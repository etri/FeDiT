#!/usr/bin/env python3
"""Visible-browser data collection and NiFi lifecycle verification."""

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
    StaleElementReferenceException,
)
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.ui import Select, WebDriverWait


OUTPUT = Path(sys.argv[1]).resolve()
BASE = os.environ.get("FEDIT_BROWSER_BASE", "http://127.0.0.1:18000")
MODE = os.environ.get("FEDIT_TEST_MODE", "GPU").upper()
STAMP = datetime.now(timezone.utc).astimezone().strftime("%Y%m%d-%H%M%S")
TWIN_NAME = f"{MODE.lower()}-ui-lifecycle-twin-{STAMP}"
CONNECTOR_NAME = f"{MODE.lower()}-ui-lifecycle-rest-{STAMP}"
CLUSTER_URL = "http://ui-lifecycle-fixture.kubeflow-user-example-com.svc.cluster.local"


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
    wait = WebDriverWait(driver, 35, ignored_exceptions=(StaleElementReferenceException,))
    evidence: list[dict[str, str]] = []
    connector_created = False
    twin_created = False
    stopped = False
    record_deleted = False
    cleaned = False

    def shot(step: str) -> None:
        path = OUTPUT / f"{MODE}_Data_Collection_{step}_{STAMP}.png"
        driver.save_screenshot(str(path))
        evidence.append({"step": step, "screenshot": path.name})
        time.sleep(1)

    def click(selector: str) -> None:
        # Twin/connector lists are re-rendered after each state change.  Retry
        # the whole find-scroll-click unit instead of retaining an element
        # reference that can become stale between lookup and interaction.
        last_error: StaleElementReferenceException | None = None
        for _ in range(12):
            try:
                element = wait.until(lambda current: current.find_element(By.CSS_SELECTOR, selector))
                driver.execute_script("arguments[0].scrollIntoView({block:'center'});", element)
                try:
                    element.click()
                except (ElementClickInterceptedException, ElementNotInteractableException):
                    driver.execute_script("arguments[0].click()", element)
                return
            except StaleElementReferenceException as error:
                last_error = error
                time.sleep(0.5)
        raise RuntimeError(f"Data collection control kept refreshing: {selector}") from last_error

    def click_named(selector: str, name: str) -> None:
        last_error: StaleElementReferenceException | None = None
        for _ in range(12):
            try:
                element = wait.until(
                    lambda current: next(
                        item for item in current.find_elements(By.CSS_SELECTOR, selector)
                        if name in item.text
                    )
                )
                driver.execute_script("arguments[0].scrollIntoView({block:'center'});", element)
                driver.execute_script("arguments[0].click()", element)
                return
            except StaleElementReferenceException as error:
                last_error = error
                time.sleep(0.5)
        raise RuntimeError(f"Data collection item kept refreshing: {name}") from last_error

    def accept_confirm() -> None:
        wait.until(lambda current: current.switch_to.alert).accept()

    def clean_prior() -> None:
        prefix = f"{MODE.lower()}-ui-lifecycle-"
        for editor in driver.find_elements(By.CSS_SELECTOR, "[data-dc-connector-edit]"):
            if prefix not in editor.text:
                continue
            editor.click()
            click("#dc-delete-connector")
            accept_confirm()
            wait.until(lambda current: prefix not in current.find_element(By.ID, "dc-connectors").text)
            break
        for twin in driver.find_elements(By.CSS_SELECTOR, ".dc-twin-list-item"):
            if prefix not in twin.text:
                continue
            twin.click()
            click("#dc-selected-twin-delete")
            accept_confirm()
            wait.until(lambda current: prefix not in current.find_element(By.ID, "dc-twins").text)
            break

    try:
        driver.get(f"{BASE}/fedit/predictor-creator-tool")
        card = wait.until(
            lambda current: current.find_element(By.XPATH, "//p[normalize-space(text())='데이터 수집']/..")
        )
        card.click()
        frame = wait.until(lambda current: current.find_element(By.CSS_SELECTOR, "iframe.predictor-tool__iframe"))
        driver.switch_to.frame(frame)
        wait.until(lambda current: current.find_element(By.ID, "dc-refresh"))
        clean_prior()
        shot("01_function_select")

        click("details.dc-manage-details > summary")
        driver.find_element(By.ID, "dc-new-twin-name").send_keys(TWIN_NAME)
        driver.find_element(By.ID, "dc-new-twin-desc").send_keys("browser UI lifecycle")
        shot("02_twin_configuration")
        click("#dc-create-twin")
        wait.until(lambda current: TWIN_NAME in current.find_element(By.ID, "dc-twins").text)
        twin_created = True
        click_named(".dc-twin-list-item", TWIN_NAME)
        click("#dc-connect-source")
        wait.until(lambda current: current.find_element(By.ID, "dc-connector-form"))
        driver.find_element(By.ID, "dc-c-name").clear()
        driver.find_element(By.ID, "dc-c-name").send_keys(CONNECTOR_NAME)
        Select(driver.find_element(By.ID, "dc-c-type")).select_by_value("rest")
        driver.find_element(By.ID, "dc-c-endpoint").clear()
        driver.find_element(By.ID, "dc-c-endpoint").send_keys(CLUSTER_URL)
        driver.find_element(By.ID, "dc-c-port").clear()
        driver.find_element(By.ID, "dc-c-port").send_keys("8080")
        driver.find_element(By.ID, "dc-c-topic").clear()
        driver.find_element(By.ID, "dc-c-topic").send_keys("/data.json")
        driver.find_element(By.ID, "dc-c-method").clear()
        driver.find_element(By.ID, "dc-c-method").send_keys("GET")
        shot("03_connector_configuration")
        click("#dc-connector-form button[type='submit']")
        wait.until(lambda current: CONNECTOR_NAME in current.find_element(By.ID, "dc-twins").text)
        connector_created = True

        click("#dc-preview-source")
        attrs = wait.until(lambda current: current.find_elements(By.CSS_SELECTOR, ".dc-attribute-row"))
        for attr in attrs[:3]:
            attr.click()
        shot("04_execution_configuration")

        click("#dc-selected-collect")
        wait.until(lambda current: "실시간 수집 중지" in current.find_element(By.ID, "dc-twins").text)
        shot("05_running")
        wait.until(lambda current: current.find_elements(By.CSS_SELECTOR, ".dc-record-row"))
        time.sleep(3)
        shot("06_result")

        click("#dc-selected-collect")
        wait.until(lambda current: "실시간 수집 시작" in current.find_element(By.ID, "dc-twins").text)
        stopped = True
        shot("07_stopped")

        # 수집 결과는 상세 확인뿐 아니라 UI에서 개별 삭제까지 가능해야 한다.
        initial_record_id = driver.find_element(By.CSS_SELECTOR, "#dc-records .dc-delete-record").get_attribute("data-record-id")
        click(f'#dc-records .dc-delete-record[data-record-id="{initial_record_id}"]')
        wait.until(lambda current: current.find_element(By.ID, "dc-confirm-record-delete"))
        shot("08_record_delete_confirm")
        click("#dc-confirm-record-delete")
        wait.until(lambda current: not current.find_elements(By.CSS_SELECTOR, f'.dc-record-row[data-record-id="{initial_record_id}"]'))
        record_deleted = True
        shot("09_record_cleanup")

        click("[data-dc-nifi-apply]")
        wait.until(lambda current: current.find_element(By.ID, "dc-modal"))
        shot("10_nifi_apply_result")
        click("#dc-modal-close")

        click("[data-dc-connector-edit]")
        click("#dc-delete-connector")
        accept_confirm()
        wait.until(lambda current: CONNECTOR_NAME not in current.find_element(By.ID, "dc-connectors").text)
        connector_created = False

        click("details.dc-manage-details > summary")
        click("#dc-selected-twin-delete")
        accept_confirm()
        wait.until(lambda current: TWIN_NAME not in current.find_element(By.ID, "dc-twins").text)
        twin_created = False
        cleaned = True
        shot("11_cleanup")
        status = "PASS"
    except Exception as error:
        shot("FAIL")
        status = "FAIL"
        failure = f"{type(error).__name__}: {error}"
    finally:
        if connector_created:
            try:
                click("[data-dc-connector-edit]")
                click("#dc-delete-connector")
                accept_confirm()
                connector_created = False
            except Exception:
                pass
        if twin_created:
            try:
                click("#dc-selected-twin-delete")
                accept_confirm()
                twin_created = False
            except Exception:
                pass
        driver.quit()

    manifest = {
        "mode": MODE,
        "service": "Data collection and NiFi flow",
        "twin_name": TWIN_NAME,
        "connector_name": CONNECTOR_NAME,
        "status": status,
        "realtime_collection_stopped": stopped,
        "record_cleanup_complete": record_deleted,
        "connector_and_twin_cleanup_complete": cleaned,
        "evidence": evidence,
    }
    if status == "FAIL":
        manifest["error"] = failure
    (OUTPUT / f"{MODE}_data_collection_ui_lifecycle_{STAMP}.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(manifest, ensure_ascii=False))
    return 0 if status == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
