"""
ConnectorRunner - 커넥터의 폴링, 데이터 변환, 전송 로직을 처리합니다.
"""

import time
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple
from urllib.parse import parse_qs, urlparse, urlencode

import requests
from requests.auth import HTTPBasicAuth
from airflow.models import Variable

logger = logging.getLogger(__name__)

# 민감한 키워드 (로그에서 redact될 문자열)
SENSITIVE_KEYWORDS = {
    "password",
    "token",
    "secret",
    "key",
    "serviceKey",
    "api_key",
    "apikey",
    "bearer",
    "authorization",
    "auth",
    "credential",
}


class SecretRedactor:
    """민감한 정보를 로그에서 제거하는 클래스"""

    @staticmethod
    def redact_url(url: str) -> str:
        """URL에서 민감한 쿼리 파라미터를 숨깁니다."""
        try:
            parsed = urlparse(url)
            if not parsed.query:
                return url

            params = parse_qs(parsed.query, keep_blank_values=True)
            redacted_params = {}

            for key, values in params.items():
                if any(keyword in key.lower() for keyword in SENSITIVE_KEYWORDS):
                    redacted_params[key] = ["***REDACTED***"]
                else:
                    redacted_params[key] = values

            redacted_query = urlencode(redacted_params, doseq=True)
            redacted_url = (
                f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
                f"?{redacted_query}"
                if redacted_query
                else f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
            )
            return redacted_url
        except Exception as e:
            logger.error(f"Error redacting URL: {e}")
            return url

    @staticmethod
    def redact_headers(headers: Dict[str, str]) -> Dict[str, str]:
        """헤더에서 민감한 정보를 숨깁니다."""
        redacted = {}
        for key, value in headers.items():
            if any(keyword in key.lower() for keyword in SENSITIVE_KEYWORDS):
                redacted[key] = "***REDACTED***"
            else:
                redacted[key] = value
        return redacted

    @staticmethod
    def redact_dict(data: Dict[str, Any]) -> Dict[str, Any]:
        """딕셔너리 데이터에서 민감한 정보를 숨깁니다."""
        redacted = {}
        for key, value in data.items():
            if any(keyword in key.lower() for keyword in SENSITIVE_KEYWORDS):
                redacted[key] = "***REDACTED***"
            else:
                redacted[key] = value
        return redacted


class RateLimiter:
    """Rate limiting을 관리하는 클래스"""

    def __init__(self, max_calls_per_minute: int = 60) -> None:
        self.max_calls_per_minute = max_calls_per_minute
        self.call_times: list[float] = []

    def wait_if_needed(self) -> None:
        """필요시 대기"""
        now = time.time()
        self.call_times = [t for t in self.call_times if now - t < 60]

        if len(self.call_times) >= self.max_calls_per_minute:
            wait_time = 60 - (now - self.call_times[0])
            if wait_time > 0:
                logger.warning(
                    f"Rate limit reached. Waiting {wait_time:.2f} seconds"
                )
                time.sleep(wait_time)
                now = time.time()

        self.call_times.append(now)


