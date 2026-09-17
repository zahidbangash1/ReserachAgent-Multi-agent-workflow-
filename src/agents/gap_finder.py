"""
Gap Finder Agent
-----------------
Diagram position: Citation Validator -> Gap Finder Agent -> Human: Gap Approval
                   Human: Gap Approval (rejected) -> back to Gap Finder Agent (loop)

Overwrites state["research_gaps"] each call (no operator.add — see state.py
FIX comment), same reasoning as idea_generator: only the latest batch should
be visible to the approval step.
"""

from pydantic import BaseModel, Field
from typing import List

from ..schemas.state import FYPState
from ..schemas.models import ResearchGap
from ..services.llm_service import get_structured_llm

GAP_FINDER_SYSTEM_PROMPT = """You are identifying research gaps for a Final Year Project, \
based on a literature review. Given the selected topic and the summarized papers, identify \
2-4 concrete, novel research gaps — things the existing literature does NOT adequately \
address, that this project could plausibly tackle in one academic year.

Each gap needs: a clear description, which papers (by title) motivate it, and a \
novelty_justification explaining why it's worth pursuing.

If NO papers are provided (empty list), do not refuse or ask for papers — instead identify \
plausible research gaps from general domain knowledge about the topic, and note in each \
gap's novelty_justification that it is based on general domain reasoning rather than a \
specific literature review, since none was available for this run. Always call the tool \
and return gaps — never respond with plain text asking for more input.

If previous gaps were rejected with feedback, address that feedback directly."""


class GapFindingOutput(BaseModel):
    gaps: List[ResearchGap] = Field(..., min_length=1, max_length=4)


def gap_finder(state: FYPState) -> dict:
    attempt = state.get("gap_finding_attempts", 0) + 1
    feedback = state.get("gap_rejection_feedback")
    idea = state.get("selected_idea")
    papers = state.get("papers", [])

    context = f"Topic: {idea.title if idea else state.get('topic')}\n\nPapers:\n" + (
        "\n".join(f"- {p.title}: {p.key_finding}" for p in papers)
        or "(none — literature review found no papers for this run; use general domain knowledge)"
    )
    if feedback:
        context += f"\n\nPrevious gaps were rejected. Feedback to address: {feedback}"

    try:
        structured_llm = get_structured_llm(GapFindingOutput, temperature=0.5)
        result: GapFindingOutput = structured_llm.invoke(
            [("system", GAP_FINDER_SYSTEM_PROMPT), ("human", context)]
        )

        return {
            "current_agent": "gap_finder",
            "previous_agent": state.get("current_agent"),
            "research_gaps": result.gaps,  # overwrite, not append
            "gap_finding_attempts": attempt,
            "status": "awaiting_gap_approval",
            "trace": [f"gap_finder: attempt {attempt}, found {len(result.gaps)} gaps"],
        }

    except Exception as exc:
        return {
            "current_agent": "gap_finder",
            "gap_finding_attempts": attempt,
            "status": "gap_finding_failed",
            "trace": [f"gap_finder: FAILED attempt {attempt} ({exc})"],
            "errors": [{"agent": "gap_finder", "step": "finding_gaps", "message": str(exc)}],
        }