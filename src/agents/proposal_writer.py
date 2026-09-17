"""
Proposal Writer
-----------------
Diagram position: Human: Gap Approval (approved) -> Proposal Writer -> Methodology Designer

No human loop directly after this node in the diagram — the proposal draft
gets refined implicitly through the downstream feasibility loop (methodology
gets rejected/redone, not the proposal itself). proposal_draft stays a plain
str per the state.py design (LLM-authored prose, no rigid schema needed).
"""

from ..schemas.state import FYPState
from ..services.llm_service import get_llm

PROPOSAL_SYSTEM_PROMPT = """You are writing the written proposal section of a Final Year \
Project (FYP) document for a university evaluation panel. Formal, academic, technical tone.

Structure the proposal with these sections:
1. Title
2. Problem Statement
3. Motivation (why this matters, referencing the literature)
4. Research Gap(s) being addressed
5. Objectives (bullet list, 3-5 measurable objectives)
6. Expected Outcomes

Write in full prose for narrative sections, not just bullet fragments. Do not include a \
methodology section — that is written separately.

CRITICAL — DO NOT HALLUCINATE: only reference papers from the "Key literature" list given \
to you in the context. Never invent an author, paper title, year, or finding not present \
in that list. If the list is thin or empty, write the Motivation section without \
fabricated citations rather than inventing sources — this proposal may be submitted as a \
real academic document."""


def proposal_writer(state: FYPState) -> dict:
    idea = state.get("selected_idea")
    gaps = state.get("research_gaps", [])
    papers = state.get("papers", [])

    context = (
        f"Topic: {idea.title if idea else state.get('topic')}\n"
        f"Core problem: {idea.core_problem if idea else 'N/A'}\n\n"
        f"Approved research gaps:\n"
        + "\n".join(f"- {g.description} (justification: {g.novelty_justification})" for g in gaps)
        + "\n\nKey literature:\n"
        + "\n".join(f"- {p.title}: {p.key_finding}" for p in papers)
    )

    try:
        llm = get_llm(temperature=0.4)
        response = llm.invoke([("system", PROPOSAL_SYSTEM_PROMPT), ("human", context)])

        return {
            "current_agent": "proposal_writer",
            "previous_agent": state.get("current_agent"),
            "proposal_draft": response.content,
            "status": "designing_methodology",
            "trace": ["proposal_writer: draft generated"],
        }

    except Exception as exc:
        return {
            "current_agent": "proposal_writer",
            "status": "proposal_writing_failed",
            "trace": [f"proposal_writer: FAILED ({exc})"],
            "errors": [{"agent": "proposal_writer", "step": "writing_proposal", "message": str(exc)}],
        }