"""
Human: Topic Approval (interrupt node)
---------------------------------------
Diagram position: Idea Generator -> Human: Topic Approval
                   approved -> Literature Review Agent
                   rejected -> back to Idea Generator (loop)

Pauses the graph and surfaces state["ideas"] to whoever is reviewing
(a human, via UI/CLI). Expects the resume payload to look like:

    {"approved": true, "selected_idea_id": "idea-2"}
    # or
    {"approved": false, "feedback": "too broad, narrow to summarization"}

This node does NOT decide the next node — the graph's conditional edge reads
state["topic_approval"] after this returns.
"""

from langgraph.types import interrupt

from ..schemas.state import FYPState, MAX_IDEA_GENERATION_ATTEMPTS


def human_topic_approval(state: FYPState) -> dict:
    ideas = state.get("ideas", [])

    review_payload = interrupt(
        {
            "stage": "topic_approval",
            "attempt": state.get("idea_generation_attempts", 0),
            "ideas": [idea.model_dump() for idea in ideas],
        }
    )

    approved = bool(review_payload.get("approved"))

    if approved:
        selected_id = review_payload.get("selected_idea_id")
        selected_idea = next((i for i in ideas if i.id == selected_id), ideas[0] if ideas else None)
        return {
            "current_agent": "human_topic_approval",
            "previous_agent": state.get("current_agent"),
            "topic_approval": "approved",
            "selected_idea": selected_idea,
            "topic": selected_idea.title if selected_idea else state.get("topic"),
            "topic_approval_feedback": None,
            "status": "researching",
            "trace": ["human_topic_approval: approved"],
        }

    # Rejected
    feedback = review_payload.get("feedback", "No specific feedback given.")
    attempts_used = state.get("idea_generation_attempts", 0)
    hit_cap = attempts_used >= MAX_IDEA_GENERATION_ATTEMPTS

    return {
        "current_agent": "human_topic_approval",
        "previous_agent": state.get("current_agent"),
        "topic_approval": "rejected",
        "topic_approval_feedback": feedback,
        "status": "idea_generation_failed" if hit_cap else "awaiting_topic_approval",
        "trace": [
            f"human_topic_approval: rejected (attempt {attempts_used}/{MAX_IDEA_GENERATION_ATTEMPTS})"
            + (" — attempt cap reached" if hit_cap else "")
        ],
    }