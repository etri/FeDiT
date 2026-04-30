from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional


AUTO_EXCLUDED_ATTRIBUTE_KEYS = {"id", "type", "@context"}


def get_nested_value(data: Any, path: Optional[str], default: Any = None) -> Any:
    """
    dot path 기반으로 중첩 값 조회
    예:
        path='result.data.temperature'
        path='station.id'
    """
    if not path:
        return default

    current = data
    for key in path.split("."):
        if not isinstance(current, dict):
            return default
        current = current.get(key)
        if current is None:
            return default
    return current


def find_all_values_by_key(data: Any, target_key: str) -> List[Any]:
    """
    dict/list 전체를 재귀 탐색하며 target_key에 해당하는 값을 모두 수집
    """
    results: List[Any] = []

    if isinstance(data, dict):
        for key, value in data.items():
            if key == target_key:
                results.append(value)
            results.extend(find_all_values_by_key(value, target_key))

    elif isinstance(data, list):
        for item in data:
            results.extend(find_all_values_by_key(item, target_key))

    return results


def cast_value(value: Any, value_type: str) -> Any:
    """
    설정된 value_type에 따라 값 변환
    """
    if value is None:
        return None

    if value_type == "number":
        try:
            if isinstance(value, str):
                stripped = value.strip()
                if "." in stripped:
                    return float(stripped)
                return int(stripped)
            if isinstance(value, (int, float)):
                return value
            return float(value)
        except (ValueError, TypeError):
            return value

    if value_type == "string":
        return str(value)

    if value_type == "boolean":
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.strip().lower() in ("true", "1", "yes", "y")
        return bool(value)

    if value_type == "geojson":
        return value

    if value_type == "object":
        return value

    return value


def infer_value_type(value: Any) -> str:
    """
    자동 탐색 모드에서 value_type 추론
    """
    if isinstance(value, bool):
        return "boolean"

    if isinstance(value, (int, float)):
        return "number"

    if isinstance(value, dict):
        if "type" in value and "coordinates" in value:
            return "geojson"
        return "object"

    if isinstance(value, str):
        stripped = value.strip()
        try:
            if "." in stripped:
                float(stripped)
                return "number"
            int(stripped)
            return "number"
        except (ValueError, TypeError):
            return "string"

    return "string"


def infer_ngsi_attribute_type(value: Any) -> str:
    """
    자동 탐색 모드에서 NGSI-LD attribute type 추론
    """
    if isinstance(value, dict) and "type" in value and "coordinates" in value:
        return "GeoProperty"
    return "Property"


def parse_timezone(tz_name: str) -> timezone:
    """
    타임존 문자열을 timezone 객체로 변환
    현재 지원:
    - UTC
    - Asia/Seoul
    """
    normalized = (tz_name or "UTC").strip()

    if normalized.upper() == "UTC":
        return timezone.utc

    if normalized == "Asia/Seoul":
        return timezone(timedelta(hours=9))

    return timezone.utc


def format_datetime_value(
    raw_value: Any,
    input_format: Optional[str] = None,
    output_format: str = "iso8601",
    tz_name: str = "UTC",
) -> Optional[str]:
    """
    날짜/시간 문자열을 ISO8601 형식으로 변환

    예:
        raw_value = "20260401161000"
        input_format = "%Y%m%d%H%M%S"
        output_format = "iso8601"
        결과 = "2026-04-01T16:10:00Z"
    """
    if raw_value is None:
        return None

    text = str(raw_value).strip()
    if not text:
        return None

    dt: Optional[datetime] = None

    if input_format:
        try:
            dt = datetime.strptime(text, input_format)
        except ValueError:
            return text
    else:
        try:
            normalized = text.replace("Z", "+00:00")
            dt = datetime.fromisoformat(normalized)
        except ValueError:
            return text

    tzinfo = parse_timezone(tz_name)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=tzinfo)

    if output_format == "iso8601":
        return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    return dt.isoformat()


def render_id_pattern(
    id_pattern: Optional[str],
    entity_type: Optional[str],
    source_data: Dict[str, Any],
) -> Optional[str]:
    """
    id_pattern 템플릿을 실제 ID 문자열로 변환

    지원 예:
        id_pattern = "urn:ngsi-ld:{type}:{MMSI_CODE}"
        id_pattern = "urn:ngsi-ld:{type}:{station.id}"
    """
    if not id_pattern:
        return None

    pattern = re.compile(r"\{([^{}]+)\}")

    def replacer(match: re.Match[str]) -> str:
        token = match.group(1).strip()

        if token == "type":
            return str(entity_type or "")

        value = get_nested_value(source_data, token)
        if value is None:
            return ""

        return str(value)

    rendered = pattern.sub(replacer, id_pattern).strip()
    return rendered or None


def build_fdt_endpoint(fdt_target: Dict[str, Any]) -> str:
    """
    fdt_target config를 기반으로 endpoint URL 생성
    """
    base_url = fdt_target.get("base_url", "").rstrip("/")
    path_template = fdt_target.get("path_template", "")
    path_params = fdt_target.get("path_params", {})

    try:
        path = path_template.format(**path_params)
    except KeyError as e:
        raise ValueError(f"[FDT ENDPOINT ERROR] Missing path param: {e}")

    return f"{base_url}{path}"


