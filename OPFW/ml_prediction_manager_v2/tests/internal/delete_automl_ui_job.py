#!/usr/bin/env python3
"""Delete one completed AutoML job through the visible AutoML UI."""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path

from selenium import webdriver
from selenium.common.exceptions import NoAlertPresentException, StaleElementReferenceException
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.ui import WebDriverWait


NAME = sys.argv[1]
BASE = os.environ.get("FEDIT_BROWSER_BASE", "http://127.0.0.1:18000")


def main() -> int:
    options = Options()
    options.binary_location = str(Path(os.environ["FEDIT_FIREFOX_BINARY"]))
    options.add_argument("--width=1440")
    options.add_argument("--height=900")
    driver = webdriver.Firefox(options=options, service=Service(executable_path=os.environ["FEDIT_GECKODRIVER"]))
    wait = WebDriverWait(driver, 35, ignored_exceptions=(StaleElementReferenceException,))
    try:
        driver.get(f"{BASE}/fedit/predictor-creator-tool")
        wait.until(lambda current: current.find_element(By.XPATH, "//p[normalize-space(text())='AutoML']/..")) .click()
        frame = wait.until(lambda current: current.find_element(By.CSS_SELECTOR, "iframe.predictor-tool__iframe"))
        driver.switch_to.frame(frame)
        wait.until(lambda current: current.find_element(By.ID, "automl-new-btn"))
        driver.execute_script("arguments[0].click()", driver.find_element(By.CSS_SELECTOR, ".automl-view-tab[data-view='done']"))
        def matching_row(current: webdriver.Firefox):
            for candidate in current.find_elements(By.CSS_SELECTOR, "#automl-tbody tr"):
                if NAME in candidate.text:
                    return candidate
            return False
        row = wait.until(matching_row)
        row.find_element(By.CSS_SELECTOR, ".automl-delete-btn").click()
        wait.until(lambda current: current.switch_to.alert).accept()
        deadline = time.monotonic() + 30
        while time.monotonic() < deadline:
            try:
                driver.switch_to.alert.accept()
                break
            except NoAlertPresentException:
                time.sleep(1)
        else:
            raise TimeoutError("completion dialog missing")
        driver.execute_script("arguments[0].click()", driver.find_element(By.CSS_SELECTOR, ".automl-view-tab[data-view='done']"))
        wait.until(lambda current: NAME not in current.find_element(By.ID, "automl-tbody").text)
        print("ui_cleanup=PASS")
        return 0
    finally:
        driver.quit()


if __name__ == "__main__":
    raise SystemExit(main())