class AuthHandler:
    """인증 처리 클래스"""

    @staticmethod
    def extract_query_secrets(url: str) -> Tuple[str, Dict[str, str]]:
        """URL에서 쿼리 파라미터로 전달된 secretkey들을 추출합니다."""
        parsed = urlparse(url)
        params = parse_qs(parsed.query, keep_blank_values=True)

        secrets = {}
        clean_params = {}

        for key, values in params.items():
            if any(keyword in key.lower() for keyword in SENSITIVE_KEYWORDS):
                if values:
                    secrets[key] = values[0]
            else:
                clean_params[key] = values

        if clean_params:
            clean_query = urlencode(clean_params, doseq=True)
            clean_url = (
                f"{parsed.scheme}://{parsed.netloc}{parsed.path}?{clean_query}"
            )
        else:
            clean_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"

        return clean_url, secrets

    @staticmethod
    def apply_auth(
        headers: Dict[str, str],
        url: str,
        auth_config: Optional[Dict[str, Any]],
        inline_secrets: Dict[str, str],
    ) -> Tuple[Dict[str, str], str, Optional[Any]]:
        """인증 정보를 적용합니다."""
        if not auth_config:
            return headers, url, None

        auth_type = auth_config.get("type", "none").lower()

        if auth_type == "none":
            return headers, url, None

        elif auth_type == "query":
            key_name = auth_config.get("key_name", "key")
            key_value = auth_config.get("key_value")

            if key_name in inline_secrets:
                key_value = inline_secrets[key_name]

            if key_value:
                separator = "&" if "?" in url else "?"
                from urllib.parse import quote_plus
                encoded_value = quote_plus(key_value)
                url = f"{url}{separator}{key_name}={encoded_value}"
                logger.debug(f"Query auth applied: {key_name}=*** (encoded)")

            return headers, url, None

        elif auth_type == "header":
            header_name = auth_config.get("header_name", "Authorization")
            header_value = auth_config.get("header_value")

            if header_value:
                headers[header_name] = header_value
                logger.debug(f"Header auth applied: {header_name}=***")

            return headers, url, None

        elif auth_type == "bearer":
            token = auth_config.get("token")
            if token:
                headers["Authorization"] = f"Bearer {token}"
                logger.debug("Bearer auth applied")
            return headers, url, None

        elif auth_type == "basic":
            username = auth_config.get("username")
            password = auth_config.get("password")
            auth_obj = None

            if username and password:
                auth_obj = HTTPBasicAuth(username, password)
                logger.debug("Basic auth configured")

            return headers, url, auth_obj

        else:
            logger.warning(f"Unknown auth type: {auth_type}")
            return headers, url, None


