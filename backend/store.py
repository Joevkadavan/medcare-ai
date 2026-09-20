"""Session storage.

Deliberately in-memory for the first working version: consultation state should
not require a database to try the product. The interface is narrow on purpose —
swap the dict for SQLite/Postgres by reimplementing these five functions and
nothing else in the codebase changes.
"""

from __future__ import annotations

import time
import uuid
from typing import Any

# session_id -> {"assessment": dict, "conversation": list, "updated": float}
_SESSIONS: dict[str, dict[str, Any]] = {}
SESSION_TTL_SECONDS = 60 * 60 * 6  # six hours


def _prune() -> None:
    cutoff = time.time() - SESSION_TTL_SECONDS
    for session_id in [s for s, data in _SESSIONS.items() if data.get("updated", 0) < cutoff]:
        _SESSIONS.pop(session_id, None)


def new_session() -> str:
    _prune()
    session_id = uuid.uuid4().hex
    _SESSIONS[session_id] = {"assessment": {}, "conversation": [], "updated": time.time()}
    return session_id


def get(session_id: str | None) -> dict[str, Any] | None:
    if not session_id:
        return None
    return _SESSIONS.get(session_id)


def save(session_id: str, assessment: dict | None = None, conversation: list | None = None) -> None:
    data = _SESSIONS.setdefault(
        session_id, {"assessment": {}, "conversation": [], "updated": time.time()}
    )
    if assessment:
        data["assessment"] = assessment
    if conversation is not None:
        data["conversation"] = conversation
    data["updated"] = time.time()


def clear(session_id: str | None) -> None:
    if session_id:
        _SESSIONS.pop(session_id, None)


def count() -> int:
    return len(_SESSIONS)
