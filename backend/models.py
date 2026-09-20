"""Pydantic request / response models shared across endpoints."""

from typing import Any, Literal

from pydantic import BaseModel, Field

Role = Literal["user", "assistant", "system"]
RiskLevel = Literal["LOW", "MODERATE", "HIGH", "EMERGENCY"]


class ConversationTurn(BaseModel):
    role: Role
    content: str


class Assessment(BaseModel):
    """Structured output of the interactive consultation quiz."""

    symptoms: list[str] = Field(default_factory=list)
    duration: str = ""
    severity: str = ""
    additional_symptoms: list[str] = Field(default_factory=list)
    notes: str = ""


class AssessRequest(BaseModel):
    """Legacy/plain assessment payload (kept for backwards compatibility)."""

    symptoms: list[str] = Field(default_factory=list)
    duration: str = ""
    severity: str = ""
    notes: str = ""


class Source(BaseModel):
    title: str
    organisation: str
    url: str
    snippet: str


class AssessResponse(BaseModel):
    risk_level: RiskLevel
    emergency: bool
    summary: str
    next_steps: list[str] = Field(default_factory=list)
    warning_signs: list[str] = Field(default_factory=list)
    seek_care_when: list[str] = Field(default_factory=list)
    sources: list[Source] = Field(default_factory=list)
    ai_mode: Literal["mock", "live"] = "mock"
    rag_status: Literal["RAG READY", "RAG ACTIVE"] = "RAG READY"


class ChatRequest(BaseModel):
    message: str = ""
    conversation: list[ConversationTurn] = Field(default_factory=list)
    assessment: Assessment = Field(default_factory=Assessment)
    session_id: str | None = None


class ChatResponse(BaseModel):
    message: str
    next_question: str | None = None
    options: list[str] = Field(default_factory=list)
    allow_free_text: bool = True
    risk_level: RiskLevel = "LOW"
    emergency: bool = False
    complete: bool = False
    sources: list[Source] = Field(default_factory=list)
    ai_mode: Literal["mock", "live"] = "mock"


class ConsultationRequest(BaseModel):
    assessment: Assessment = Field(default_factory=Assessment)
    conversation: list[ConversationTurn] = Field(default_factory=list)
    session_id: str | None = None


class ConsultationResponse(BaseModel):
    risk_level: RiskLevel
    emergency: bool
    summary: str
    reported: dict[str, Any] = Field(default_factory=dict)
    next_steps: list[str] = Field(default_factory=list)
    warning_signs: list[str] = Field(default_factory=list)
    seek_care_when: list[str] = Field(default_factory=list)
    sources: list[Source] = Field(default_factory=list)
    ai_mode: Literal["mock", "live"] = "mock"
    rag_status: Literal["RAG READY", "RAG ACTIVE"] = "RAG READY"
    disclaimer: str = (
        "This is general health information, not a diagnosis. "
        "A qualified healthcare professional can evaluate your symptoms."
    )


class ResetRequest(BaseModel):
    session_id: str | None = None


class ResetResponse(BaseModel):
    ok: bool = True
    message: str = "Consultation state cleared. You can start a new assessment."


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "MedCare AI"
    ai_mode: Literal["mock", "live"] = "mock"
    rag_status: Literal["RAG READY", "RAG ACTIVE"] = "RAG READY"
