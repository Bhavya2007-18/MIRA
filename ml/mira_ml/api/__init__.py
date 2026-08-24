"""FastAPI REST API module for MIRA ML Service."""

from mira_ml.api.app import create_app, app
from mira_ml.api.routes import router

__all__ = ["create_app", "app", "router"]
