"""Bounded, expiring demo storage. Tokens are bearer secrets, not user authentication.
Single-process only. Do not use this store for production health records.
"""
import secrets
import time
from threading import RLock
from fastapi import HTTPException

_SESSIONS = {}
_LOCK = RLock()
SESSION_TTL_SECONDS = 1800
MAX_SESSIONS = 500

def _prune():
    cutoff = time.monotonic() - SESSION_TTL_SECONDS
    for sid in [sid for sid, data in _SESSIONS.items() if data["updated"] < cutoff]:
        del _SESSIONS[sid]

def resolve(session_id=None, session_token=None):
    with _LOCK:
        _prune()
        if session_id:
            data = _SESSIONS.get(session_id)
            if not data or not session_token or not secrets.compare_digest(data["token"], session_token):
                raise HTTPException(401, "Session expired or invalid")
            data["updated"] = time.monotonic()
            return session_id, data["token"]
        if session_token:
            raise HTTPException(401, "Session invalid")
        if len(_SESSIONS) >= MAX_SESSIONS:
            raise HTTPException(503, "Demo session capacity reached")
        sid, token = secrets.token_hex(16), secrets.token_urlsafe(32)
        _SESSIONS[sid] = {"token": token, "updated": time.monotonic(), "emergency": False}
        return sid, token

def latch(session_id, emergency):
    with _LOCK:
        data = _SESSIONS[session_id]
        data["emergency"] = data["emergency"] or emergency
        return data["emergency"]

def clear(session_id, session_token=None):
    with _LOCK:
        _prune()
        if session_id not in _SESSIONS:
            return
        resolve(session_id, session_token)
        _SESSIONS.pop(session_id, None)

def count():
    with _LOCK:
        _prune()
        return len(_SESSIONS)
