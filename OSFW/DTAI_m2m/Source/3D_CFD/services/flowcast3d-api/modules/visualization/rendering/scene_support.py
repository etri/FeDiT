import logging
import math
from pathlib import Path

import numpy as np
import pyvista as pv
import vtk

from modules.domain.transport.fields import velocity

log = logging.getLogger(__name__)
INTERACTION_MESH_BYTES = 256 << 20
INTERACTION_FACES = 100_000
BUILDING_COLOR = "#c8c8c8"
AMBIENT, DIFFUSE = 0.4, 0.7
PHOTO_AMBIENT, PHOTO_DIFFUSE = 0.8, 0.3
PHOTO_FLOW = "#7a818a"
# VTK 9.7에서 한글이 표시되는 글꼴 사용
FONT = Path("/usr/share/fonts/truetype/nanum/NanumBarunGothic.ttf")
LABELS = {
    "speed": "풍속",
    "velocity_x": "속도 u",
    "velocity_y": "속도 v",
    "velocity_z": "속도 w",
    "pressure": "압력",
    "temperature": "온도",
    "density": "밀도",
}
BASE_HEIGHT = 720  # 글자와 선 크기의 기준 창 높이(px)
NARROW = 1.4
# 기본 시점은 +X에서 방위각 135도, 고도각 45도
DIRECTION = (-1.0, 1.0, math.sqrt(2.0))
ROOF = 0.1
# 격자 해상도와 무관하게 진하기를 유지할 대각선 대비 기준 거리
OPACITY_DISTANCE = 0.25
FLOWS = ("streamlines", "box", "volume", "isosurface", "arrows")
WIND_HEIGHT = 10.0  # 평균 바람의 지면 위 관측 높이(m)
WIND_COLOR = "#1d4e89"
ARROW_CMAPS = {True: "coolwarm", False: "turbo"}
ARROW_COLORS = (
    "temperature",
    "pressure",
    "speed",
)
PLUME_COLOR = "__plume__"
# 나침반과 캡처 제목을 피할 패널 화면 영역
PANEL_VIEW = ((0.13, 0.03), (0.97, 0.88))
LEGEND_EDGE = 0.87
# 단면 카메라의 영역 앞면과의 거리(영역 깊이 비율)
SECTION_EYE = 0.7
SECTION_ANGLE = 60.0
CUBE_VIEW = (1.0, 0.58, 0.64)
CUBE_ZOOM = 0.92
FIGURES = ("colormap", "iso", "stream")
SPEED_CMAP = ARROW_CMAPS[False]
STREAM_SEEDS = 260
# 유입면 씨앗의 비율이며 나머지는 건물 주변에 배치
STREAM_UPWIND = 0.15
STREAM_CANOPY = 0.75
STREAM_REACH = 10.0
STREAM_SPAN = 0.55
STREAM_STEPS = 900
STREAM_NEAR = 5.0
STREAM_WIDTH = 3.0
STREAM_BUILDINGS = 0.7
# 벽 옆 유선 보간에 쓸 고체 쪽 속도 확장 층수
STREAM_WALL = 1
STREAM_VIEW = (-1.0, -1.6, 0.55)
FAINT = 0.01
NUDGE = 0.002  # 표면을 카메라 쪽 유체로 당길 거리 비율


def wind_of(sample, channels):
    """수평 유체 셀의 평균 벡터, 평균 풍속, 풍향"""
    horizontal = velocity(sample.values, channels)[..., :2][sample.valid]
    if not len(horizontal):
        return None
    mean = horizontal.mean(axis=0).astype(np.float64)
    direction = math.degrees(math.atan2(-mean[0], -mean[1])) % 360
    return mean, float(np.hypot(horizontal[:, 0], horizontal[:, 1]).mean()), direction


def drawn(look):
    return look.model_dump(exclude={"opacity", "path_width", "emphasis", "value"}) if look.visible else None


def photo_buildings(textures, matrix, origin, roi):
    mesh, image = textures.load_textured(matrix, origin, roi)
    if image is None:
        return mesh, None
    texture = pv.Texture(image)
    # 원거리 사진 텍스처의 번쩍임을 줄이도록 밉맵 사용
    texture.interpolate, texture.mipmap = True, True
    return mesh, texture


def interaction_proxy(mesh):
    """대형 도시의 조작용 삼각형 수를 제한하고 원본 메시를 보존"""
    if not mesh.n_points or not mesh.n_cells:
        return None
    bounds = np.asarray(mesh.bounds).reshape(3, 2)
    span = bounds[:, 1] - bounds[:, 0]
    if not np.isfinite(mesh.points).all() or not np.isfinite(span).all() or span.max() <= 0:
        return None
    if mesh.n_cells <= INTERACTION_FACES:
        return mesh

    # 긴 축의 분할 수를 기준으로 공간 비율을 유지하며 입력 정점만 선택
    for resolution in (64, 48, 32, 24, 16, 8):
        divisions = np.where(span > 0, np.maximum(2, np.ceil(span / span.max() * resolution)), 1).astype(int)
        decimator = vtk.vtkBinnedDecimation()
        decimator.SetInputData(mesh)
        decimator.AutoAdjustNumberOfDivisionsOff()
        decimator.SetNumberOfDivisions(*(int(value) for value in divisions))
        decimator.SetPointGenerationModeToBinPoints()
        decimator.ProducePointDataOff()
        decimator.ProduceCellDataOff()
        decimator.Update()
        proxy = pv.wrap(decimator.GetOutput())
        if not 0 < proxy.n_cells <= INTERACTION_FACES:
            continue

        # 유한 좌표와 원본 영역을 확인하고 캐시 메모리 상한 유지
        tolerance = max(float(span.max()) * 1e-6, 1e-8)
        if (
            np.isfinite(proxy.points).all()
            and np.all(proxy.points >= bounds[:, 0] - tolerance)
            and np.all(proxy.points <= bounds[:, 1] + tolerance)
            and proxy.GetActualMemorySize() * 1024 <= INTERACTION_MESH_BYTES
        ):
            return proxy
    return mesh


def set_font(prop):
    if FONT.is_file():
        prop.SetFontFamily(vtk.VTK_FONT_FILE)
        prop.SetFontFile(str(FONT))
