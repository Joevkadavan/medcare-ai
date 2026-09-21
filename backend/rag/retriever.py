"""BM25 retrieval over checked passages; topic gating avoids irrelevant citations.
Scores are retrieval scores, never confidence in a medical conclusion.
"""
import math
from collections import Counter
from config import get_settings
from rag.embeddings import tokenise
from rag.knowledge_base import all_documents

TOPICS = {
    "fever": {"fever", "temperature", "chill"},
    "headache": {"headache", "migraine"},
    "cough": {"cough", "coughing"},
    "fatigue": {"fatigue", "tired", "tirednes", "exhausted"},
    "stroke": {"stroke"},
    "breathing": {"breathing", "breath", "breathlessnes", "breathless"},
}

def retrieve(query, top_k=None):
    if not get_settings().rag_enabled:
        return []
    docs = all_documents()
    tokens = set(tokenise(query))
    topics = [topic for topic, synonyms in TOPICS.items() if tokens & synonyms]
    if not topics or not docs:
        return []
    tokens.update(topics)
    texts = [tokenise(d["title"] + " " + " ".join(d["tags"]) + " " + d["snippet"]) for d in docs]
    average = sum(map(len, texts)) / len(texts)
    frequencies = Counter(token for text in texts for token in set(text))
    scored = []
    for doc, text in zip(docs, texts):
        if not any(doc["id"].startswith(topic + "-") for topic in topics):
            continue
        counts = Counter(text)
        score = 0.0
        for token in tokens:
            tf = counts[token]
            idf = math.log(1 + (len(docs)-frequencies[token]+0.5)/(frequencies[token]+0.5))
            score += idf * (tf*2.5)/(tf + 1.5*(0.25 + 0.75*len(text)/average))
        if score > 0:
            scored.append({**doc, "score": round(score, 4)})
    scored.sort(key=lambda d: (-d["score"], d["id"]))
    return scored[:min(top_k or get_settings().rag_top_k, 4)]

def retrieve_for_assessment(assessment, extra_text="", top_k=None):
    return retrieve(" ".join([*(assessment.get("symptoms") or []),
        *(assessment.get("additional_symptoms") or []), assessment.get("notes", ""), extra_text]), top_k)
