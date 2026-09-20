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

from config import get_settings

SYSTEM_PROMPT = """You are MedCare AI, a careful health-guidance assistant.

HARD RULES:
- You NEVER diagnose. Never say "you have <condition>".
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
        "trigger": ["cough", "sore throat", "cold"],
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
            *[t.content for t in request.conversation],
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
        if entry["question"].split("?")[0].lower() in haystack:
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
            "Thank you — that covers what I need for now. Your consultation summary is "
            "ready, and you can keep asking me questions here at any time.",
            None,
            [],
            True,
        )

    opening, question, options = pick_mock_question(request)
    if question is None:
        return opening, None, [], True
    return f"{opening}\n\n{question}", question, options, False


async def _call_openai(request, analysis: dict, retrieved: list[dict]) -> str:
    settings = get_settings()
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if retrieved:
        context = "\n\n".join(
            f"[{i + 1}] {doc['title']} — {doc['organisation']}\n{doc['snippet']}"
            for i, doc in enumerate(retrieved)
        )
        messages.append(
            {
                "role": "system",
                "content": (
                    "Reference material retrieved for this consultation. Use it only to "
                    "inform general guidance. Do not quote it as a diagnosis.\n\n"
                    + context
                ),
            }
        )

    messages.append(
        {"role": "system", "content": "Consultation context. " + _context_blurb(analysis.get("assessment", {}))}
    )
    messages.append({"role": "user", "content": _transcript(request) or "(no message)"})

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json",
            },
            json={"model": settings.openai_model, "messages": messages, "temperature": 0.3, "max_tokens": 400},
        )
        response.raise_for_status()
        payload = response.json()
    return payload["choices"][0]["message"]["content"].strip()


async def generate_reply(request, analysis: dict, retrieved: list[dict]) -> tuple[str, str | None, list[str], bool, str]:
    """Main entry point. Falls back to mock mode on any LLM failure."""
    settings = get_settings()
    fallback = mock_reply(request, analysis)

    if not settings.ai_live:
        return (*fallback, "mock")

    try:
        text = await _call_openai(request, analysis, retrieved)
        # The model may or may not have asked a question; keep the deterministic
        # quick-reply options only when its reply also poses one.
        if "?" in text:
            _, question, options = pick_mock_question(request)
            return text, question, options, False, "live"
        return text, None, [], True, "live"
    except Exception:  # noqa: BLE001 - never let the LLM break the consultation
        return (*fallback, "mock")
