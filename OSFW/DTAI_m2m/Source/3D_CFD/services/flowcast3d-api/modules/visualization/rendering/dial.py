import numpy as np
import pyvista as pv
import vtk

FACE, RING, NORTH = "#f5f7f9", "#78909c", "#d32f2f"
SIDE = 0.16
LEFT, BOTTOM = 0.01, 0.08
REACH = 0.6
# 아래 길이는 원판 반지름에 대한 비율
VIEW = 1.07
FEATHER = 0.035
RIM = 0.885
MARK = 0.79
GAP = np.radians(13.0)
SHADOW, DROP = 0.24, 0.03

# 도형 가장자리 거리를 화면 픽셀의 알파로 변환
# VTK 9.7 셰이더 태그 기준
VERTEX = [
    ("//VTK::Normal::Dec", "in float edgeMC;\nout float edgeVSOut;"),
    ("//VTK::Normal::Impl", "edgeVSOut = edgeMC;"),
]
FRAGMENT = [
    ("//VTK::Normal::Dec", "in float edgeVSOut;"),
    (
        "//VTK::Light::Impl",
        (
            "float edgePx = length(vec2(dFdx(edgeVSOut), dFdy(edgeVSOut)));\n"
            "gl_FragData[0].a *= edgePx > 0.0 ? clamp(edgeVSOut / edgePx, 0.0, 1.0) : 1.0;"
        ),
    ),
]


def convex(outline, feather=FEATHER):
    outline = np.asarray(outline, dtype=np.float64)
    x, y = outline.T
    if np.dot(x, np.roll(y, -1)) < np.dot(np.roll(x, -1), y):
        outline = outline[::-1]
    count = len(outline)
    edge = np.roll(outline, -1, axis=0) - outline
    inward = np.column_stack([-edge[:, 1], edge[:, 0]]) / np.hypot(*edge.T)[:, None]
    before = np.roll(inward, 1, axis=0)
    inner = outline + feather * (before + inward) / (1.0 + np.sum(before * inward, axis=1))[:, None]
    index = np.arange(count)
    after = (index + 1) % count
    triangles = np.vstack([
        np.column_stack([index, after, count + after]),
        np.column_stack([index, count + after, count + index]),
        np.column_stack([np.full(count - 2, count), count + index[1:-1], count + index[2:]]),
    ])  # fmt: skip
    return np.vstack([outline, inner]), triangles, np.r_[np.zeros(count), np.full(count, feather)]


def polar(angles, radii, edge):
    count, rings = radii.shape
    points = np.stack([radii * np.cos(angles)[:, None], radii * np.sin(angles)[:, None]], axis=-1).reshape(
        -1, 2
    )
    corner = (np.arange(count - 1)[:, None] * rings + np.arange(rings - 1)).ravel()
    triangles = np.vstack([
        np.column_stack([corner, corner + rings, corner + rings + 1]),
        np.column_stack([corner, corner + rings + 1, corner + 1]),
    ])  # fmt: skip
    return points, triangles, np.clip(edge, 0.0, FEATHER).ravel()


def join(parts, z):
    points, triangles, edges, offset = [], [], [], 0
    for point, triangle, edge in parts:
        points.append(point)
        triangles.append(triangle + offset)
        edges.append(edge)
        offset += len(point)
    point, triangle = np.vstack(points), np.vstack(triangles)
    mesh = pv.PolyData(
        np.column_stack([point, np.full(len(point), z)]),
        np.column_stack([np.full(len(triangle), 3), triangle]).ravel(),
    )  # fmt: skip
    mesh.point_data["edge"] = np.concatenate(edges).astype(np.float32)
    return mesh


def rotate(points, direction):
    ahead = np.asarray(direction, dtype=np.float64)
    return np.asarray(points, dtype=np.float64) @ np.array([ahead, [-ahead[1], ahead[0]]])


def rgb(color):
    return np.asarray(pv.Color(color).int_rgb, dtype=np.float64)


def face():
    angles = np.linspace(0, 2 * np.pi, 145)
    radii = np.tile([0.955 - FEATHER, 0.955], (len(angles), 1))
    points, triangles, edge = polar(angles, radii, np.tile([FEATHER, 0.0], (len(angles), 1)))
    ring = np.arange(len(angles) - 1) * 2
    fan = np.column_stack([np.full(len(ring), len(points)), ring, ring + 2])
    return join(
        [(np.vstack([points, [[0.0, 0.0]]]), np.vstack([triangles, fan]), np.r_[edge, FEATHER])], -0.04
    )


def ring():
    blend = FEATHER / RIM
    bounds = np.pi / 2 + np.array([-1, 1])[:, None] * (GAP + np.array([-0.5, 0.5]) * blend)
    angles = np.unique(np.r_[np.linspace(0, 2 * np.pi, 145), bounds.ravel()])
    radii = np.tile([RIM, RIM + FEATHER, 1.0 - FEATHER, 1.0], (len(angles), 1))
    parts = [polar(angles, radii, np.minimum(radii - RIM, 1.0 - radii))]
    north = np.abs(np.angle(np.exp(1j * (angles - np.pi / 2))))
    mix = np.clip((north - GAP) / blend + 0.5, 0.0, 1.0)
    colors = [np.repeat(rgb(FACE) + mix[:, None] * (rgb(RING) - rgb(FACE)), 4, axis=0)]
    for step in (0, 1, 3, 4, 5, 6, 7):
        inner, half = (0.72, 0.036) if step % 2 == 0 else (0.8, 0.03)
        tick = [[inner, -half], [0.93, -half], [0.93, half], [inner, half]]
        angle = np.radians(45.0 * step)
        parts.append(convex(rotate(tick, (np.cos(angle), np.sin(angle))), min(FEATHER, half)))
        colors.append(np.tile(rgb(RING), (8, 1)))
    mesh = join(parts, -0.03)
    mesh.point_data["rgb"] = np.round(np.vstack(colors)).astype(np.uint8)
    return mesh


