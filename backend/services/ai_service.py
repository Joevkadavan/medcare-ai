"""LLM generation layer.

Two modes:
  * LIVE — an OpenAI-compatible chat completion call, when OPENAI_API_KEY is set.
  * MOCK — deterministic, rule-based question selection and phrasing when no key
    is present. The application is fully functional in mock mode; it simply asks
    a fixed but sensible sequence of follow-up questions instead of generating them.

The frontend is told which mode is active (`ai_mode`), so nothing is ever
presented to the user as AI-generated when it is not.
"""

from __future__ import annotations

import httpx
import json
from pydantic import BaseModel, ConfigDict, Field

from config import get_settings

SYSTEM_PROMPT = """You are MedCare AI, a careful health-guidance assistant.

HARD RULES:
- You NEVER diagnose, prescribe treatment, suggest prescription dosages, or claim certainty.
- Say what symptoms CAN occur with, not what they mean.
- Always remind the user, when giving guidance, that this is not a diagnosis.
- If warning signs of a medical emergency are present, tell the user to seek
  emergency care immediately and stop asking further questions.
- Keep replies short (2-4 sentences) and calm. No alarmist language.
- Ask at most ONE follow-up question per reply.
- Reply in plain prose. Do not use markdown headings or bullet symbols.
"""


# Deterministic follow-up ladder used in mock mode.
FOLLOW_UPS: list[dict] = [
    {
        "trigger": ["fever", "chills", "temperature"],
        "question": "You mentioned a fever. What is your approximate temperature?",
        "options": [
            "Below 100°F",
            "100–102°F",
            "102–104°F",
            "Above 104°F",
            "I don't know",
        ],
    },
    {
        "trigger": ["headache", "migraine"],
        "question": "How severe is your headache, and is it getting worse?",
        "options": ["Mild", "Moderate", "Severe", "The worst headache I have had"],
    },
    {
        "trigger": ["cough"],
        "question": "Is your cough dry, or are you bringing anything up?",
        "options": ["Dry cough", "Bringing up phlegm", "Both", "Not sure"],
    },
    {
        "trigger": ["stomach pain", "nausea", "vomiting", "diarrhea", "diarrhoea"],
        "question": "Are you able to keep fluids down?",
        "options": [
            "Yes, easily",
            "Only small sips",
            "No, I keep vomiting",
            "I have not tried",
        ],
    },
    {
        "trigger": ["dizziness", "dizzy", "lightheaded"],
        "question": "When do you feel dizzy — on standing up, or all the time?",
        "options": ["Mainly on standing up", "All the time", "Comes and goes", "Not sure"],
    },
    {
        "trigger": ["breathing difficulty", "shortness of breath", "chest pain"],
        "question": "Does the discomfort get worse when you breathe deeply or move?",
        "options": ["Yes", "No", "Not sure"],
    },
    {
        "trigger": [],  # always applicable fallback
        "question": "Are your symptoms getting better, worse, or staying about the same?",
        "options": ["Getting better", "Getting worse", "About the same"],
    },
    {
        "trigger": [],
        "question": "Is there anything else you have noticed that might be relevant?",
        "options": ["No, that is everything", "Yes"],
    },
]

MAX_FOLLOW_UPS = 3


def _transcript(request) -> str:
    lines = [f"{turn.role}: {turn.content}" for turn in request.conversation]
    if request.message:
        lines.append(f"user: {request.message}")
    return "\n".join(lines)


def _context_blurb(assessment: dict) -> str:
    symptoms = ", ".join(assessment.get("symptoms") or []) or "none reported"
    duration = assessment.get("duration") or "not stated"
    severity = assessment.get("severity") or "not stated"
    return f"Reported symptoms: {symptoms}. Duration: {duration}. Severity: {severity}."


def _questions_asked(request) -> int:
    """Count assistant turns that carried a question."""
    return sum(1 for turn in request.conversation if turn.role == "assistant" and "?" in turn.content)


