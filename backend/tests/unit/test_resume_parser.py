"""Resume parser tests (PDF + DOCX) and the stub extractor pipeline."""

from __future__ import annotations

import io

import pytest

from app.modules.resume.parser import (
    DOCX_MIME,
    PDF_MIME,
    ResumeParseError,
    extract_text,
)


def _make_pdf(text: str) -> bytes:
    """Tiny PDF generator using pypdf so we don't require a fixtures dir."""
    from pypdf import PdfWriter
    from pypdf.generic import (
        ArrayObject,
        ContentStream,
        DictionaryObject,
        NameObject,
        NumberObject,
    )

    # Simpler: use reportlab-style text via pypdf is awkward; instead use a
    # minimal raw PDF with a Tj operator.
    pdf = (
        b"%PDF-1.4\n"
        b"1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n"
        b"2 0 obj<< /Type /Pages /Count 1 /Kids [3 0 R] >>endobj\n"
        b"3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj\n"
        b"4 0 obj<< /Length 70 >>stream\n"
        b"BT /F1 12 Tf 50 700 Td (" + text.encode() + b") Tj ET\n"
        b"endstream endobj\n"
        b"5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n"
        b"xref\n0 6\n"
        b"0000000000 65535 f \n"
        b"0000000010 00000 n \n"
        b"0000000060 00000 n \n"
        b"0000000110 00000 n \n"
        b"0000000220 00000 n \n"
        b"0000000310 00000 n \n"
        b"trailer<< /Size 6 /Root 1 0 R >>\n"
        b"startxref\n400\n%%EOF\n"
    )
    return pdf


def _make_docx(text: str) -> bytes:
    from docx import Document

    buf = io.BytesIO()
    doc = Document()
    doc.add_paragraph(text)
    doc.save(buf)
    return buf.getvalue()


def test_extract_text_pdf() -> None:
    text = extract_text(data=_make_pdf("Ada Lovelace Engineer"), mime_type=PDF_MIME)
    assert "Ada Lovelace" in text


def test_extract_text_docx() -> None:
    text = extract_text(
        data=_make_docx("Grace Hopper is a senior engineer"), mime_type=DOCX_MIME
    )
    assert "Grace Hopper" in text


def test_unsupported_mime_raises() -> None:
    with pytest.raises(ResumeParseError):
        extract_text(data=b"not a real file", mime_type="image/png")


def test_pdf_with_no_text_raises() -> None:
    with pytest.raises(ResumeParseError):
        extract_text(data=b"%PDF-1.4\n", mime_type=PDF_MIME)
