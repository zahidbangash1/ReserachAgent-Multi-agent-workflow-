"""
Feasibility Reviewer
-----------------------
Diagram position: Methodology Designer -> Feasibility Reviewer (diamond)
                   approved -> Experiment Planner
                   rejected -> back to Methodology Designer (loop)

Unlike Human: Topic/Gap Approval, this is drawn as a diamond (automated
decision node), not a hexagon (human node) — so it's an LLM judge, not an
interrupt(). It enforces MAX_METHODOLOGY_ATTEMPTS itself since there's no
human in this loop to naturally stop it.
"""

from ..schemas.state import FYPState, MAX_METHODOLOGY_ATTEMPTS
from ..schemas.models import FeasibilityReview
from ..services.llm_service import get_structured_llm

FEASIBILITY_SYSTEM_PROMPT = """You are reviewing whether a proposed FYP methodology is \
feasible for a single undergraduate student to execute in one academic year, with \
typical university compute resources (a single GPU at most, no large-scale infra).

Reject if: the methodology requires unrealistic compute/data, is too vague to execute, \
has steps that don't logically follow the proposal's objectives, or is missing critical \
steps (e.g. no evaluation step).

Be a reasonably strict but fair reviewer — approve methodologies that are solid even if \
not perfect."""


def feasibility_reviewer(state: FYPState) -> dict:
    attempt = state.get("methodology_attempts", 0)
    steps = state.get("methodology_steps", [])

    steps_text = "\n".join(
        f"{s.step_number}. {s.title}: {s.description}" for s in steps
    )

    try:
        structured_llm = get_structured_llm(FeasibilityReview, temperature=0.0)
        result: FeasibilityReview = structured_llm.invoke(
            [("system", FEASIBILITY_SYSTEM_PROMPT), ("human", steps_text)]
        )

        if result.approved:
            return {
                "current_agent": "feasibility_reviewer",
                "previous_agent": state.get("current_agent"),
                "feasibility_review": result,
                "feasibility_approval": "approved",
                "status": "planning_experiments",
                "trace": ["feasibility_reviewer: approved"],
            }

        hit_cap = attempt >= MAX_METHODOLOGY_ATTEMPTS
        return {
            "current_agent": "feasibility_reviewer",
            "previous_agent": state.get("current_agent"),
            "feasibility_review": result,
            "feasibility_approval": "rejected",
            # feeds back into methodology_designer's next attempt
            "methodology_rejection_feedback": "; ".join(result.concerns) or "Not feasible as designed.",
            "status": "methodology_design_failed" if hit_cap else "reviewing_feasibility",
            "trace": [
                f"feasibility_reviewer: rejected (attempt {attempt}/{MAX_METHODOLOGY_ATTEMPTS})"
                + (" — attempt cap reached, proceeding best-effort" if hit_cap else "")
            ],
        }

    except Exception as exc:
        return {
            "current_agent": "feasibility_reviewer",
            "status": "feasibility_review_failed",
            "trace": [f"feasibility_reviewer: FAILED ({exc})"],
            "errors": [
                {"agent": "feasibility_reviewer", "step": "reviewing_feasibility", "message": str(exc)}
            ],
        }