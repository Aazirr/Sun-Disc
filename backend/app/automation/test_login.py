from __future__ import annotations

from urllib.parse import urljoin

from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

from app.services.screenshot_service import save_failure_screenshot


class TestExecutionError(Exception):
    def __init__(self, message: str, screenshot_path: str | None = None) -> None:
        super().__init__(message)
        self.screenshot_path = screenshot_path


def _build_driver() -> webdriver.Chrome:
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--window-size=1440,900")
    options.add_argument("--disable-gpu")

    return webdriver.Chrome(options=options)


def _wait_for_ready(driver: webdriver.Chrome, timeout_seconds: int = 15) -> None:
    WebDriverWait(driver, timeout_seconds).until(
        lambda browser: browser.execute_script("return document.readyState") == "complete"
    )


def _find_first(driver: webdriver.Chrome, selectors: list[str]):
    for selector in selectors:
        matches = driver.find_elements(By.CSS_SELECTOR, selector)
        if matches:
            return matches[0]
    return None


def run_login_test(
    base_url: str,
    run_id: int,
    username: str | None = None,
    password: str | None = None,
) -> None:
    if not base_url:
        raise ValueError("base_url is required for login_test")

    driver = _build_driver()
    driver.set_page_load_timeout(20)

    try:
        driver.get(base_url)
        _wait_for_ready(driver)

        if username and password:
            username_input = _find_first(
                driver,
                [
                    "input[name='username']",
                    "input[name='email']",
                    "input[type='email']",
                    "input[id*='user']",
                    "input[id*='email']",
                ],
            )
            password_input = _find_first(
                driver,
                [
                    "input[name='password']",
                    "input[type='password']",
                    "input[id*='password']",
                ],
            )

            if username_input is None or password_input is None:
                login_url = urljoin(base_url.rstrip("/") + "/", "login")
                driver.get(login_url)
                _wait_for_ready(driver)

                username_input = _find_first(
                    driver,
                    [
                        "input[name='username']",
                        "input[name='email']",
                        "input[type='email']",
                        "input[id*='user']",
                        "input[id*='email']",
                    ],
                )
                password_input = _find_first(
                    driver,
                    [
                        "input[name='password']",
                        "input[type='password']",
                        "input[id*='password']",
                    ],
                )

            if username_input is None or password_input is None:
                raise RuntimeError("Could not find login form fields on base_url or /login")

            username_input.clear()
            username_input.send_keys(username)
            password_input.clear()
            password_input.send_keys(password)

            submit_button = _find_first(
                driver,
                [
                    "button[type='submit']",
                    "input[type='submit']",
                    "button[name='login']",
                    "button[id*='login']",
                ],
            )

            if submit_button is not None:
                submit_button.click()
            else:
                password_input.submit()

            try:
                _wait_for_ready(driver, timeout_seconds=10)
            except TimeoutException:
                # The run is still valid if the page performs long client redirects.
                pass

    except Exception as exc:
        screenshot_path = save_failure_screenshot(driver, run_id)
        raise TestExecutionError(str(exc), screenshot_path) from exc

    finally:
        driver.quit()
