"""Versioned, source-checked passages. No runtime crawling or untrusted uploads."""
import json
from pathlib import Path

CORPUS_PATH = Path(__file__).with_name("corpus.json")
def all_documents():
    try:
        docs = json.loads(CORPUS_PATH.read_text(encoding="utf-8"))
        assert isinstance(docs, list)
        for doc in docs:
            assert all(isinstance(doc[k], str) and doc[k] for k in
                       ("id", "title", "url", "snippet", "section", "verified_on", "organisation"))
            assert doc["url"].startswith("https://www.nhs.uk/")
            assert isinstance(doc["tags"], list)
        assert len({d["id"] for d in docs}) == len(docs)
        return docs
    except (OSError, ValueError, KeyError, AssertionError, TypeError):
        return []

def by_id(doc_id):
    return next((d for d in all_documents() if d["id"] == doc_id), None)
