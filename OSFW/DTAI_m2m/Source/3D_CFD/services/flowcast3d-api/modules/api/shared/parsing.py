"""공개 요청의 유한 JSON과 OpenAPI 스키마 처리"""

import json
import math


def finite_json(raw):
    """중첩된 모든 실수에서 비유한 상수와 지수 오버플로 거부"""

    def invalid_constant(value):
        raise ValueError("Nonfinite JSON number")

    def finite_float(value):
        number = float(value)
        if not math.isfinite(number):
            raise ValueError("Nonfinite JSON number")
        return number

    return json.loads(raw, parse_constant=invalid_constant, parse_float=finite_float)


def inline_schema(model):
    """직접 파싱하는 본문 모델의 참조를 OpenAPI 안에서 해석"""
    schema = model.model_json_schema()
    definitions = schema.pop("$defs", {})

    def expand(value):
        if isinstance(value, dict):
            if "$ref" in value:
                return expand(definitions[value["$ref"].rsplit("/", 1)[-1]])
            return {key: expand(item) for key, item in value.items()}
        if isinstance(value, list):
            return [expand(item) for item in value]
        return value

    return expand(schema)
