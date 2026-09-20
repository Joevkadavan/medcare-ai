"""Emergency / red-flag detection.

Scans free text and structured symptom selections for warning signs that
warrant urgent medical attention. Deliberately over-inclusive: a false
positive costs the user a moment of alarm; a false negative could cost
far more.
"""

from __future__ import annotations

import re

# Each pattern is matched case-insensitively against normalised text.
# Phrases are grouped by the clinical picture they suggest.
EMERGENCY_PATTERNS: dict[str, list[str]] = {
    "cardiac": [
        r"severe chest pain",
        r"crushing chest pain",
        r"chest pain.{0,20}(arm|jaw|neck|shoulder)",
        r"chest pressure",
        r"chest tightness",
        r"pain in (my )?chest",
        r"left arm (pain|numbness|tingling)",
    ],
    "respiratory": [
        r"(can ?not|cant|can't|unable to|struggling to) breathe",
        r"difficulty breathing",
        r"trouble breathing",
        r"shortness of breath",
        r"short of breath",
        r"severe breathing difficulty",
        r"gasping",
        r"suffocating",
        r"lips? (are )?(turning )?blue",
        r"blue lips",
    ],
    "neurological": [
        r"unconscious",
        r"passed out",
        r"fainted",
        r"loss of consciousness",
        r"seizure",
        r"convulsion",
        r"fitting",
        r"stroke",
        r"face droop",
        r"slurred speech",
        r"cannot speak",
        r"sudden numbness",
        r"sudden weakness on one side",
        r"one side of (my )?body",
        r"sudden confusion",
        r"worst headache of my life",
        r"sudden severe headache",
        r"stiff neck.{0,30}(fever|rash|light)",
        r"light sensitivity",
    ],
    "bleeding": [
        r"severe bleeding",
        r"heavy bleeding",
        r"bleeding (a lot|heavily|uncontrollably)",
        r"won ?t stop bleeding",
        r"coughing up blood",
        r"vomiting blood",
        r"blood in (my )?(vomit|stool|urine)",
        r"black tarry stool",
    ],
    "anaphylaxis": [
        r"throat (is )?(closing|swelling|swollen)",
        r"swollen throat",
        r"anaphyla",
        r"severe allergic reaction",
        r"hives.{0,30}(breath|swell|throat)",
    ],
    "other_red_flags": [
        r"suicidal",
        r"want to (die|end my life|kill myself)",
        r"self ?harm",
        r"overdose",
        r"poisoning",
        r"severe abdominal pain",
        r"rigid (abdomen|stomach)",
        r"pregnant.{0,30}(bleeding|pain|contractions)",
        r"no (urine|urination) (for|in) \d+ hours",
        r"high fever.{0,20}(rash|stiff neck|confusion)",
    ],
}

# Standalone symptom labels from the quiz that are always red flags.
EMERGENCY_SYMPTOM_LABELS = {
    "chest pain",
    "breathing difficulty",
    "difficulty breathing",
    "severe chest pain",
    "cannot breathe",
    "unconsciousness",
    "severe bleeding",
    "seizure",
    "stroke symptoms",
}

# Severity labels that, combined with certain symptoms, escalate to emergency.
SEVERE_LABELS = {"severe", "very severe"}

_COMPILED = [
    (group, re.compile(pattern, re.IGNORECASE))
    for group, patterns in EMERGENCY_PATTERNS.items()
    for pattern in patterns
]


def _normalise(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def detect_emergency(
    text: str = "",
    symptoms: list[str] | None = None,
    additional: list[str] | None = None,
    severity: str = "",
    notes: str = "",
) -> tuple[bool, list[str]]:
    """Return (is_emergency, matched_reasons).

    Never raises: detection failing open is the safer failure mode.
    """
    symptoms = symptoms or []
    additional = additional or []
    haystack = _normalise(" ".join([text, notes, *symptoms, *additional]))

    reasons: list[str] = []
    for group, pattern in _COMPILED:
        if pattern.search(haystack):
            label = pattern.pattern.replace(".{0,20}", "…").replace(".{0,30}", "…")
            reasons.append(f"{group}: {label}")

    labels = {s.strip().lower() for s in [*symptoms, *additional]}
    for label in labels & EMERGENCY_SYMPTOM_LABELS:
        reasons.append(f"reported symptom: {label}")

    if severity.strip().lower() in SEVERE_LABELS:
        if labels & {"chest pain", "breathing difficulty", "difficulty breathing"}:
            reasons.append("severe chest or breathing symptoms")

    # De-duplicate while preserving order.
    seen: list[str] = []
    for reason in reasons:
        if reason not in seen:
            seen.append(reason)
    return (len(seen) > 0, seen)
