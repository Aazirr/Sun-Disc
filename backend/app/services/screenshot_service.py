from __future__ import annotations

from pathlib import Path
from typing import Optional

from selenium.webdriver import Chrome

SCREENSHOT_DIR = Path(__file__).resolve().parents[2] / "storage" / "screenshots"


def ensure_screenshot_dir() -> Path:
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
    return SCREENSHOT_DIR


def save_failure_screenshot(driver: Chrome, run_id: int) -> Optional[str]:
    screenshot_dir = ensure_screenshot_dir()
    screenshot_file = screenshot_dir / f"run_{run_id}.png"

    success = driver.save_screenshot(str(screenshot_file))
    if not success:
        return None

    return str(screenshot_file.resolve())
