"""Retrieval layer.

STATUS: RAG READY — the retrieval pipeline is wired end to end, backed by a
small curated local knowledge base. It performs real keyword/BM25-style scoring
over that corpus.

It is NOT yet RAG ACTIVE over a large external corpus: there is no vector index
and no embedding model. Swap `embeddings.py` for a real embedding backend and
`knowledge_base.py` for an ingested corpus, and the retriever needs no changes.
"""