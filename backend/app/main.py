"""FastAPI application factory."""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.logging_setup import install as install_file_logger
from app.middleware import error_handler
from app.startup import bootstrap
from app.modules.auth.routes import router as auth_router
from app.modules.case.routes import router as case_router
from app.modules.country_comparison.routes import router as country_comparison_router
from app.modules.culture.routes import router as culture_router
from app.modules.documents.routes import router as documents_router
from app.modules.family.routes import router as family_router
from app.modules.finance.routes import router as finance_router
from app.modules.job_fit.routes import router as job_fit_router
from app.modules.profile.routes import router as profile_router
from app.modules.resume.routes import router as resume_router
from app.modules.visa.routes import router as visa_router
from app.modules.synthesis.routes import router as synthesis_router
from app.modules.timeline.routes import router as timeline_router
from app.modules.workflow.routes import router as workflow_router


def create_app() -> FastAPI:
    s = get_settings()
    logging.basicConfig(level=getattr(logging, s.log_level, logging.INFO))
    install_file_logger()
    s.ensure_local_dirs()
    bootstrap()

    app = FastAPI(
        title="Glimmora Relocate Backend",
        version="0.1.0",
        description="Foundation phase — auth, profile, case, resume, AI gateway.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
        allow_credentials=False,
    )

    error_handler.install(app)

    app.include_router(auth_router)
    app.include_router(profile_router)
    app.include_router(case_router)
    app.include_router(resume_router)
    app.include_router(country_comparison_router)
    app.include_router(job_fit_router)
    app.include_router(visa_router)
    app.include_router(family_router)
    app.include_router(finance_router)
    app.include_router(documents_router)
    app.include_router(workflow_router)
    app.include_router(culture_router)
    app.include_router(timeline_router)
    app.include_router(synthesis_router)

    @app.get("/healthz", tags=["meta"])
    async def healthz() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
