import numpy as np
import vtk

from modules.domain.transport.pollutants import concentration_label
from modules.visualization.rendering.field_panel import decade_labels
from modules.visualization.rendering.scene_support import FLOWS, LABELS, NUDGE, PLUME_COLOR, set_font


class SceneAnnotations:
    """장면의 주석과 범례 관리"""

    def __init__(self, scene):
        self.scene = scene

    def scalar_bar(self, lut):
        scene = self.scene
        bar = vtk.vtkScalarBarActor()
        bar.SetLookupTable(lut)
        bar.SetNumberOfLabels(5)
        bar.GetPositionCoordinate().SetCoordinateSystemToNormalizedViewport()
        bar.GetPositionCoordinate().SetValue(0.9, 0.25)
        bar.SetWidth(0.08)
        bar.SetHeight(0.5)
        bar.SetBarRatio(0.3)
        bar.DrawBackgroundOn()
        bar.GetBackgroundProperty().SetColor(1, 1, 1)
        bar.GetBackgroundProperty().SetOpacity(0.92)
        bar.SetUnconstrainedFontSize(True)
        for prop, size in (
            (bar.GetTitleTextProperty(), 13),
            (bar.GetLabelTextProperty(), 12),
        ):
            prop.SetFontSize(round(size * scene.scale))
            prop.SetColor(0, 0, 0)
            prop.SetItalic(False)
            prop.SetShadow(False)
            prop.SetBold(False)
            set_font(prop)
        scene.plotter.add_actor(bar, reset_camera=False, render=False)
        return bar

    def place_marker(self):
        scene = self.scene
        layer = scene.plume
        if layer is None or not scene.settings.plume.visible:
            scene.marker.place(None)
            return
        point = layer.plume.source - scene.origin
        if scene.is_map_view:
            point[2] = layer.column_map.projection_height - scene.origin[2]
            downwind = None if scene.wind is None else np.r_[scene.wind[0], 0.0]
            scene.marker.place("pin", point, away=downwind)
        elif scene.is_section_view:
            scene.marker.place("head", point)
        elif scene.is_cube_view and layer.cube is not None:
            scene.marker.place("post", point, layer.ground, facing=layer.cube.facing)
        else:
            scene.marker.place("stem", point, layer.ground)

    def show_wind(self, wind):
        scene = self.scene
        scene.wind = wind
        shown = wind is not None and wind[1] > 0
        scene.dial.show(wind[0] if shown and np.hypot(*wind[0]) > 0 else None)

    def turn_dial(self, *_):
        scene = self.scene
        scene.dial.follow(scene.plotter.camera, scene.plotter.renderer.GetRenderWindow().GetSize())

    def pick(self, x, y):
        """창의 위치 비율(x는 왼쪽 0, y는 위쪽 0)을 유체 쪽 실제 좌표(m)로 변환"""
        scene = self.scene
        cube = scene.plume.cube if scene.is_cube_view and scene.plume is not None else None
        if scene.is_cube_view and cube is None:
            return None
        renderer = scene.plotter.renderer
        window = renderer.GetRenderWindow()
        window.Render()
        width, height = window.GetSize()
        column, line = round(x * (width - 1)), round((1.0 - y) * (height - 1))
        if scene.dial.renderer.GetDraw() and scene.dial.renderer.IsInViewport(column, line):
            return None
        if scene.is_map_view and scene.block_map is not None and scene.block_map.actor.GetVisibility():
            renderer.SetDisplayPoint(column, line, 0.0)
            renderer.DisplayToWorld()
            point = np.array(renderer.GetWorldPoint())
            ground = point[:2] / point[3] + scene.origin[:2]
            height = scene.block_map.surface(*ground)
            if height is None:
                return None
            point = np.array([*ground, height]) - scene.origin
            eye = np.array(scene.plotter.camera.position)
            return point + NUDGE * (eye - point) + scene.origin
        if (
            scene.building is not None
            and scene.building.visibility
            and (scene.is_map_view or scene.settings.buildings.opacity < 1)
        ):
            # 반투명 메시가 깊이를 기록하지 않을 수 있어 원본 형상의 교차점 사용
            picker = vtk.vtkCellPicker()
            picker.PickFromListOn()
            picker.AddPickList(scene.building)
            if scene.pick_locator is None:
                scene.pick_locator = vtk.vtkStaticCellLocator()
                scene.pick_locator.SetDataSet(scene.building.mapper.GetInput())
                scene.pick_locator.BuildLocator()
            picker.AddLocator(scene.pick_locator)
            if not scene.is_map_view:
                for actor in [
                    *(actor for _, _, actor in scene.slices),
                    *(actor for _, actor, _, _ in scene.box or ()),
                ]:
                    if actor.visibility:
                        picker.AddPickList(actor)
            if picker.Pick(column, line, 0, renderer):
                point = np.asarray(picker.GetPickPosition())
                eye = np.array(scene.plotter.camera.position)
                return point + NUDGE * (eye - point) + scene.origin
            return None
        if scene.is_map_view:
            return None
        depth = renderer.GetZ(column, line)
        if not 0.0 < depth < 1.0:
            return None
        renderer.SetDisplayPoint(column, line, depth)
        renderer.DisplayToWorld()
        point = np.array(renderer.GetWorldPoint())
        point = point[:3] / point[3]
        if scene.is_section_view:
            # 투명 셀의 뒤 배경을 고르지 않도록 단면 평면과의 교점 사용
            section = None if scene.plume is None else scene.plume.section
            eye = np.asarray(scene.plotter.camera.position, dtype=float)
            along = point - eye
            if section is not None and abs(along[section.axis]) > 1e-9:
                plane = float(section.position - scene.origin[section.axis])
                point = eye + along * (plane - eye[section.axis]) / along[section.axis]
            bounds = np.asarray(scene.region(scene.settings.roi), dtype=float).reshape(3, 2)
            margin = float(np.max(scene.result.grid.spacing))
            if np.any(point < bounds[:, 0] - margin) or np.any(point > bounds[:, 1] + margin):
                return None
        if cube is not None:
            # 상자 껍질 중 배출원 단면인 앞면만 선택 허용
            # 깊이 오차와 고체 도형 간격을 고려해 셀 크기의 1/4까지 허용
            axis = cube.front.axis
            plane = cube.front.plane - scene.origin[axis]
            if abs(point[axis] - plane) > float(scene.result.grid.spacing[axis]) / 4:
                return None
        eye = np.array(scene.plotter.camera.position)
        return point + NUDGE * (eye - point) + scene.origin

    def annotate(self):
        scene = self.scene
        result, settings = scene.result, scene.settings
        looks = (
            *settings.slices,
            *(getattr(settings, name) for name in FLOWS if name != "arrows"),
        )
        scene.bar.SetVisibility(
            settings.legends and result is not None and any(look.visible for look in looks)
        )
        scene.arrow_bar.SetVisibility(
            settings.legends
            and result is not None
            and settings.arrows.visible
            and scene.arrow_data.n_points > 0
        )
        particle_flow = (
            settings.particles.visible and settings.particles.style == "flow" and scene.particles is not None
        )
        scene.particle_bar.SetVisibility(settings.legends and particle_flow)
        if particle_flow:
            scene.particle_bar.SetLookupTable(scene.particles.lut)
        plume_scope = scene.plume_arrows(settings)
        scene.plume_bar.SetVisibility(
            settings.legends and scene.plume is not None and bool(scene.plume.volume.GetVisibility())
        )
        scene.panel_bar.SetVisibility(settings.legends and scene.shown_panel() is not None)
        scene.label_panel_bar()
        if plume_scope and scene.plume_bar.GetVisibility():
            scene.arrow_bar.SetVisibility(False)
        plume_label = concentration_label(settings.plume.pollutant, settings.plume.transport)
        scene.plume_bar.SetLookupTable(scene.plume_lut)
        scene.plume_bar.SetTitle(f"{plume_label}\n(㎍/㎥)")
        scene.label_plume_bars()
        if result is not None:
            for bar, name, prefix in (
                (scene.bar, settings.quantity, ""),
                (
                    scene.arrow_bar,
                    PLUME_COLOR if plume_scope else settings.arrows.color,
                    "" if plume_scope else "화살표 색: ",
                ),
            ):
                name = name or settings.quantity
                unit, label = (
                    ("㎍/㎥", plume_label)
                    if name == PLUME_COLOR
                    else (result.quantities[name], LABELS.get(name, name))
                )
                separator = "\n" if plume_scope and bar is scene.arrow_bar else " "
                bar.SetTitle(prefix + (f"{label}{separator}({unit})" if unit else label))
        bars = (scene.bar, scene.arrow_bar, scene.particle_bar, scene.plume_bar, scene.panel_bar)
        shown = [bar for bar in bars if bar.GetVisibility()]
        places = {
            1: [(0.25, 0.5)],
            2: [(0.52, 0.4), (0.06, 0.4)],
            3: [(0.68, 0.26), (0.37, 0.26), (0.06, 0.26)],
            4: [(0.77, 0.19), (0.53, 0.19), (0.29, 0.19), (0.05, 0.19)],
        }
        for bar, (bottom, height) in zip(shown, places.get(len(shown), [])):
            bar.GetPositionCoordinate().SetValue(0.9, bottom)
            bar.SetHeight(height)

    def label_panel_bar(self, *_):
        scene = self.scene
        panel = scene.shown_panel() if scene.panel_bar.GetVisibility() else None
        if panel is None:
            return
        legend, colour_range, title, ticks = panel
        key = (id(legend), tuple(colour_range), title, None if ticks is None else ticks[0].GetMTime())
        if key == scene.panel_bar_key:
            return
        scene.panel_bar_key = key
        scene.panel_bar.SetLookupTable(legend)
        labels, form = decade_labels(colour_range) if ticks is None else ticks
        scene.panel_bar.SetCustomLabels(labels)
        scene.panel_bar.SetLabelFormat(form)
        name, _, unit = title.rpartition(" (")
        scene.panel_bar.SetTitle(f"{name}\n({unit}" if name else title)

    def label_plume_bars(self, *_):
        scene = self.scene
        for name, bar, lut in (
            ("plume", scene.plume_bar, scene.plume_lut),
            ("arrow", scene.arrow_bar, scene.arrow_lut),
        ):
            if not bar.GetVisibility():
                continue
            colour_range = tuple(lut.GetRange())
            key = (lut.GetScale() == vtk.VTK_SCALE_LOG10, colour_range)
            if key == scene.plume_bar_keys.get(name):
                continue
            scene.plume_bar_keys[name] = key
            if not (key[0] and 0 < colour_range[0] < colour_range[1]):
                bar.SetUseCustomLabels(False)
                bar.SetLabelFormat(scene.bar_format)
                continue
            labels, form = decade_labels(colour_range)
            bar.SetUseCustomLabels(True)
            bar.SetCustomLabels(labels)
            bar.SetLabelFormat(form)

    def shown_panel(self):
        """표시 패널의 (색표, 로그 범위, 제목, 눈금)이며 없으면 None"""
        scene = self.scene
        layer = scene.plume
        if layer is None:
            return None
        if scene.is_iso_view and layer.shells is not None and layer.shells.legend is not None:
            shells = layer.shells
            return shells.legend, shells.legend_range, shells.colour_label, shells.ticks
        if (scene.is_field_view or scene.is_iso_view) and layer.field is not None:
            field = layer.field
            return field.legend, field.range, field.colour_label, None
        if scene.is_map_view:
            panel = layer.column_map.panel
        elif scene.is_section_view and layer.section is not None:
            panel = layer.section.panel
        elif scene.is_cube_view and layer.cube is not None:
            return layer.cube.legend, layer.cube.range, layer.cube.colour_label, None
        else:
            return None
        return panel.legend, panel.range, panel.colour_label, None
