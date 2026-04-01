from flask import Blueprint, jsonify

from app.services.run_store import list_test_runs

runs_bp = Blueprint("runs", __name__)


@runs_bp.get("/runs")
def get_runs() -> tuple[dict, int]:
    runs = list_test_runs()
    return jsonify({"items": runs}), 200
