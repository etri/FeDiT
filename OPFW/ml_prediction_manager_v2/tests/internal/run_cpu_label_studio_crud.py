#!/usr/bin/env python3
"""Visible Firefox create/result/cleanup cycle for Label Studio via FeDiT SSO."""

from __future__ import annotations

import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


OUTPUT = Path(sys.argv[1]).resolve()
BASE = os.environ.get("FEDIT_BROWSER_BASE", "http://127.0.0.1")
MODE = os.environ.get("FEDIT_TEST_MODE", "CPU").upper()
STAMP = datetime.now(timezone.utc).astimezone().strftime("%Y%m%d-%H%M%S")
PROJECT_NAME = f"{MODE}-video-browser-{STAMP}"


def shot(driver: webdriver.Firefox, step: str) -> str:
    path = OUTPUT / f"{MODE}_Label_Studio_video_{step}_{STAMP}.png"
    driver.save_screenshot(str(path))
    time.sleep(2)
    return path.name


def main() -> int:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    options = webdriver.FirefoxOptions()
    options.add_argument("--width=1440")
    options.add_argument("--height=900")
    browser_binary = Path(
        os.environ.get(
            "FEDIT_FIREFOX_BINARY",
            "/snap/firefox/current/usr/lib/firefox/firefox",
        )
    )
    if browser_binary.is_file() and os.access(browser_binary, os.X_OK):
        options.binary_location = str(browser_binary)
    service = Service(executable_path=os.environ["FEDIT_GECKODRIVER"])
    driver = webdriver.Firefox(options=options, service=service)
    driver.set_window_size(1440, 900)
    wait = WebDriverWait(driver, 30)
    evidence: list[dict[str, str]] = []
    project_opened = False
    try:
        driver.get(f"{BASE}:18000/label-studio/")
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        evidence.append({"step": "01_entry", "screenshot": shot(driver, "01_entry")})

        wait.until(EC.element_to_be_clickable((By.XPATH, "//*[self::a or self::button][contains(normalize-space(), 'Create Project')]"))).click()
        project_name = wait.until(EC.visibility_of_element_located((By.XPATH, "//input[not(@type='hidden')][1]")))
        project_name.clear()
        project_name.send_keys(PROJECT_NAME)
        evidence.append({"step": "02_config", "screenshot": shot(driver, "02_config")})

        wait.until(EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Save']"))).click()
        wait.until(lambda current: PROJECT_NAME in current.page_source)
        project_opened = True
        evidence.append({"step": "03_result_created", "screenshot": shot(driver, "03_result_created")})

        wait.until(EC.element_to_be_clickable((By.XPATH, "//*[self::a or self::button][normalize-space()='Settings']"))).click()
        wait.until(EC.element_to_be_clickable((By.XPATH, "//*[self::a or self::button][normalize-space()='Danger Zone']"))).click()
        wait.until(EC.element_to_be_clickable((By.XPATH, "//*[self::a or self::button][normalize-space()='Delete Project']"))).click()
        evidence.append({"step": "04_cleanup_confirm", "screenshot": shot(driver, "04_cleanup_confirm")})

        wait.until(EC.element_to_be_clickable((By.XPATH, "//*[self::a or self::button][normalize-space()='Proceed']"))).click()
        wait.until(lambda current: PROJECT_NAME not in current.page_source)
        project_opened = False
        evidence.append({"step": "05_cleanup_complete", "screenshot": shot(driver, "05_cleanup_complete")})
        status = "PASS"
    except Exception as error:  # preserve on-screen failure evidence for review
        evidence.append({"step": "failure", "screenshot": shot(driver, "FAIL")})
        status = "FAIL"
        failure = str(error)
    finally:
        driver.quit()
    manifest = {
        "mode": MODE,
        "service": "Label Studio via FeDiT SSO",
        "project_name": PROJECT_NAME,
        "status": status,
        "project_cleanup_complete": not project_opened,
        "evidence": evidence,
    }
    if status == "FAIL":
        manifest["error"] = failure
    (OUTPUT / f"{MODE}_label_studio_crud_{STAMP}.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(manifest, ensure_ascii=False))
    return 0 if status == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
