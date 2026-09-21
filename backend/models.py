"""Pydantic request / response models shared across endpoints."""

from typing import Annotated, Literal

from pydantic import BaseModel, Field, StringConstraints, ConfigDict, field_validator, model_validator

class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]
Symptom = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
Role = Literal["user", "assistant"]
RagStatus = Literal["RAG_DISABLED", "RAG_READY", "RAG_ACTIVE"]
DISCLAIMER = "MedCare AI provides informational guidance and does not replace professional medical advice."

class SessionRequest(StrictModel):
    session_id: str | None = Field(default=None, min_length=32, max_length=64)
    session_token: str | None = Field(default=None, min_length=32, max_length=128)

RiskLevel = Literal["LOW", "MODERATE", "HIGH", "EMERGENCY"]


class ConversationTurn(StrictModel):
    role: Role
    content: Text


class Assessment(StrictModel):
    symptoms: list[Symptom] = Field(min_length=1, max_length=12)
    duration: Literal["a few hours", "1-2 days", "3-7 days", "more than a week", "more than a month"]
    severity: Literal["mild", "moderate", "severe", "very severe"]
    additional_symptoms: list[Symptom] = Field(default_factory=list, max_length=12)
    notes: str = Field(default="", max_length=2000)

    @field_validator("duration", "severity", mode="before")
    @classmethod
    def normalize_choice(cls, value):
        return value.strip().lower().replace("–", "-") if isinstance(value, str) else value

    @field_validator("additional_symptoms")
    @classmethod
    def exclusive_none(cls, value):
        if any(s.lower() == "none of these" for s in value):
            if len(value) > 1:
                raise ValueError("None of these cannot be combined with symptoms")
            return []
        return value

class AssessRequest(Assessment):
    """Stateless deterministic screening, with the same validated assessment."""

class Source(BaseModel):
    id: str
    section: str
    verified_on: str
    score: float = Field(ge=0)
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
    rag_status: RagStatus = "RAG_DISABLED"


class ChatRequest(SessionRequest):
    intent: Literal["consultation", "question"] = "consultation"
    message: str = Field(default="", max_length=2000)
    conversation: list[ConversationTurn] = Field(default_factory=list, max_length=40)
    assessment: Assessment | None = None

    @field_validator("message", mode="before")
    @classmethod
    def reject_whitespace(cls, value):
        if isinstance(value, str) and value and not value.strip():
            raise ValueError("Message cannot be whitespace")
        return value

    @model_validator(mode="after")
    def validate_turn(self):
        if self.intent == "consultation" and self.assessment is None:
            raise ValueError("Assessment required")
        if self.intent == "question" and not self.message:
            raise ValueError("Question required")
        if not self.message and self.conversation:
            raise ValueError("A follow-up message must not be blank")
        return self

class ChatResponse(BaseModel):
    rag_status: RagStatus = "RAG_READY"
    answer_mode: Literal["follow_up", "retrieval", "abstain", "emergency"] = "follow_up"
    session_id: str
    session_token: str
    message: str
    options: list[str] = Field(default_factory=list)
    allow_free_text: bool = True
    risk_level: RiskLevel = "LOW"
    emergency: bool = False
    complete: bool = False
    sources: list[Source] = Field(default_factory=list)
    ai_mode: Literal["mock", "live"] = "mock"


class ConsultationRequest(SessionRequest):
    assessment: Assessment
    conversation: list[ConversationTurn] = Field(default_factory=list, max_length=40)

class ConsultationResponse(BaseModel):
    session_id: str
    session_token: str
    risk_level: RiskLevel
    emergency: bool
    summary: str
    follow_up_answers: list[str] = Field(default_factory=list)
    reported: Assessment
    next_steps: list[str] = Field(default_factory=list)
    warning_signs: list[str] = Field(default_factory=list)
    seek_care_when: list[str] = Field(default_factory=list)
    sources: list[Source] = Field(default_factory=list)
    ai_mode: Literal["mock", "live"] = "mock"
    rag_status: RagStatus = "RAG_DISABLED"
    disclaimer: str = DISCLAIMER

class ResetRequest(SessionRequest):
    pass

class ResetResponse(BaseModel):
    ok: bool = True
    message: str = "Consultation state cleared. You can start a new assessment."


class RootResponse(BaseModel):
    service: str
    status: str
    ai_mode: str
    rag_status: RagStatus
    docs: str
    disclaimer: str

class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "MedCare AI"
    ai_mode: Literal["mock", "live"] = "mock"
    rag_status: RagStatus = "RAG_DISABLED"
