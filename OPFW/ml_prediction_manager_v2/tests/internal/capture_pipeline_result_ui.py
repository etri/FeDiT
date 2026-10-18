#!/usr/bin/env python3
"""Capture the terminal Kubeflow Pipeline result through the FeDiT browser UI."""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.ui import WebDriverWait


run_id, output = sys.argv[1], Path(sys.argv[2]).resolve()
base = os.environ.get("FEDIT_BROWSER_BASE", "http://127.0.0.1:18000")
namespace = "kubeflow-user-example-com"
output.mkdir(parents=True, exist_ok=True)
options = Options()
options.binary_location = os.environ["FEDIT_FIREFOX_BINARY"]
options.add_argument("--width=1440")
options.add_argument("--height=900")
options.page_load_strategy = "eager"
driver = webdriver.Firefox(options=options, service=Service(os.environ["FEDIT_GECKODRIVER"]))
driver.set_window_size(1440, 900)
try:
    driver.get(f"{base}/pipeline/?ns={namespace}#/runs/details/{run_id}")
    wait = WebDriverWait(driver, 90)
    wait.until(lambda current: "kubeflow pipelines" in current.find_element(By.TAG_NAME, "body").text.lower())
    detail_tabs = driver.find_elements(By.XPATH, "//*[normalize-space()='Detail']")
    if detail_tabs:
        driver.execute_script("arguments[0].click();", detail_tabs[0])
        time.sleep(2)
    text = driver.find_element(By.TAG_NAME, "body").text
    if "Succeeded" not in text and "SUCCEEDED" not in text:
        raise RuntimeError("KFP browser detail does not show a success status")
    screenshot = output / "GPU_Dataset_Pipeline_06_terminal_result.png"
    driver.save_screenshot(str(screenshot))
    print(screenshot)
finally:
    driver.quit()
