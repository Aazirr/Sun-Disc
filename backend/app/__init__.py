import os

from flask import Flask
from flask_cors import CORS

from app.api.routes_health import health_bp
from app.api.routes_runs import runs_bp
from app.api.routes_tests import tests_bp
from app.services.run_store import init_run_store


def create_app() -> Flask:
    app = Flask(__name__)

    cors_origins = os.getenv("CORS_ORIGINS", "*")
    if cors_origins == "*":
        CORS(app)
    else:
        parsed_origins = [origin.strip() for origin in cors_origins.split(",") if origin.strip()]
        CORS(app, resources={r"/api/*": {"origins": parsed_origins}})

    init_run_store()

    @app.get("/")
    def root() -> tuple[dict, int]:
        return {
            "service": "sun-disc-backend",
            "status": "ok",
            "health": "/api/health",
        }, 200

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(tests_bp, url_prefix="/api")
    app.register_blueprint(runs_bp, url_prefix="/api")

    return app
