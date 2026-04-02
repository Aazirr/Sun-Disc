from flask import Blueprint, current_app, jsonify, request

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health_check():
    current_app.logger.info(
        "Health check from origin=%s host=%s",
        request.headers.get("Origin"),
        request.host,
    )
    return jsonify({"status": "ok", "service": "sun-disc-backend"}), 200
