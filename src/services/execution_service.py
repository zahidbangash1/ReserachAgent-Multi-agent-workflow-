"""
Execution Service (stub)
--------------------------
Currently produces a plausible dry-run summary via LLM instead of literally
training a model — actually running arbitrary ML training safely (sandboxing,
GPU/timeout limits, dependency installs) is a separate infra task outside
this graph's scope for now.

Swap run_experiment's internals for a real sandboxed runner later; the
ExperimentResult contract it returns should not need to change.
"""

from pydantic import BaseModel, Field
from typing import Literal

from ..schemas.models import ExperimentDesign, ExperimentResult
from .llm_service import get_structured_llm

DRYRUN_SYSTEM_PROMPT = """You are simulating a plausible outcome for an undergraduate FYP \
experiment, given its design. Produce a realistic summary of what running this experiment \
would likely show (rough performance relative to baselines, likely issues), and a status:
- "success": the setup is sound and would likely produce usable results
- "failure": the setup has a fundamental flaw that would make results unusable
- "error": the setup itself is broken/underspecified (e.g. missing baseline)

Be a realistic, moderately critical judge — most well-planned experiments should be \
"success", but genuinely weak plans should fail here rather than downstream."""


class _DryRunOutput(BaseModel):
    summary: str
    status: Literal["success", "failure", "error"]


def run_experiment(plan: ExperimentDesign, attempt: int) -> ExperimentResult:
    structured_llm = get_structured_llm(_DryRunOutput, temperature=0.3)
    result: _DryRunOutput = structured_llm.invoke(
        [
            ("system", DRYRUN_SYSTEM_PROMPT),
            (
                "human",
                f"Datasets: {plan.datasets}\nMetrics: {plan.metrics}\nBaselines: {plan.baselines}",
            ),
        ]
    )
    return ExperimentResult(attempt=attempt, summary=result.summary, status=result.status)