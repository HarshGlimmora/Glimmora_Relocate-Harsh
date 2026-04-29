"""Resume upload → parse → auto-fill golden path."""

from __future__ import annotations

import io

import pytest
from docx import Document


def _make_docx_bytes(body: str) -> bytes:
    buf = io.BytesIO()
    doc = Document()
    for line in body.splitlines():
        doc.add_paragraph(line)
    doc.save(buf)
    return buf.getvalue()


RESUME_BODY = """Ada Lovelace
ada@example.com
+1 555 123 4567
12 years of experience as a software engineer

Skills: Python, Math, Distributed Systems
"""

DOCX_MIME = (
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
)


@pytest.mark.asyncio
async def test_resume_upload_extracts_and_auto_fills_profile(app_client) -> None:
    client, _ = app_client
    r = await client.post(
        "/api/v1/auth/register",
        json={"email": "ada@example.com", "password": "hunter2-strong", "name": "Ada"},
    )
    access = r.json()["tokens"]["access_token"]

    # upload
    up = await client.post(
        "/api/v1/resume/upload",
        headers={"Authorization": f"Bearer {access}"},
        files={"file": ("ada.docx", _make_docx_bytes(RESUME_BODY), DOCX_MIME)},
    )
    assert up.status_code == 200, up.text
    parse_id = up.json()["parse_id"]
    assert up.json()["status"] == "ready"

    # status endpoint returns extracted JSON
    st = await client.get(
        f"/api/v1/resume/{parse_id}",
        headers={"Authorization": f"Bearer {access}"},
    )
    assert st.status_code == 200
    extracted = st.json()["extracted"]
    assert extracted["full_name"] == "Ada Lovelace"
    assert "ada@example.com" in extracted["emails"]
    assert extracted["years_experience"] == 12
    assert extracted["seniority"] == "principal"  # 12+ years

    # profile got auto-filled with resume source
    p = await client.get(
        "/api/v1/profile", headers={"Authorization": f"Bearer {access}"}
    )
    body = p.json()
    assert body["profile"]["full_name"] == "Ada Lovelace"
    assert body["field_sources"]["full_name"] == "resume"
    assert body["completion_percentage"] > 0


@pytest.mark.asyncio
async def test_user_patch_overrides_resume_value(app_client) -> None:
    client, _ = app_client
    r = await client.post(
        "/api/v1/auth/register",
        json={"email": "x@example.com", "password": "hunter2-strong", "name": "X"},
    )
    access = r.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {access}"}

    await client.post(
        "/api/v1/resume/upload",
        headers=headers,
        files={"file": ("ada.docx", _make_docx_bytes(RESUME_BODY), DOCX_MIME)},
    )

    patch = await client.patch(
        "/api/v1/profile", headers=headers, json={"full_name": "Grace Hopper"}
    )
    assert patch.status_code == 200
    assert patch.json()["profile"]["full_name"] == "Grace Hopper"
    assert patch.json()["field_sources"]["full_name"] == "user"


@pytest.mark.asyncio
async def test_unsupported_mime_rejected(app_client) -> None:
    client, _ = app_client
    r = await client.post(
        "/api/v1/auth/register",
        json={"email": "y@example.com", "password": "hunter2-strong", "name": "Y"},
    )
    access = r.json()["tokens"]["access_token"]
    up = await client.post(
        "/api/v1/resume/upload",
        headers={"Authorization": f"Bearer {access}"},
        files={"file": ("a.png", b"\x89PNG\r\n", "image/png")},
    )
    assert up.status_code == 400


@pytest.mark.asyncio
async def test_status_404_for_other_user(app_client) -> None:
    client, _ = app_client
    r1 = await client.post(
        "/api/v1/auth/register",
        json={"email": "u1@example.com", "password": "hunter2-strong", "name": "U1"},
    )
    a1 = r1.json()["tokens"]["access_token"]
    up = await client.post(
        "/api/v1/resume/upload",
        headers={"Authorization": f"Bearer {a1}"},
        files={"file": ("ada.docx", _make_docx_bytes(RESUME_BODY), DOCX_MIME)},
    )
    parse_id = up.json()["parse_id"]

    r2 = await client.post(
        "/api/v1/auth/register",
        json={"email": "u2@example.com", "password": "hunter2-strong", "name": "U2"},
    )
    a2 = r2.json()["tokens"]["access_token"]
    s = await client.get(
        f"/api/v1/resume/{parse_id}", headers={"Authorization": f"Bearer {a2}"}
    )
    assert s.status_code == 404
