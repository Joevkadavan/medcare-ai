"""Local medical knowledge base.

A small, curated set of entries drawn from the kind of public guidance published
by national health services. Each entry is written in general, non-diagnostic
language. This is the initial working corpus — it is intentionally small and is
meant to be replaced by ingested documents from trusted healthcare sources.

IMPORTANT: entries must not assert a diagnosis. They describe what symptoms can
occur with and what a person should generally do.
"""

from __future__ import annotations

KB: list[dict] = [
    {
        "id": "fever-adult",
        "title": "Fever in adults",
        "organisation": "General public health guidance",
        "url": "https://www.nhs.uk/conditions/fever-in-adults/",
        "tags": ["fever", "temperature", "chills", "sweating", "flu", "infection"],
        "snippet": (
            "A fever is a common response to infection. Most fevers settle within a few "
            "days with rest and fluids. Seek medical advice if the fever is very high, "
            "lasts more than a few days, or comes with a stiff neck, rash, confusion, or "
            "breathing difficulty."
        ),
    },
    {
        "id": "headache",
        "title": "Headaches",
        "organisation": "General public health guidance",
        "url": "https://www.nhs.uk/conditions/headaches/",
        "tags": ["headache", "migraine", "head pain", "pressure", "tension"],
        "snippet": (
            "Most headaches are not a sign of anything serious and are often linked to "
            "tension, dehydration, tiredness, or eye strain. A sudden, very severe headache, "
            "or one with fever, a stiff neck, confusion, or weakness, needs urgent assessment."
        ),
    },
    {
        "id": "cough",
        "title": "Coughs",
        "organisation": "General public health guidance",
        "url": "https://www.nhs.uk/conditions/cough/",
        "tags": ["cough", "dry cough", "phlegm", "chest", "throat", "cold"],
        "snippet": (
            "Coughs usually clear up on their own within a few weeks and are often caused "
            "by a cold or other upper respiratory infection. Seek advice if the cough lasts "
            "more than three weeks, brings up blood, or comes with breathlessness or chest pain."
        ),
    },
    {
        "id": "sore-throat",
        "title": "Sore throat",
        "organisation": "General public health guidance",
        "url": "https://www.nhs.uk/conditions/sore-throat/",
        "tags": ["sore throat", "throat", "swallowing", "tonsils", "hoarse"],
        "snippet": (
            "A sore throat is often caused by a viral infection and usually improves within "
            "about a week. Seek advice if you cannot swallow fluids, have difficulty breathing "
            "or opening your mouth, or have a very high fever."
        ),
    },
    {
        "id": "chest-pain",
        "title": "Chest pain",
        "organisation": "General public health guidance",
        "url": "https://www.nhs.uk/conditions/chest-pain/",
        "tags": ["chest pain", "chest pressure", "tightness", "heart", "arm pain"],
        "snippet": (
            "Chest pain has many possible causes, some of them serious. Call emergency "
            "services immediately if chest pain is sudden or severe, spreads to the arm, "
            "neck, or jaw, or is accompanied by breathlessness, sweating, or nausea."
        ),
    },
    {
        "id": "shortness-of-breath",
        "title": "Shortness of breath",
        "organisation": "General public health guidance",
        "url": "https://www.nhs.uk/conditions/shortness-of-breath/",
        "tags": ["breathing difficulty", "shortness of breath", "breathless", "asthma", "wheeze"],
        "snippet": (
            "Breathlessness can occur with many conditions, including asthma, infection, and "
            "anxiety. Severe breathlessness, blue lips, confusion, or an inability to speak in "
            "full sentences are warning signs requiring emergency care."
        ),
    },
    {
        "id": "stomach-pain",
        "title": "Stomach ache and abdominal pain",
        "organisation": "General public health guidance",
        "url": "https://www.nhs.uk/conditions/stomach-ache/",
        "tags": ["stomach pain", "abdominal pain", "belly", "cramps", "nausea"],
        "snippet": (
            "Most stomach aches are not serious and pass within a day or two. Seek urgent "
            "assessment if the pain is severe, the abdomen is rigid or tender to touch, or "
            "there is blood in vomit or stool."
        ),
    },
    {
        "id": "nausea-vomiting",
        "title": "Nausea and vomiting",
        "organisation": "General public health guidance",
        "url": "https://www.nhs.uk/conditions/nausea-and-vomiting/",
        "tags": ["nausea", "vomiting", "sick", "diarrhoea", "dehydration"],
        "snippet": (
            "Nausea and vomiting are common and often settle within a couple of days. Take "
            "small, frequent sips of fluid. Seek advice if you cannot keep fluids down, are "
            "passing very little urine, or have severe abdominal pain."
        ),
    },
    {
        "id": "dizziness",
        "title": "Dizziness and lightheadedness",
        "organisation": "General public health guidance",
        "url": "https://www.nhs.uk/conditions/dizziness/",
        "tags": ["dizziness", "dizzy", "lightheaded", "vertigo", "balance", "faint"],
        "snippet": (
            "Dizziness is often linked to dehydration or a change in position, but can also "
            "occur with inner-ear problems, low blood pressure, or anaemia. Seek urgent help "
            "for dizziness with chest pain, palpitations, weakness, or difficulty speaking."
        ),
    },
    {
        "id": "fatigue",
        "title": "Tiredness and fatigue",
        "organisation": "General public health guidance",
        "url": "https://www.nhs.uk/conditions/tiredness-and-fatigue/",
        "tags": ["fatigue", "tired", "exhausted", "weakness", "no energy"],
        "snippet": (
            "Persistent tiredness can occur with infection, poor sleep, stress, anaemia, or "
            "thyroid changes. See a healthcare professional if you have been exhausted for "
            "several weeks despite resting, or if it is getting worse."
        ),
    },
    {
        "id": "influenza",
        "title": "Flu and influenza-like illness",
        "organisation": "General public health guidance",
        "url": "https://www.nhs.uk/conditions/flu/",
        "tags": ["flu", "influenza", "body ache", "fever", "aching", "chills", "tired"],
        "snippet": (
            "Flu usually comes on quickly with fever, aching muscles, and tiredness, and "
            "most people recover within a week or so with rest and fluids. Seek advice if "
            "you are in a higher-risk group or your symptoms worsen sharply."
        ),
    },
    {
        "id": "emergency-signs",
        "title": "When to call emergency services",
        "organisation": "General public health guidance",
        "url": "https://www.nhs.uk/conditions/emergencies/",
        "tags": [
            "emergency", "chest pain", "breathing", "unconscious", "seizure", "stroke",
            "bleeding", "collapse", "urgent",
        ],
        "snippet": (
            "Call emergency services for: severe chest pain or pressure; difficulty "
            "breathing or inability to breathe; loss of consciousness; sudden weakness or "
            "numbness on one side, or slurred speech; severe bleeding that will not stop; "
            "a seizure; or a sudden, very severe headache."
        ),
    },
    {
        "id": "self-care",
        "title": "General self-care for minor illness",
        "organisation": "General public health guidance",
        "url": "https://www.nhs.uk/live-well/",
        "tags": ["rest", "hydration", "self care", "recovery", "fluids", "sleep"],
        "snippet": (
            "For most minor illnesses, rest, adequate fluid intake, and simple "
            "symptom relief are enough. Symptoms that persist beyond the expected "
            "timeframe, or that worsen, are worth having assessed."
        ),
    },
]


def all_documents() -> list[dict]:
    return KB


def by_id(doc_id: str) -> dict | None:
    return next((doc for doc in KB if doc["id"] == doc_id), None)
