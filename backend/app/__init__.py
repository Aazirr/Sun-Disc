import os
import logging

from flask import Flask, request
from flask_cors import CORS

from app.api.routes_health import health_bp
from app.api.routes_runs import runs_bp
from app.api.routes_tests import tests_bp
from app.services.run_store import init_run_store


def create_app() -> Flask:
    app = Flask(__name__)

    logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s in %(name)s: %(message)s")

    app.logger.setLevel(logging.INFO)

    cors_origins = os.getenv("CORS_ORIGINS", "*")
    default_origins = [
        r"https://.*\.onrender\.com",
        r"http://localhost:\d+",
        r"http://127\.0\.0\.1:\d+",
    ]
    if cors_origins == "*":
        CORS(app, resources={r"/api/*": {"origins": default_origins}})
    else:
        parsed_origins = [origin.strip() for origin in cors_origins.split(",") if origin.strip()]
        allowed_origins = parsed_origins + default_origins
        CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

    app.logger.info("sun-disc backend starting")
    app.logger.info("CORS origins: %s", cors_origins)

    init_run_store()

    @app.get("/")
    def root() -> tuple[dict, int]:
        return {
            "service": "sun-disc-backend",
            "status": "ok",
            "health": "/api/health",
        }, 200

    @app.before_request
    def log_request() -> None:
        app.logger.info(
            "Request %s %s origin=%s host=%s",
            request.method,
            request.path,
            request.headers.get("Origin"),
            request.host,
        )

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(tests_bp, url_prefix="/api")
    app.register_blueprint(runs_bp, url_prefix="/api")

    return app