def resolve_attribute_value(
    source_data: Dict[str, Any],
    attr_name: str,
    attr_rule: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    attributes 리스트/딕셔너리 형식을 모두 지원하여 실제 값을 해석

    반환 예:
    {
        "target_attr_name": "temperature",
        "raw_value": 24.1,
        "ngsi_attr_type": "Property",
        "value_type": "number",
        "observedAt_path": None,
        "observedAt_input_format": None,
        "observedAt_output_format": None,
        "timezone": None,
    }
    """
    if attr_rule is None:
        # 리스트 모드: attr_name을 source key로 간주하고 전체 body에서 재귀 탐색
        matches = find_all_values_by_key(source_data, attr_name)

        if not matches:
            raise KeyError(f"[NGSI-LD ATTRIBUTE ERROR] Key not found: '{attr_name}'")

        if len(matches) > 1:
            raise ValueError(
                f"[NGSI-LD ATTRIBUTE ERROR] Multiple values found for key '{attr_name}'. "
                f"Use dict mapping with source_path or source_key."
            )

        raw_value = matches[0]
        return {
            "target_attr_name": attr_name,
            "raw_value": raw_value,
            "ngsi_attr_type": infer_ngsi_attribute_type(raw_value),
            "value_type": infer_value_type(raw_value),
            "observedAt_path": None,
            "observedAt_input_format": None,
            "observedAt_output_format": None,
            "timezone": None,
        }

    source_path = attr_rule.get("source_path")
    source_key = attr_rule.get("source_key")

    raw_value = None

    if source_path:
        raw_value = get_nested_value(source_data, source_path)
    elif source_key:
        matches = find_all_values_by_key(source_data, source_key)

        if len(matches) == 1:
            raw_value = matches[0]
        elif len(matches) > 1:
            raise ValueError(
                f"[NGSI-LD ATTRIBUTE ERROR] Multiple values found for source_key '{source_key}'. "
                f"Use source_path instead."
            )
    else:
        matches = find_all_values_by_key(source_data, attr_name)

        if len(matches) == 1:
            raw_value = matches[0]
        elif len(matches) > 1:
            raise ValueError(
                f"[NGSI-LD ATTRIBUTE ERROR] Multiple values found for key '{attr_name}'. "
                f"Use source_path or source_key."
            )

    if raw_value is None:
        raise KeyError(f"[NGSI-LD ATTRIBUTE ERROR] Value not found for '{attr_name}'")

    ngsi_attr_type = attr_rule.get("type", infer_ngsi_attribute_type(raw_value))
    value_type = attr_rule.get("value_type", infer_value_type(raw_value))

    return {
        "target_attr_name": attr_name,
        "raw_value": raw_value,
        "ngsi_attr_type": ngsi_attr_type,
        "value_type": value_type,
        "observedAt_path": attr_rule.get("observedAt_path"),
        "observedAt_input_format": attr_rule.get("observedAt_input_format"),
        "observedAt_output_format": attr_rule.get("observedAt_output_format"),
        "timezone": attr_rule.get("timezone"),
    }


def build_attribute_object_from_resolved(
    resolved_attr: Dict[str, Any],
    source_data: Dict[str, Any],
    default_observed_at: Optional[str] = None,
    entity_datetime_config: Optional[Dict[str, Any]] = None,
) -> Optional[Dict[str, Any]]:
    """
    resolve_attribute_value 결과를 바탕으로 NGSI-LD attribute object 생성
    """
    raw_value = resolved_attr.get("raw_value")
    ngsi_attr_type = resolved_attr.get("ngsi_attr_type", "Property")
    value_type = resolved_attr.get("value_type", "string")

    value = cast_value(raw_value, value_type)
    if value is None:
        return None

    if ngsi_attr_type == "Relationship":
        return {
            "type": "Relationship",
            "object": value,
        }

    attr_obj: Dict[str, Any] = {
        "type": ngsi_attr_type,
        "value": value,
    }

    attr_observed_at_path = resolved_attr.get("observedAt_path")
    if attr_observed_at_path:
        dt_input_format = resolved_attr.get("observedAt_input_format") or (
            entity_datetime_config or {}
        ).get("observedAt_input_format")
        dt_output_format = resolved_attr.get("observedAt_output_format") or (
            entity_datetime_config or {}
        ).get("observedAt_output_format", "iso8601")
        dt_timezone = resolved_attr.get("timezone") or (
            entity_datetime_config or {}
        ).get("timezone", "UTC")

        raw_observed_at = get_nested_value(source_data, attr_observed_at_path)
        converted_observed_at = format_datetime_value(
            raw_value=raw_observed_at,
            input_format=dt_input_format,
            output_format=dt_output_format,
            tz_name=dt_timezone,
        )

        if converted_observed_at:
            attr_obj["observedAt"] = converted_observed_at

    elif default_observed_at and ngsi_attr_type in ("Property", "GeoProperty"):
        attr_obj["observedAt"] = default_observed_at

    return attr_obj


def resolve_attributes_config(
    source_data: Dict[str, Any],
    ngsi_ld_config: Dict[str, Any],
) -> Any:
    """
    attributes 설정을 해석한다.

    우선순위:
    1. ngsi_ld.attributes가 명시되어 있으면 그대로 사용
    2. 없으면 source_root_path 아래 dict의 key들을 자동 매핑
    3. source_root_path도 없으면 최상위 dict key들을 자동 매핑
    """
    attributes_config = ngsi_ld_config.get("attributes", None)
    if attributes_config is not None:
        return attributes_config

    source_root_path = ngsi_ld_config.get("source_root_path")
    source_payload = (
        get_nested_value(source_data, source_root_path, default=None)
        if source_root_path
        else source_data
    )

    if not isinstance(source_payload, dict):
        return []

    auto_keys = [
        key
        for key in source_payload.keys()
        if key not in AUTO_EXCLUDED_ATTRIBUTE_KEYS
    ]
    return auto_keys


def build_ngsi_ld_entity(data: Dict[str, Any], ngsi_ld_config: Dict[str, Any]) -> Dict[str, Any]:
    """
    원본 dict 데이터를 NGSI-LD entity로 변환
    """
    entity_config = ngsi_ld_config.get("entity", {})
    attributes_config = resolve_attributes_config(data, ngsi_ld_config)
    context_value = ngsi_ld_config.get("context", [])

    source_root_path = ngsi_ld_config.get("source_root_path")
    attribute_source_data = (
        get_nested_value(data, source_root_path, default=data)
        if source_root_path
        else data
    )
    if not isinstance(attribute_source_data, dict):
        attribute_source_data = data

    entity_type = entity_config.get("type")
    entity_id = entity_config.get("id")

    if not entity_id:
        entity_id = render_id_pattern(
            id_pattern=entity_config.get("id_pattern"),
            entity_type=entity_type,
            source_data=data,
        )

    entity: Dict[str, Any] = {
        "id": entity_id,
        "type": entity_type,
        "@context": context_value,
    }

    observed_at_path = entity_config.get("observedAt_path")
    observed_at_input_format = entity_config.get("observedAt_input_format")
    observed_at_output_format = entity_config.get("observedAt_output_format", "iso8601")
    timezone_name = entity_config.get("timezone", "UTC")

    entity_observed_at: Optional[str] = None
    if observed_at_path:
        raw_observed_at = get_nested_value(data, observed_at_path)
        entity_observed_at = format_datetime_value(
            raw_value=raw_observed_at,
            input_format=observed_at_input_format,
            output_format=observed_at_output_format,
            tz_name=timezone_name,
        )

    if isinstance(attributes_config, list):
        for attr_name in attributes_config:
            try:
                resolved_attr = resolve_attribute_value(
                    source_data=attribute_source_data,
                    attr_name=attr_name,
                    attr_rule=None,
                )
                attr_obj = build_attribute_object_from_resolved(
                    resolved_attr=resolved_attr,
                    source_data=attribute_source_data,
                    default_observed_at=entity_observed_at,
                    entity_datetime_config={
                        "observedAt_input_format": observed_at_input_format,
                        "observedAt_output_format": observed_at_output_format,
                        "timezone": timezone_name,
                    },
                )
                if attr_obj is not None:
                    entity[resolved_attr["target_attr_name"]] = attr_obj
            except KeyError:
                continue

    elif isinstance(attributes_config, dict):
        for target_attr_name, attr_rule in attributes_config.items():
            try:
                resolved_attr = resolve_attribute_value(
                    source_data=attribute_source_data,
                    attr_name=target_attr_name,
                    attr_rule=attr_rule,
                )
                attr_obj = build_attribute_object_from_resolved(
                    resolved_attr=resolved_attr,
                    source_data=attribute_source_data,
                    default_observed_at=entity_observed_at,
                    entity_datetime_config={
                        "observedAt_input_format": observed_at_input_format,
                        "observedAt_output_format": observed_at_output_format,
                        "timezone": timezone_name,
                    },
                )
                if attr_obj is not None:
                    entity[resolved_attr["target_attr_name"]] = attr_obj
            except KeyError:
                continue

    static_attributes = entity_config.get("static_attributes", {})
    for static_attr_name, static_attr_value in static_attributes.items():
        entity[static_attr_name] = static_attr_value

    return entity


def transform_with_config(data: Any, context: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
    """
    CONNECTOR_CONFIG 기반 공통 변환 함수
    """
    if not data:
        return {"data": []}

    ngsi_ld_config = config.get("ngsi_ld", {})
    ngsi_ld_enabled = ngsi_ld_config.get("enabled", False)

    if not ngsi_ld_enabled:
        return {"data": data}

    if isinstance(data, dict):
        return {
            "data": build_ngsi_ld_entity(data, ngsi_ld_config),
        }

    if isinstance(data, list):
        entities: List[Dict[str, Any]] = []
        for item in data:
            if isinstance(item, dict):
                entities.append(build_ngsi_ld_entity(item, ngsi_ld_config))
        return {
            "data": entities,
        }

    return {"data": data}