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

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
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
    RootResponse,
)
from rag.retriever import retrieve_for_assessment
from rag.qa import answer as answer_question
from services.emergency_service import detect_emergency
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
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc: RequestValidationError):
    # Pydantic errors can include the original health narrative; never echo it.
    return JSONResponse(status_code=422, content={"detail": "Invalid or oversized consultation input."})


def rag_status(docs=None) -> str:
    if not settings.rag_enabled:
        return "RAG_DISABLED"
    return "RAG_ACTIVE" if docs else "RAG_READY"


def contextual_assessment(payload):
    assessment = payload.assessment.model_dump()
    # Screen every user turn. Assistant warnings must never become reported symptoms.
    notes = [assessment["notes"], *[t.content for t in payload.conversation if t.role == "user"]]
    if getattr(payload, "message", ""):
        notes.append(payload.message)
    assessment["notes"] = "\n".join(n for n in notes if n)
    return assessment


def analyse_session(payload):
    sid, token = store.resolve(payload.session_id, payload.session_token)
    assessment = contextual_assessment(payload)
    analysis = symptom_service.analyse(assessment)
    if store.latch(sid, analysis["emergency"]):
        analysis.update(emergency=True, risk_level="EMERGENCY",
                        next_steps=symptom_service.next_steps_for("EMERGENCY"))
    analysis["assessment"] = assessment
    return sid, token, assessment, analysis


def ai_mode() -> str:
    return "mock"


def to_sources(docs: list[dict]) -> list[Source]:
    return [Source(**{k: d[k] for k in Source.model_fields}) for d in docs]



@app.get("/", response_model=RootResponse, tags=["meta"])
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
        "additional_symptoms": payload.additional_symptoms,
        "notes": payload.notes,
    }
    analysis = symptom_service.analyse(assessment)
    docs = retrieve_for_assessment(assessment)
    logger.info("assess risk=%s emergency=%s", analysis["risk_level"], analysis["emergency"])
    return AssessResponse(
        risk_level=analysis["risk_level"],
        emergency=analysis["emergency"],
        summary=analysis["summary"] + ("\n\nRetrieved guidance:\n" + "\n".join(f"{d['snippet']} [{i}]" for i, d in enumerate(docs, 1)) if docs and not analysis["emergency"] else ""),
        next_steps=analysis["next_steps"],
        warning_signs=analysis["warning_signs"],
        seek_care_when=analysis["seek_care_when"],
        sources=to_sources(docs) if not analysis["emergency"] else [],
        ai_mode=ai_mode(),
        rag_status=rag_status(docs if not analysis["emergency"] else []),
    )


@app.post("/consultation", response_model=ConsultationResponse, tags=["consultation"])
def consultation(payload: ConsultationRequest) -> ConsultationResponse:
    """Full consultation result: risk grade, narrative summary, next steps, sources."""
    sid, token, assessment, analysis = analyse_session(payload)
    docs = retrieve_for_assessment(assessment)
    logger.info("consultation risk=%s emergency=%s", analysis["risk_level"], analysis["emergency"])

    return ConsultationResponse(
        session_id=sid, session_token=token,
        risk_level=analysis["risk_level"],
        emergency=analysis["emergency"],
        summary=analysis["summary"] + ("\n\nRetrieved guidance:\n" + "\n".join(f"{d['snippet']} [{i}]" for i, d in enumerate(docs, 1)) if docs and not analysis["emergency"] else ""),
        follow_up_answers=[t.content for t in payload.conversation if t.role == "user"],
        reported={
            "symptoms": assessment.get("symptoms") or [],
            "additional_symptoms": assessment.get("additional_symptoms") or [],
            "duration": assessment.get("duration") or "",
            "severity": assessment.get("severity") or "",
            "notes": payload.assessment.notes,
        },
        next_steps=analysis["next_steps"],
        warning_signs=analysis["warning_signs"],
        seek_care_when=analysis["seek_care_when"],
        sources=to_sources(docs) if not analysis["emergency"] else [],
        ai_mode=ai_mode(),
        rag_status=rag_status(docs if not analysis["emergency"] else []),
    )


@app.post("/chat", response_model=ChatResponse, tags=["consultation"])
async def chat(payload: ChatRequest) -> ChatResponse:
    """One conversational turn. Maintains state, detects emergencies, asks follow-ups."""
    if payload.intent == "question":
        sid, token = store.resolve(payload.session_id, payload.session_token)
        emergency, _ = detect_emergency(text=". ".join([payload.message, *[t.content for t in payload.conversation if t.role == "user"]]))
        if payload.assessment:
            emergency = emergency or symptom_service.analyse(payload.assessment.model_dump())["emergency"]
        emergency = store.latch(sid, emergency)
        if emergency:
            return ChatResponse(session_id=sid, session_token=token, emergency=True,
                risk_level="EMERGENCY", complete=True, allow_free_text=False,
                message="These may be emergency warning signs. Contact local emergency services now. Do not delay care to continue chatting.",
                answer_mode="emergency", rag_status=rag_status())
        text, docs = answer_question(payload.message, payload.conversation)
        return ChatResponse(session_id=sid, session_token=token, message=text,
            sources=to_sources(docs), complete=True, rag_status=rag_status(docs),
            answer_mode="retrieval" if docs else "abstain")
    sid, token, assessment, analysis = analyse_session(payload)
    docs = retrieve_for_assessment(assessment, extra_text=payload.message)
    message, question, options, complete, mode = await ai_service.generate_reply(payload, analysis, docs)

    return ChatResponse(
        session_id=sid, session_token=token,
        message=message,
        options=options,
        allow_free_text=not analysis["emergency"],
        rag_status=rag_status(),
        answer_mode="emergency" if analysis["emergency"] else "follow_up",
        risk_level=analysis["risk_level"],
        emergency=analysis["emergency"],
        complete=complete,
        sources=[],
        ai_mode=mode,
    )


@app.post("/reset", response_model=ResetResponse, tags=["consultation"])
def reset(payload: ResetRequest) -> ResetResponse:
    store.clear(payload.session_id, payload.session_token)
    return ResetResponse()
