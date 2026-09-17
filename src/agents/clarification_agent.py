"""
Clarification Agent
--------------------
Diagram addition (not in the original image, added via router_decision =
"clarification_needed"): pauses execution and asks the user a follow-up
question, then re-routes through Router Agent with the enriched query.

Uses LangGraph's interrupt() — requires the graph to be compiled with a
checkpointer (e.g. MemorySaver / a persistent one) since interrupt() only
works with checkpointed graphs. On resume, the caller does:

    graph.invoke(Command(resume=user_answer), config)
"""

from langgraph.types import interrupt

from ..schemas.state import FYPState


def clarification_agent(state: FYPState) -> dict:
    question = state.get("clarification_question") or (
        "Could you tell me a bit more about the subject area or problem "
        "you'd like your FYP to focus on?"
    )

    # Pauses graph execution here. The value passed to interrupt() is surfaced
    # to whatever is driving the graph (UI/CLI) so it can display `question`.
    # Resuming with Command(resume=<answer>) makes this call return <answer>.
    user_answer: str = interrupt({"question": question})

    combined_query = f"{state['user_query']}\n\nClarification: {question}\nUser answer: {user_answer}"

    return {
        "current_agent": "clarification",
        "previous_agent": state.get("current_agent"),
        "user_query": combined_query,
        "user_clarification_response": user_answer,
        "router_decision": None,  # force router to re-evaluate with the enriched query
        "status": "routing",
        "trace": [f"clarification_agent: received user answer, re-routing"],
    }