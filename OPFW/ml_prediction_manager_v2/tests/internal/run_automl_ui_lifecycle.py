#!/usr/bin/env python3
"""Visible-browser AutoML lifecycle using an in-cluster sample CSV."""

from __future__ import annotations

import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from selenium import webdriver
from selenium.common.exceptions import (
    NoAlertPresentException,
    StaleElementReferenceException,
    UnexpectedAlertPresentException,
)
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.ui import Select, WebDriverWait


OUTPUT = Path(sys.argv[1]).resolve()
BASE = os.environ.get("FEDIT_BROWSER_BASE", "http://127.0.0.1:18000")
MODE = os.environ.get("FEDIT_TEST_MODE", "GPU").upper()
STAMP = datetime.now(timezone.utc).astimezone().strftime("%Y%m%d-%H%M%S")
JOB_NAME = f"{MODE.lower()}-ui-lifecycle-automl-{STAMP}"
SERVING_NAME = f"{MODE.lower()}-ui-lifecycle-serve-{STAMP}"
# Production deployment sanitizes the model name and prefixes it with
# ``prod-``.  These generated names contain only safe characters and stay
# below the service's 50-character limit, so this mirrors the deployed ISVC.
ISVC_NAME = f"prod-{SERVING_NAME}"[:50]
DATASET_URL = "http://ui-lifecycle-fixture.kubeflow-user-example-com.svc.cluster.local:8080/data.csv"


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
    # A scale-to-zero KServe endpoint can take longer than Selenium's default
    # asynchronous-script limit while the server-side production-test helper
    # waits for its bounded cold-start retry.  This is test cleanup only; the
    # visible UI still uses its own explicit readiness assertion below.
    driver.set_script_timeout(120)
    # The AutoML list refreshes itself as a job transitions from QUEUED to
    # RUNNING.  Re-query the row while that DOM replacement is in flight.
    wait = WebDriverWait(driver, 35, ignored_exceptions=(StaleElementReferenceException,))
    evidence: list[dict[str, str]] = []
    job_submitted = False
    cleaned = False
    production_deployed = False
    submitted_job_id: str | None = None
    phase = "initialization"
    cleanup_error: str | None = None

    def drain_alerts() -> None:
        # UI delete/undeploy handlers emit a completion alert after the
        # confirmation alert.  Consume both before taking the next screenshot
        # or querying the refreshed model list.
        for _ in range(4):
            try:
                driver.switch_to.alert.accept()
            except NoAlertPresentException:
                return
            except UnexpectedAlertPresentException:
                continue

    def shot(step: str) -> None:
        drain_alerts()
        path = OUTPUT / f"{MODE}_AutoML_{step}_{STAMP}.png"
        driver.save_screenshot(str(path))
        evidence.append({"step": step, "screenshot": path.name})
        time.sleep(1)

    def click(selector: str) -> None:
        # AutoML replaces table rows while jobs are refreshed.  A successful
        # lookup can therefore still become stale before either JavaScript
        # click operation runs.  Retry the complete lookup/scroll/click unit,
        # not merely the lookup, for every dynamic control on this page.
        last_error: StaleElementReferenceException | None = None
        for _ in range(12):
            try:
                element = wait.until(lambda current: current.find_element(By.CSS_SELECTOR, selector))
                driver.execute_script("arguments[0].scrollIntoView({block:'center'});", element)
                driver.execute_script("arguments[0].click()", element)
                return
            except StaleElementReferenceException as error:
                last_error = error
                time.sleep(0.5)
        raise RuntimeError(f"AutoML control kept refreshing: {selector}") from last_error

    def open_tool_card(title: str, ready_selector: str) -> None:
        """Enter a FeDiT card from a known top-level browsing context.

        Every service page is loaded in the same-origin FeDiT iframe.  Keeping
        this transition in one helper prevents a completed KServe page from
        leaving Selenium in its old iframe when the next lifecycle phase opens
        Model Management or returns to AutoML for cleanup.
        """
        driver.switch_to.default_content()
        driver.get(f"{BASE}/fedit/predictor-creator-tool")
        card = wait.until(
            lambda current: current.find_element(
                By.XPATH, f"//p[normalize-space(text())='{title}']/.."
            )
        )
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", card)
        driver.execute_script("arguments[0].click()", card)
        frame = wait.until(
            lambda current: current.find_element(
                By.CSS_SELECTOR, "iframe.predictor-tool__iframe"
            )
        )
        driver.switch_to.frame(frame)
        wait.until(lambda current: current.find_element(By.CSS_SELECTOR, ready_selector))

    def visible_job_row(name: str = JOB_NAME) -> webdriver.remote.webelement.WebElement:
        return wait.until(
            lambda current: next(
                row
                for row in current.find_elements(By.CSS_SELECTOR, "#automl-tbody tr")
                if name in row.text
            )
        )

    def job_row(job_id: str) -> webdriver.remote.webelement.WebElement:
        return wait.until(
            lambda current: current.find_element(
                By.CSS_SELECTOR, f"#automl-tbody tr[data-id='{job_id}']"
            )
        )

    def current_job_status(job_id: str) -> str | None:
        """Read the just-submitted job's state without matching another row.

        The visible table automatically replaces its DOM as jobs move between
        active and completed tabs.  A completed job from an earlier test must
        not make this test mistake its own still-running job for SUCCEEDED.
        This fetch runs in the same visible browser session and the result is
        still confirmed in the completed-job UI below.
        """
        jobs = driver.execute_async_script(
            """
            const done = arguments[0];
            fetch('/prediction-manager/api/automl/jobs?view=all', {
                credentials: 'same-origin',
            })
              .then((response) => response.ok ? response.json() : Promise.reject(response.status))
              .then((items) => done(items))
              .catch((error) => done({error: String(error)}));
            """
        )
        if isinstance(jobs, dict) and jobs.get("error"):
            return None
        for item in jobs or []:
            if item.get("job_id") == job_id:
                return item.get("status")
        return None

    def delete_job(job_id: str) -> None:
        # The completed-jobs table refreshes asynchronously.  Locate the
        # control at click time instead of retaining a row element that may
        # have been replaced between the status check and cleanup.
        click(f"tr[data-id='{job_id}'] .automl-delete-btn")
        wait.until(lambda current: current.switch_to.alert).accept()
        deadline = time.monotonic() + 30
        while time.monotonic() < deadline:
            try:
                driver.switch_to.alert.accept()
                break
            except NoAlertPresentException:
                time.sleep(1)
        else:
            raise TimeoutError("AutoML deletion completion dialog did not appear")
        click(".automl-view-tab[data-view='done']")
        wait.until(
            lambda current: not current.find_elements(
                By.CSS_SELECTOR, f"#automl-tbody tr[data-id='{job_id}']"
            )
        )

    try:
        phase = "automl_function_select"
        open_tool_card("AutoML", "#automl-new-btn")
        shot("01_function_select")

        phase = "automl_configuration"
        click("#automl-new-btn")
        name = wait.until(lambda current: current.find_element(By.ID, "automl-name"))
        name.send_keys(JOB_NAME)
        Select(driver.find_element(By.ID, "automl-task")).select_by_value("regression")
        driver.find_element(By.ID, "automl-dataset").send_keys(DATASET_URL)
        driver.find_element(By.ID, "automl-target").send_keys("target")
        for selector, value in (
            ("#automl-trials", "1"),
            ("#automl-timeout", "1"),
            ("#automl-topn", "1"),
            ("#automl-cpu", "0.25"),
            ("#automl-mem", "0.5"),
            ("#automl-gpu", "0.25" if MODE == "GPU" else "0"),
        ):
            field = driver.find_element(By.CSS_SELECTOR, selector)
            field.clear()
            field.send_keys(value)
        for card_item in driver.find_elements(By.CSS_SELECTOR, "#automl-models .automl-model-card.selected"):
            if card_item.get_attribute("data-id") != "rf":
                card_item.click()
        shot("02_configuration")

        click("#automl-new-submit")
        wait.until(lambda current: JOB_NAME in current.find_element(By.ID, "automl-tbody").text)
        submitted_job_id = visible_job_row().get_attribute("data-id")
        if not submitted_job_id:
            raise RuntimeError("AutoML submission row has no job ID")
        job_submitted = True
        shot("03_running")

        phase = "automl_execution"
        deadline = time.monotonic() + 300
        while time.monotonic() < deadline:
            state = current_job_status(submitted_job_id)
            if state == "SUCCEEDED":
                break
            if state in {"FAILED", "STOPPED", "CANCELED", "DELETED"}:
                raise RuntimeError(f"AutoML terminal state: {state}")
            time.sleep(5)
        else:
            raise TimeoutError("AutoML did not finish within 300 seconds")

        phase = "automl_result"
        click(".automl-view-tab[data-view='done']")
        # Switching tabs repaints the table.  Re-find the log button through
        # the stale-element-aware click helper so a successful job is not
        # reported as a browser-test failure solely because of that repaint.
        click(f"tr[data-id='{submitted_job_id}'] .automl-log-btn")
        wait.until(lambda current: "SUCCEEDED" in current.find_element(By.ID, "automl-log-modal").text)
        shot("04_result")

        phase = "automl_one_click_serving"
        click(".automl-deploy-btn")
        deploy_prompt = wait.until(lambda current: current.switch_to.alert)
        deploy_prompt.send_keys(SERVING_NAME)
        deploy_prompt.accept()
        # A cold KServe installation can require the bounded server-side
        # helper/copy/readiness window.  A normal clean install warms that
        # runtime, but retain the full contract timeout here so this browser
        # test reports the actual UI result rather than an artificial client
        # timeout on a slow first image pull.
        deploy_deadline = time.monotonic() + 420
        while time.monotonic() < deploy_deadline:
            try:
                completion_alert = driver.switch_to.alert
                completion_text = completion_alert.text
                completion_alert.accept()
                if "서빙 완료" not in completion_text:
                    raise RuntimeError(f"KServe deployment was rejected: {completion_text}")
                production_deployed = True
                break
            except NoAlertPresentException:
                time.sleep(2)
        else:
            raise TimeoutError("KServe deployment completion dialog did not appear")
        phase = "kserve_ready"
        # The FeDiT shell keeps service pages in a same-origin iframe.  Check
        # the exact resource row in the live Prediction Manager KServe page,
        # rather than a truncated dashboard label or text inherited from the
        # parent shell.  This proves that the InferenceService made by the UI
        # is actually Ready before production inference is attempted.
        open_tool_card("KServe 엔드포인트", "table.endpoint-table")
        wait.until(
            lambda current: current.find_element(
                By.CSS_SELECTOR, f"tr[data-name='{ISVC_NAME}'] .state.ready"
            ).text
            == "Ready"
        )
        shot("05_kserve_endpoint_result")

        # The Model Registry page is the functional serving UI: it exposes
        # the deployed endpoint, performs a real inference, and stops the
        # InferenceService afterwards.  The public KServe route itself is a
        # dashboard entry point, so checking only that list would not prove
        # that the one-click serving result can process a request.
        phase = "model_management_serving_test"
        open_tool_card("모델 관리", "#model-list")
        model_item = wait.until(
            lambda current: current.find_element(By.CSS_SELECTOR, f".model-list-item[data-name='{SERVING_NAME}']")
        )
        model_item.click()
        wait.until(lambda current: current.find_element(By.ID, "prod-test-btn").is_enabled())
        driver.find_element(By.ID, "prod-test-btn").click()
        wait.until(lambda current: current.find_element(By.ID, "pt-submit"))
        shot("06_inference_configuration")
        driver.find_element(By.ID, "pt-submit").click()
        WebDriverWait(driver, 120, ignored_exceptions=(StaleElementReferenceException,)).until(
            lambda current: "OK · HTTP 200" in current.find_element(By.ID, "pt-output").text
        )
        shot("07_inference_result")
        click("#pt-close")
        wait.until(lambda current: not current.find_elements(By.ID, "pt-submit"))
        # Closing the modal triggers no model reload.  Give the visible model
        # card a bounded refresh window before looking for the lifecycle
        # control; otherwise a successful inference can be reported as a
        # missing undeploy button while the detail request is still repainting.
        undeploy_wait = WebDriverWait(
            driver, 90, ignored_exceptions=(StaleElementReferenceException,)
        )
        undeploy = undeploy_wait.until(
            lambda current: current.find_element(By.ID, "undeploy-btn")
        )
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", undeploy)
        driver.execute_script("arguments[0].click();", undeploy)
        undeploy_wait.until(lambda current: current.switch_to.alert).accept()
        # Stopping an endpoint emits a second asynchronous completion alert.
        # Consume it while waiting for the test button to become disabled;
        # otherwise Selenium raises UnexpectedAlertPresentException even
        # though the visible serving stop succeeded.
        def undeploy_finished(current):
            try:
                current.switch_to.alert.accept()
            except NoAlertPresentException:
                pass
            return not current.find_element(By.ID, "prod-test-btn").is_enabled()

        undeploy_wait.until(undeploy_finished)
        production_deployed = False
        # The lifecycle job creates a transient registered model.  Delete it
        # through the visible Model Management UI after stopping its serving
        # endpoint so registry, model storage, and test data do not drift.
        click("#delete-model-btn")
        wait.until(lambda current: current.switch_to.alert).accept()
        def model_deleted(current):
            drain_alerts()
            try:
                rows = current.find_elements(
                    By.CSS_SELECTOR, f".model-list-item[data-name='{SERVING_NAME}']"
                )
            except UnexpectedAlertPresentException:
                drain_alerts()
                return False
            return not rows

        wait.until(model_deleted)
        shot("08_serving_cleanup")

        phase = "automl_cleanup"
        open_tool_card("AutoML", "#automl-new-btn")
        click(".automl-view-tab[data-view='done']")

        delete_job(submitted_job_id)
        cleaned = True
        shot("09_job_cleanup")
        status = "PASS"
    except Exception as error:
        shot("FAIL")
        status = "FAIL"
        failure = f"{phase}: {type(error).__name__}: {error}"
    finally:
        # A failed assertion must not leave a job, PVC, or InferenceService to
        # affect the next independently collected service case.  This is
        # recovery evidence only; a test still remains FAIL until its normal
        # visible cleanup step has completed in the success path.
        if production_deployed:
            try:
                response = driver.execute_async_script(
                    """
                    const done = arguments[0];
                    const modelName = arguments[1];
                    fetch(`/prediction-manager/api/models/${encodeURIComponent(modelName)}`, {
                        method: 'DELETE', credentials: 'same-origin',
                    })
                      .then(async (result) => done({ok: result.ok, status: result.status, body: await result.text()}))
                      .catch((error) => done({ok: false, error: String(error)}));
                    """,
                    SERVING_NAME,
                )
                if not response.get("ok"):
                    raise RuntimeError(f"recovery model deletion failed: {response}")
                production_deployed = False
            except Exception as error:
                cleanup_error = f"production recovery: {type(error).__name__}: {error}"
        if submitted_job_id and not cleaned:
            try:
                open_tool_card("AutoML", "#automl-new-btn")
                click(".automl-view-tab[data-view='done']")
                delete_job(submitted_job_id)
                cleaned = True
            except Exception as error:
                cleanup_error = f"{type(error).__name__}: {error}"
        driver.quit()

    manifest = {
        "mode": MODE,
        "service": "AutoML / Ray / MLflow",
        "job_name": JOB_NAME,
        "serving_name": SERVING_NAME,
        "dataset_url": DATASET_URL,
        "status": status,
        "job_cleanup_complete": cleaned,
        "failure_phase": phase if status == "FAIL" else None,
        "evidence": evidence,
    }
    if status == "FAIL":
        manifest["error"] = failure
    if cleanup_error:
        manifest["recovery_cleanup_error"] = cleanup_error
    (OUTPUT / f"{MODE}_automl_ui_lifecycle_{STAMP}.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(manifest, ensure_ascii=False))
    return 0 if status == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
