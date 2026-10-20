import numpy as np

from modules.domain.schemas import FlowMetadata

CHANNELS = ("velocity_x", "velocity_y", "velocity_z", "pressure")
DENSITY = 1.225  # 밀도(kg/m3)
# 로그 법칙 유입 분포의 기준 높이 유속(m/s), 기준 높이(m), 도심 거칠기 길이(m)
REFERENCE_SPEED, REFERENCE_HEIGHT, ROUGHNESS = 5.0, 10.0, 0.5
# 동결 난류 가정에서 프레임 간 변화를 만드는 기준 풍속의 에디 이동 속도(m/s)
CONVECTION_SPEED = 8.0
# 풍향 270도 기준 에디의 (파장 m, 진폭 m/s, 방향, 위상)
# 파수에 수직인 진폭 성분으로 모드별 발산 제거
EDDIES = (
    ((240.0, 320.0, 160.0), 0.5, (0.0, 1.0, 0.0), 0.0),
    ((160.0, -240.0, 96.0), 0.4, (0.0, 0.0, 1.0), 1.3),
    ((96.0, 120.0, -64.0), 0.3, (1.0, 0.0, 0.0), 2.1),
    ((64.0, -80.0, 48.0), 0.2, (0.0, 1.0, 1.0), 0.7),
)


def flow_direction(direction):
    """북쪽 기준 시계 방향 풍향(도)을 흐름 방향 단위 벡터로 변환"""
    angle = np.radians(direction)
    # 풍향 270도의 비트 단위 호환성을 위해 -0.0 정리
    d_x, d_y = np.round([-np.sin(angle), -np.cos(angle)], 15) + 0.0
    return float(d_x), float(d_y)


def synthetic_flow(grid, x_range, time, direction=270.0, speed=REFERENCE_SPEED):
    """x 슬랩의 속도(m/s)와 계기 압력(Pa)을 [X, Y, Z, C]로 생성"""
    dx, dy, dz = grid.spacing
    x = (np.arange(grid.shape[0])[x_range, None, None] + 0.5) * dx
    y = (np.arange(grid.shape[1])[None, :, None] + 0.5) * dy
    z = (np.arange(grid.shape[2])[None, None, :] + 0.5) * dz
    d_x, d_y = flow_direction(direction)
    rotation = np.array([[d_x, -d_y], [d_y, d_x]])
    centre = np.array([grid.shape[0] * dx, grid.shape[1] * dy]) / 2
    scale = speed / REFERENCE_SPEED
    shift = CONVECTION_SPEED * scale * time

    # 로그 유입 분포를 높이 방향 셀 구간 평균으로 계산
    def antiderivative(height):
        return np.where(height > 0, height * np.log(np.maximum(height, 1e-300) / ROUGHNESS) - height, 0.0)

    profile = (antiderivative(z + dz / 2) - antiderivative(z - dz / 2)) / dz
    profile = speed * np.maximum(profile, 0.0) / np.log(REFERENCE_HEIGHT / ROUGHNESS)
    peak = profile.max()
    if peak <= 0:  # 모든 셀이 거칠기 높이 아래면 0 나눗셈 방지
        raise ValueError(
            "source.inflow needs a grid whose top cell lies above the roughness height (about 1.4 m)"
        )

    velocity = np.zeros((x.shape[0], grid.shape[1], grid.shape[2], 3))
    velocity[..., 0] = profile * d_x
    velocity[..., 1] = profile * d_y
    for wavelength, amplitude, orientation, phase in EDDIES:
        wave = 2 * np.pi / np.array(wavelength)
        transverse = np.array(orientation) - np.dot(orientation, wave) / np.dot(wave, wave) * wave
        transverse *= amplitude * scale / np.linalg.norm(transverse)
        # 수평 회전으로 파수와 진폭의 직교성 유지
        turned = rotation @ wave[:2]
        transverse[:2] = rotation @ transverse[:2]
        # 영역 중심 기준으로 위상 회전
        offset = np.dot(wave[:2] - turned, centre)
        eddy = np.sin(
            turned[0] * (x - shift * d_x) + turned[1] * (y - shift * d_y) + wave[2] * z + (phase + offset)
        )
        velocity += (eddy * profile / peak)[..., None] * transverse
    # 교란 없는 유입 분포를 기준으로 한 계기 압력
    pressure = 0.5 * DENSITY * (profile**2 - np.square(velocity).sum(axis=-1))
    return np.concatenate([velocity, pressure[..., None]], axis=-1).astype(np.float32)


def infer_conditions(
    flow: np.ndarray, solid: np.ndarray, metadata: FlowMetadata, physics: dict[str, float], ground_z: float
) -> dict[str, float]:
    indices = [metadata.channels.index(name) for name in CHANNELS[:2]]
    heights = metadata.grid.origin[2] + (np.arange(metadata.grid.shape[2]) + 0.5) * metadata.grid.spacing[2]
    zref, z0 = float(physics.get("zref", 10)), float(physics.get("z0", 0.1))
    displacement = float(physics.get("displacement", 0))
    level = int(np.argmin(np.abs(heights - ground_z - zref)))
    valid = ~solid[:, :, level]
    if valid.any():
        vector = np.mean(flow[:, :, level, :][valid][:, indices], axis=0)
        height = max(float(heights[level] - ground_z - displacement), 0)
    else:
        valid = ~solid
        vector = np.mean(flow[valid][:, indices], axis=0)
        height = max(float(np.mean(heights) - ground_z - displacement), 0)
    profile = np.log1p(height / z0) / np.log1p((zref - displacement) / z0)
    speed = float(np.linalg.norm(vector)) / max(float(profile), 1e-6)
    if not np.isfinite(speed) or speed <= 1e-6:
        raise ValueError("Stationary flow requires a wind direction and positive reference wind speed.")
    return {
        "wind_speed_m_s": speed,
        "wind_direction_deg": float(np.degrees(np.arctan2(vector[1], vector[0])) % 360),
    }