class ConnectorRunner:
    """
    커넥터 런타임
    - 폴링 스케줄 관리
    - HTTP 요청 (retry, timeout, rate limit)
    - 데이터 변환
    - FDiT 플랫폼으로 전송
    """

    def __init__(
        self,
        connector_id: str,
        config: Dict[str, Any],
        transform_func: Any,
    ) -> None:
        self.connector_id = connector_id
        self.config = config
        self.transform_func = transform_func

        self.source = config.get("source", {})
        self.fdt_target = config.get("fdt_target", {})
        self.behavior = config.get("behavior", {})

        max_calls = self.behavior.get("max_calls_per_minute", 60)
        self.rate_limiter = RateLimiter(max_calls)

        self.last_fetch_status: Optional[int] = None

        logger.info(
            f"[SEOLZERO-CHECK][runner] initialized connector_id={self.connector_id}, "
            f"name={self.config.get('name')}, disabled={self.config.get('disabled')}"
        )

    def _is_manual_trigger(self, **context: Any) -> bool:
        """수동 실행 여부 확인"""
        dag_run = context.get("dag_run")
        if dag_run is None:
            return False

        external_trigger = getattr(dag_run, "external_trigger", False)
        run_type = getattr(dag_run, "run_type", None)

        logger.info(
            f"[SEOLZERO-CHECK][runner] dag_run external_trigger={external_trigger}, run_type={run_type}"
        )
        return bool(external_trigger)

    def _is_due(self) -> bool:
        """다음 실행 시간인지 확인합니다."""
        poll_interval_minutes = self.behavior.get("poll_interval_minutes", 1)

        var_key = f"connector_{self.connector_id}_next_run_at"
        last_run_time_str = Variable.get(var_key, default_var=None)

        logger.info(
            f"[SEOLZERO-CHECK][runner] _is_due check connector_id={self.connector_id}, "
            f"var_key={var_key}, stored_next_run_at={last_run_time_str}"
        )

        if last_run_time_str is None:
            logger.info(
                f"[{self.connector_id}] First run. "
                f"Scheduling next run in {poll_interval_minutes} minutes"
            )
            self._update_next_run_time(poll_interval_minutes)
            return True

        try:
            last_run_time = datetime.fromisoformat(last_run_time_str)
            now = datetime.utcnow()

            logger.info(
                f"[SEOLZERO-CHECK][runner] now={now.isoformat()}, next_run_at={last_run_time.isoformat()}"
            )

            if now >= last_run_time:
                logger.info(f"[{self.connector_id}] Due for polling")
                self._update_next_run_time(poll_interval_minutes)
                return True
            else:
                time_left = (last_run_time - now).total_seconds()
                logger.info(
                    f"[SEOLZERO-CHECK][runner] not due yet, next run in {time_left:.0f} seconds"
                )
                return False

        except Exception as e:
            logger.error(f"[{self.connector_id}] Error checking due status: {e}")
            return False

    def _update_next_run_time(self, poll_interval_minutes: int) -> None:
        """다음 실행 시간을 업데이트합니다."""
        var_key = f"connector_{self.connector_id}_next_run_at"
        next_run_time = datetime.utcnow() + timedelta(minutes=poll_interval_minutes)
        Variable.set(var_key, next_run_time.isoformat())
        logger.info(
            f"[SEOLZERO-CHECK][runner] next_run_at updated: {var_key}={next_run_time.isoformat()}"
        )

    def _fetch_data(self) -> Optional[Dict[str, Any]]:
        """소스에서 데이터를 가져옵니다."""
        base_url = self.source.get("url")
        if not base_url:
            logger.error(f"[{self.connector_id}] Source URL not configured")
            return None

        headers = self.source.get("headers", {}).copy()
        auth_config = self.source.get("auth") or {}
        auth_type = auth_config.get("type", "none").lower()

        # auth.type == "none" 인 경우에는 source.url 원본을 그대로 사용한다.
        # (serviceKey 같은 query 파라미터를 실제 요청에서 제거하면 안 됨)
        if auth_type == "none":
            final_url = base_url
            auth_obj = None
        else:
            clean_url, inline_secrets = AuthHandler.extract_query_secrets(base_url)
            headers, final_url, auth_obj = AuthHandler.apply_auth(
                headers, clean_url, auth_config, inline_secrets
            )
 
        logger.info(
            f"[SEOLZERO-CHECK][runner] fetch start url={SecretRedactor.redact_url(final_url)}"
         )
        logger.info(
            f"[SEOLZERO-CHECK][runner] fetch headers={SecretRedactor.redact_headers(headers)}"
        )

        self.rate_limiter.wait_if_needed()

        max_retries = self.behavior.get("max_retries", 3)
        timeout = self.behavior.get("timeout_seconds", 30)
        backoff_factor = self.behavior.get("backoff_factor", 2)

        for attempt in range(max_retries):
            try:
                response = requests.get(
                    final_url,
                    headers=headers,
                    auth=auth_obj,
                    timeout=timeout,
                )

                self.last_fetch_status = response.status_code
                logger.info(
                    f"[SEOLZERO-CHECK][runner] fetch response status={response.status_code}"
                )

                try:
                    logger.info(
                        f"[SEOLZERO-CHECK][runner] fetch response preview={response.text[:500]}"
                    )
                except Exception:
                    pass

                response.raise_for_status()

                logger.info(
                    f"[{self.connector_id}] Data fetched successfully. "
                    f"Status: {response.status_code}"
                )
                return response.json()

            except requests.exceptions.Timeout:
                logger.warning(
                    f"[{self.connector_id}] Timeout on attempt {attempt + 1}/{max_retries}"
                )
            except requests.exceptions.HTTPError as e:
                resp = getattr(e, "response", None)
                body = ""
                if resp is not None:
                    try:
                        body = resp.text[:500]
                    except Exception:
                        body = "<unreadable>"
                logger.warning(
                    f"[{self.connector_id}] HTTP error on attempt {attempt + 1}/{max_retries}: {e} body={body}"
                )
            except requests.exceptions.RequestException as e:
                logger.warning(
                    f"[{self.connector_id}] Request error on attempt {attempt + 1}/{max_retries}: {e}"
                )
            except Exception as e:
                logger.exception(
                    f"[SEOLZERO-CHECK][runner] unexpected fetch error: {e}"
                )

            if attempt < max_retries - 1:
                wait_time = backoff_factor ** attempt
                logger.info(
                    f"[SEOLZERO-CHECK][runner] waiting {wait_time} seconds before retry"
                )
                time.sleep(wait_time)

        logger.error(
            f"[{self.connector_id}] Failed to fetch data after {max_retries} retries"
        )
        return None

    def _transform_data(self, raw_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """데이터를 변환합니다."""
        try:
            logger.info(
                f"[SEOLZERO-CHECK][runner] transform start raw_data_type={type(raw_data)}"
            )
            try:
                logger.info(
                    f"[SEOLZERO-CHECK][runner] transform raw_data preview={str(raw_data)[:500]}"
                )
            except Exception:
                pass

            context = {
                "connector_id": self.connector_id,
                "config": self.config,
                "timestamp": datetime.utcnow().isoformat(),
            }

            logger.info(
                f"[SEOLZERO-CHECK][runner] calling transform_func for connector_id={self.connector_id}"
            )

            transformed = self.transform_func(raw_data, context)

            logger.info(f"[{self.connector_id}] Data transformation completed")
            try:
                logger.info(
                    f"[SEOLZERO-CHECK][runner] transform result preview={str(transformed)[:500]}"
                )
            except Exception:
                pass
            return transformed

        except Exception as e:
            logger.exception(f"[{self.connector_id}] Error transforming data: {e}")
            return None

    def _build_fdt_endpoint(self) -> Optional[str]:
        """FDT endpoint 생성"""
        endpoint = self.fdt_target.get("endpoint")
        if endpoint:
            return endpoint

        base_url = self.fdt_target.get("base_url")
        path_template = self.fdt_target.get("path_template")
        path_params = self.fdt_target.get("path_params", {})

        if not base_url or not path_template:
            return None

        try:
            path = path_template.format(**path_params)
            return f"{base_url.rstrip('/')}{path}"
        except KeyError as e:
            logger.error(f"[{self.connector_id}] Missing FDT path param: {e}")
            return None
        except Exception as e:
            logger.error(f"[{self.connector_id}] Error building FDT endpoint: {e}")
            return None

    def _send_to_fdt(self, data: Dict[str, Any]) -> bool:
        """변환된 데이터를 FDiT 플랫폼으로 전송합니다."""
        fdt_endpoint = self._build_fdt_endpoint()
        if not fdt_endpoint:
            logger.error(f"[{self.connector_id}] FDT endpoint not configured")
            return False

        logger.info(f"[SEOLZERO-CHECK][runner] final FDT URL={fdt_endpoint}")

        headers = {"Content-Type": "application/json"}
        auth_config = self.fdt_target.get("auth")

        headers, fdt_endpoint, auth_obj = AuthHandler.apply_auth(
            headers, fdt_endpoint, auth_config, {}
        )

        logger.info(f"[{self.connector_id}] Sending to FDT: {fdt_endpoint}")

        try:
            logger.info(
                f"[SEOLZERO-CHECK][runner] send payload preview={str(data)[:500]}"
            )

            response = requests.post(
                fdt_endpoint,
                json=data,
                headers=headers,
                auth=auth_obj,
                timeout=self.behavior.get("timeout_seconds", 30),
            )
            response.raise_for_status()

            logger.info(
                f"[{self.connector_id}] Successfully sent to FDT. Status: {response.status_code}"
            )
            return True

        except requests.exceptions.RequestException as e:
            logger.error(f"[{self.connector_id}] Error sending to FDT: {e}")
            return False

    def run(self, **context: Any) -> Dict[str, Any]:
        """주 실행 로직"""
        logger.info(f"[{self.connector_id}] Starting connector execution")
        logger.info(
            f"[SEOLZERO-CHECK][runner] run() called connector_id={self.connector_id}"
        )

        result = {
            "connector_id": self.connector_id,
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "details": {},
        }

        if self._is_manual_trigger(**context):
            logger.info(
                f"[SEOLZERO-CHECK][runner] manual trigger detected -> bypass _is_due"
            )
        else:
            if not self._is_due():
                result["status"] = "skipped"
                result["details"]["reason"] = "not_due"
                logger.info(f"[{self.connector_id}] Skipped (not due)")
                return result

        raw_data = self._fetch_data()
        if raw_data is None:
            result["status"] = "failed"
            result["details"]["reason"] = "fetch_failed"
            if self.last_fetch_status is not None:
                result["details"]["error_code"] = self.last_fetch_status
            logger.error(
                f"[{self.connector_id}] Failed to fetch data (status={self.last_fetch_status})"
            )
            return result

        transformed_data = self._transform_data(raw_data)
        if transformed_data is None:
            result["status"] = "failed"
            result["details"]["reason"] = "transform_failed"
            logger.error(f"[{self.connector_id}] Failed to transform data")
            return result

        if self.fdt_target:
            send_success = self._send_to_fdt(transformed_data)
            if not send_success:
                result["status"] = "partial_failure"
                result["details"]["reason"] = "fdt_send_failed"
                logger.warning(f"[{self.connector_id}] Failed to send to FDT")
                return result

        result["details"]["rows_processed"] = (
            len(transformed_data) if isinstance(transformed_data, list) else 1
        )
        logger.info(f"[{self.connector_id}] Completed successfully")
        return result