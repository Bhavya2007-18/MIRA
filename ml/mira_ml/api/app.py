"""FastAPI Application factory for MIRA AI/ML Backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mira_ml.api.routes import router


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="MIRA AI/ML Intelligence Service",
        description="Cognitive scoring, profiling, adaptive difficulty, personalization, and Memory Prosthetic API.",
        version="0.1.0",
    )

    # Enable CORS for Next.js Web Dashboard and React Native Mobile App
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(router)
    return app


app = create_app()
