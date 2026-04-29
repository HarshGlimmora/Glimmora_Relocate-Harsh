"""Raw text extraction from PDF/DOCX bytes.

Uses pypdf for PDFs and python-docx for DOCX. Pure functions; no I/O beyond
the bytes argument. Document AI / GCS land in the production parser path
later — the contract here is "bytes in, text out".
"""

from __future__ import annotations

import io
import logging
from typing import Final

logger = logging.getLogger(__name__)


PDF_MIME: Final = "application/pdf"
DOCX_MIME: Final = (
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
)
SUPPORTED_MIMES: Final = {PDF_MIME, DOCX_MIME}


class ResumeParseError(Exception):
    pass


def extract_text(*, data: bytes, mime_type: str) -> str:
    if mime_type == PDF_MIME:
        return _extract_pdf(data)
    if mime_type == DOCX_MIME:
        return _extract_docx(data)
    raise ResumeParseError(f"Unsupported mime type: {mime_type!r}")


def _extract_pdf(data: bytes) -> str:
    try:
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(data))
        chunks: list[str] = []
        for page in reader.pages:
            try:
                chunks.append(page.extract_text() or "")
            except Exception as e:
                logger.warning("pypdf page extract failed: %s", e)
        text = "\n".join(c.strip() for c in chunks if c)
        if not text.strip():
            raise ResumeParseError("PDF contained no extractable text.")
        return text
    except ResumeParseError:
        raise
    except Exception as e:
        raise ResumeParseError(f"Failed to read PDF: {e}") from e


def _extract_docx(data: bytes) -> str:
    try:
        from docx import Document

        doc = Document(io.BytesIO(data))
        text = "\n".join(p.text for p in doc.paragraphs if p.text and p.text.strip())
        if not text.strip():
            raise ResumeParseError("DOCX contained no extractable text.")
        return text
    except ResumeParseError:
        raise
    except Exception as e:
        raise ResumeParseError(f"Failed to read DOCX: {e}") from e
