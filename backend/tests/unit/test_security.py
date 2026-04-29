"""Auth security helpers."""

from __future__ import annotations

import os

# Set the env BEFORE importing the security module so settings load.
os.environ.setdefault("JWT_SECRET", "test-secret-32-characters-min-padding-1234567890")

import jwt  # noqa: E402
import pytest  # noqa: E402

from app.modules.auth import security  # noqa: E402


def test_password_hash_and_verify() -> None:
    h = security.hash_password("hunter2-strong")
    assert h != "hunter2-strong"
    assert security.verify_password("hunter2-strong", h) is True
    assert security.verify_password("wrong", h) is False


def test_access_token_round_trip() -> None:
    token, exp = security.issue_access_token(user_id="u1", email="a@b.com")
    payload = security.decode_access_token(token)
    assert payload["sub"] == "u1"
    assert payload["email"] == "a@b.com"
    assert payload["typ"] == "access"
    assert exp.timestamp() > 0


def test_access_token_invalid_signature() -> None:
    token, _ = security.issue_access_token(user_id="u1", email="a@b.com")
    bad = token + "x"
    with pytest.raises(jwt.InvalidTokenError):
        security.decode_access_token(bad)


def test_refresh_token_distinct_each_call() -> None:
    a, ah, _ = security.new_refresh_token()
    b, bh, _ = security.new_refresh_token()
    assert a != b
    assert ah != bh
    assert security.hash_refresh(a) == ah
