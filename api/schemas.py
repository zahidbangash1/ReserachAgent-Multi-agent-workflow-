"""
API schemas
------------
Request/response models for the FastAPI layer. Kept separate from
src/schemas/models.py (domain models) — this file is the *wire contract*,
domain models are the *internal state*. Domain model types are reused
directly as field types where it's a clean fit (e.g. citation_issues),
since Pydantic nests them into JSON automatically.
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel

from src.schemas.models import ErrorLog, CitationIssue


class StartSessionRequest(BaseModel):
    user_query: str


class ResumeRequest(BaseModel):
    """resume_payload shape depends on which interrupt stage is being resumed:
    - topic_approval: {"approved": bool, "selected_idea_id"?: str, "feedback"?: str}
    - gap_approval:    {"approved": bool, "selected_gap_indices"?: List[int], "feedback"?: str}
    - final_review:    {"approved": bool, "feedback"?: str}
    - clarification (no "stage" key on the interrupt): a plain string answer,
      not a dict — see /sessions/{thread_id}/resume handling in main.py.
    """
    resume_payload: Any


class InterruptInfo(BaseModel):
    stage: Optional[str] = None  # None for the clarification interrupt
    payload: Dict[str, Any]


class SessionResponse(BaseModel):
    thread_id: str
    status: str
    trace: List[str] = []
    errors: List[ErrorLog] = []
    citation_issues: List[CitationIssue] = []
    interrupt: Optional[InterruptInfo] = None
    final_report: Optional[str] = None
    completed: bool = False