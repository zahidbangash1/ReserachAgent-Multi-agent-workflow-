"""
Idea Generator Agent
--------------------
Diagram position: Router (topic missing) -> Idea Generator -> Human: Topic Approval
                   Human: Topic Approval (rejected) -> back to Idea Generator (loop)

Generates 3-5 candidate FYPIdea objects. On retries (after human rejection),
uses topic_approval_feedback so it doesn't regenerate the same rejected ideas.

NOTE: overwrites state["ideas"] each call (no operator.add reducer — see
state.py FIX comment). This is intentional: only the latest batch should be
visible to the approval step.
"""

from pydantic import BaseModel, Field
from typing import List

from ..schemas.state import FYPState, MAX_IDEA_GENERATION_ATTEMPTS
from ..schemas.models import FYPIdea
from ..services.llm_service import get_structured_llm
from dotenv import load_dotenv 
load_dotenv()

IDEA_GEN_SYSTEM_PROMPT = """You are an expert academic advisor generating Final Year \
Project (FYP) ideas in NLP for undergraduate Computer Science students.

Generate 3 to 5 distinct, feasible FYP ideas. Each must be:
- specific enough to research (not "a chatbot", but a concrete problem/approach)
- feasible for a single undergraduate over one academic year
- have a clear core_problem and a realistic feasibility_score (1-10)

If previous ideas were rejected with feedback, DO NOT repeat them — address the \
feedback directly in the new set."""


class IdeaGenerationOutput(BaseModel):
    ideas: List[FYPIdea] = Field(..., min_length=3, max_length=5)


def idea_generator(state: FYPState) -> dict:
    attempt = state.get("idea_generation_attempts", 0) + 1
    feedback = state.get("topic_approval_feedback")

    human_prompt = f"User request: {state['user_query']}"
    if feedback:
        human_prompt += f"\n\nPrevious attempt was rejected. Feedback to address: {feedback}"

    try:
        structured_llm = get_structured_llm(IdeaGenerationOutput, temperature=0.7)
        result: IdeaGenerationOutput = structured_llm.invoke(
            [("system", IDEA_GEN_SYSTEM_PROMPT), ("human", human_prompt)]
        )

        return {
            "current_agent": "idea_generator",
            "previous_agent": state.get("current_agent"),
            "ideas": result.ideas,  # overwrite, not append — see docstring
            "idea_generation_attempts": attempt,
            "status": "awaiting_topic_approval",
            "trace": [f"idea_generator: attempt {attempt}, generated {len(result.ideas)} ideas"],
        }

    except Exception as exc:
        failures = state.get("idea_generation_failures", 0) + 1
        return {
            "current_agent": "idea_generator",
            "idea_generation_attempts": attempt,
            "idea_generation_failures": failures,
            "status": "idea_generation_failed",
            "trace": [f"idea_generator: FAILED attempt {attempt} ({exc})"],
            "errors": [
                {"agent": "idea_generator", "step": "generating_ideas", "message": str(exc)}
            ],
        }
    finally:
        # Graph-level responsibility, noted here for visibility: the conditional
        # edge after human_topic_approval should check
        # attempt >= MAX_IDEA_GENERATION_ATTEMPTS and, if so, route to a
        # best-effort/manual-topic path instead of looping back here again.
        pass