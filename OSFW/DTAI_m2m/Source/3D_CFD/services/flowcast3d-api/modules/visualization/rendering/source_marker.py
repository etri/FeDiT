import numpy as np
import pyvista as pv
import vtk
from vtkmodules.util import numpy_support

HEAD = 15.0
STEM = 4.0
FOOT = 15.0
TIP = 7.0
NEEDLE = 15.0
# 농도를 가리지 않도록 핀 머리를 아래로 옮길 상향 흐름 비율
RISE = 0.2
BASE_HEIGHT = 720  # 마커 크기의 기준 창 높이(px)
MIN_STEM = 0.3
RED = (0.83, 0.18, 0.18)
INK = (0.12, 0.16, 0.22)
LIGHT = (-0.45, 0.55, 0.70)  # 화면 좌표(오른쪽, 위, 앞)의 광원 방향
SPRITE = 128
SUPER = 4


def lit_sphere(x, y, radius):
    nx, ny = x / radius, y / radius
    nz = np.sqrt(np.clip(1 - nx**2 - ny**2, 0, 1))
    light = np.asarray(LIGHT) / np.linalg.norm(LIGHT)
    diffuse = np.clip(nx * light[0] + ny * light[1] + nz * light[2], 0, 1)
    half = light + (0, 0, 1)
    half /= np.linalg.norm(half)
    specular = np.clip(nx * half[0] + ny * half[1] + nz * half[2], 0, 1) ** 48
    shade = (0.36 + 0.72 * diffuse) * (0.86 + 0.14 * nz)
    return np.clip(np.asarray(RED) * shade[..., None] + 0.6 * specular[..., None], 0, 1)


def rings(radius, layers, fill=None):
    rgb = np.zeros((*radius.shape, 3))
    alpha = np.zeros(radius.shape)
    inner = 0.0
    for number, (outer, colour, opacity) in enumerate(layers):
        part = (radius >= inner) & (radius <= outer)
        rgb[part] = fill(part) if number == 0 and fill is not None else colour
        alpha[part] = opacity
        inner = outer
    return rgb, alpha, np.asarray(layers[-1][1], dtype=np.float64)


