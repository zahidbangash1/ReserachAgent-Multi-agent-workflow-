"""
Report / Paper Writer
------------------------
Diagram position: Results Evaluator (passed) -> Report / Paper Writer -> Human: Final Review

Compiles everything gathered so far (proposal, approved methodology,
experiment results, citation-checked papers) into the final report text.
final_report stays plain str per state.py design, same as proposal_draft.

If results_limited_by_attempt_cap is set, the report must disclose this
honestly (e.g. "results are preliminary / inconclusive after N attempts")
rather than presenting a forced-success narrative.

IMPORTANT — experiment_executor currently does NOT run real training; it
produces an LLM-simulated plausible outcome (see services/execution_service.py
docstring). Every report MUST therefore disclose the experimental results as
projected/simulated, not as real measured results — see SIMULATED_RESULTS_
DISCLAIMER below, always injected into the prompt regardless of pass/fail.
Remove this disclaimer requirement once execution_service runs real
experiments.
"""

from ..schemas.state import FYPState
from ..services.llm_service import get_llm

SIMULATED_RESULTS_DISCLAIMER = (
    "The reported experimental numbers were produced by an LLM-simulated dry run of the "
    "experiment design, NOT by actually training/running the models. They represent a "
    "plausible projected outcome, not a measured result."
)

REPORT_PART1_SYSTEM_PROMPT = """You are compiling the FIRST HALF of a Final Year Project \
(FYP) report for a university evaluation panel. Formal, academic, technical tone.

CRITICAL FORMATTING INSTRUCTIONS:
- You MUST use strict GitHub Flavored Markdown headings:
  # [Specific FYP Project Title]
  ## Abstract
  ## 1. Introduction & Problem Statement
  ## 2. Literature Review
  ## 3. Research Gap & Novelty
  ## 4. Proposed Methodology
- Under Abstract, write a rich 250-word academic abstract summarizing the domain, problem, proposed architecture, and expected findings.
- Under Methodology, format each step with numbered bold titles: `1. **Step Name:** description`.
- NEVER write plain unformatted section labels like "Title & Abstract" without markdown `#` or `##`.

Write ONLY these sections. Do NOT write Results, Discussion, Conclusion, or References — those come in a separate part.

CRITICAL — DO NOT HALLUCINATE: the Literature Review MUST cite ONLY papers from the \
"Key literature" list given below. Never invent an author, title, year, or finding not \
provided. If that list is thin or empty, say so plainly rather than fabricating sources."""

REPORT_PART2_SYSTEM_PROMPT = """You are compiling the SECOND HALF of a Final Year Project \
(FYP) report — continuing directly after a first half that already covered Title/Abstract, \
Introduction, Literature Review, Research Gap, and Methodology. Formal, academic, technical tone.

CRITICAL FORMATTING INSTRUCTIONS:
- You MUST use strict GitHub Flavored Markdown headings:
  ## 5. Experimental Setup & Benchmarks
  ### 5.1 Dataset Specifications & Preprocessing
  ### 5.2 Baseline Architectures & Training Protocols
  ## 6. Experimental Results & Performance Analysis
  ## 7. Discussion & Limitations
  ## 8. Conclusion & Future Work
  ## 9. References
- Format datasets and experimental results using clean Markdown tables (| Metric | Baseline | Proposed |).
- In the Experimental Results section, you MUST include, verbatim as a blockquote (> ⚠️ ...), the
  simulated-results disclaimer given below. Do not soften, remove, or bury it.
- Every reference in section 9 MUST include its url exactly as given below.

If the results are marked as limited/best-effort (not a clean pass), the Discussion \
section MUST disclose this plainly — do not overstate confidence in inconclusive results.

CRITICAL — DO NOT HALLUCINATE:
- References MUST be drawn ONLY from the papers list given below. Never invent an author,
  title, year, url, or finding not provided. If the list is empty, say so plainly.
- Every reference entry in section 9 MUST include its url exactly as given below."""


def report_writer(state: FYPState) -> dict:
    idea = state.get("selected_idea")
    proposal = state.get("proposal_draft", "")
    methodology = state.get("methodology_steps", [])
    results = state.get("experiment_results", [])
    evaluation = state.get("results_evaluation")
    papers = state.get("papers", [])
    limited = state.get("results_limited_by_attempt_cap", False)
    feedback = state.get("final_review_feedback")

    topic_line = f"Topic: {idea.title if idea else state.get('topic')}"
    references_block = (
        "\n".join(
            f"- {p.title} ({', '.join(p.authors) or 'n/a'}, {p.year or 'n.d.'}) — {p.url or 'no url available'}"
            for p in papers
        )
        or "(none available — say so plainly, do not invent references)"
    )

    # NOTE: openai/gpt-oss-120b's TPM cap on this tier is only 8000, and that
    # cap covers (prompt_tokens + max_tokens) for a SINGLE request. A full
    # 9-section report in one call previously needed max_tokens=8192 just for
    # the output — already over the cap before counting any prompt content
    # (hit a 413 "Requested 12542" error). Splitting into two smaller calls
    # keeps each individual request's prompt+max_tokens comfortably under
    # 8000, while still producing the full report in aggregate.
    part1_context = (
        f"{topic_line}\n\n"
        f"Proposal draft:\n{proposal}\n\n"
        f"Methodology:\n" + "\n".join(f"{s.step_number}. {s.title}: {s.description}" for s in methodology)
        + f"\n\nKey literature:\n{references_block}"
    )

    part2_context = (
        f"{topic_line}\n\n"
        "Experiment results:\n"
        + "\n".join(f"Attempt {r.attempt} ({r.status}): {r.summary}" for r in results)
        + f"\n\nFinal evaluation: {evaluation.feedback if evaluation else 'N/A'}"
        + (f"\n\nNOTE: results are best-effort / not a clean pass after max attempts — disclose this." if limited else "")
        + f"\n\nSimulated-results disclaimer (must appear verbatim in the Results section):\n{SIMULATED_RESULTS_DISCLAIMER}"
        + f"\n\nReferences (ONLY cite these):\n{references_block}"
    )
    if feedback:
        part2_context += f"\n\nPrevious draft was sent back for revision. Feedback: {feedback}"

    try:
        llm = get_llm(temperature=0.4, max_tokens=3500)

        response1 = llm.invoke([("system", REPORT_PART1_SYSTEM_PROMPT), ("human", part1_context)])
        response2 = llm.invoke([("system", REPORT_PART2_SYSTEM_PROMPT), ("human", part2_context)])

        truncated = any(
            (r.response_metadata or {}).get("finish_reason") == "length" for r in (response1, response2)
        )
        trace_msg = "report_writer: draft compiled (2-part generation)"
        if truncated:
            trace_msg += " — ⚠️ one part hit max_tokens (3500) and was likely cut off; consider raising max_tokens or splitting further"

        final_report = response1.content.rstrip() + "\n\n" + response2.content.lstrip()

        return {
            "current_agent": "report_writer",
            "previous_agent": state.get("current_agent"),
            "final_report": final_report,
            "status": "awaiting_final_review",
            "trace": [trace_msg],
        }

    except Exception as exc:
        return {
            "current_agent": "report_writer",
            "status": "report_writing_failed",
            "trace": [f"report_writer: FAILED ({exc})"],
            "errors": [{"agent": "report_writer", "step": "writing_report", "message": str(exc)}],
        }