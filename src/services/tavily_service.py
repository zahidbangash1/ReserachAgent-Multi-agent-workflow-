"""
Tavily Search Service
----------------------
Thin wrapper around the Tavily API so agents never call it directly.
Centralizing it here also makes it easy to add caching/rate-limiting later.
"""

import os
from typing import List

from tavily import TavilyClient

from ..schemas.models import TavilySearchResult

_client: TavilyClient | None = None


def _get_client() -> TavilyClient:
    global _client
    if _client is None:
        api_key = os.environ.get("TAVILY_API_KEY")
        if not api_key:
            raise RuntimeError("TAVILY_API_KEY not set in environment (.env).")
        _client = TavilyClient(api_key=api_key)
    return _client


def search_academic_papers(queries: List[str], max_results_per_query: int = 5) -> List[TavilySearchResult]:
    """Runs each query through Tavily and returns deduplicated TavilySearchResult
    objects. Uses Tavily's 'advanced' search depth for better academic recall."""
    client = _get_client()
    seen_urls = set()
    results: List[TavilySearchResult] = []

    for query in queries:
        response = client.search(
            query=query,
            search_depth="advanced",
            max_results=max_results_per_query,
        )
        for item in response.get("results", []):
            url = item.get("url")
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)
            results.append(
                TavilySearchResult(
                    title=item.get("title", ""),
                    url=url,
                    content=item.get("content", ""),
                    score=item.get("score"),
                    tavily_source_id=item.get("id"),
                )
            )

    return results