def pick_mock_question(request) -> tuple[str, str | None, list[str]]:
    """Choose the next deterministic follow-up. Returns (opening, question, options)."""
    asked = _questions_asked(request)
    assessment = request.assessment.model_dump() if hasattr(request.assessment, "model_dump") else dict(request.assessment)

    haystack = " ".join(
        [
            request.message or "",
            assessment.get("notes") or "",
            *[t.content for t in request.conversation if t.role == "user"],
            *[s for s in (assessment.get("symptoms") or [])],
            *[s for s in (assessment.get("additional_symptoms") or [])],
        ]
    ).lower()

    if asked == 0:
        opening = (
            "Thank you — I have a clearer picture now. I have a few short follow-up "
            "questions to make the guidance more useful. " + _context_blurb(assessment)
        )
    else:
        opening = "Thanks, that helps."

    for entry in FOLLOW_UPS:
        if entry["trigger"] and not any(t in haystack for t in entry["trigger"]):
            continue
        # Skip questions whose wording already appears in the transcript.
        if any(entry["question"] in t.content for t in request.conversation if t.role == "assistant"):
            continue
        return opening, entry["question"], entry["options"]

    return (
        "Thanks — I have what I need. I can put your consultation summary together now.",
        None,
        [],
    )


def mock_reply(request, analysis: dict) -> tuple[str, str | None, list[str], bool]:
    """Deterministic chatbot turn. Returns (message, next_question, options, complete)."""
    if analysis["emergency"]:
        return (
            "Some of the symptoms you have described are possible warning signs that "
            "need urgent attention. Please contact your local emergency services or go "
            "to the nearest emergency department now. I am stopping the questions here.",
            None,
            [],
            True,
        )

    asked = _questions_asked(request)
    if asked >= MAX_FOLLOW_UPS:
        return (
            analysis["summary"] + " " + " ".join(analysis["next_steps"][:2]) +
            " MedCare AI provides informational guidance and does not replace professional medical advice.",
            None,
            [],
            True,
        )

    opening, question, options = pick_mock_question(request)
    if question is None:
        return opening, None, [], True
    return f"{opening}\n\n{question}", question, options, False


class QuestionChoice(BaseModel):
    model_config = ConfigDict(extra="forbid")
    question_id: int = Field(strict=True, ge=0, lt=len(FOLLOW_UPS))


async def _call_openai(request, analysis: dict, retrieved: list[dict]) -> str:
    settings = get_settings()
    # Provider selects vetted wording, never writes medical guidance for the UI.
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT +
         " Select the most relevant follow-up from this catalogue. Return only JSON with question_id. " +
         json.dumps([{ "question_id": i, "question": q["question"] } for i, q in enumerate(FOLLOW_UPS)])},
        {"role": "user", "content": _context_blurb(analysis["assessment"]) + "\n" + _transcript(request)},
    ]
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post("https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.openai_api_key}"},
            json={"model": settings.openai_model, "messages": messages,
                  "response_format": {"type": "json_object"}, "max_tokens": 40})
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]


async def generate_reply(request, analysis: dict, retrieved: list[dict]):
    fallback = mock_reply(request, analysis)
    if analysis["emergency"] or fallback[3] or not get_settings().ai_live:
        return (*fallback, "mock")
    try:
        choice = QuestionChoice.model_validate_json(await _call_openai(request, analysis, retrieved))
        entry = FOLLOW_UPS[choice.question_id]
        symptoms = " ".join(analysis["assessment"]["symptoms"]).lower()
        if entry["trigger"] and not any(t in symptoms for t in entry["trigger"]):
            raise ValueError("Irrelevant question")
        if any(entry["question"] in t.content for t in request.conversation if t.role == "assistant"):
            raise ValueError("Repeated question")
        return entry["question"], None, entry["options"], False, "live"
    except Exception:
        return (*fallback, "mock")
