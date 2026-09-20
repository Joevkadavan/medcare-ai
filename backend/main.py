"""MedCare AI — FastAPI backend.

Endpoints:
  GET  /              service banner
  GET  /health        liveness + current AI/RAG mode
  POST /assess        structured symptom assessment (legacy-compatible)
  POST /consultation  full assessment -> risk grade, summary, guidance
  POST /chat          stateful follow-up chatbot turn
  POST /reset         clear consultation state

Safety: this service never diagnoses. All output is general health information.
LLM calls happen server-side only; the API key is never exposed to the client.
"""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import store
from config import get_settings
from models import (
    AssessRequest,
    AssessResponse,
    ChatRequest,
    ChatResponse,
    ConsultationRequest,
    ConsultationResponse,
    HealthResponse,
    ResetRequest,
    ResetResponse,
    Source,
)
from rag.embeddings import EMBEDDING_LIVE
from rag.retriever import retrieve_for_assessment
from services import ai_service, symptom_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("medcare")

settings = get_settings()

app = FastAPI(
    title="MedCare AI API",
    description=(
        "AI-assisted health guidance. Not a diagnostic service. "
        "All guidance is general information and is not a substitute for professional care."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def rag_status() -> str:
    """RAG READY = pipeline wired, local corpus. RAG ACTIVE = real embedding index."""
    if settings.rag_enabled and EMBEDDING_LIVE:
        return "RAG ACTIVE"
    return "RAG READY"


def ai_mode() -> str:
    return "live" if settings.ai_live else "mock"


def to_sources(docs: list[dict]) -> list[Source]:
    return [
        Source(
            title=doc["title"],
            organisation=doc["organisation"],
            url=doc["url"],
            snippet=doc["snippet"],
        )
        for doc in docs
    ]


@app.get("/", tags=["meta"])
def root() -> dict:
    return {
        "service": "MedCare AI",
        "status": "ok",
        "ai_mode": ai_mode(),
        "rag_status": rag_status(),
        "docs": "/docs",
        "disclaimer": "General health information only — not a diagnosis.",
    }


@app.get("/health", response_model=HealthResponse, tags=["meta"])
def health() -> HealthResponse:
    return HealthResponse(status="ok", ai_mode=ai_mode(), rag_status=rag_status())


@app.post("/assess", response_model=AssessResponse, tags=["consultation"])
def assess(payload: AssessRequest) -> AssessResponse:
    """Structured symptom assessment. Deterministic — does not call an LLM."""
    assessment = {
        "symptoms": payload.symptoms,
        "duration": payload.duration,
        "severity": payload.severity,
        "additional_symptoms": [],
        "notes": payload.notes,
    }
    analysis = symptom_service.analyse(assessment)
    docs = retrieve_for_assessment(assessment)
    logger.info("assess risk=%s emergency=%s", analysis["risk_level"], analysis["emergency"])
    return AssessResponse(
        risk_level=analysis["risk_level"],
        emergency=analysis["emergency"],
        summary=analysis["summary"],
        next_steps=analysis["next_steps"],
        warning_signs=analysis["warning_signs"],
        seek_care_when=analysis["seek_care_when"],
        sources=to_sources(docs),
        ai_mode=ai_mode(),
        rag_status=rag_status(),
    )


@app.post("/consultation", response_model=ConsultationResponse, tags=["consultation"])
def consultation(payload: ConsultationRequest) -> ConsultationResponse:
    """Full consultation result: risk grade, narrative summary, next steps, sources."""
    assessment = payload.assessment.model_dump()
    analysis = symptom_service.analyse(assessment)

    if payload.session_id:
        store.save(payload.session_id, assessment=assessment)

    docs = retrieve_for_assessment(assessment)
    logger.info("consultation risk=%s emergency=%s", analysis["risk_level"], analysis["emergency"])

    return ConsultationResponse(
        risk_level=analysis["risk_level"],
        emergency=analysis["emergency"],
        summary=analysis["summary"],
        reported={
            "symptoms": assessment.get("symptoms") or [],
            "additional_symptoms": assessment.get("additional_symptoms") or [],
            "duration": assessment.get("duration") or "",
            "severity": assessment.get("severity") or "",
            "notes": assessment.get("notes") or "",
        },
        next_steps=analysis["next_steps"],
        warning_signs=analysis["warning_signs"],
        seek_care_when=analysis["seek_care_when"],
        sources=to_sources(docs),
        ai_mode=ai_mode(),
        rag_status=rag_status(),
    )


@app.post("/chat", response_model=ChatResponse, tags=["consultation"])
async def chat(payload: ChatRequest) -> ChatResponse:
    """One conversational turn. Maintains state, detects emergencies, asks follow-ups."""
    assessment = payload.assessment.model_dump()

    # Merge any stored context for this session.
    session = store.get(payload.session_id)
    if session:
        stored = session.get("assessment") or {}
        for key, value in stored.items():
            if not assessment.get(key) and value:
                assessment[key] = value

    if payload.message:
        assessment.setdefault("notes", "")
        joined = f"{assessment['notes']} {payload.message}".strip()
        assessment["notes"] = joined

    analysis = symptom_service.analyse(assessment)
    analysis["assessment"] = assessment

    docs = retrieve_for_assessment(assessment, extra_text=payload.message)
    message, question, options, complete, mode = await ai_service.generate_reply(payload, analysis, docs)

    if payload.session_id:
        store.save(
            payload.session_id,
            assessment=assessment,
            conversation=[t.model_dump() for t in payload.conversation],
        )

    return ChatResponse(
        message=message,
        next_question=question,
        options=options,
        allow_free_text=True,
        risk_level=analysis["risk_level"],
        emergency=analysis["emergency"],
        complete=complete,
        sources=to_sources(docs),
        ai_mode=mode,
    )


@app.post("/reset", response_model=ResetResponse, tags=["consultation"])
def reset(payload: ResetRequest) -> ResetResponse:
    store.clear(payload.session_id)
    return ResetResponse()
