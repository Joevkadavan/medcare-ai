"""Retrieval-augmented answer composition with exact passage-to-citation mapping.
No open-ended medical generation: only reviewed source summaries are displayed.
"""
import re
from models import DISCLAIMER
from rag.retriever import retrieve

def answer(question, conversation=()):
    if re.search(r"\b(dose|dosage|prescribe|prescription|diagnose|diagnosis|antibiotic)\b", question.lower()):
        return "I cannot diagnose or recommend prescriptions or dosages. Please ask a qualified healthcare professional. " + DISCLAIMER, []
    docs = retrieve(question, top_k=2)
    # Topic overlap alone does not support a diagnosis or an uncovered sub-question.
    unsupported = re.search(r"(?i)\b(cause|causes|why|cancer|diabetes|pregnant|pregnancy|baby|babies|child|children)\b", question)
    if unsupported:
        docs = []
    if not docs and not unsupported and re.match(r"(?i)^(and |what about (that|it)|how long|what else|when should i)", question):
        previous = next((t.content for t in reversed(conversation)
                         if t.role == "user" and retrieve(t.content, top_k=1)), "")
        docs = retrieve(previous + " " + question, top_k=2) if previous else []
    if not docs:
        return "I do not have a sufficiently relevant verified passage for that question. Try a question about fever, headaches, cough, tiredness, breathing or stroke warning signs, or ask a healthcare professional. " + DISCLAIMER, []
    message = "Based on the retrieved NHS guidance:\n\n" + "\n\n".join(
        f"{doc['snippet']} [{index}]" for index, doc in enumerate(docs, 1))
    return message + "\n\n" + DISCLAIMER, docs
