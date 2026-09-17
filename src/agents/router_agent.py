"""
Router Agent
------------
Diagram position: User Input -> Router Agent -> (topic missing | topic available)

Decides, from the raw user_query, whether:
  - a concrete, usable FYP topic was already given        -> "topic_available"
  - no topic was given, idea generation is needed          -> "topic_missing"
  - the query is too vague/ambiguous to route either way   -> "clarification_needed"

This node ONLY sets routing fields. It does not call idea_generator or
literature_review itself — that happens via add_conditional_edges in the
graph builder, reading state["router_decision"].
"""

from pydantic import BaseModel, Field
from typing import Literal

from ..schemas.state import FYPState
from ..services.llm_service import get_structured_llm


class RouterOutput(BaseModel):
    decision: Literal["topic_missing", "topic_available", "clarification_needed"]
    extracted_topic: str | None = Field(
        None, description="The topic, verbatim/cleaned, if the user already gave one."
    )
    confidence: float = Field(..., ge=0.0, le=1.0)
    reasoning: str = Field(..., description="One or two sentences on why this route was chosen.")
    clarification_question: str | None = Field(
        None, description="If decision is clarification_needed, the question to ask the user."
    )


ROUTER_SYSTEM_PROMPT = """You are the Router Agent for an academic Final Year Project (FYP) \
research proposal generator, specialized in NLP topics.

Given the user's message, decide ONE of:
- "topic_available": the user has given a specific enough research topic or problem \
  to start a literature review on (even if not perfectly worded).
- "topic_missing": the user wants a project but has NOT given a specific topic — \
  ideas need to be generated for them.
- "clarification_needed": the message is too ambiguous to classify confidently \
  (e.g. off-topic, contradictory, or missing basic context like subject area).

Be decisive. Prefer "topic_available" over "clarification_needed" whenever a \
reasonable topic can be extracted, even if underspecified — the later pipeline \
stages will refine it."""


def router_agent(state: FYPState) -> dict:
    trace_entry = "router_agent: started"
    try:
        structured_llm = get_structured_llm(RouterOutput, temperature=0.0)
        result: RouterOutput = structured_llm.invoke(
            [
                ("system", ROUTER_SYSTEM_PROMPT),
                ("human", state["user_query"]),
            ]
        )

        update = {
            "current_agent": "router",
            "previous_agent": state.get("current_agent"),
            "router_decision": result.decision,
            "router_confidence": result.confidence,
            "router_reasoning": result.reasoning,
            "router_used_fallback": False,
            "router_error_type": None,
            "trace": [f"router_agent: decision={result.decision} (confidence={result.confidence:.2f})"],
        }

        if result.decision == "topic_available":
            update["topic"] = result.extracted_topic
            update["status"] = "routing"
        elif result.decision == "topic_missing":
            update["status"] = "generating_ideas"
        else:  # clarification_needed
            update["status"] = "awaiting_clarification"
            update["clarification_question"] = result.clarification_question

        return update

    except Exception as exc:
        # Fallback: if the LLM/structured-output call fails outright, don't crash
        # the graph — route to idea_generator (safest default) and log the error.
        return {
            "current_agent": "router",
            "previous_agent": state.get("current_agent"),
            "router_decision": "topic_missing",
            "router_used_fallback": True,
            "router_error_type": type(exc).__name__,
            "status": "generating_ideas",
            "trace": [trace_entry, f"router_agent: FAILED, fell back to topic_missing ({exc})"],
            "errors": [
                {"agent": "router_agent", "step": "routing", "message": str(exc)}
            ],
        }