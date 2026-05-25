from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from fastapi import HTTPException, Request, Response, status
from pydantic import BaseModel
from .config import get_settings


class LoginRequest(BaseModel):
    username: str
    password: str


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def _signature(payload: str) -> str:
    settings = get_settings()
    key = settings.secret_key.encode("utf-8")
    return _b64encode(hmac.new(key, payload.encode("utf-8"), hashlib.sha256).digest())


def create_session_token(username: str) -> str:
    settings = get_settings()
    expires_at = int(time.time()) + int(settings.auth_session_hours * 3600)
    payload = _b64encode(json.dumps({"u": username, "exp": expires_at}, separators=(",", ":")).encode("utf-8"))
    return f"{payload}.{_signature(payload)}"


def verify_session_token(token: str | None) -> str | None:
    settings = get_settings()
    if not settings.auth_enabled:
        return settings.auth_username
    if not token or "." not in token:
        return None
    payload, sig = token.rsplit(".", 1)
    if not hmac.compare_digest(sig, _signature(payload)):
        return None
    try:
        data = json.loads(_b64decode(payload).decode("utf-8"))
    except Exception:
        return None
    if int(data.get("exp", 0)) < int(time.time()):
        return None
    user = str(data.get("u", ""))
    if not user:
        return None
    return user


def set_auth_cookie(response: Response, username: str) -> None:
    settings = get_settings()
    token = create_session_token(username)
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=int(settings.auth_session_hours * 3600),
        path="/",
    )


def clear_auth_cookie(response: Response) -> None:
    settings = get_settings()
    response.delete_cookie(key=settings.auth_cookie_name, path="/")


def authenticate(username: str, password: str) -> bool:
    settings = get_settings()
    return hmac.compare_digest(username, settings.auth_username) and hmac.compare_digest(password, settings.auth_password)


def current_user_from_request(request: Request) -> str | None:
    settings = get_settings()
    return verify_session_token(request.cookies.get(settings.auth_cookie_name))


def require_auth(request: Request) -> str:
    user = current_user_from_request(request)
    if user:
        return user
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Přihlášení je vyžadováno")
