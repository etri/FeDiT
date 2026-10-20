from typing import Literal

Pollutant = Literal["tracer", "pm25", "pm10", "co", "co2", "no2", "so2", "o3", "nh3"]

POLLUTANTS: dict[Pollutant, str] = {
    "tracer": "일반 추적 물질",
    "pm25": "PM2.5",
    "pm10": "PM10",
    "co": "일산화탄소 (CO)",
    "co2": "이산화탄소 (CO₂)",
    "no2": "이산화질소 (NO₂)",
    "so2": "이산화황 (SO₂)",
    "o3": "오존 (O₃)",
    "nh3": "암모니아 (NH₃)",
}


def concentration_label(pollutant: Pollutant, transport: str) -> str:
    label = "가상 농도"
    if pollutant == "tracer":
        return label if transport == "prediction" else "오염물질 농도"
    name = POLLUTANTS[pollutant]
    if "(" in name:
        name = name.partition("(")[2].removesuffix(")")
    return f"{name}\n{label}"
