"""
FastAPI app for ResearchAgent
--------------------------------
Run with: uvicorn api.main:app --reload --port 8000

Routes:
  POST /sessions                       -> start a new run, blocks until next interrupt (non-streaming clients)
  POST /sessions/{thread_id}/resume    -> resume after an interrupt, blocks until next interrupt
  GET  /sessions/{thread_id}           -> poll current status/interrupt without advancing
  POST /sessions/stream                -> start a new run, streaming NDJSON node-by-node progress
  POST /sessions/{thread_id}/resume/stream -> resume, streaming NDJSON node-by-node progress

The /stream routes are what the React frontend uses for live pipeline
progress — each line of the response body is one JSON event
({"type": "node_update", ...} | {"type": "done", "session": {...}} | ...),
NOT full Server-Sent-Events framing (no "data:" prefix) since the frontend
reads it via fetch()'s ReadableStream rather than EventSource (EventSource
can't POST a body, which /sessions/stream needs for user_query).
"""

import json
from contextlib import asynccontextmanager
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from src.db.database import init_db
from src.db.service import list_search_history, get_search_details

from .graph_service import (
    start_session, resume_session, get_session,
    stream_new_session, stream_resume_session,
)
from .schemas import StartSessionRequest, ResumeRequest, SessionResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="ResearchAgent API", version="0.1.0", lifespan=lifespan)


# CORS: wide open for local React dev. Restrict allow_origins to your actual
# frontend URL(s) before deploying this anywhere real.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _ndjson(events):
    for event in events:
        yield json.dumps(event) + "\n"


@app.get("/")
def health_check():
    return {"status": "ok"}


@app.post("/sessions", response_model=SessionResponse)
def create_session(req: StartSessionRequest):
    if not req.user_query.strip():
        raise HTTPException(status_code=400, detail="user_query cannot be empty")
    return start_session(req.user_query)


@app.post("/sessions/{thread_id}/resume", response_model=SessionResponse)
def resume(thread_id: str, req: ResumeRequest):
    result = resume_session(thread_id, req.resume_payload)
    if result is None:
        raise HTTPException(status_code=404, detail=f"No session found for thread_id={thread_id}")
    return result


@app.get("/sessions/{thread_id}", response_model=SessionResponse)
def status(thread_id: str):
    result = get_session(thread_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"No session found for thread_id={thread_id}")
    return result


@app.post("/sessions/stream")
def create_session_stream(req: StartSessionRequest):
    if not req.user_query.strip():
        raise HTTPException(status_code=400, detail="user_query cannot be empty")
    return StreamingResponse(_ndjson(stream_new_session(req.user_query)), media_type="application/x-ndjson")


@app.post("/sessions/{thread_id}/resume/stream")
def resume_stream(thread_id: str, req: ResumeRequest):
    return StreamingResponse(
        _ndjson(stream_resume_session(thread_id, req.resume_payload)), media_type="application/x-ndjson"
    )


@app.get("/searches")
def get_searches(limit: int = 50):
    """Retrieve history of searches stored in PostgreSQL database."""
    return list_search_history(limit=limit)


@app.get("/searches/{thread_id}")
def get_search(thread_id: str):
    """Retrieve detailed search data including all generated ideas for a specific session."""
    result = get_search_details(thread_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"No search found for thread_id={thread_id}")
    return result