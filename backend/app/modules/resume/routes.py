"""Resume HTTP surface."""

from __future__ import annotations

from fastapi import APIRouter, File, UploadFile

from app.deps import CurrentUser, SessionDep
from app.middleware.error_handler import BadRequest
from app.modules.resume.parser import SUPPORTED_MIMES
from app.modules.resume.schemas import ResumeApplyOut, ResumeStatusOut, ResumeUploadOut
from app.modules.resume.service import ResumeService

router = APIRouter(prefix="/api/v1/resume", tags=["resume"])


@router.post("/upload", response_model=ResumeUploadOut)
async def upload_resume(
    user: CurrentUser,
    session: SessionDep,
    file: UploadFile = File(...),
) -> ResumeUploadOut:
    if not file.filename:
        raise BadRequest("Missing filename.")
    mime = (file.content_type or "").lower()
    if mime not in SUPPORTED_MIMES:
        raise BadRequest(
            f"Unsupported content-type {mime!r}. Allowed: {sorted(SUPPORTED_MIMES)}"
        )
    data = await file.read()
    return await ResumeService(session).upload(
        user_id=user.id, filename=file.filename, mime_type=mime, data=data
    )


@router.get("/{parse_id}", response_model=ResumeStatusOut)
async def get_status(
    parse_id: str, user: CurrentUser, session: SessionDep
) -> ResumeStatusOut:
    return await ResumeService(session).get_status(user_id=user.id, parse_id=parse_id)


@router.post("/{parse_id}/apply", response_model=ResumeApplyOut)
async def apply_to_profile(
    parse_id: str, user: CurrentUser, session: SessionDep
) -> ResumeApplyOut:
    return await ResumeService(session).apply_to_profile(
        user_id=user.id, parse_id=parse_id
    )
