from pathlib import Path

from flask import Blueprint, jsonify, send_file

from app.services.run_store import get_test_run, list_test_runs

runs_bp = Blueprint("runs", __name__)


@runs_bp.get("/runs")
def get_runs() -> tuple[dict, int]:
    runs = list_test_runs()
    return jsonify({"items": runs}), 200


@runs_bp.get("/runs/<int:run_id>")
def get_run_by_id(run_id: int) -> tuple[dict, int]:
    run = get_test_run(run_id)
    if run is None:
        return jsonify({"error": "Run not found"}), 404
    return jsonify(run), 200


@runs_bp.get("/runs/<int:run_id>/screenshot")
def get_run_screenshot(run_id: int):
    run = get_test_run(run_id)
    if run is None:
        return jsonify({"error": "Run not found"}), 404

    screenshot_path = run.get("screenshot_path")
    if not screenshot_path:
        return jsonify({"error": "Screenshot not found for this run"}), 404

    screenshot_file = Path(str(screenshot_path))
    if not screenshot_file.exists():
        return jsonify({"error": "Screenshot file is missing on disk"}), 404

    return send_file(screenshot_file, mimetype="image/png")
