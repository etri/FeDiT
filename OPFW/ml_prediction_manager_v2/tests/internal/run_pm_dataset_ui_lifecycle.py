#!/usr/bin/env python3
"""Visible-browser dataset lifecycle: create, configure, run, verify, clean up."""

from __future__ import annotations

import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from selenium import webdriver
from selenium.common.exceptions import (
    ElementClickInterceptedException,
    ElementNotInteractableException,
    TimeoutException,
)
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.ui import Select, WebDriverWait


OUTPUT = Path(sys.argv[1]).resolve()
FIXTURE = Path(__file__).with_name("fixtures") / "ui_lifecycle_dataset.csv"
BASE = os.environ.get("FEDIT_BROWSER_BASE", "http://127.0.0.1:18000")
MODE = os.environ.get("FEDIT_TEST_MODE", "GPU").upper()
STAMP = datetime.now(timezone.utc).astimezone().strftime("%Y%m%d-%H%M%S")
DATASET_NAME = f"{MODE.lower()}-ui-lifecycle-{STAMP}"


def browser() -> webdriver.Firefox:
    options = Options()
    options.add_argument("--width=1440")
    options.add_argument("--height=900")
    options.page_load_strategy = "eager"
    options.binary_location = os.environ["FEDIT_FIREFOX_BINARY"]
    return webdriver.Firefox(
        options=options,
        service=Service(executable_path=os.environ["FEDIT_GECKODRIVER"]),
    )


def main() -> int:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    driver = browser()
    driver.set_window_size(1440, 900)
    wait = WebDriverWait(driver, 30)
    evidence: list[dict[str, str]] = []
    cleaned = False
    created = False

    def shot(step: str) -> None:
        path = OUTPUT / f"{MODE}_Dataset_{step}_{STAMP}.png"
        driver.save_screenshot(str(path))
        evidence.append({"step": step, "screenshot": path.name})
        time.sleep(1)

    def click(selector: str) -> None:
        element = wait.until(lambda current: current.find_element(By.CSS_SELECTOR, selector))
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", element)
        try:
            element.click()
        except (ElementClickInterceptedException, ElementNotInteractableException):
            # Firefox can report a fixed iframe layout as outside the viewport
            # even after scrollIntoView. Use the same visible DOM click path as
            # the pipeline probe, while retaining the real browser event.
            driver.execute_script("arguments[0].click();", element)

    def delete_selected(name: str) -> None:
        click(".ds-delete")
        prompt = wait.until(lambda current: current.switch_to.alert)
        prompt.send_keys(name)
        prompt.accept()
        wait.until(lambda current: name not in current.find_element(By.ID, "ds-list").text)

    try:
        driver.get(f"{BASE}/fedit/predictor-creator-tool")
        card = wait.until(
            lambda current: current.find_element(
                By.XPATH, "//p[normalize-space(text())='데이터셋 카탈로그']/.."
            )
        )
        card.click()
        frame = wait.until(lambda current: current.find_element(By.CSS_SELECTOR, "iframe.predictor-tool__iframe"))
        driver.switch_to.frame(frame)
        wait.until(lambda current: current.find_element(By.ID, "ds-guide"))
        for prior in driver.find_elements(By.CSS_SELECTOR, ".ds-card"):
            if prior.text.startswith(f"{MODE.lower()}-ui-lifecycle-"):
                prior_name = prior.text.splitlines()[0]
                prior.click()
                delete_selected(prior_name)
        shot("01_function_select")

        click("summary")
        name = wait.until(lambda current: current.find_element(By.ID, "ds-name"))
        name.send_keys(DATASET_NAME)
        driver.find_element(By.ID, "ds-target").send_keys("target")
        Select(driver.find_element(By.ID, "ds-type")).select_by_value("csv")
        Select(driver.find_element(By.ID, "ds-task")).select_by_value("regression")
        driver.find_element(By.ID, "ds-desc").send_keys("browser UI lifecycle verification")
        shot("02_configuration")

        click("#ds-create-btn")
        wait.until(lambda current: DATASET_NAME in current.find_element(By.ID, "ds-list").text)
        created = True
        click(".ds-card")
        wait.until(lambda current: current.find_element(By.ID, "ds-toggle-version-form"))
        shot("03_created")

        click("#ds-toggle-version-form")
        upload = wait.until(lambda current: current.find_element(By.ID, "ds-file"))
        upload.send_keys(str(FIXTURE))
        shot("04_upload_configured")
        click("#ds-add-version")
        click(".ds-more-menu > summary")
        click(".ds-prep")
        wait.until(lambda current: current.find_element(By.ID, "ds-run-preprocess"))
        shot("05_execution_ready")

        click("#ds-run-preprocess")
        wait.until(
            lambda current: len(current.find_elements(By.CSS_SELECTOR, ".ds-version-row")) >= 2
        )
        shot("06_result")

        delete_selected(DATASET_NAME)
        cleaned = True
        shot("07_cleanup")
        status = "PASS"
    except Exception as error:
        shot("FAIL")
        status = "FAIL"
        failure = f"{type(error).__name__}: {error}"
    finally:
        if created and not cleaned:
            try:
                delete_selected(DATASET_NAME)
                cleaned = True
            except Exception:
                pass
        driver.quit()

    manifest = {
        "mode": MODE,
        "service": "Dataset Catalog",
        "dataset_name": DATASET_NAME,
        "status": status,
        "cleanup_complete": cleaned,
        "evidence": evidence,
    }
    if status == "FAIL":
        manifest["error"] = failure
    (OUTPUT / f"{MODE}_dataset_ui_lifecycle_{STAMP}.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(manifest, ensure_ascii=False))
    return 0 if status == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
