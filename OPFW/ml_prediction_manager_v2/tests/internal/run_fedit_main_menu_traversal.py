#!/usr/bin/env python3
"""Click every non-logout FeDiT main-menu route in a visible Firefox session."""

from __future__ import annotations

import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

from selenium import webdriver
from selenium.common.exceptions import TimeoutException, WebDriverException
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.ui import WebDriverWait


OUTPUT = Path(sys.argv[1]).resolve()
BASE = os.environ.get("FEDIT_BROWSER_BASE", "http://127.0.0.1:18000")
MODE = os.environ.get("FEDIT_TEST_MODE", "CPU").upper()
STAMP = datetime.now(timezone.utc).astimezone().strftime("%Y%m%d-%H%M%S")
MAIN_URL = f"{BASE}/fedit/predictor-creator-tool"

# These are the service cards on the actual FeDiT Predictor Creator main
# screen.  The test clicks the card itself (not a directly loaded service URL),
# then records where the visible UI navigated.
SERVICE_CARDS = [
    ("01_prediction_manager", "예측매니저"),
    ("02_dataset_catalog", "데이터셋 카탈로그"),
    ("03_data_collection", "데이터 수집"),
    ("04_volumes", "볼륨"),
    ("05_nifi", "Apache NiFi"),
    ("06_label_studio", "Label Studio"),
    ("07_pipelines", "파이프라인"),
    ("08_automl", "AutoML"),
    ("09_ray_dashboard", "Ray 대시보드"),
    ("10_mlflow", "MLflow"),
    ("11_tensorboards", "텐서보드"),
    ("12_model_management", "모델 관리"),
    ("13_kserve_endpoints", "KServe 엔드포인트"),
    ("14_mlops_monitoring", "MLOps 모니터링"),
    ("15_system_management", "시스템 관리"),
]


def at_main_screen(driver: webdriver.Firefox) -> bool:
    actual = urlsplit(driver.current_url)
    return actual.path == "/fedit/predictor-creator-tool"


def configure_firefox() -> webdriver.Firefox:
    options = Options()
    options.add_argument("--width=1440")
    options.add_argument("--height=900")
    options.page_load_strategy = "eager"
    browser_binary = Path(
        os.environ.get(
            "FEDIT_FIREFOX_BINARY",
            "/snap/firefox/current/usr/lib/firefox/firefox",
        )
    )
    if browser_binary.is_file() and os.access(browser_binary, os.X_OK):
        options.binary_location = str(browser_binary)
    options.set_preference("browser.aboutConfig.showWarning", False)
    options.set_preference("browser.shell.checkDefaultBrowser", False)
    service = Service(executable_path=os.environ["FEDIT_GECKODRIVER"])
    driver = webdriver.Firefox(options=options, service=service)
    driver.set_window_size(1440, 900)
    driver.set_page_load_timeout(35)
    return driver


def wait_for_visible_page(driver: webdriver.Firefox) -> None:
    WebDriverWait(driver, 15).until(
        lambda current: current.execute_script(
            "return document.body && document.body.innerText.trim().length > 0"
        )
    )


def main() -> int:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    driver = configure_firefox()
    results: list[dict[str, str]] = []
    try:
        # Keep one explicit capture of the FeDiT main dashboard before the
        # card-by-card traversal starts.
        driver.get(MAIN_URL)
        WebDriverWait(driver, 25).until(at_main_screen)
        wait_for_visible_page(driver)
        dashboard = OUTPUT / f"{MODE}_fedit_main_dashboard_{STAMP}_PASS.png"
        driver.save_screenshot(str(dashboard))

        for label, card_title in SERVICE_CARDS:
            item: dict[str, str] = {
                "name": label,
                "main_url": MAIN_URL,
                "card_title": card_title,
            }
            try:
                # Return to the FeDiT main screen before every native card
                # click, ensuring each service route is entered from the
                # screen the user actually uses.
                driver.get(MAIN_URL)
                WebDriverWait(driver, 25).until(at_main_screen)
                wait_for_visible_page(driver)
                card = WebDriverWait(driver, 15).until(
                    lambda current: current.find_element(
                        By.XPATH, f"//p[normalize-space(text())='{card_title}']/.."
                    )
                )
                driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", card)
                time.sleep(1)
                card.click()
                WebDriverWait(driver, 25).until(lambda current: not at_main_screen(current))
                wait_for_visible_page(driver)
                time.sleep(3)
                item["title"] = driver.title
                item["current_url"] = driver.current_url
                item["status"] = "PASS"
            except (TimeoutException, WebDriverException) as error:
                item["status"] = "FAIL"
                item["error"] = str(error)
            screenshot = OUTPUT / f"{MODE}_fedit_main_menu_{label}_{STAMP}_{item['status']}.png"
            driver.save_screenshot(str(screenshot))
            item["screenshot"] = screenshot.name
            results.append(item)
    finally:
        driver.quit()

    manifest = {
        "mode": MODE,
        "recorded_at": datetime.now(timezone.utc).astimezone().isoformat(),
        "entry_point": MAIN_URL,
        "main_dashboard_screenshot": dashboard.name,
        "items": results,
    }
    (OUTPUT / f"{MODE}_fedit_main_menu_traversal_{STAMP}.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(manifest, ensure_ascii=False))
    return 1 if any(item["status"] != "PASS" for item in results) else 0


if __name__ == "__main__":
    raise SystemExit(main())
