"""
Human: Final Review (interrupt node)
---------------------------------------
Diagram position: Report / Paper Writer -> Human: Final Review -> Output

The diagram doesn't draw a rejection loop out of this node (unlike the
other two human gates) — but state.py already has final_review_feedback +
final_review_attempts fields (added as a FIX in an earlier review), so this
implementation supports revision: rejected -> back to report_writer, capped
by MAX_FINAL_REVIEW_ATTEMPTS, same pattern as the other loops. If you want
to match the diagram exactly (no revision loop, reject = hard stop), remove
the rejected branch below and just end the graph either way.
"""

from langgraph.types import interrupt

from ..schemas.state import FYPState, MAX_FINAL_REVIEW_ATTEMPTS


def human_final_review(state: FYPState) -> dict:
    review_payload = interrupt(
        {
            "stage": "final_review",
            "attempt": state.get("final_review_attempts", 0),
            "final_report": state.get("final_report"),
        }
    )

    approved = bool(review_payload.get("approved"))
    attempts_used = state.get("final_review_attempts", 0) + 1

    if approved:
        return {
            "current_agent": "human_final_review",
            "previous_agent": state.get("current_agent"),
            "final_review": "approved",
            "final_review_attempts": attempts_used,
            "status": "completed",
            "trace": ["human_final_review: approved — pipeline complete"],
        }

    feedback = review_payload.get("feedback", "No specific feedback given.")
    hit_cap = attempts_used >= MAX_FINAL_REVIEW_ATTEMPTS

    return {
        "current_agent": "human_final_review",
        "previous_agent": state.get("current_agent"),
        "final_review": "rejected",
        "final_review_feedback": feedback,
        "final_review_attempts": attempts_used,
        # if the cap is hit, ship the current draft as-is rather than looping forever
        "status": "completed" if hit_cap else "writing_report",
        "trace": [
            f"human_final_review: rejected (attempt {attempts_used}/{MAX_FINAL_REVIEW_ATTEMPTS})"
            + (" — attempt cap reached, shipping current draft" if hit_cap else " — sending back to report_writer")
        ],
    }