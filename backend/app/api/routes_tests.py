from flask import Blueprint, jsonify, request

from app.services.run_store import create_test_run

tests_bp = Blueprint("tests", __name__)


@tests_bp.post("/tests/run")
def run_test() -> tuple[dict, int]:
    payload = request.get_json(silent=True) or {}

    try:
        created_run = create_test_run(payload)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"run_id": created_run["id"], "status": created_run["status"]}), 201
