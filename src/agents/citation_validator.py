"""
Citation Validator
-------------------
Diagram position: Literature Review Agent -> Citation Validator -> Gap Finder Agent

No human loop after this node in the diagram — it flags issues but does not
block the pipeline. citation_issues are carried forward so proposal_writer /
report_writer can avoid citing flagged papers, or so a human can review them
later in the final report review.
"""

from pydantic import BaseModel, Field
from typing import List

from ..schemas.state import FYPState
from ..schemas.models import CitationIssue
from ..services.llm_service import get_structured_llm

VALIDATE_SYSTEM_PROMPT = """You are validating a list of academic papers collected for a \
literature review. For each paper, flag an issue if:
- the URL looks broken, missing, or non-academic (e.g. a random blog)
- authors list is empty/unknown and cannot be verified from the content
- the paper appears to be a duplicate of another in the list
- the key_finding claim seems inconsistent with the content snippet

Only flag genuine problems — most papers should pass with no issue."""


class CitationValidationOutput(BaseModel):
    issues: List[CitationIssue] = Field(default_factory=list)


def citation_validator(state: FYPState) -> dict:
    papers = state.get("papers", [])
    if not papers:
        return {
            "current_agent": "citation_validator",
            "citation_issues": [],
            "status": "finding_gaps",
            "trace": ["citation_validator: no papers to validate, skipping"],
        }

    try:
        structured_llm = get_structured_llm(CitationValidationOutput, temperature=0.0)
        papers_text = "\n---\n".join(
            f"Title: {p.title}\nAuthors: {p.authors}\nURL: {p.url}\nKey finding: {p.key_finding}"
            for p in papers
        )
        result: CitationValidationOutput = structured_llm.invoke(
            [("system", VALIDATE_SYSTEM_PROMPT), ("human", papers_text)]
        )

        return {
            "current_agent": "citation_validator",
            "previous_agent": state.get("current_agent"),
            "citation_issues": result.issues,
            "status": "finding_gaps",
            "trace": [f"citation_validator: found {len(result.issues)} issues across {len(papers)} papers"],
        }

    except Exception as exc:
        return {
            "current_agent": "citation_validator",
            "citation_issues": [],
            "status": "citation_validation_failed",
            "trace": [f"citation_validator: FAILED, proceeding without validation ({exc})"],
            "errors": [
                {"agent": "citation_validator", "step": "validating_citations", "message": str(exc)}
            ],
        }