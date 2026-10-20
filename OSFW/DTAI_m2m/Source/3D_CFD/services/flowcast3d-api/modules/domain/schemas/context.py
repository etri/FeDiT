"""원본 자료에 연결하는 표시와 시나리오 문맥"""

CONTEXT_KEYS = (
    "scenarioId",
    "resultRole",
    "sourceRef",
    "supportModes",
    "scenarioModes",
    "analysisKind",
    "referenceResultId",
    "colorRange",
    "attribution",
    "referenceData",
    "defaultWind",
    "purpose",
    "initialFrame",
)


def source_context(source):
    """원본 규격과 분리한 표시 및 시나리오 문맥 추출"""
    metadata = source.get("metadata") or {}
    return {
        key: source.get(key, metadata.get(key)) for key in CONTEXT_KEYS if key in source or key in metadata
    }
