"""
ConnectorLoader - 사용자 커넥터 파일들을 자동으로 스캔하고 로드합니다.
(DEBUG VERSION)
"""

import os
import importlib.util
import logging
from typing import Dict, Any, Optional, Callable

logger = logging.getLogger(__name__)


class ConnectorLoader:

    DEFAULT_USER_CONNECTORS_DIR = "plugins/user_connectors"

    @classmethod
    def find_connector_dir(cls) -> str:
        print("\n[SEOLZERO-CHECK][loader] find_connector_dir() called")

        # 1. AIRFLOW_HOME 기준
        airflow_home = os.environ.get("AIRFLOW_HOME")
        print(f"[SEOLZERO-CHECK][loader] AIRFLOW_HOME={airflow_home}")

        if airflow_home:
            path = os.path.join(airflow_home, cls.DEFAULT_USER_CONNECTORS_DIR)
            print(f"[SEOLZERO-CHECK][loader] check path={path}")
            if os.path.isdir(path):
                print(f"[SEOLZERO-CHECK][loader] using AIRFLOW_HOME path={path}")
                return path

        # 2. 현재 디렉토리 기준
        cwd = os.getcwd()
        path = os.path.join(cwd, cls.DEFAULT_USER_CONNECTORS_DIR)
        print(f"[SEOLZERO-CHECK][loader] check cwd path={path}")

        if os.path.isdir(path):
            print(f"[SEOLZERO-CHECK][loader] using cwd path={path}")
            return path

        # 3. script 기준
        script_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(script_dir)
        path = os.path.join(parent_dir, "user_connectors")

        print(f"[SEOLZERO-CHECK][loader] check script path={path}")

        if os.path.isdir(path):
            print(f"[SEOLZERO-CHECK][loader] using script-relative path={path}")
            return path

        raise RuntimeError("Cannot find user_connectors directory")

    @classmethod
    def scan_connectors(cls, connector_dir: Optional[str] = None) -> Dict[str, str]:
        print("\n[SEOLZERO-CHECK][loader] scan_connectors() called")

        if connector_dir is None:
            connector_dir = cls.find_connector_dir()

        print(f"[SEOLZERO-CHECK][loader] scanning dir={connector_dir}")

        if not os.path.isdir(connector_dir):
            print("[SEOLZERO-CHECK][loader] directory not found ❌")
            return {}

        connectors = {}

        for filename in os.listdir(connector_dir):
            print(f"[SEOLZERO-CHECK][loader] found file={filename}")

            if filename.endswith("_connector.py") and not filename.startswith("_"):
                connector_id = filename.replace("_connector.py", "")
                file_path = os.path.join(connector_dir, filename)

                connectors[connector_id] = file_path

                print(
                    f"[SEOLZERO-CHECK][loader] ✔ valid connector "
                    f"id={connector_id}, path={file_path}"
                )

        print(
            f"[SEOLZERO-CHECK][loader] scan result connectors={list(connectors.keys())}"
        )
        return connectors

    @classmethod
    def load_connector_config(cls, file_path: str) -> Optional[Dict[str, Any]]:
        print(f"\n[SEOLZERO-CHECK][loader] load_connector_config file={file_path}")

        try:
            spec = importlib.util.spec_from_file_location("connector_module", file_path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

            if not hasattr(module, "CONNECTOR_CONFIG"):
                print("[SEOLZERO-CHECK][loader] CONNECTOR_CONFIG 없음 ❌")
                return None

            config = getattr(module, "CONNECTOR_CONFIG")

            print(
                f"[SEOLZERO-CHECK][loader] CONNECTOR_CONFIG loaded "
                f"name={config.get('name')}, disabled={config.get('disabled')}"
            )

            return config

        except Exception as e:
            print(f"[SEOLZERO-CHECK][loader] config load ERROR ❌ {e}")
            return None

    @classmethod
    def load_transform_function(
        cls, file_path: str
    ) -> Optional[Callable[[Any, Dict[str, Any]], Any]]:

        print(f"\n[SEOLZERO-CHECK][loader] load_transform_function file={file_path}")

        try:
            spec = importlib.util.spec_from_file_location("connector_module", file_path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

            if not hasattr(module, "transform_source_data"):
                print("[SEOLZERO-CHECK][loader] transform_source_data 없음 ❌")
                return None

            func = getattr(module, "transform_source_data")

            print(
                f"[SEOLZERO-CHECK][loader] transform_source_data loaded func={func}"
            )

            return func

        except Exception as e:
            print(f"[SEOLZERO-CHECK][loader] transform load ERROR ❌ {e}")
            return None

    @classmethod
    def load_all(
        cls, connector_dir: Optional[str] = None
    ) -> Dict[str, Dict[str, Any]]:

        print("\n[SEOLZERO-CHECK][loader] load_all() called")

        connectors = cls.scan_connectors(connector_dir)

        loaded = {}

        for connector_id, file_path in connectors.items():
            print(
                f"\n[SEOLZERO-CHECK][loader] === processing connector_id={connector_id} ==="
            )

            config = cls.load_connector_config(file_path)
            transform_func = cls.load_transform_function(file_path)

            print(
                f"[SEOLZERO-CHECK][loader] result "
                f"config_ok={config is not None}, transform_ok={transform_func is not None}"
            )

            if config is not None and transform_func is not None:
                loaded[connector_id] = {
                    "config": config,
                    "transform_func": transform_func,
                    "file_path": file_path,
                }

                print(
                    f"[SEOLZERO-CHECK][loader] ✔ LOADED connector_id={connector_id}"
                )
            else:
                print(
                    f"[SEOLZERO-CHECK][loader] ❌ FAILED connector_id={connector_id}"
                )

        print(
            f"\n[SEOLZERO-CHECK][loader] FINAL loaded connectors={list(loaded.keys())}"
        )

        return loaded