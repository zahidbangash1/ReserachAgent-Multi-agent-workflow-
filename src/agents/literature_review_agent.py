"""
Literature Review Agent
------------------------
Diagram position: (Human: Topic Approval approved | Auto Select Topic) -> Literature Review Agent -> Citation Validator

Two-source strategy:
1. PRIMARY — Semantic Scholar (services/semantic_scholar_service.py): returns
   REAL structured title/authors/year/url directly from an academic API. No
   LLM guessing involved for these fields at all — this is what actually
   fixes the "authors: n/a" issue, since the LLM was never a reliable source
   for that metadata to begin with.
2. FALLBACK — Tavily (services/tavily_service.py): only used to fill in
   coverage when Semantic Scholar returns too few results for the topic.
   Papers sourced this way start with authors=[] / year=None (Tavily has no
   structured metadata), but each one then gets a per-title Semantic Scholar
   lookup (enrich_paper_by_title) as a second chance to recover real
   authors/year — searching by an exact known title hits a specific paper
   far more reliably than the earlier broad topic-level search did. If that
   lookup also comes up empty, authors/year stay honestly blank — still no
   LLM guessing here, that's what caused the fabricated-citation problem
   originally.
"""

from pydantic import BaseModel, Field
from typing import List

from ..schemas.state import FYPState
from ..schemas.models import ResearchPaper, TavilySearchResult
from ..services.llm_service import get_structured_llm
from ..services.tavily_service import search_academic_papers
from ..services.semantic_scholar_service import search_papers as search_semantic_scholar
from ..services.semantic_scholar_service import enrich_paper_by_title, _normalize_title

MIN_PAPERS_BEFORE_TAVILY_FALLBACK = 3

# --- key_finding generation for Semantic Scholar papers (grounded in abstract) ---

KEY_FINDING_SYSTEM_PROMPT = """For each paper below (title + abstract), write ONE short \
sentence (key_finding) summarizing its main contribution — grounded strictly in the \
abstract text given. Do not use outside knowledge about the paper. If the abstract is \
thin or unclear, write a neutral one-line description based only on what's given.

Return exactly one finding per paper, in the SAME ORDER as listed — do not skip, merge, \
or reorder any."""


class PaperFinding(BaseModel):
    key_finding: str


class KeyFindingOutput(BaseModel):
    findings: List[PaperFinding]


def _clean_title(title: str) -> str:
    """Strips common search-snippet truncation artifacts (trailing '...', '…',
    stray whitespace) without altering the actual wording — formatting only,
    never fabricating missing words."""
    return title.strip().rstrip(".…").strip()


def _is_near_duplicate_title(title: str, existing_titles_normalized: List[str]) -> bool:
    """Same paper often gets indexed on multiple sites (mdpi, researchgate
    mirror, PMC, etc.) with identical or near-identical titles but different
    URLs — our earlier dedup only checked exact URL match, so these slipped
    through as separate references (seen in the wild: the LLM had to write
    "(presumed duplicate of #1)" into the actual report). Catches that case
    via the same word-overlap heuristic used for Semantic Scholar title
    matching in semantic_scholar_service.py."""
    norm = _normalize_title(title)
    if not norm:
        return False
    words = set(norm.split())
    if not words:
        return False
    for other in existing_titles_normalized:
        other_words = set(other.split())
        if not other_words:
            continue
        overlap = len(words & other_words) / max(len(words), len(other_words))
        if overlap >= 0.75:
            return True
    return False


# --- Tavily fallback prompt (only used when Semantic Scholar coverage is thin) ---

