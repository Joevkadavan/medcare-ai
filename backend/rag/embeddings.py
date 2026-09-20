"""Embedding backend.

PLACEHOLDER. The current implementation is a deterministic bag-of-words hashing
embedder so the retrieval pipeline can run with zero external dependencies.

To go live with real semantic retrieval, implement `embed()` against an
embedding API (OpenAI text-embedding-3-small, Voyage, or a local sentence
model) and keep the return contract: a normalised list[float].
"""

from __future__ import annotations

import hashlib
import math
import re

DIM = 256
EMBEDDING_LIVE = False  # flipped to True when a real model is wired in

_TOKEN_RE = re.compile(r"[a-z0-9]+")

STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "do", "for",
    "from", "has", "have", "i", "if", "in", "is", "it", "my", "of", "on", "or",
    "that", "the", "their", "there", "these", "they", "this", "to", "was", "were",
    "what", "when", "which", "with", "you", "your",
}


def tokenise(text: str) -> list[str]:
    tokens = [t for t in _TOKEN_RE.findall(text.lower()) if t not in STOPWORDS]
    # crude stemming so "headaches" and "headache" collide
    return [t[:-1] if len(t) > 4 and t.endswith("s") else t for t in tokens]


def embed(text: str) -> list[float]:
    """Return a normalised pseudo-embedding using hashed token counts."""
    vector = [0.0] * DIM
    for token in tokenise(text):
        digest = hashlib.md5(token.encode("utf-8")).hexdigest()
        bucket = int(digest[:8], 16) % DIM
        vector[bucket] += 1.0

    norm = math.sqrt(sum(v * v for v in vector))
    if norm == 0:
        return vector
    return [v / norm for v in vector]


def cosine(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b))
