#!/usr/bin/env python3
"""Inspect visible control identifiers for the browser UI lifecycle test.

This is intentionally a read-only browser probe.  It gives the lifecycle
runner stable selectors without using API-side test shortcuts.
"""

from __future__ import annotations

import os
import time
import traceback
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.ui import WebDriverWait


BASE = os.environ.get("FEDIT_BROWSER_BASE", "http://127.0.0.1:18000")
ROUTES = (
    ("datasets", "데이터셋 카탈로그", "새 데이터셋"),
    ("data-collection", "데이터 수집", "트윈 데이터 준비"),
    ("automl", "AutoML", "새 AutoML Job"),
    ("models", "모델 관리", "새 모델 등록"),
    ("monitoring", "MLOps 모니터링", "MLOps 모니터링"),
)


def main() -> None:
    lines: list[str] = []
    output = Path(os.environ.get("FEDIT_PROBE_OUTPUT", "/tmp/fedit-ui-probe.txt"))
    options = Options()
    options.add_argument("--width=1440")
    options.add_argument("--height=900")
    options.page_load_strategy = "eager"
    binary = Path(os.environ["FEDIT_FIREFOX_BINARY"])
    options.binary_location = str(binary)
    driver = webdriver.Firefox(
        options=options,
        service=Service(executable_path=os.environ["FEDIT_GECKODRIVER"]),
    )
    try:
        main_url = f"{BASE}/fedit/predictor-creator-tool"
        requested = os.environ.get("FEDIT_PROBE_ROUTE", "").strip()
        routes = tuple(item for item in ROUTES if not requested or item[0] == requested)
        for route, card_title, expected_text in routes:
            driver.get(main_url)
            WebDriverWait(driver, 30).until(
                lambda current: current.execute_script(
                    "return document.body && document.body.innerText.trim().length > 0"
                )
            )
            card = WebDriverWait(driver, 30).until(
                lambda current: current.find_element(
                    By.XPATH, f"//p[normalize-space(text())='{card_title}']/.."
                )
            )
            card.click()
            frame = WebDriverWait(driver, 15).until(
                lambda current: current.find_element(By.CSS_SELECTOR, "iframe.predictor-tool__iframe")
            )
            driver.switch_to.frame(frame)
            WebDriverWait(driver, 30).until(
                lambda current: expected_text in current.find_element(By.TAG_NAME, "body").text
            )
            lines.append(driver.find_element(By.TAG_NAME, "body").text[:500])
            controls = driver.find_elements(By.CSS_SELECTOR, "button, input, select, textarea, summary")
            lines.append(f"\n===== {route} =====")
            for item in controls:
                if not item.is_displayed():
                    continue
                ident = item.get_attribute("id") or "-"
                label = (item.get_attribute("aria-label") or item.text or item.get_attribute("placeholder") or "").strip()
                lines.append(f"{item.tag_name}\tid={ident}\ttext={label[:120]}")
            driver.switch_to.default_content()
    except Exception:
        lines.append(f"current_url={driver.current_url}")
        lines.append(
            "iframes=" + repr(
                driver.execute_script(
                    "return [...document.querySelectorAll('iframe')].map(x => ({src:x.src, hidden:x.hidden, w:x.offsetWidth, h:x.offsetHeight}))"
                )
            )
        )
        lines.append(
            "main=" + driver.execute_script(
                "return document.querySelector('main, #root, #app')?.outerHTML?.slice(0, 800) || ''"
            )
        )
        lines.append(
            "html=" + driver.execute_script(
                "return document.documentElement.outerHTML.slice(-3000)"
            )
        )
        lines.append(driver.find_element(By.TAG_NAME, "body").text[:2000])
        lines.append(traceback.format_exc())
        raise
    finally:
        driver.quit()
        output.write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
