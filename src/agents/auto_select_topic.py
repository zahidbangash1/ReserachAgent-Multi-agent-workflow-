"""
Auto Select Topic Agent
------------------------
Diagram position: Router Agent ("topic available") -> Literature Review Agent
                   (bypasses Idea Generator AND Human: Topic Approval entirely)

This node's only job is to turn state["topic"] (raw string from the router)
into a proper FYPIdea so every downstream agent can rely on
state["selected_idea"] always being populated by the time literature_review
runs, regardless of which branch was taken.

No LLM call needed for the common case; falls back to LLM inference only if
domain/core_problem can't be trivially derived.
"""

from pydantic import BaseModel, Field

from ..schemas.state import FYPState
from ..schemas.models import FYPIdea
from ..services.llm_service import get_structured_llm

ENRICH_SYSTEM_PROMPT = """Given a raw FYP topic string from a user, produce a structured \
FYPIdea: a clean title, the core problem it addresses, its NLP sub-domain, and a \
1-10 feasibility_score for an undergraduate final year project."""


class _EnrichedTopic(BaseModel):
    idea: FYPIdea


def auto_select_topic(state: FYPState) -> dict:
    topic = state.get("topic")
    if not topic:
        # Shouldn't happen if router_decision == "topic_available", but guard anyway.
        return {
            "current_agent": "auto_select_topic",
            "status": "generating_ideas",
            "router_decision": "topic_missing",
            "trace": ["auto_select_topic: no topic found despite topic_available, falling back to idea_generator"],
        }

    try:
        structured_llm = get_structured_llm(_EnrichedTopic, temperature=0.2)
        result: _EnrichedTopic = structured_llm.invoke(
            [("system", ENRICH_SYSTEM_PROMPT), ("human", topic)]
        )
        idea = result.idea
        idea.id = idea.id or "user-provided-topic"

        return {
            "current_agent": "auto_select_topic",
            "previous_agent": state.get("current_agent"),
            "ideas": [idea],
            "selected_idea": idea,
            "topic_approval": "approved",  # implicitly approved — user gave it directly
            "status": "researching",
            "trace": [f"auto_select_topic: enriched user-provided topic '{topic}'"],
        }

    except Exception as exc:
        # Fallback: build a minimal FYPIdea without the LLM rather than blocking the pipeline.
        idea = FYPIdea(
            id="user-provided-topic",
            title=topic,
            core_problem=topic,
            domain="unspecified",
            feasibility_score=5,
        )
        return {
            "current_agent": "auto_select_topic",
            "ideas": [idea],
            "selected_idea": idea,
            "topic_approval": "approved",
            "status": "researching",
            "trace": [f"auto_select_topic: LLM enrichment failed, used raw topic as-is ({exc})"],
            "errors": [
                {"agent": "auto_select_topic", "step": "routing", "message": str(exc)}
            ],
        }
    












    