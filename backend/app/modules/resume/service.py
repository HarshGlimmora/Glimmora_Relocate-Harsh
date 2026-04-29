"""Resume service.

Pipeline:
  1. validate upload (mime, size)
  2. write bytes to storage (returns uri)
  3. create parsing row
  4. (synchronous for MVP) extract text → call AI gateway → write structured result
  5. apply extraction to user profile (auto-fill, no overrides)

Synchronous parse keeps the foundation simple. The route still returns the
status payload separately, so swapping to a background task later is a
service-internal change.
"""

from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.gateway import AIGateway, get_ai_gateway
from app.config import get_settings
from app.middleware.error_handler import BadRequest, NotFound
from app.modules.profile.repository import ProfileRepository
from app.modules.profile.service import ProfileService
from app.modules.resume.extractor import ResumeExtractor
from app.modules.resume.parser import (
    ResumeParseError,
    SUPPORTED_MIMES,
    extract_text,
)
from app.modules.resume.repository import ResumeRepository
from app.modules.resume.schemas import ResumeApplyOut, ResumeStatusOut, ResumeUploadOut
from app.schemas.profile import ResumeExtraction
from app.storage.files import get_file_storage

logger = logging.getLogger(__name__)


class ResumeService:
    def __init__(
        self,
        session: AsyncSession,
        *,
        gateway: AIGateway | None = None,
    ) -> None:
        self.session = session
        self.repo = ResumeRepository(session)
        self.profiles = ProfileService(ProfileRepository(session))
        self.gateway = gateway or get_ai_gateway()
        self.extractor = ResumeExtractor(self.gateway)
        self.storage = get_file_storage()

    async def upload(
        self,
        *,
        user_id: str,
        filename: str,
        mime_type: str,
        data: bytes,
    ) -> ResumeUploadOut:
        s = get_settings()
        if mime_type not in SUPPORTED_MIMES:
            raise BadRequest(f"Unsupported file type: {mime_type}")
        if len(data) == 0:
            raise BadRequest("Empty file.")
        if len(data) > s.resume_max_bytes:
            raise BadRequest(
                f"File too large: {len(data)} bytes (max {s.resume_max_bytes})."
            )

        uri = await self.storage.write(
            user_id=user_id, filename=filename, mime_type=mime_type, data=data
        )
        row = await self.repo.create(
            user_id=user_id,
            storage_uri=uri,
            mime_type=mime_type,
            file_size=len(data),
            original_filename=filename,
        )
        # Commit the parse row immediately so the client can poll/apply even
        # if the (slow, fallible) AI extraction below blows up the request.
        await self.session.commit()
        parse_id = row.id

        # Synchronous parse + extract for MVP. Each side-effect commits on
        # its own so a later failure cannot roll back the parse-row insert.
        try:
            text = extract_text(data=data, mime_type=mime_type)
            extraction = await self.extractor.extract(raw_text=text)
            await self.repo.mark_ready(
                parse_id,
                raw_text=text,
                extracted=extraction.model_dump(mode="json"),
            )
            await self.session.commit()
            await self.profiles.apply_resume_extraction(
                user_id=user_id, extraction=extraction
            )
            await self.session.commit()
            status = "ready"
        except ResumeParseError as e:
            logger.info("resume parse failed for %s: %s", parse_id, e)
            await self.session.rollback()
            await self.repo.mark_failed(parse_id, error=str(e))
            await self.session.commit()
            status = "failed"
        except Exception as e:  # AI gateway / schema failure
            logger.exception("resume extraction failed for %s", parse_id)
            await self.session.rollback()
            await self.repo.mark_failed(parse_id, error=f"extraction_error: {e}")
            await self.session.commit()
            status = "failed"

        return ResumeUploadOut(
            parse_id=row.id,
            status=status,
            storage_uri=uri,
            file_size=len(data),
            mime_type=mime_type,
        )

    async def get_status(self, *, user_id: str, parse_id: str) -> ResumeStatusOut:
        row = await self.repo.get(parse_id)
        if row is None or row.user_id != user_id:
            raise NotFound("resume not found")
        extracted = (
            ResumeExtraction.model_validate(row.extracted_json) if row.extracted_json else None
        )
        return ResumeStatusOut(
            parse_id=row.id,
            status=row.status,  # type: ignore[arg-type]
            extracted=extracted,
            error=row.error,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    async def apply_to_profile(self, *, user_id: str, parse_id: str) -> ResumeApplyOut:
        """Re-apply a stored extraction to the profile (idempotent).

        Useful for the frontend to confirm "auto-fill" after the user views
        the preview without uploading again.
        """
        row = await self.repo.get(parse_id)
        if row is None or row.user_id != user_id:
            raise NotFound("resume not found")
        if row.status != "ready" or row.extracted_json is None:
            raise BadRequest("resume is not ready to apply")

        extraction = ResumeExtraction.model_validate(row.extracted_json)
        new_profile, delta = await self.profiles.apply_resume_extraction(
            user_id=user_id, extraction=extraction
        )
        return ResumeApplyOut(
            parse_id=row.id,
            profile_completion=new_profile.completion_percentage,
            fields_filled_from_resume=sorted(delta.keys()),
            field_sources={k: v for k, v in new_profile.field_sources.items()},
        )
