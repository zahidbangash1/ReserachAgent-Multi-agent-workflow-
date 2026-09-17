"""
Human: Gap Approval (interrupt node)
--------------------------------------
Diagram position: Gap Finder Agent -> Human: Gap Approval
                   approved -> Proposal Writer
                   rejected -> back to Gap Finder Agent (loop)

Same interrupt pattern as human_topic_approval. Resume payload:
    {"approved": true, "selected_gap_indices": [0, 2]}   # can approve a subset
    # or
    {"approved": false, "feedback": "gap 2 isn't novel, already covered by paper X"}
"""

from langgraph.types import interrupt

from ..schemas.state import FYPState, MAX_GAP_FINDING_ATTEMPTS


def human_gap_approval(state: FYPState) -> dict:
    gaps = state.get("research_gaps", [])

    review_payload = interrupt(
        {
            "stage": "gap_approval",
            "attempt": state.get("gap_finding_attempts", 0),
            "gaps": [g.model_dump() for g in gaps],
        }
    )

    approved = bool(review_payload.get("approved"))

    if approved:
        selected_indices = review_payload.get("selected_gap_indices")
        approved_gaps = (
            [gaps[i] for i in selected_indices if 0 <= i < len(gaps)]
            if selected_indices
            else gaps
        )
        return {
            "current_agent": "human_gap_approval",
            "previous_agent": state.get("current_agent"),
            "gap_approval": "approved",
            "research_gaps": approved_gaps,  # narrow down to only the approved subset
            "gap_rejection_feedback": None,
            "status": "writing_proposal",
            "trace": [f"human_gap_approval: approved {len(approved_gaps)}/{len(gaps)} gaps"],
        }

    feedback = review_payload.get("feedback", "No specific feedback given.")
    attempts_used = state.get("gap_finding_attempts", 0)
    hit_cap = attempts_used >= MAX_GAP_FINDING_ATTEMPTS

    return {
        "current_agent": "human_gap_approval",
        "previous_agent": state.get("current_agent"),
        "gap_approval": "rejected",
        "gap_rejection_feedback": feedback,
        "status": "gap_finding_failed" if hit_cap else "awaiting_gap_approval",
        "trace": [
            f"human_gap_approval: rejected (attempt {attempts_used}/{MAX_GAP_FINDING_ATTEMPTS})"
            + (" — attempt cap reached" if hit_cap else "")
        ],
    }