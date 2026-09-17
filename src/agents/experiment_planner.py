"""
Experiment Planner
---------------------
Diagram position: Feasibility Reviewer (approved) -> Experiment Planner -> Experiment Executor
                   Results Evaluator (failed) -> back to Experiment Planner (loop)

Produces state["experiment_plan"] (ExperimentDesign: datasets, metrics,
baselines). On retries (after a failed run), incorporates
results_evaluation.feedback to adjust the plan (e.g. swap dataset, add a
baseline, change a metric) rather than just re-running the same thing.
"""

from ..schemas.state import FYPState
from ..services.llm_service import get_structured_llm
from ..schemas.models import ExperimentDesign

PLANNER_SYSTEM_PROMPT = """You are planning the concrete experiment setup for a Final Year \
Project, based on its approved methodology. Produce an ExperimentDesign: 1-3 datasets, \
2+ evaluation metrics, and 1+ baseline models to compare against.

Keep it realistic for a single undergraduate with limited compute — prefer small/medium \
public datasets and well-known baselines over exotic large-scale setups.

If a previous experiment run failed or produced poor results, use that feedback to adjust \
the plan (different dataset, different baseline, different metric) rather than repeating \
the same setup."""


def experiment_planner(state: FYPState) -> dict:
    attempt = state.get("experiment_attempts", 0) + 1
    methodology = state.get("methodology_steps", [])
    prior_eval = state.get("results_evaluation")

    context = "Methodology:\n" + "\n".join(
        f"{s.step_number}. {s.title}: {s.description}" for s in methodology
    )
    if prior_eval and not prior_eval.passed:
        context += f"\n\nPrevious attempt failed. Feedback: {prior_eval.feedback}"

    try:
        structured_llm = get_structured_llm(ExperimentDesign, temperature=0.3)
        plan: ExperimentDesign = structured_llm.invoke(
            [("system", PLANNER_SYSTEM_PROMPT), ("human", context)]
        )

        return {
            "current_agent": "experiment_planner",
            "previous_agent": state.get("current_agent"),
            "experiment_plan": plan,
            "experiment_attempts": attempt,
            "status": "executing_experiments",
            "trace": [f"experiment_planner: attempt {attempt}, plan ready"],
        }

    except Exception as exc:
        return {
            "current_agent": "experiment_planner",
            "experiment_attempts": attempt,
            "status": "experiment_planning_failed",
            "trace": [f"experiment_planner: FAILED attempt {attempt} ({exc})"],
            "errors": [
                {"agent": "experiment_planner", "step": "planning_experiments", "message": str(exc)}
            ],
        }