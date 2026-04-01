from flask import Flask
from flask_cors import CORS

from app.api.routes_health import health_bp
from app.api.routes_runs import runs_bp
from app.api.routes_tests import tests_bp
from app.services.run_store import init_run_store


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)
    init_run_store()

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(tests_bp, url_prefix="/api")
    app.register_blueprint(runs_bp, url_prefix="/api")

    return app
