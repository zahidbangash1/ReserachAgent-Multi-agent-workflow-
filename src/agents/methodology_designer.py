"""
Methodology Designer
----------------------
Diagram position: Proposal Writer -> Methodology Designer -> Feasibility Reviewer
                   Feasibility Reviewer (rejected) -> back to Methodology Designer (loop)

Overwrites state["methodology_steps"] each call (no operator.add — see
state.py FIX comment), same reasoning as idea_generator/gap_finder.
"""

from pydantic import BaseModel, Field
from typing import List

from ..schemas.state import FYPState
from ..schemas.models import MethodologyStep
from ..services.llm_service import get_structured_llm

METHODOLOGY_SYSTEM_PROMPT = """You are designing the methodology for a Final Year Project \
(FYP), based on its proposal. Produce an ordered list of methodology steps (4-8 steps), \
each with a step_number, a short title, a description of what happens, and a \
justification tying it back to the research gap being addressed.

Steps should be concrete and executable by an undergraduate over one academic year \
(e.g. 'Collect and preprocess dataset X', 'Fine-tune baseline model Y', \
'Evaluate against metric Z') — not vague research philosophy.

If a previous methodology was rejected by a feasibility reviewer, address that \
feedback directly — usually this means scaling down scope, swapping an unrealistic \
step, or clarifying an ambiguous one."""


class MethodologyOutput(BaseModel):
    steps: List[MethodologyStep] = Field(..., min_length=4, max_length=8)


def methodology_designer(state: FYPState) -> dict:
    attempt = state.get("methodology_attempts", 0) + 1
    feedback = state.get("methodology_rejection_feedback")
    proposal = state.get("proposal_draft", "")

    context = f"Proposal:\n{proposal}"
    if feedback:
        context += f"\n\nPrevious methodology was rejected by feasibility review. Feedback: {feedback}"

    try:
        structured_llm = get_structured_llm(MethodologyOutput, temperature=0.4)
        result: MethodologyOutput = structured_llm.invoke(
            [("system", METHODOLOGY_SYSTEM_PROMPT), ("human", context)]
        )

        return {
            "current_agent": "methodology_designer",
            "previous_agent": state.get("current_agent"),
            "methodology_steps": result.steps,  # overwrite, not append
            "methodology_attempts": attempt,
            "status": "reviewing_feasibility",
            "trace": [f"methodology_designer: attempt {attempt}, {len(result.steps)} steps"],
        }

    except Exception as exc:
        return {
            "current_agent": "methodology_designer",
            "methodology_attempts": attempt,
            "status": "methodology_design_failed",
            "trace": [f"methodology_designer: FAILED attempt {attempt} ({exc})"],
            "errors": [
                {"agent": "methodology_designer", "step": "designing_methodology", "message": str(exc)}
            ],
        }