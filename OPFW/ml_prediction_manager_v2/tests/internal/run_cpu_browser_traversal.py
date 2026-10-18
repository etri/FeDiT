#!/usr/bin/env python3
"""Recordable Firefox UI traversal for the CPU verification environment.

The functional verifier owns data creation/deletion because several services
expose no equivalent browser workflow.  This program controls a visible
Firefox session, visits every public UI route, saves one screenshot per route,
and writes a machine-readable result manifest for the accompanying recording.
"""

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
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.ui import WebDriverWait


OUTPUT = Path(sys.argv[1]).resolve()
BASE = os.environ.get("FEDIT_BROWSER_BASE", "http://127.0.0.1")
MODE = os.environ.get("FEDIT_TEST_MODE", "CPU").upper()
STAMP = datetime.now(timezone.utc).astimezone().strftime("%Y%m%d-%H%M%S")


def at_port(port: int, path: str) -> str:
    """Build a route whether the configured base includes a port or not.

    The lifecycle wrapper uses the FeDiT entry point (``:18000``), while this
    route-level traversal also opens the separately published service ports.
    Replace an existing base port instead of accidentally producing an invalid
    URL such as ``http://127.0.0.1:18000:15000``.
    """
    parsed = urlsplit(BASE)
    if not parsed.scheme or not parsed.hostname:
        raise ValueError(f"FEDIT_BROWSER_BASE is not a valid HTTP URL: {BASE}")
    host = parsed.hostname
    if ":" in host and not host.startswith("["):
        host = f"[{host}]"
    return f"{parsed.scheme}://{host}:{port}{path}"


PAGES = [
    ("01_fedit", at_port(18000, "/fedit/predictor-creator-tool")),
    ("02_prediction_manager", at_port(18000, "/prediction-manager/docs")),
    ("03_kubeflow_volumes", at_port(18000, "/volumes/")),
    ("04_tensorboards", at_port(18000, "/tensorboards/")),
    ("05_kserve_endpoints", at_port(18000, "/kserve-endpoints/")),
    ("06_kubeflow_pipelines", at_port(18000, "/pipeline/")),
    ("07_mlflow", at_port(15000, "/")),
    ("08_nifi", at_port(15001, "/nifi/")),
    ("09_ray_dashboard", at_port(15002, "/")),
    ("10_label_studio_sso", at_port(18000, "/label-studio/")),
    ("11_label_studio_raw_port", at_port(15003, "/")),
    ("12_prometheus", at_port(19090, "/graph")),
]


def is_expected_page(driver: webdriver.Firefox, expected_url: str) -> bool:
    """Reject a timeout recovery that is still showing the previous route."""
    expected = urlsplit(expected_url)
    actual = urlsplit(driver.current_url)
    return (
        actual.scheme == expected.scheme
        and actual.netloc == expected.netloc
        and actual.path.startswith(expected.path)
    )


def is_transient_network_reset(driver: webdriver.Firefox, error: Exception) -> bool:
    """Identify a one-off browser reset while a service port-forward recovers."""
    detail = f"{error}\n{driver.current_url}".lower()
    return any(
        marker in detail
        for marker in ("netreset", "connection reset", "ns_error_net_reset")
    )


def main() -> int:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    options = Options()
    options.add_argument("--width=1440")
    options.add_argument("--height=900")
    # Ubuntu's /usr/bin/firefox is a Snap launcher.  Geckodriver validates the
    # target as an ELF Firefox binary, so prefer an explicitly supplied,
    # portable Firefox and otherwise use the packaged Snap binary.
    browser_binary = Path(
        os.environ.get(
            "FEDIT_FIREFOX_BINARY",
            "/snap/firefox/current/usr/lib/firefox/firefox",
        )
    )
    if browser_binary.is_file() and os.access(browser_binary, os.X_OK):
        options.binary_location = str(browser_binary)
    # NiFi and dashboard pages keep event-stream/telemetry connections open.
    # Waiting for the browser's full `complete` state can therefore block a
    # valid, visible UI traversal for minutes.  Eager loading proves that the
    # DOM is rendered while preserving a bounded per-route navigation.
    options.page_load_strategy = "eager"
    options.set_preference("browser.aboutConfig.showWarning", False)
    options.set_preference("browser.shell.checkDefaultBrowser", False)
    service = Service(executable_path=os.environ["FEDIT_GECKODRIVER"])
    driver = webdriver.Firefox(options=options, service=service)
    driver.set_window_size(1440, 900)
    driver.set_page_load_timeout(35)
    results: list[dict[str, str]] = []
    try:
        for label, url in PAGES:
            item: dict[str, str] = {"name": label, "url": url}
            for attempt in range(3):
                try:
                    driver.get(url)
                    WebDriverWait(driver, 25).until(
                        lambda current: current.execute_script(
                            "return document.readyState"
                        ) in ("interactive", "complete")
                    )
                    if not is_expected_page(driver, url):
                        raise WebDriverException(
                            f"expected {url}, browser remained at {driver.current_url}"
                        )
                    WebDriverWait(driver, 8).until(
                        lambda current: current.execute_script(
                            "return document.body && document.body.innerText.trim().length > 0"
                        )
                    )
                    # Keep each UI visibly on screen long enough for the recording.
                    time.sleep(3)
                    item["title"] = driver.title
                    item["status"] = "PASS"
                except TimeoutException as error:
                    # The UI may already be rendered while a stream, websocket, or
                    # telemetry request keeps Firefox's navigation unsettled.
                    # Stop only that outstanding navigation and require visible
                    # document content before accepting the browser evidence.
                    try:
                        driver.execute_script("window.stop()")
                        WebDriverWait(driver, 8).until(
                            lambda current: current.execute_script(
                                "return document.body && document.body.innerText.trim().length > 0"
                            )
                        )
                        if not is_expected_page(driver, url):
                            raise WebDriverException(
                                f"expected {url}, browser remained at {driver.current_url}"
                            )
                        item["title"] = driver.title
                        item["status"] = "PASS"
                        item["note"] = "long-lived page connection stopped after visible DOM rendered"
                    except WebDriverException as recovery_error:
                        item["status"] = "FAIL"
                        item["error"] = f"{error}; recovery: {recovery_error}"
                except WebDriverException as error:
                    if attempt < 2 and is_transient_network_reset(driver, error):
                        item["note"] = (
                            f"transient service connection reset; retry {attempt + 1}/2"
                        )
                        time.sleep(2 * (attempt + 1))
                        continue
                    item["status"] = "FAIL"
                    item["error"] = str(error)
                break
            screenshot = OUTPUT / f"{MODE}_video_{label}_{STAMP}_{item['status']}.png"
            driver.save_screenshot(str(screenshot))
            item["screenshot"] = screenshot.name
            results.append(item)
    finally:
        driver.quit()
    manifest = {
        "mode": MODE,
        "recorded_at": datetime.now(timezone.utc).astimezone().isoformat(),
        "pages": results,
    }
    (OUTPUT / f"{MODE}_browser_traversal_{STAMP}.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    failed = [item for item in results if item["status"] != "PASS"]
    print(json.dumps(manifest, ensure_ascii=False))
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
