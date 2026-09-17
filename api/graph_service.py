"""
Graph Service
--------------
Single place that owns the compiled graph and knows how to start/resume/
inspect a session. main.py's routes call into this instead of touching
LangGraph internals directly — keeps the HTTP layer thin.

Sessions use SqliteSaver pointing at the checkpoints.db file on disk (see
src/Graph/graph_builder.py) instead of an in-memory MemorySaver.

Streaming: stream_events() uses graph.stream(..., stream_mode="updates")
instead of graph.invoke() so the frontend can show each agent's progress
live as it happens, rather than one blocking call that only resolves at the
next interrupt/completion. invoke()-based start_session/resume_session are
kept for non-streaming clients (e.g. simple API consumers, tests).
"""

import threading
import uuid
from typing import Any, Iterator, Optional

import logging
from langgraph.types import Command

from src.Graph.graph_builder import build_graph
from src.schemas.state import create_initial_state
from src.db.service import record_new_search, sync_state_to_db

from .schemas import InterruptInfo, SessionResponse

logger = logging.getLogger(__name__)


_graph = None
# SqliteSaver wraps a single sqlite3 connection (check_same_thread=False lets
# other threads use it, but doesn't make concurrent access SAFE). FastAPI
# runs sync route handlers in a thread pool, so a streaming request (which
# holds the connection open node-by-node for potentially a while) and a
# concurrent GET/POST on another thread WILL overlap without this lock —
# risking "database is locked" errors or worse. Every function that touches
# the graph acquires this first.
_graph_lock = threading.Lock()


def get_graph():
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph


def _config(thread_id: str) -> dict:
    return {"configurable": {"thread_id": thread_id}}


def _build_response(thread_id: str, result: dict) -> SessionResponse:
    interrupt_list = result.get("__interrupt__")
    interrupt_info = None
    if interrupt_list:
        value = interrupt_list[0].value
        interrupt_info = InterruptInfo(stage=value.get("stage"), payload=value)

    status = result.get("status", "unknown")
    return SessionResponse(
        thread_id=thread_id,
        status=status,
        trace=result.get("trace", [])[-25:],
        errors=result.get("errors", []),
        citation_issues=result.get("citation_issues", []),
        interrupt=interrupt_info,
        final_report=result.get("final_report") if status == "completed" else None,
        completed=status == "completed",
    )


def _build_response_from_snapshot(thread_id: str) -> SessionResponse:
    """Builds a SessionResponse from graph.get_state() instead of an
    invoke()/stream() return value. Used after streaming ends, since the
    merged final state (not just the last delta) lives in the checkpointer.

    Interrupt detection here uses snapshot.tasks[*].interrupts — the
    version-safe way to detect a paused interrupt() from get_state(),
    since snapshot.values (the plain state dict) doesn't reliably carry a
    "__interrupt__" key the way invoke()'s return value does.

    Caller must hold _graph_lock — this does not acquire it itself, so it
    can be safely called from inside _stream_and_finish's already-locked
    section without deadlocking (threading.Lock is not reentrant).
    """
    graph = get_graph()
    snapshot = graph.get_state(_config(thread_id))
    result = dict(snapshot.values)

    interrupt_info = None
    for task in snapshot.tasks:
        if task.interrupts:
            value = task.interrupts[0].value
            interrupt_info = InterruptInfo(stage=value.get("stage"), payload=value)
            break

    status = result.get("status", "unknown")
    return SessionResponse(
        thread_id=thread_id,
        status=status,
        trace=result.get("trace", [])[-25:],
        errors=result.get("errors", []),
        citation_issues=result.get("citation_issues", []),
        interrupt=interrupt_info,
        final_report=result.get("final_report") if status == "completed" else None,
        completed=status == "completed",
    )


def start_session(user_query: str) -> SessionResponse:
    thread_id = str(uuid.uuid4())
    record_new_search(thread_id=thread_id, query=user_query)
    initial_state = create_initial_state(thread_id=thread_id, user_query=user_query)
    with _graph_lock:
        result = get_graph().invoke(initial_state, config=_config(thread_id))
        try:
            snap = get_graph().get_state(_config(thread_id))
            sync_state_to_db(thread_id, dict(snap.values))
        except Exception as exc:
            logger.error(f"Error syncing start_session to DB: {exc}")
    return _build_response(thread_id, result)