def letter():
    half, top, stem, slant = 0.11, 0.13, 0.074, 0.09
    return join([
        convex([[-half, -top], [-half + stem, -top], [-half + stem, top], [-half, top]]),
        convex([[half - stem, -top], [half, -top], [half, top], [half - stem, top]]),
        convex([[-half, top], [half - slant, -top], [half, -top], [-half + slant, top]]),
    ], 0.0)  # fmt: skip


def shadow():
    angles = np.linspace(0, 2 * np.pi, 145)
    radii = np.tile(np.linspace(0.96, VIEW - DROP - 0.01, 6), (len(angles), 1))
    points, triangles, _ = polar(angles, radii, np.zeros_like(radii))
    mesh = join([(points, triangles, np.zeros(len(points)))], -0.05)
    fade = 1.0 - (radii.ravel() - radii.min()) / np.ptp(radii)
    rgba = np.zeros((len(points), 4), dtype=np.uint8)
    rgba[:, 3] = np.round(255 * SHADOW * fade**2)
    mesh.point_data["rgba"] = rgba
    return mesh


def flat(mesh, color=None, smooth=True):
    mapper = vtk.vtkPolyDataMapper()
    mapper.SetInputData(mesh)
    actor = pv.Actor(mapper=mapper)
    actor.prop.lighting = False
    actor.ForceOpaqueOn()
    if color is None:
        mapper.SetColorModeToDirectScalars()
        mapper.SetScalarModeToUsePointFieldData()
        mapper.SelectColorArray("rgba" if "rgba" in mesh.point_data else "rgb")
    else:
        mapper.ScalarVisibilityOff()
        actor.prop.color = color
    if smooth:
        mapper.MapDataArrayToVertexAttribute("edgeMC", "edge", vtk.vtkDataObject.FIELD_ASSOCIATION_POINTS, -1)
        shader = actor.GetShaderProperty()
        for tag, code in VERTEX:
            shader.AddVertexShaderReplacement(tag, True, f"{tag}\n{code}", False)
        for tag, code in FRAGMENT:
            shader.AddFragmentShaderReplacement(tag, True, f"{tag}\n{code}", False)
    return actor


class WindDial:
    """장면 카메라 방향을 따르는 평균 바람 나침반"""

    def __init__(self, color):
        self.renderer = vtk.vtkRenderer()
        self.renderer.SetLayer(1)
        self.renderer.InteractiveOff()
        self.renderer.SetDraw(False)
        self.arrow = pv.PolyData()
        self.shadow = flat(shadow(), smooth=False)
        self.north = flat(letter(), NORTH)
        self.north.SetPosition(0.0, MARK, -0.02)
        for actor in (self.shadow, flat(face(), FACE), flat(ring()), self.north, flat(self.arrow, color)):
            self.renderer.AddActor(actor)

    def show(self, heading):
        self.renderer.SetDraw(heading is not None)
        if heading is None:
            return
        direction = np.asarray(heading, dtype=np.float64) / np.hypot(*heading)
        shaft = [[-REACH, -0.075], [REACH - 0.2, -0.075], [REACH - 0.2, 0.075], [-REACH, 0.075]]
        head = [[REACH, 0.0], [REACH - 0.32, 0.22], [REACH - 0.32, -0.22]]
        parts = [
            (rotate(point, direction), triangle, edge) for point, triangle, edge in map(convex, (shaft, head))
        ]
        self.arrow.copy_from(join(parts, -0.01))

    def follow(self, camera, size):
        width, height = size
        if width < 1 or height < 1:
            return
        self.renderer.SetViewport(LEFT, BOTTOM, min(LEFT + SIDE * height / width, 1.0), BOTTOM + SIDE)
        ahead = np.subtract(camera.GetFocalPoint(), camera.GetPosition())
        ahead /= np.linalg.norm(ahead)
        up = np.asarray(camera.GetViewUp(), dtype=np.float64)
        heading = (up - (up @ ahead) * ahead)[:2]
        if np.hypot(*heading) < 1e-6:
            heading = ahead[:2]
        heading = heading / np.hypot(*heading)
        self.shadow.SetPosition(*(-DROP * heading), 0.0)
        # N 글자는 원판 반대 방향으로 돌려 수직 유지
        self.north.SetOrientation(0.0, 0.0, np.degrees(np.arctan2(-heading[0], heading[1])))
        own = self.renderer.GetActiveCamera()
        own.SetFocalPoint(0.0, 0.0, 0.0)
        own.SetPosition(0.0, 0.0, 5.0)
        own.SetViewUp(*heading, 0.0)
        own.ParallelProjectionOn()
        own.SetParallelScale(VIEW)
        own.SetClippingRange(1.0, 10.0)
