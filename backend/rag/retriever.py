"""Hybrid retriever over the local knowledge base.

Scoring blends a hashed-embedding cosine similarity with a lexical tag/title
overlap score, so short queries like "sore throat" still land on the right
document. Returns the top-k entries with a relevance score.

This is the seam for real RAG: replace `embed` in embeddings.py with a real
model and grow `KB` into an ingested corpus. The retriever itself is unchanged.
"""

from __future__ import annotations

from config import get_settings
from rag.embeddings import cosine, embed, tokenise
from rag.knowledge_base import all_documents


def _lexical_score(query_tokens: set[str], doc: dict) -> float:
    title_tokens = set(tokenise(doc["title"]))
    tag_tokens = set(tokenise(" ".join(doc.get("tags", []))))
    body_tokens = set(tokenise(doc.get("snippet", "")))

    if not query_tokens:
        return 0.0

    overlap_tags = len(query_tokens & tag_tokens) / len(query_tokens)
    overlap_title = len(query_tokens & title_tokens) / len(query_tokens)
    overlap_body = len(query_tokens & body_tokens) / len(query_tokens)
    return 1.0 * overlap_tags + 0.8 * overlap_title + 0.3 * overlap_body


def retrieve(query: str, top_k: int | None = None) -> list[dict]:
    """Return the best-matching knowledge base entries for a query."""
    settings = get_settings()
    if not settings.rag_enabled:
        return []

    k = top_k or settings.rag_top_k
    query = (query or "").strip()
    query_tokens = set(tokenise(query))
    query_vector = embed(query)

    scored: list[tuple[float, dict]] = []
    for doc in all_documents():
        lexical = _lexical_score(query_tokens, doc)
        semantic = cosine(query_vector, embed(f"{doc['title']} {' '.join(doc.get('tags', []))} {doc['snippet']}"))
        score = 0.7 * lexical + 0.3 * semantic
        if score > 0.05:
            scored.append((score, doc))

    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [
        {
            "id": doc["id"],
            "title": doc["title"],
            "organisation": doc["organisation"],
            "url": doc["url"],
            "snippet": doc["snippet"],
            "score": round(score, 3),
        }
        for score, doc in scored[:k]
    ]


def retrieve_for_assessment(assessment: dict, extra_text: str = "", top_k: int | None = None) -> list[dict]:
    """Build a retrieval query from the structured assessment."""
    parts = [
        *[s for s in (assessment.get("symptoms") or [])],
        *[s for s in (assessment.get("additional_symptoms") or [])],
        assessment.get("notes") or "",
        extra_text or "",
    ]
    query = " ".join(p for p in parts if p)
    return retrieve(query, top_k=top_k)