def resume_session(thread_id: str, resume_payload: Any) -> Optional[SessionResponse]:
    """Returns None if thread_id is unknown to the checkpointer (caller should 404)."""
    with _graph_lock:
        if not _session_exists_unlocked(thread_id):
            return None
        result = get_graph().invoke(Command(resume=resume_payload), config=_config(thread_id))
        try:
            snap = get_graph().get_state(_config(thread_id))
            sync_state_to_db(thread_id, dict(snap.values))
        except Exception as exc:
            logger.error(f"Error syncing resume_session to DB: {exc}")
    return _build_response(thread_id, result)


def get_session(thread_id: str) -> Optional[SessionResponse]:
    with _graph_lock:
        if not _session_exists_unlocked(thread_id):
            return None
        return _build_response_from_snapshot(thread_id)


def session_exists(thread_id: str) -> bool:
    with _graph_lock:
        return _session_exists_unlocked(thread_id)


def _session_exists_unlocked(thread_id: str) -> bool:
    """Caller must hold _graph_lock (see note on _build_response_from_snapshot)."""
    snapshot = get_graph().get_state(_config(thread_id))
    return bool(snapshot.values)


# --- Streaming ---

def stream_new_session(user_query: str) -> Iterator[dict]:
    """Starts a new session, yielding one dict per node completion as the
    graph executes, then a final {"type": "done", "session": SessionResponse}
    once it hits the next interrupt or finishes."""
    thread_id = str(uuid.uuid4())
    record_new_search(thread_id=thread_id, query=user_query)
    yield {"type": "started", "thread_id": thread_id}
    initial_state = create_initial_state(thread_id=thread_id, user_query=user_query)
    yield from _stream_and_finish(thread_id, initial_state)


def stream_resume_session(thread_id: str, resume_payload: Any) -> Iterator[dict]:
    """Same as stream_new_session but resumes an existing paused session.
    Yields a single {"type": "error", ...} event if thread_id is unknown."""
    if not session_exists(thread_id):
        yield {"type": "error", "message": f"No session found for thread_id={thread_id}"}
        return
    yield from _stream_and_finish(thread_id, Command(resume=resume_payload))


def _stream_and_finish(thread_id: str, graph_input) -> Iterator[dict]:
    # Held for the whole streaming duration — see _graph_lock's docstring.
    # This is a local single-user dev tool, so serializing all graph access
    # behind one lock is the right tradeoff over the complexity of a
    # per-connection pool.
    with _graph_lock:
        graph = get_graph()
        try:
            for update in graph.stream(graph_input, config=_config(thread_id), stream_mode="updates"):
                for node_name, partial in update.items():
                    if node_name == "__interrupt__":
                        # Interrupt reached — stop streaming node updates, the
                        # final "done" event below will carry the interrupt panel.
                        continue
                    if not isinstance(partial, dict):
                        continue
                    yield {
                        "type": "node_update",
                        "node": node_name,
                        "status": partial.get("status"),
                        "trace": partial.get("trace", []),
                    }
                    if node_name in ("idea_generator", "auto_select_topic", "human_topic_approval", "report_writer"):
                        try:
                            snap = graph.get_state(_config(thread_id))
                            sync_state_to_db(thread_id, dict(snap.values))
                        except Exception as sync_err:
                            logger.error(f"Error syncing intermediate node to DB: {sync_err}")
        except Exception as exc:
            yield {"type": "error", "message": str(exc)}

        final_session = _build_response_from_snapshot(thread_id)
        try:
            snap = graph.get_state(_config(thread_id))
            sync_state_to_db(thread_id, dict(snap.values))
        except Exception as sync_err:
            logger.error(f"Error syncing final session snapshot to DB: {sync_err}")

    yield {"type": "done", "session": final_session.model_dump()}