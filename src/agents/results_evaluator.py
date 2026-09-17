"""
Results Evaluator
--------------------
Diagram position: Experiment Executor -> Results Evaluator (diamond)
                   passed -> Report / Paper Writer
                   failed -> back to Experiment Planner (loop)

Automated (not human) — same pattern as Feasibility Reviewer. Enforces
MAX_EXPERIMENT_ATTEMPTS itself; when the cap is hit, proceeds best-effort to
the report writer rather than looping forever (sets
results_limited_by_attempt_cap so report_writer/report can disclose this
honestly instead of claiming a clean pass).
"""

from ..schemas.state import FYPState, MAX_EXPERIMENT_ATTEMPTS
from ..schemas.models import ResultsEvaluation
from ..services.llm_service import get_structured_llm

EVALUATOR_SYSTEM_PROMPT = """You are evaluating the outcome of an FYP experiment run. Given \
the experiment design and its result summary, decide if it PASSED (results are usable and \
support the proposal's objectives) or FAILED (results are inconclusive, broken, or don't \
support the objectives).

If failed, give specific, actionable feedback: what needs to change in the next attempt \
(different dataset, different baseline, different metric, etc.) — this feedback goes \
directly back to the experiment planner."""


def results_evaluator(state: FYPState) -> dict:
    attempt = state.get("experiment_attempts", 0)
    results = state.get("experiment_results", [])
    latest = results[-1] if results else None
    plan = state.get("experiment_plan")

    if latest is None:
        return {
            "current_agent": "results_evaluator",
            "status": "results_evaluation_failed",
            "trace": ["results_evaluator: no experiment_results to evaluate"],
            "errors": [
                {"agent": "results_evaluator", "step": "evaluating_results", "message": "no results in state"}
            ],
        }

    context = (
        f"Design — datasets: {plan.datasets if plan else '?'}, metrics: {plan.metrics if plan else '?'}, "
        f"baselines: {plan.baselines if plan else '?'}\n\n"
        f"Result (attempt {latest.attempt}, status={latest.status}): {latest.summary}"
    )

    try:
        structured_llm = get_structured_llm(ResultsEvaluation, temperature=0.0)
        evaluation: ResultsEvaluation = structured_llm.invoke(
            [("system", EVALUATOR_SYSTEM_PROMPT), ("human", context)]
        )

        if evaluation.passed:
            return {
                "current_agent": "results_evaluator",
                "previous_agent": state.get("current_agent"),
                "results_evaluation": evaluation,
                "results_approval": "approved",
                "status": "writing_report",
                "trace": [f"results_evaluator: passed on attempt {attempt}"],
            }

        hit_cap = attempt >= MAX_EXPERIMENT_ATTEMPTS
        return {
            "current_agent": "results_evaluator",
            "previous_agent": state.get("current_agent"),
            "results_evaluation": evaluation,
            "results_approval": "best_effort" if hit_cap else "rejected",
            "results_limited_by_attempt_cap": hit_cap,
            "status": "writing_report" if hit_cap else "results_evaluation_failed",
            "trace": [
                f"results_evaluator: failed on attempt {attempt}/{MAX_EXPERIMENT_ATTEMPTS}"
                + (" — cap reached, proceeding best-effort to report" if hit_cap else " — retrying")
            ],
        }

    except Exception as exc:
        return {
            "current_agent": "results_evaluator",
            "status": "results_evaluation_failed",
            "trace": [f"results_evaluator: FAILED ({exc})"],
            "errors": [{"agent": "results_evaluator", "step": "evaluating_results", "message": str(exc)}],
        }