SUMMARIZE_SYSTEM_PROMPT = """You are reviewing academic search results for a Final Year \
Project literature review. From the raw search results given, extract the papers that \
are genuinely relevant to the research topic. For each, produce a ResearchPaper: title \
(cleaned of any trailing "..." truncation), authors=[] (leave empty — these results don't \
reliably state authorship), year=None (leave empty — not reliably stated), url, and a \
one-line key_finding summarizing its main contribution relevant to this topic.

Discard results that are not academic papers (blogs, forum posts, etc.).

CRITICAL — DO NOT HALLUCINATE:
- Every ResearchPaper you output MUST correspond to one of the search results given below.
  Use that result's exact url. Never invent a paper, author name, publication year, or
  finding that isn't grounded in the provided content.
- Always leave authors=[] and year=None for these results — do not guess.
- If NONE of the search results are genuinely relevant academic papers, return an empty
  papers list."""


class LiteratureReviewOutput(BaseModel):
    papers: List[ResearchPaper]


def literature_review_agent(state: FYPState) -> dict:
    idea = state.get("selected_idea")
    topic = idea.title if idea else state.get("topic", state["user_query"])

    trace_lines = []
    verified_papers: List[ResearchPaper] = []

    try:
        # --- Primary: Semantic Scholar (real metadata) ---
        try:
            ss_results = search_semantic_scholar(topic, limit=6)
            ss_results = [p for p in ss_results if p["title"]]

            # The full generated topic title is often too long/specific for
            # Semantic Scholar's search to match well (it's not a real paper
            # title). If that returned nothing, retry once with a broader
            # domain-level query before giving up on this source.
            if not ss_results and idea and idea.domain:
                trace_lines.append(f"literature_review_agent: Semantic Scholar returned 0 matches for full topic, retrying with domain '{idea.domain}'")
                ss_results = search_semantic_scholar(idea.domain, limit=6)
                ss_results = [p for p in ss_results if p["title"]]

            if not ss_results:
                trace_lines.append("literature_review_agent: Semantic Scholar returned 0 matches")
        except Exception as ss_exc:
            # Distinguish "API call failed" from "0 matches" in the trace so
            # this is diagnosable (rate limit vs bad query vs genuinely
            # nothing indexed) instead of silently falling through to Tavily.
            ss_results = []
            trace_lines.append(f"literature_review_agent: Semantic Scholar request failed ({ss_exc}), falling back to Tavily only")

        if ss_results:
            with_abstract = [p for p in ss_results if p.get("abstract")]
            without_abstract = [p for p in ss_results if not p.get("abstract")]

            findings_by_index: List[str] = []
            if with_abstract:
                # Truncate abstracts before sending — Semantic Scholar abstracts
                # can run 300-400+ words each; 6 papers' worth of full abstracts
                # plus reserved max_tokens routinely exceeded gpt-oss-120b's
                # 8000 TPM cap (413 "Request too large"). 500 chars is enough
                # for a one-line key_finding summary anyway.
                context = "\n---\n".join(
                    f"Title: {p['title']}\nAbstract: {p['abstract'][:500]}" for p in with_abstract
                )
                structured_llm = get_structured_llm(KeyFindingOutput, temperature=0.2, max_tokens=1400)
                result: KeyFindingOutput = structured_llm.invoke(
                    [("system", KEY_FINDING_SYSTEM_PROMPT), ("human", context)]
                )
                if len(result.findings) == len(with_abstract):
                    findings_by_index = [f.key_finding for f in result.findings]
                else:
                    # LLM didn't return a 1:1 match — don't guess which finding
                    # belongs to which paper, fall back to a neutral default.
                    findings_by_index = [None] * len(with_abstract)

            for paper, finding in zip(with_abstract, findings_by_index):
                verified_papers.append(
                    ResearchPaper(
                        title=_clean_title(paper["title"]),
                        authors=paper["authors"],
                        year=paper["year"],
                        url=paper["url"],
                        tavily_source_id=None,
                        key_finding=finding or f"Relevant to {topic} (see abstract for details).",
                    )
                )
            for paper in without_abstract:
                verified_papers.append(
                    ResearchPaper(
                        title=_clean_title(paper["title"]),
                        authors=paper["authors"],
                        year=paper["year"],
                        url=paper["url"],
                        tavily_source_id=None,
                        key_finding="No abstract available — relevance inferred from title only.",
                    )
                )
            trace_lines.append(f"literature_review_agent: {len(verified_papers)} papers from Semantic Scholar (real authors/year)")

        # --- Fallback: Tavily, only if Semantic Scholar coverage is thin ---
        raw_tavily_results: List[TavilySearchResult] = []
        if len(verified_papers) < MIN_PAPERS_BEFORE_TAVILY_FALLBACK:
            try:
                queries = [topic, f"{topic} survey", f"{topic} state of the art NLP"]
                raw_tavily_results = search_academic_papers(queries)

                if raw_tavily_results:
                    # Cap how many results actually reach the LLM (dedup order),
                    # and shrink each result's content preview — both reduce
                    # prompt size so more of the 8000 TPM budget is left for
                    # max_tokens.
                    trimmed_results = raw_tavily_results[:8]
                    structured_llm = get_structured_llm(LiteratureReviewOutput, temperature=0.2, max_tokens=3000)
                    tavily_result: LiteratureReviewOutput = structured_llm.invoke(
                        [
                            ("system", SUMMARIZE_SYSTEM_PROMPT),
                            (
                                "human",
                                f"Topic: {topic}\n\nSearch results:\n"
                                + "\n---\n".join(
                                    f"Title: {r.title}\nURL: {r.url}\nContent: {r.content[:250]}" for r in trimmed_results
                                ),
                            ),
                        ]
                    )
                    known_urls = {r.url for r in trimmed_results}
                    already_known_urls = {p.url for p in verified_papers}
                    already_known_titles_norm = [_normalize_title(p.title) for p in verified_papers]

                    new_from_tavily = []
                    for p in tavily_result.papers:
                        if p.url not in known_urls or p.url in already_known_urls:
                            continue
                        if _is_near_duplicate_title(p.title, already_known_titles_norm):
                            continue  # same paper as one we already have, just a different host/mirror
                        new_from_tavily.append(p)
                        already_known_titles_norm.append(_normalize_title(p.title))

                    # Second chance at real authors/year: Tavily gave us a title
                    # but no structured metadata. Look each one up by its exact
                    # title on Semantic Scholar.
                    enriched_count = 0
                    for p in new_from_tavily:
                        match = enrich_paper_by_title(p.title)
                        if match:
                            p.authors = match["authors"] or p.authors
                            p.year = match["year"] or p.year
                            enriched_count += 1

                    verified_papers.extend(new_from_tavily)
                    if enriched_count:
                        trace_lines.append(f"literature_review_agent: enriched {enriched_count}/{len(new_from_tavily)} Tavily papers with real authors/year from Semantic Scholar")
                    trace_lines.append(f"literature_review_agent: +{len(new_from_tavily)} papers from Tavily fallback")
            except Exception as tavily_exc:
                trace_lines.append(f"literature_review_agent: Tavily fallback encountered error ({tavily_exc}), proceeding with {len(verified_papers)} existing papers")

        if not verified_papers:
            trace_lines.append("literature_review_agent: no relevant papers found from either source (no fabrication)")

        return {
            "current_agent": "literature_review",
            "previous_agent": state.get("current_agent"),
            "tavily_search_queries": [topic, f"{topic} survey", f"{topic} state of the art NLP"],
            "raw_search_results": raw_tavily_results,
            "ranked_search_results": raw_tavily_results,
            "papers": verified_papers,
            "status": "validating_citations",
            "trace": trace_lines,
        }

    except Exception as exc:
        return {
            "current_agent": "literature_review",
            "status": "literature_review_failed",
            "papers": [],  # explicit, so downstream (citation_validator/gap_finder)
            # sees a clean empty list rather than silently inheriting whatever
            # was in state before — this was previously omitted, meaning a
            # mid-run failure here could leave stale/partial data for the
            # next node to read.
            "trace": [f"literature_review_agent: FAILED ({exc})"],
            "errors": [
                {"agent": "literature_review_agent", "step": "researching", "message": str(exc)}
            ],
        }