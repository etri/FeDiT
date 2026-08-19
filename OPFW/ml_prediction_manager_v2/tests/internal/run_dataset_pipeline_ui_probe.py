#!/usr/bin/env python3
"""Visible-browser Dataset-to-KFP submission probe for internal verification."""

from __future__ import annotations

import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

from selenium import webdriver
from selenium.common.exceptions import (
    ElementClickInterceptedException,
    ElementNotInteractableException,
    StaleElementReferenceException,
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
DATASET_NAME = f"{MODE.lower()}-pipeline-ui-{STAMP}"
RUN_NAME = f"{MODE.lower()}-pipeline-ui-{STAMP}"


def _browser() -> webdriver.Firefox:
    options = Options()
    options.binary_location = os.environ["FEDIT_FIREFOX_BINARY"]
    options.add_argument("--width=1440")
    options.add_argument("--height=900")
    options.page_load_strategy = "eager"
    return webdriver.Firefox(options=options, service=Service(os.environ["FEDIT_GECKODRIVER"]))


def main() -> int:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    driver = _browser()
    driver.set_window_size(1440, 900)
    # KFP v2 polling uses execute_async_script and can legitimately outlive
    # Selenium's 30-second default while the pipeline pod starts.
    driver.set_script_timeout(120)
    wait = WebDriverWait(driver, 45, ignored_exceptions=(StaleElementReferenceException,))
    evidence: list[dict[str, str]] = []
    submitted = False
    run_id = ""
    dataset_id = ""
    cleanup_complete = False

    def shot(step: str) -> None:
        path = OUTPUT / f"{MODE}_Dataset_Pipeline_{step}_{STAMP}.png"
        driver.save_screenshot(str(path))
        evidence.append({"step": step, "screenshot": path.name})
        time.sleep(1)

    def click(selector: str) -> None:
        item = wait.until(lambda current: current.find_element(By.CSS_SELECTOR, selector))
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", item)
        try:
            item.click()
        except (ElementClickInterceptedException, ElementNotInteractableException):
            driver.execute_script("arguments[0].click();", item)

    try:
        driver.get(f"{BASE}/fedit/predictor-creator-tool")
        wait.until(lambda current: current.find_element(By.XPATH, "//p[normalize-space(text())='데이터셋 카탈로그']/..")).click()
        driver.switch_to.frame(wait.until(lambda current: current.find_element(By.CSS_SELECTOR, "iframe.predictor-tool__iframe")))
        wait.until(lambda current: current.find_element(By.ID, "ds-guide"))
        shot("01_function_select")

        click("summary")
        driver.find_element(By.ID, "ds-name").send_keys(DATASET_NAME)
        driver.find_element(By.ID, "ds-target").send_keys("target")
        Select(driver.find_element(By.ID, "ds-type")).select_by_value("csv")
        Select(driver.find_element(By.ID, "ds-task")).select_by_value("regression")
        shot("02_dataset_configuration")
        click("#ds-create-btn")
        wait.until(lambda current: DATASET_NAME in current.find_element(By.ID, "ds-list").text)
        click(".ds-card")
        click("#ds-toggle-version-form")
        driver.find_element(By.ID, "ds-file").send_keys(str(FIXTURE))
        click("#ds-add-version")
        click(".ds-more-menu > summary")
        click(".ds-prep")
        click("#ds-run-preprocess")
        wait.until(lambda current: len(current.find_elements(By.CSS_SELECTOR, ".ds-version-row")) >= 2)
        shot("03_preprocess_result")
        package_text = driver.find_element(By.TAG_NAME, "body").text
        dataset_match = re.search(r"/datasets/([^/]+)/versions/", package_text)
        if dataset_match:
            dataset_id = dataset_match.group(1)

        click(".ds-more-menu > summary")
        pipeline_button = wait.until(lambda current: next(button for button in current.find_elements(By.CSS_SELECTOR, ".ds-pipeline") if button.is_enabled()))
        driver.execute_script("arguments[0].click();", pipeline_button)
        wait.until(lambda current: current.find_element(By.ID, "ds-run-pipeline"))
        run_name = driver.find_element(By.ID, "ds-run-name")
        run_name.clear()
        run_name.send_keys(RUN_NAME)
        shot("04_pipeline_configuration")
        click("#ds-run-pipeline")
        submitted = True
        driver.switch_to.default_content()
        # The Dataset page is itself inside the FeDiT shell iframe.  The
        # submit handler posts a message to the shell, which changes the
        # parent route and asynchronously mounts a new PM iframe; waiting only
        # on current_url races that remount and produced a false timeout.
        wait.until(
            lambda current: "/pipeline" in current.current_url
            or bool(current.find_elements(By.CSS_SELECTOR, "iframe.predictor-tool__iframe"))
        )
        frame = WebDriverWait(
            driver, 90, ignored_exceptions=(StaleElementReferenceException,)
        ).until(
            lambda current: current.find_element(
                By.CSS_SELECTOR, "iframe.predictor-tool__iframe"
            )
        )
        driver.switch_to.frame(frame)
        nested = WebDriverWait(
            driver, 90, ignored_exceptions=(StaleElementReferenceException,)
        ).until(lambda current: current.find_element(By.ID, "pl-kfp-iframe"))
        # The parent application passes the KFP run id in the native KFP
        # iframe fragment.  Keep it before switching browsing contexts: a
        # Selenium ``refresh`` from a nested iframe loses the parent bridge
        # and can leave the evidence run polling an obsolete page.
        kfp_url = nested.get_attribute("src") or ""
        run_id = urlparse(kfp_url).fragment.rsplit("/", 1)[-1]
        if not run_id:
            raise RuntimeError("KFP run id was not included in the service navigation URL")
        driver.switch_to.frame(nested)
        wait.until(lambda current: RUN_NAME in current.find_element(By.TAG_NAME, "body").text or "Runs" in current.find_element(By.TAG_NAME, "body").text)
        shot("05_submission_result")

        # Poll the KFP v2 API from the visible, authenticated browser frame.
        # This is the same endpoint used by the native KFP screen.  It avoids
        # treating a stale graph canvas as a still-running job while retaining
        # a browser-visible submission and terminal-result capture.
        deadline = time.monotonic() + int(os.environ.get("FEDIT_PIPELINE_TIMEOUT_SECONDS", "180"))
        terminal = ""
        while time.monotonic() < deadline:
            run = driver.execute_async_script(
                """
                const done = arguments[arguments.length - 1];
                fetch(`/pipeline/apis/v2beta1/runs/${arguments[0]}`)
                  .then(async response => ({ status: response.status, body: await response.json() }))
                  .then(done)
                  .catch(error => done({ error: String(error) }));
                """,
                run_id,
            )
            state = str((run.get("body") or {}).get("state") or "").upper() if isinstance(run, dict) else ""
            if state in {"SUCCEEDED", "FAILED", "ERROR", "CANCELLED", "TERMINATED"}:
                terminal = state
                break
            time.sleep(5)
        if not terminal:
            raise TimeoutError("KFP run did not reach a terminal state")
        # Refresh only the native KFP frame after the API reaches terminal
        # state, then open its Detail tab for the browser evidence frame.
        driver.execute_script("window.location.reload();")
        time.sleep(4)
        detail_tabs = driver.find_elements(By.XPATH, "//*[normalize-space()='Detail']")
        if detail_tabs:
            driver.execute_script("arguments[0].click();", detail_tabs[0])
            time.sleep(2)
        shot("06_terminal_result")
        if terminal != "SUCCEEDED":
            raise RuntimeError("KFP run reached a non-success terminal state")
        status = "PASS"
    except Exception as error:
        shot("FAIL")
        status = "FAIL"
        failure = f"{type(error).__name__}: {error}"
    finally:
        # Terminate a still-running KFP run and remove the browser-created
        # dataset through the authenticated same-origin browser context.  A
        # timeout must not leave a workflow, PVC, or test dataset behind for
        # the next clean traversal.
        try:
            if run_id and status != "PASS":
                driver.execute_async_script(
                    """
                    const done = arguments[arguments.length - 1];
                    fetch(`/pipeline/apis/v2beta1/runs/${encodeURIComponent(arguments[0])}:terminate`, {
                      method: 'POST', credentials: 'same-origin'
                    }).then(() => done(true)).catch(() => done(false));
                    """,
                    run_id,
                )
            if dataset_id:
                driver.execute_async_script(
                    """
                    const done = arguments[arguments.length - 1];
                    fetch(`/prediction-manager/api/datasets/${encodeURIComponent(arguments[0])}`, {
                      method: 'DELETE', credentials: 'same-origin'
                    }).then(() => done(true)).catch(() => done(false));
                    """,
                    dataset_id,
                )
            # A successful pipeline registers a transient Production model;
            # remove it through the same authenticated browser context so the
            # next clean traversal does not inherit a prior run's model row.
            driver.execute_async_script(
                """
                const done = arguments[arguments.length - 1];
                fetch(`/prediction-manager/api/models/${encodeURIComponent(arguments[0])}`, {
                  method: 'DELETE', credentials: 'same-origin'
                }).then(() => done(true)).catch(() => done(false));
                """,
                RUN_NAME,
            )
            cleanup_complete = True
        except Exception:
            cleanup_complete = False
        driver.quit()

    manifest = {
        "mode": MODE,
        "service": "Dataset to Kubeflow Pipeline",
        "dataset_name": DATASET_NAME,
        "run_name": RUN_NAME,
        "run_submitted": submitted,
        "cleanup_complete": cleanup_complete,
        "status": status,
        "evidence": evidence,
    }
    if status == "FAIL":
        manifest["error"] = failure
    (OUTPUT / f"{MODE}_dataset_pipeline_ui_probe_{STAMP}.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False))
    return 0 if status == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
