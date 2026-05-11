"""Global exception → JSON converter.

Keeps the API surface predictable: every error becomes
`{"error": {"code", "message", "details"?}}` with a stable HTTP status.

For unhandled exceptions we ALSO:
  - print the full traceback directly to stderr so it always lands in the
    uvicorn terminal (uvicorn's own logging config can swallow records sent
    through the standard `logger.exception(...)` path)
  - in dev/debug mode, include the exception class, message and traceback in
    the JSON body so the consumer-side `logBackendError` can surface the real
    cause instead of the generic "Something went wrong."
"""

from __future__ import annotations

import logging
import sys
import traceback

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.config import get_settings

logger = logging.getLogger(__name__)


class AppError(Exception):
    code: str = "internal_error"
    status_code: int = 500

    def __init__(self, message: str, *, details: dict | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.details = details or {}


class NotFound(AppError):
    code = "not_found"
    status_code = 404


class Conflict(AppError):
    code = "conflict"
    status_code = 409


class Unauthorized(AppError):
    code = "unauthorized"
    status_code = 401


class Forbidden(AppError):
    code = "forbidden"
    status_code = 403


class BadRequest(AppError):
    code = "bad_request"
    status_code = 400


def _payload(code: str, message: str, details: dict | None = None) -> dict:
    body: dict = {"error": {"code": code, "message": message}}
    if details:
        body["error"]["details"] = details
    return body


def _is_dev() -> bool:
    try:
        s = get_settings()
    except Exception:  # noqa: BLE001 — settings unavailable, fall back to safe default
        return False
    return s.debug or s.env in ("development", "test")


def install(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(_payload(exc.code, exc.message, exc.details), status_code=exc.status_code)

    @app.exception_handler(HTTPException)
    async def _http(_: Request, exc: HTTPException) -> JSONResponse:
        return JSONResponse(
            _payload("http_error", str(exc.detail)),
            status_code=exc.status_code,
        )

    @app.exception_handler(RequestValidationError)
    async def _val(_: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            _payload("validation_error", "Request body failed validation.", {"errors": exc.errors()}),
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    @app.exception_handler(ValidationError)
    async def _pyd(_: Request, exc: ValidationError) -> JSONResponse:
        return JSONResponse(
            _payload("validation_error", "Internal validation failed.", {"errors": exc.errors()}),
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    @app.exception_handler(Exception)
    async def _unhandled(request: Request, exc: Exception) -> JSONResponse:
        # 1. Always emit the full traceback to stderr so it shows in the
        #    uvicorn terminal regardless of uvicorn's logging configuration.
        tb_str = "".join(
            traceback.format_exception(type(exc), exc, exc.__traceback__)
        )
        print(
            f"\n=== unhandled exception @ {request.method} {request.url.path} ===\n"
            f"{tb_str}"
            f"=== end traceback ===\n",
            file=sys.stderr,
            flush=True,
        )

        # 2. Also route through the standard logger so the rotating file
        #    handler in app.logging_setup still captures it.
        logger.error(
            "unhandled exception on %s %s",
            request.method,
            request.url.path,
            exc_info=exc,
        )

        # 3. In dev mode, expose the real cause to the caller so the
        #    frontend logs are immediately useful.
        details: dict | None = None
        message = "Something went wrong."
        if _is_dev():
            message = f"{type(exc).__name__}: {exc}"
            details = {
                "exception": type(exc).__name__,
                "exception_message": str(exc),
                "traceback": tb_str.splitlines()[-12:],  # tail only — keep payload small
                "path": request.url.path,
                "method": request.method,
            }

        return JSONResponse(
            _payload("internal_error", message, details),
            status_code=500,
        )
