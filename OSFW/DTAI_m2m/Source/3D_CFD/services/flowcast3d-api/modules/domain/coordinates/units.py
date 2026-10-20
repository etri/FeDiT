# 채널별 첫 단위가 표준 단위이며 변환값은 (곱, 더하기)
KINEMATIC_PRESSURE = "m2/s2"
UNITS = {
    "velocity_x": {"m/s": (1.0, 0.0), "cm/s": (0.01, 0.0), "km/h": (1 / 3.6, 0.0)},
    "pressure": {"Pa": (1.0, 0.0), "hPa": (100.0, 0.0), "kPa": (1000.0, 0.0), KINEMATIC_PRESSURE: None},
    "temperature": {"K": (1.0, 0.0), "degC": (1.0, 273.15)},
    "density": {"kg/m3": (1.0, 0.0)},
}
UNITS["velocity_y"] = UNITS["velocity_z"] = UNITS["velocity_x"]


def conversion(channel, unit, density=None):
    """표준 단위 변환의 (곱, 더하기) 반환"""
    if unit is None:
        return (1.0, 0.0)
    if unit == KINEMATIC_PRESSURE:
        return (density, 0.0)
    return UNITS[channel][unit]


def canonical_unit(channel):
    return next(iter(UNITS[channel])) if channel in UNITS else None
