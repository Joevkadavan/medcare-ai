"""Rule-based symptom analysis: risk grading, guidance, and warning signs.

This is the deterministic fallback intelligence. It never claims a diagnosis —
it describes which broad categories of illness a symptom cluster can occur with,
and what the user should do next.
"""

from __future__ import annotations

from services.emergency_service import detect_emergency

COMMON_DURATION_LONG = {"more than a week", "more than a month"}

# Symptom -> broad, non-diagnostic category language.
SYMPTOM_CATEGORIES: dict[str, str] = {
    "headache": "tension-type headaches, migraine, dehydration, or infections such as colds and flu",
    "fever": "common viral or bacterial infections",
    "cough": "upper respiratory infections, allergies, or irritation of the airways",
    "sore throat": "viral throat infections or other causes of throat inflammation",
    "chest pain": "muscular strain, reflux, or heart and lung conditions",
    "breathing difficulty": "asthma, infection, allergy, or other lung conditions",
    "stomach pain": "indigestion, gastrointestinal infection, or other abdominal conditions",
    "nausea": "gastrointestinal upset, infection, migraine, or medication effects",
    "dizziness": "dehydration, inner-ear problems, low blood pressure, or anaemia",
    "fatigue": "infection, poor sleep, anaemia, stress, or thyroid changes",
    "vomiting": "gastrointestinal infection, food-related illness, or migraine",
    "body ache": "viral illness such as influenza, or muscular strain",
}

GENERAL_NEXT_STEPS = [
    "Rest and give your body time to recover",
    "Stay well hydrated — water, and oral rehydration fluids if you can tolerate them",
    "Monitor your symptoms and note whether they are improving or worsening",
    "Consider contacting a healthcare professional if symptoms do not improve or get worse",
]

SERIOUS_NEXT_STEPS = [
    "Contact a healthcare professional today to have your symptoms assessed",
    "Rest and keep hydrated while you arrange care",
    "Note the timeline of your symptoms — when they started and how they have changed",
    "Go to urgent care or call emergency services if symptoms worsen quickly",
]

WARNING_SIGNS = [
    "Chest pain or pressure, especially spreading to the arm, neck, or jaw",
    "Difficulty breathing, or being unable to catch your breath",
    "Confusion, fainting, or loss of consciousness",
    "Sudden weakness or numbness on one side of the body, or slurred speech",
    "Heavy bleeding that will not stop",
    "A very high fever with a stiff neck, rash, or severe headache",
    "Symptoms that worsen rapidly over hours rather than days",
]

SEEK_CARE_WHEN = [
    "Symptoms last longer than expected for their type, or beyond about a week",
    "Symptoms get worse instead of improving",
    "You develop new symptoms on top of the ones you already have",
    "You are unable to keep fluids down, or become dehydrated",
    "You have an underlying condition, are pregnant, or are caring for a young child or older adult",
]


def _severity_score(severity: str) -> int:
    return {
        "mild": 0,
        "moderate": 1,
        "severe": 2,
        "very severe": 3,
    }.get(severity.strip().lower(), 0)


def grade_risk(
    symptoms: list[str],
    additional: list[str],
    severity: str,
    duration: str,
    notes: str = "",
) -> str:
    """Return LOW | MODERATE | HIGH | EMERGENCY. Non-diagnostic triage only."""
    is_emergency, _ = detect_emergency(
        symptoms=symptoms,
        additional=additional,
        severity=severity,
        notes=notes,
    )
    if is_emergency:
        return "EMERGENCY"

    score = _severity_score(severity)
    everything = {s.strip().lower() for s in [*symptoms, *additional]}
    count = len(everything)
    long_running = duration.strip().lower() in COMMON_DURATION_LONG

    if score >= 2 or "chest pain" in everything or "breathing difficulty" in everything:
        return "HIGH"
    if score == 1 or count >= 4 or long_running:
        return "MODERATE"
    return "LOW"


def build_summary(assessment: dict) -> str:
    """Non-diagnostic narrative summary of what the user reported."""
    symptoms = assessment.get("symptoms") or []
    additional = assessment.get("additional_symptoms") or []
    duration = assessment.get("duration") or ""
    severity = (assessment.get("severity") or "").lower()

    all_symptoms = [s for s in [*symptoms, *additional] if s and s.lower() != "none of these"]

    if not all_symptoms:
        return (
            "You did not report specific symptoms. If something is bothering you, "
            "it is worth describing it so it can be considered properly."
        )

    if len(all_symptoms) == 1:
        listed = all_symptoms[0]
    else:
        listed = ", ".join(all_symptoms[:-1]) + " and " + all_symptoms[-1]

    categories: list[str] = []
    for symptom in all_symptoms:
        key = symptom.strip().lower()
        if key in SYMPTOM_CATEGORIES and SYMPTOM_CATEGORIES[key] not in categories:
            categories.append(SYMPTOM_CATEGORIES[key])

    parts = [f"You reported {listed}."]
    if duration:
        parts.append(f"These have been present {duration.lower()}.")
    if severity:
        parts.append(f"You described them as {severity}.")

    if categories:
        parts.append(
            "Symptoms like these can occur with several different conditions, including "
            + "; ".join(categories[:3])
            + ". This assessment cannot determine which, if any, applies to you."
        )
    else:
        parts.append(
            "These symptoms can occur with several different conditions, and this "
            "assessment cannot determine the cause."
        )

    return " ".join(parts)


def next_steps_for(risk: str) -> list[str]:
    if risk in {"HIGH", "EMERGENCY"}:
        return SERIOUS_NEXT_STEPS
    return GENERAL_NEXT_STEPS


def analyse(assessment: dict) -> dict:
    """Full deterministic analysis of an assessment dict."""
    symptoms = assessment.get("symptoms") or []
    additional = assessment.get("additional_symptoms") or []
    severity = assessment.get("severity") or ""
    duration = assessment.get("duration") or ""
    notes = assessment.get("notes") or ""

    emergency, reasons = detect_emergency(
        symptoms=symptoms, additional=additional, severity=severity, notes=notes
    )
    risk = grade_risk(symptoms, additional, severity, duration, notes)

    return {
        "risk_level": risk,
        "emergency": emergency,
        "emergency_reasons": reasons,
        "summary": build_summary(assessment),
        "next_steps": next_steps_for(risk),
        "warning_signs": WARNING_SIGNS,
        "seek_care_when": SEEK_CARE_WHEN,
    }