def shrink(rgb, alpha, edge):
    rows, columns = (side // SUPER for side in alpha.shape)
    weight = alpha.reshape(rows, SUPER, columns, SUPER).sum(axis=(1, 3))
    colour = (rgb * alpha[..., None]).reshape(rows, SUPER, columns, SUPER, 3).sum(axis=(1, 3))
    colour = np.where(weight[..., None] > 0, colour / np.maximum(weight, 1e-9)[..., None], edge)
    out = np.concatenate([colour, (weight / SUPER**2)[..., None]], axis=-1)
    return np.ascontiguousarray(np.round(out * 255).astype(np.uint8))


def grid(columns=SPRITE, rows=SPRITE):
    x = (np.arange(columns * SUPER) + 0.5) / (columns * SUPER) * 2 - 1
    y = (np.arange(rows * SUPER) + 0.5) / (rows * SUPER) * 2 - 1
    return np.meshgrid(x, y)


def head_sprite():
    x, y = grid()
    radius = np.hypot(x, y)
    core = 0.6
    layers = [(core, RED, 1.0), (0.86, (1.0, 1.0, 1.0), 1.0), (1.0, INK, 0.8)]
    return shrink(*rings(radius, layers, fill=lambda part: lit_sphere(x[part], y[part], core)))


def foot_sprite():
    x, y = grid()
    layers = [(0.5, INK, 0.3), (0.78, (1.0, 1.0, 1.0), 0.95), (1.0, INK, 0.7)]
    return shrink(*rings(np.hypot(x, y), layers))


def tip_sprite():
    x, y = grid()
    layers = [(0.45, INK, 1.0), (0.78, (1.0, 1.0, 1.0), 1.0), (1.0, INK, 0.6)]
    return shrink(*rings(np.hypot(x, y), layers))


def stem_sprite():
    x, _ = grid(32, 4)
    layers = [(0.3, INK, 1.0), (0.78, (1.0, 1.0, 1.0), 1.0), (1.0, INK, 0.35)]
    return shrink(*rings(np.abs(x), layers))


def sprite_actor(renderer, pixels):
    """투명 스프라이트를 장면 깊이에 가리지 않고 표시"""
    image = vtk.vtkImageData()
    image.SetDimensions(pixels.shape[1], pixels.shape[0], 1)
    image.GetPointData().SetScalars(numpy_support.numpy_to_vtk(pixels.reshape(-1, 4), deep=True))
    texture = vtk.vtkTexture()
    texture.SetInputData(image)
    texture.InterpolateOn()
    texture.MipmapOn()
    texture.RepeatOff()
    texture.EdgeClampOn()
    texture.SetColorModeToDirectScalars()
    quad = pv.PolyData(np.zeros((4, 3)), faces=[4, 0, 1, 2, 3])
    quad.active_texture_coordinates = np.array([[0, 0], [1, 0], [1, 1], [0, 1]], dtype=np.float32)
    mapper = vtk.vtkPolyDataMapper()
    mapper.SetInputData(quad)
    mapper.ScalarVisibilityOff()
    actor = pv.Actor(mapper=mapper)
    actor.SetTexture(texture)
    actor.prop.color = "white"
    actor.prop.lighting = False
    actor.SetForceTranslucent(True)
    actor.SetPickable(False)
    # 깊이 검사를 통과하도록 스프라이트 깊이를 맨 앞으로 고정
    actor.GetShaderProperty().AddFragmentShaderReplacement(
        "//VTK::Depth::Impl", True, "//VTK::Depth::Impl\n  gl_FragDepth = 0.0;\n", False
    )
    renderer.AddActor(actor)
    return actor, quad


class SourceMarker:
    def __init__(self, scene):
        self.scene = scene
        self.renderer = vtk.vtkRenderer()
        self.renderer.SetLayer(1)
        self.renderer.SetPreserveDepthBuffer(True)
        self.renderer.InteractiveOff()
        self.renderer.SetDraw(False)
        # 확대 캡처의 타일별 카메라 변경을 피하도록 카메라 복사
        self.renderer.AddObserver("StartEvent", self.follow)
        self.foot, self.foot_quad = sprite_actor(self.renderer, foot_sprite())
        self.stem, self.stem_quad = sprite_actor(self.renderer, stem_sprite())
        self.tip, self.tip_quad = sprite_actor(self.renderer, tip_sprite())
        self.head, self.head_quad = sprite_actor(self.renderer, head_sprite())
        self.style, self.point, self.ground = None, np.zeros(3), 0.0
        self.away = self.facing = None
        scene.plotter.ren_win.AddRenderer(self.renderer)

    @property
    def actors(self):
        return [self.foot, self.stem, self.tip, self.head]

    @property
    def visibility(self):
        return self.style is not None and bool(self.renderer.GetDraw())

    @visibility.setter
    def visibility(self, visible):
        self.renderer.SetDraw(bool(visible) and self.style is not None)

    def place(self, style, point=None, ground=None, away=None, facing=None):
        self.style = style
        if point is not None:
            self.point = np.asarray(point, dtype=np.float64)
        if ground is not None:
            self.ground = float(ground)
        self.away = None if away is None else np.asarray(away, dtype=np.float64)
        self.facing = None if facing is None else np.asarray(facing, dtype=np.float64)
        self.renderer.SetDraw(style is not None)

    def follow(self, *_):
        """확대 캡처에도 같은 화면 크기를 유지하도록 카메라 동기화"""
        camera = self.renderer.GetActiveCamera()
        camera.DeepCopy(self.scene.plotter.renderer.GetActiveCamera())
        if self.style is None:
            return
        position, focus = np.asarray(camera.GetPosition()), np.asarray(camera.GetFocalPoint())
        forward = (focus - position) / max(np.linalg.norm(focus - position), 1e-12)
        up = np.asarray(camera.GetViewUp(), dtype=np.float64)
        up = up - (up @ forward) * forward
        up /= max(np.linalg.norm(up), 1e-12)
        right = np.cross(forward, up)
        # 타일별 시야 축소에 맞춰 마커 크기도 배율 보정
        magnify = self.renderer.GetRenderWindow().GetTileScale()[1]

        def pixel(point):
            if camera.GetParallelProjection():
                span = 2 * camera.GetParallelScale()
            else:
                span = (
                    2
                    * max((point - position) @ forward, 1e-6)
                    * np.tan(np.radians(camera.GetViewAngle()) / 2)
                )
            return span * magnify / BASE_HEIGHT

        def square(quad, centre, first, second, size):
            half = size / 2
            quad.points = [centre - first * half - second * half, centre + first * half - second * half,
                           centre + first * half + second * half, centre - first * half + second * half]  # fmt: skip

        point, unit = self.point, pixel(self.point)
        head = point
        shown = {self.head}
        if self.facing is not None and (position - point) @ self.facing <= 0:
            # 배출원 면을 뒤에서 보면 마커 숨김
            shown = set()
        elif self.style == "pin":
            tip, away = point, self.away
            falls = away is not None and away @ up > RISE * np.linalg.norm(away)
            head = tip + (-up if falls else up) * NEEDLE * unit
            square(self.tip_quad, tip, right, up, TIP * unit)
            self.stem_quad.points = [tip - right * STEM * unit / 2, tip + right * STEM * unit / 2,
                                     head + right * STEM * unit / 2, head - right * STEM * unit / 2]  # fmt: skip
            shown |= {self.tip, self.stem}
        elif self.style in ("stem", "post") and point[2] - self.ground > MIN_STEM:
            foot = np.array([point[0], point[1], self.ground])
            side = np.cross(forward, (0.0, 0.0, 1.0))
            if np.linalg.norm(side) > 0.2:
                side /= np.linalg.norm(side)
                width = STEM * unit / 2
                self.stem_quad.points = [
                    foot - side * width,
                    foot + side * width,
                    point + side * width,
                    point - side * width,
                ]
                shown.add(self.stem)
            if self.style == "stem":
                square(self.foot_quad, foot, np.array([1.0, 0, 0]), np.array([0, 1.0, 0]), FOOT * pixel(foot))
                shown.add(self.foot)
        square(self.head_quad, head, right, up, HEAD * unit)
        for actor in self.actors:
            actor.SetVisibility(actor in shown)
        self.renderer.ResetCameraClippingRange()

    def close(self):
        self.scene.plotter.ren_win.RemoveRenderer(self.renderer)
