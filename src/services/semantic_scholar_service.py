"""
Semantic Scholar Service
--------------------------
Provides real, structured academic metadata (title, authors, year, url,
abstract) via the Semantic Scholar Graph API — no API key required for
light/normal use (rate-limited to ~100 requests per 5 min without a key).
For heavier use, get a free key at https://www.semanticscholar.org/product/api
and set SEMANTIC_SCHOLAR_API_KEY in .env; this service will pick it up
automatically if present.

Why this exists: Tavily (services/tavily_service.py) returns unstructured
web snippets — no reliable author/year fields. Previously, literature_review
_agent asked the LLM to fill in authors/year from those snippets, but the
LLM has no real source for that and was told to leave it blank rather than
guess (to avoid hallucinated citations). This service is the honest fix:
get REAL structured metadata directly from an academic API instead of
asking the LLM to infer it.
"""

import os
from typing import List, TypedDict

import requests

SEMANTIC_SCHOLAR_SEARCH_URL = "https://api.semanticscholar.org/graph/v1/paper/search"


class SemanticScholarPaper(TypedDict):
    title: str
    authors: List[str]
    year: int | None
    url: str | None
    abstract: str | None


def search_papers(query: str, limit: int = 5) -> List[SemanticScholarPaper]:
    """Searches Semantic Scholar for papers matching `query`. Returns
    structured metadata directly from the API — title/authors/year/url are
    real, not LLM-inferred.

    Raises requests.RequestException on failure (network error, timeout,
    rate limit / non-2xx status) rather than swallowing it — the caller
    (literature_review_agent) needs to distinguish "API failed" from
    "API succeeded but found 0 matches" to log a useful trace message.
    A previous version caught and hid this distinction, which made a run
    that silently fell back to Tavily for every paper impossible to
    diagnose (rate limit? bad query? genuinely no matches?)."""
    headers = {}
    api_key = os.environ.get("SEMANTIC_SCHOLAR_API_KEY")
    if api_key:
        headers["x-api-key"] = api_key

    response = requests.get(
        SEMANTIC_SCHOLAR_SEARCH_URL,
        params={
            "query": query,
            "limit": limit,
            "fields": "title,authors,year,url,abstract",
        },
        headers=headers,
        timeout=10,
    )
    response.raise_for_status()
    data = response.json()

    papers: List[SemanticScholarPaper] = []
    for item in data.get("data", []):
        papers.append(
            SemanticScholarPaper(
                title=item.get("title") or "",
                authors=[a.get("name", "") for a in (item.get("authors") or []) if a.get("name")],
                year=item.get("year"),
                url=item.get("url"),
                abstract=item.get("abstract"),
            )
        )
    return papers


def _normalize_title(title: str) -> str:
    return "".join(ch.lower() for ch in title if ch.isalnum() or ch.isspace()).strip()


def enrich_paper_by_title(title: str) -> SemanticScholarPaper | None:
    """Looks up a SPECIFIC known paper title on Semantic Scholar to recover
    real authors/year for papers that were found via Tavily (which has no
    structured author/year fields at all).

    Searching by an exact, known title is far more likely to hit the right
    paper than the broad topic-level search in search_papers() — that one
    is a general "find me relevant papers on X" query, this one is "I
    already know this exact paper exists, find its metadata."

    Returns None (never raises) if the API fails, finds nothing, or the
    best match's title doesn't look like the same paper (guards against
    attaching the wrong paper's authors/year to this title) — silence here
    is the safe default, since the caller falls back to leaving authors/
    year blank either way."""
    try:
        candidates = search_papers(title, limit=1)
    except requests.RequestException:
        return None

    if not candidates:
        return None

    best = candidates[0]
    norm_query = _normalize_title(title)
    norm_result = _normalize_title(best["title"])
    if not norm_query or not norm_result:
        return None

    # Cheap containment-based similarity check (no extra dependency): treat
    # it as the same paper only if one title's word set is largely covered
    # by the other's. Deliberately conservative — attaching a WRONG paper's
    # authors/year would be worse than leaving them blank.
    query_words = set(norm_query.split())
    result_words = set(norm_result.split())
    if not query_words:
        return None
    overlap = len(query_words & result_words) / len(query_words)
    if overlap < 0.7:
        return None

    return best