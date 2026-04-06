from flask import Blueprint, current_app, jsonify, request

from app.automation.test_login import TestExecutionError
from app.services.run_store import create_test_run, update_run_status
from app.services.test_runner import execute_test

tests_bp = Blueprint("tests", __name__)


@tests_bp.post("/tests/run")
def run_test() -> tuple[dict, int]:
    payload = request.get_json(silent=True) or {}
    current_app.logger.info("Run request payload test_name=%s base_url=%s environment=%s", payload.get("test_name"), payload.get("base_url"), payload.get("environment"))

    try:
        created_run = create_test_run(payload)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    run_id = int(created_run["id"])
    run_state = update_run_status(run_id, "RUNNING")

    try:
        execute_test(run_id, str(created_run["test_name"]), payload)
        run_state = update_run_status(run_id, "PASS")
        current_app.logger.info("Run %s completed PASS", run_id)
    except TestExecutionError as exc:
        run_state = update_run_status(
            run_id,
            "FAIL",
            str(exc),
            exc.screenshot_path,
        )
        current_app.logger.exception("Run %s failed with screenshot=%s", run_id, exc.screenshot_path)
    except Exception as exc:
        run_state = update_run_status(run_id, "FAIL", str(exc))
        current_app.logger.exception("Run %s failed", run_id)

    return (
        jsonify(
            {
                "run_id": run_state["id"],
                "status": run_state["status"],
                "error_message": run_state["error_message"],
                "screenshot_path": run_state["screenshot_path"],
            }
        ),
        201,
    )
