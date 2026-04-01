from flask import Blueprint, jsonify, request

from app.services.run_store import create_test_run, update_run_status
from app.services.test_runner import execute_test

tests_bp = Blueprint("tests", __name__)


@tests_bp.post("/tests/run")
def run_test() -> tuple[dict, int]:
    payload = request.get_json(silent=True) or {}

    try:
        created_run = create_test_run(payload)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    run_id = int(created_run["id"])
    run_state = update_run_status(run_id, "RUNNING")

    try:
        execute_test(str(created_run["test_name"]), payload)
        run_state = update_run_status(run_id, "PASS")
    except Exception as exc:
        run_state = update_run_status(run_id, "FAIL", str(exc))

    return (
        jsonify(
            {
                "run_id": run_state["id"],
                "status": run_state["status"],
                "error_message": run_state["error_message"],
            }
        ),
        201,
    )
