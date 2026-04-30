"""
run_registered_connectors.py

Airflow DAG: 등록된 커넥터들을 자동으로 스캔하고 실행합니다.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List
import logging

from airflow import DAG
from airflow.operators.python import PythonOperator

logger = logging.getLogger(__name__)

default_args = {
    "owner": "connector_system",
    "depends_on_past": False,
    "start_date": datetime(2026, 3, 9),
    "email": [],
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=1),
}

dag = DAG(
    "run_registered_connectors",
    default_args=default_args,
    description="자동 폴링 커넥터 런타임",
    schedule_interval="* * * * *",
    catchup=False,
    tags=["connector", "polling", "runtime"],
    max_active_runs=1,
)


def load_and_run_connectors(**context: Any) -> Dict[str, Any]:
    """
    커넥터들을 로드하고 실행하는 메인 태스크
    """
    logger.info("Starting run_registered_connectors")

    try:
        from connector_runtime.loader import ConnectorLoader
        from connector_runtime.runner import ConnectorRunner

        loader = ConnectorLoader()
        loaded_connectors = loader.load_all()

        if not loaded_connectors:
            logger.info("No connectors loaded")
            return {
                "status": "success",
                "total_connectors": 0,
                "executed_connectors": 0,
                "skipped_connectors": 0,
                "failed_connectors": 0,
            }

        results: List[Dict[str, Any]] = []
        executed_count = 0
        skipped_count = 0
        failed_count = 0

        for connector_id, connector_info in loaded_connectors.items():
            config = connector_info["config"]
            transform_func = connector_info["transform_func"]

            if config.get("disabled", False):
                logger.info(f"[{connector_id}] Skipped because disabled=True")
                skipped_count += 1
                continue

            try:
                runner = ConnectorRunner(connector_id, config, transform_func)
                result = runner.run(**context)

                results.append(result)

                if result["status"] == "success":
                    executed_count += 1
                elif result["status"] == "skipped":
                    skipped_count += 1
                    logger.info(
                        f"[{connector_id}] Skipped ({result['details'].get('reason', 'unknown')})"
                    )
                else:
                    failed_count += 1
                    logger.warning(
                        f"[{connector_id}] Failed ({result['details'].get('reason', 'unknown')})"
                    )

            except Exception as e:
                failed_count += 1
                logger.error(f"[{connector_id}] Exception: {e}", exc_info=True)
                results.append({
                    "connector_id": connector_id,
                    "status": "failed",
                    "timestamp": datetime.utcnow().isoformat(),
                    "details": {"error": str(e)},
                })

        logger.info(
            "Connector run summary - total=%s, executed=%s, skipped=%s, failed=%s",
            len(loaded_connectors),
            executed_count,
            skipped_count,
            failed_count,
        )

        return {
            "status": "success",
            "total_connectors": len(loaded_connectors),
            "executed_connectors": executed_count,
            "skipped_connectors": skipped_count,
            "failed_connectors": failed_count,
            "results": results,
        }

    except ImportError as e:
        logger.error(f"Failed to import connector runtime: {e}", exc_info=True)
        return {
            "status": "failed",
            "error": f"Import error: {e}",
        }

    except Exception as e:
        logger.error(f"Unexpected error in connector runtime: {e}", exc_info=True)
        return {
            "status": "failed",
            "error": str(e),
        }


run_connectors_task = PythonOperator(
    task_id="run_registered_connectors",
    python_callable=load_and_run_connectors,
    provide_context=True,
    dag=dag,
    pool="default_pool",
)

run_connectors_task