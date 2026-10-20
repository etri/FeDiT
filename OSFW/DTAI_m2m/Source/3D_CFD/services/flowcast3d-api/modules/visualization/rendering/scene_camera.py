import itertools
import math

import numpy as np
import pyvista as pv

from modules.visualization.rendering.scene_support import (
    CUBE_VIEW,
    CUBE_ZOOM,
    DIRECTION,
    FAINT,
    FIGURES,
    LEGEND_EDGE,
    NARROW,
    PANEL_VIEW,
    SECTION_ANGLE,
    SECTION_EYE,
    STREAM_VIEW,
)
from modules.visualization.rendering.settings import Camera


class SceneCamera:
    """장면의 카메라와 시야 관리"""

    def __init__(self, scene):
        self.scene = scene

    def panel_view(self):
        scene = self.scene
        if scene.is_map_view:
            panel = scene.plume.column_map.panel if scene.plume is not None else None
            return panel, np.array([0.0, 0.0, 1.0]), np.array([0.0, 1.0, 0.0])
        section = scene.plume.section if scene.plume is not None else None
        if scene.is_section_view and section is not None:
            return section.panel, np.asarray(section.facing, dtype=float), np.array([0.0, 0.0, 1.0])
        return None

    def section_eye(self):
        scene = self.scene
        section = None if scene.plume is None else scene.plume.section
        if section is None:
            return None
        axis = section.axis
        plane = float(section.position - scene.origin[axis])
        depth = float(scene.extent[axis])
        ahead = depth - plane if section.facing[axis] > 0 else plane
        return max(ahead, 0.0) + SECTION_EYE * depth

    def align_section_camera(self, direction, up, eye):
        """카메라 거리는 고정하고 시야각으로 확대하여 원근 유지"""
        scene = self.scene
        camera = scene.plotter.camera
        focus = np.asarray(camera.focal_point)
        offset = np.asarray(camera.position) - focus
        distance = float(np.linalg.norm(offset))
        straight = np.allclose(np.cross(offset, direction), 0, atol=1e-9) and offset @ direction > 0
        perspective = straight and not camera.parallel_projection
        half = (
            distance * math.tan(math.radians(camera.view_angle) / 2) if perspective else camera.parallel_scale
        )
        half = max(float(half), 1e-6)
        eye = max(eye, half / math.tan(math.radians(SECTION_ANGLE) / 2))
        if perspective and abs(distance - eye) <= 1e-9 * eye and np.allclose(camera.up, up, atol=1e-9):
            return
        camera.parallel_projection = False
        camera.position = tuple(focus + np.asarray(direction) * eye)
        camera.up = tuple(up)
        camera.view_angle = math.degrees(2 * math.atan(half / eye))
        camera.parallel_scale = half
        scene.plotter.renderer.reset_camera_clipping_range()

    def align_map_camera(self, *_):
        """패널 정면 투영을 유지하며 이동과 확대 보존"""
        scene = self.scene
        view = scene.panel_view()
        if view is None:
            return
        panel, direction, up = view
        eye = scene.section_eye() if scene.is_section_view else None
        if eye is not None:
            scene.align_section_camera(direction, up, eye)
            return
        camera = scene.plotter.camera
        focus = np.asarray(camera.focal_point)
        offset = np.asarray(camera.position) - focus
        boxes = [(np.zeros(3), np.asarray(scene.extent, dtype=float))]
        if panel is not None:
            boxes.append((np.asarray(panel.bounds[::2]), np.asarray(panel.bounds[1::2])))
        front = max(float(np.maximum(low * direction, high * direction).sum()) for low, high in boxes)
        aligned = camera.parallel_projection and np.allclose(np.cross(offset, direction), 0, atol=1e-9)
        aligned = aligned and offset @ direction > 0 and np.allclose(camera.up, up, atol=1e-9)
        if aligned and np.asarray(camera.position) @ direction > front:
            return
        distance = float(np.linalg.norm(offset))
        if not camera.parallel_projection:
            camera.parallel_scale = max(distance * math.tan(math.radians(camera.view_angle) / 2), 1e-6)
        distance = max(
            distance, front - focus @ direction + max(1.0, float(np.abs(direction) @ scene.extent))
        )
        camera.parallel_projection = True
        camera.position = tuple(focus + direction * distance)
        camera.up = tuple(up)
        scene.plotter.renderer.reset_camera_clipping_range()

    def region(self, roi):
        """관심 영역의 장면 좌표 범위 [xmin, xmax, ymin, ymax, zmin, zmax]"""
        scene = self.scene
        if roi is None:
            return np.column_stack([np.zeros(3), scene.extent]).ravel()
        return (np.sort(np.array(roi, dtype=np.float64), axis=0) - scene.origin).T.ravel()

    def fit(self, bounds, direction=DIRECTION, view_up=(0, 0, 1)):
        scene = self.scene
        scene.plotter.view_vector(direction, viewup=view_up)
        scene.plotter.reset_camera(bounds=bounds)
        renderer, reach = scene.plotter.renderer, 0.0
        # 브라우저의 창 비율이 다를 수 있어 생성 당시 비율은 사용하지 않음
        aspect = renderer.GetTiledAspectRatio()
        for corner in itertools.product(bounds[:2], bounds[2:4], bounds[4:]):
            renderer.SetWorldPoint(*corner, 1.0)
            renderer.WorldToView()
            across, up, _ = renderer.GetViewPoint()
            reach = max(reach, abs(up), 0.97 * abs(across) * aspect / (0.8 * NARROW))
        scene.plotter.camera.zoom(0.97 / reach)
        scene.plotter.renderer.reset_camera_clipping_range()
        return scene.camera()

    def focus_flow(self, world_points=None):
        """배출원과 흐름에 카메라만 맞추며 계산 영역과 이력 유지"""
        scene = self.scene
        if not scene.velocity:
            return
        source = np.asarray(scene.plume_source(scene.settings)) - scene.origin
        points = source[None, :]
        if world_points is not None:
            points = np.vstack(
                (
                    points,
                    np.asarray(world_points, dtype=np.float64).reshape(-1, 3) - scene.origin,
                )
            )
        else:
            if scene.plume is not None and len(scene.plume.plume.points):
                points = np.vstack((points, scene.plume.plume.points - scene.origin))
            if scene.arrow_path_data.n_points:
                points = np.vstack((points, scene.arrow_path_data.points))
        points = points[np.isfinite(points).all(axis=1)]
        low, high = points.min(axis=0), points.max(axis=0)
        spacing = np.asarray(scene.result.grid.spacing)
        padding = np.maximum(0.22 * (high - low), 4 * spacing)
        centre = 0.5 * (low + high)
        half = np.maximum(0.5 * (high - low) + padding, np.maximum([14.0, 12.0, 8.0], 6 * spacing))
        region = np.asarray(scene.region(scene.settings.roi)).reshape(3, 2)
        bounds = np.column_stack(
            (
                np.maximum(centre - half, region[:, 0]),
                np.minimum(centre + half, region[:, 1]),
            )
        )
        camera = scene.plotter.camera
        direction = np.asarray(camera.position) - camera.focal_point
        camera.parallel_projection = scene.is_map_view
        if scene.is_map_view:
            bounds[2] = region[2]
            if scene.plume is not None:
                bounds[2, 1] = max(
                    bounds[2, 1],
                    scene.plume.column_map.projection_height - scene.origin[2],
                )
            scene.fit(bounds.ravel(), direction=(0, 0, 1), view_up=(0, 1, 0))
        else:
            scene.fit(bounds.ravel(), direction=direction, view_up=camera.up)
        scene.plotter.camera.zoom(0.86)
        scene.focus_bounds = tuple(tuple(point) for point in (bounds.T + scene.origin))

    def fit_building_flow(self, direction=DIRECTION):
        scene = self.scene
        scene.fit(scene.region(scene.settings.roi), direction=direction)
        shapes = []
        if scene.settings.arrows.visible:
            shapes.extend((scene.arrow_data.points, scene.arrow_path_data.points))
        look = scene.settings.plume
        if scene.plume is not None and scene.plume.field is not None and look.visible:
            drawn = look.field or look.shells.visible
            shown = scene.plume.field.shown_bounds(scene.plume.field.peak * FAINT) if drawn else None
            if shown is not None:
                shapes.append(np.array(np.meshgrid(*shown.T, indexing="ij")).reshape(3, -1).T)
        if scene.settings.particles.visible and scene.particles is not None:
            shapes.extend(
                pv.wrap(actor.mapper.GetInput()).points
                for actor in getattr(scene.particles, "actors", (scene.particles.actor,))
                if actor.visibility
            )
        if scene.building is not None and scene.building.visibility:
            shapes.append(pv.wrap(scene.building.mapper.GetInput()).points)
        shapes = [np.asarray(points) for points in shapes if len(points)]
        if not shapes:
            return
        camera = scene.plotter.camera
        aspect = scene.plotter.renderer.GetTiledAspectRatio()

        def projected_bounds():
            transform = camera.GetCompositeProjectionTransformMatrix(aspect, -1, 1)
            matrix = np.array([[transform.GetElement(i, j) for j in range(4)] for i in range(4)])
            low, high = np.full(2, np.inf), np.full(2, -np.inf)
            for points in shapes:
                for start in range(0, len(points), 65536):
                    chunk = points[start : start + 65536]
                    weight = chunk @ matrix[3, :3] + matrix[3, 3]
                    projected = (chunk @ matrix[:2, :3].T + matrix[:2, 3]) / weight[:, None]
                    valid = np.isfinite(projected).all(axis=1) & (weight > 0)
                    if valid.any():
                        low = np.minimum(low, projected[valid].min(axis=0))
                        high = np.maximum(high, projected[valid].max(axis=0))
            return low, high, matrix

        # 카메라와 초점을 함께 옮겨 저장된 Camera만으로 시야 재현
        for _ in range(2):
            low, high, matrix = projected_bounds()
            if not np.isfinite([low, high]).all():
                return
            focal = np.asarray(camera.focal_point)
            clip = matrix @ np.r_[focal, 1.0]
            centre = np.linalg.solve(matrix, np.r_[0.5 * (low + high), clip[2] / clip[3], 1.0])
            shift = centre[:3] / centre[3] - focal
            camera.position = tuple(np.asarray(camera.position) + shift)
            camera.focal_point = tuple(focal + shift)
        low, high, _ = projected_bounds()
        reach = np.maximum(np.abs(low), np.abs(high))
        room = np.array([0.76 if scene.settings.legends else 0.9, 0.84])
        zoom = float(np.min(room / np.maximum(reach, 1e-6)))
        # 원근 확대율을 맞추기 위해 시야각이 아닌 tan(시야각/2)에 배율 적용
        camera.view_angle = np.degrees(2 * np.arctan(np.tan(np.radians(camera.view_angle) / 2) / zoom))
        scene.plotter.renderer.reset_camera_clipping_range()

    def fit_presentation(self, mode):
        scene = self.scene
        scene.plotter.camera.parallel_projection = mode == "city"
        section = scene.plume.section if scene.plume is not None else None
        if mode == "city" and scene.plume is not None:
            scene.fit_panel(scene.plume.column_map.panel.bounds, (0, 0, 1), (0, 1, 0))
        elif mode == "city":
            scene.fit(scene.region(scene.settings.roi), direction=(0, 0, 1), view_up=(0, 1, 0))
            scene.plotter.camera.zoom(0.80)
        elif mode in ("plume", "city3d"):
            scene.focus_flow()
        elif mode in FIGURES:
            scene.fit_building_flow(STREAM_VIEW if mode == "stream" else DIRECTION)
        elif mode == "section" and section is not None:
            scene.fit_panel(section.panel.bounds, section.facing, (0, 0, 1), scene.section_eye())
        elif mode == "cube" and scene.plume is not None and scene.plume.cube is not None:
            cube = scene.plume.cube
            front, downwind, up = CUBE_VIEW
            direction = front * cube.facing + downwind * cube.downwind + (0.0, 0.0, up)
            scene.fit(cube.bounds, direction=direction)
            scene.plotter.camera.zoom(CUBE_ZOOM)
        else:
            scene.fit(scene.region(scene.settings.roi))

    def fit_panel(self, bounds, direction, view_up, eye=None):
        scene = self.scene
        camera, renderer = scene.plotter.camera, scene.plotter.renderer
        low, high = np.asarray(bounds[::2], dtype=float), np.asarray(bounds[1::2], dtype=float)
        forward = -np.asarray(direction, dtype=float) / np.linalg.norm(direction)
        up = np.asarray(view_up, dtype=float)
        right = np.cross(forward, up)
        size = high - low
        width, height = abs(size @ right), abs(size @ up)
        aspect = renderer.GetTiledAspectRatio()
        (left, bottom), (end, top) = PANEL_VIEW
        if scene.settings is not None and scene.settings.legends:
            end = min(end, LEGEND_EDGE)
        half = max(width / (2 * (end - left) * aspect), height / (2 * (top - bottom)))
        shift = (0.5 - (left + end) / 2) * 2 * half * aspect * right + (
            0.5 - (bottom + top) / 2
        ) * 2 * half * up
        focus = (low + high) / 2 + shift
        if eye is None:
            distance = half / math.tan(math.radians(camera.view_angle) / 2)
        else:
            distance = eye
            camera.view_angle = math.degrees(2 * math.atan(half / eye))
        camera.focal_point = tuple(focus)
        camera.position = tuple(focus - forward * distance)
        camera.up = tuple(up)
        camera.parallel_projection = eye is None
        camera.parallel_scale = half
        renderer.reset_camera_clipping_range()

    def camera(self):
        """실제 좌표 기준의 카메라 반환"""
        scene = self.scene
        camera = scene.plotter.camera
        return Camera(
            position=tuple(np.array(camera.position) + scene.origin),
            focal_point=tuple(np.array(camera.focal_point) + scene.origin),
            view_up=tuple(camera.up),
            view_angle=camera.view_angle,
            parallel_projection=bool(camera.parallel_projection),
            parallel_scale=float(camera.parallel_scale),
        )
