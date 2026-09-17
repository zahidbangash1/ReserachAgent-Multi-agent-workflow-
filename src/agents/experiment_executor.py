"""
Experiment Executor
----------------------
Diagram position: Experiment Planner -> Experiment Executor -> Results Evaluator

IMPORTANT SCOPE NOTE (high-level pass): actually training/fine-tuning models
inside this graph is a much bigger infra decision (sandboxed compute, GPU
access, timeouts) than a single node file can settle. This implementation
calls a pluggable execution_service so the interface is correct now; the
service itself currently returns an LLM-generated *plausible dry-run*
description rather than real training numbers. When real execution infra is
ready (e.g. a sandboxed script runner), swap out
services/execution_service.run_experiment's internals only — this agent's
code doesn't need to change.
"""

from ..schemas.state import FYPState
from ..schemas.models import ExperimentResult
from ..services.execution_service import run_experiment  # see scope note above


def experiment_executor(state: FYPState) -> dict:
    plan = state.get("experiment_plan")
    attempt = state.get("experiment_attempts", 0)

    if plan is None:
        return {
            "current_agent": "experiment_executor",
            "status": "experiment_execution_failed",
            "trace": ["experiment_executor: no experiment_plan in state, cannot run"],
            "errors": [
                {"agent": "experiment_executor", "step": "executing_experiments", "message": "missing experiment_plan"}
            ],
        }

    try:
        result: ExperimentResult = run_experiment(plan=plan, attempt=attempt)

        return {
            "current_agent": "experiment_executor",
            "previous_agent": state.get("current_agent"),
            "experiment_results": [result],  # operator.add — history across attempts is intentional
            "status": "evaluating_results",
            "trace": [f"experiment_executor: attempt {attempt} status={result.status}"],
        }

    except Exception as exc:
        error_result = ExperimentResult(attempt=attempt, summary=f"Execution error: {exc}", status="error")
        return {
            "current_agent": "experiment_executor",
            "experiment_results": [error_result],
            "status": "experiment_execution_failed",
            "trace": [f"experiment_executor: FAILED attempt {attempt} ({exc})"],
            "errors": [
                {"agent": "experiment_executor", "step": "executing_experiments", "message": str(exc)}
            ],
        }