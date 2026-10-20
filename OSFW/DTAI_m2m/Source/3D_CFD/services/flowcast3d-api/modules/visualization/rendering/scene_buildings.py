from contextlib import contextmanager
from zipfile import BadZipFile

from modules.visualization.geometry import citytexture
from modules.visualization.geometry.citymesh import MeshNotPrepared
from modules.visualization.rendering import layers
from modules.visualization.rendering.block_map import BlockMap
from modules.visualization.rendering.scene_support import (
    AMBIENT,
    BUILDING_COLOR,
    DIFFUSE,
    INTERACTION_MESH_BYTES,
    PHOTO_AMBIENT,
    PHOTO_DIFFUSE,
    PHOTO_FLOW,
    interaction_proxy,
    log,
    photo_buildings,
)


class SceneBuildings:
    """장면의 건물 형상과 텍스처 관리"""

    def __init__(self, scene):
        self.scene = scene

    def textured(self, new):
        scene = self.scene
        if new.plume.visible and new.plume.footprint:
            return False
        if not (new.buildings.texture and new.buildings.geometry == "mesh" and scene.has_textures):
            return False
        if scene.textures is None:
            try:
                scene.textures = citytexture.TexturedCity.open(scene.city.case_dir, scene.case)
            except MeshNotPrepared:
                scene.textures = False
        return bool(scene.textures)

    def preload_buildings(self, new):
        """렌더 창 없이 텍스처를 미리 읽어 이벤트 루프 지연 방지"""
        scene = self.scene
        if scene.textured(new):
            scene.preloaded = (new.roi, photo_buildings(scene.textures, scene.matrix, scene.origin, new.roi))

    def build_buildings(self, new):
        """기하를 모두 읽은 뒤 교체하여 읽기 실패 시 기존 장면 유지"""
        scene = self.scene
        texture, textured = None, scene.textured(new)
        if textured:
            preloaded, scene.preloaded = scene.preloaded, None
            if preloaded is not None and preloaded[0] == new.roi:
                mesh, texture = preloaded[1]
            else:
                mesh, texture = photo_buildings(scene.textures, scene.matrix, scene.origin, new.roi)
        elif scene.city is not None and new.buildings.geometry == "mesh":
            mesh = scene.city.load(scene.matrix, scene.origin, new.roi, new.buildings.lod)
        else:
            solid, edges = scene.result.mask_volume(new.roi, new.max_cells)
            mesh = layers.mask_surface(solid, [edge - o for edge, o in zip(edges, scene.origin)])
        # 준비된 저해상도 메시를 한 번 읽어 마우스 조작 중에만 재사용
        coarse = None
        if not textured and scene.city is not None and new.buildings.geometry == "mesh":
            level = len(scene.city.index["lods"]) - 1
            try:
                coarse = mesh
                if level > new.buildings.lod:
                    coarse = scene.city.load(
                        scene.matrix, scene.origin, new.roi, level, max_bytes=INTERACTION_MESH_BYTES
                    )
                coarse = interaction_proxy(coarse)
            except (OSError, MemoryError, ValueError, EOFError, BadZipFile) as error:
                log.warning("interactive building detail is unavailable: %s", error)
            if coarse is not None and not 0 < coarse.n_cells < mesh.n_cells:
                coarse = None

        # 원본 액터의 모양과 재질은 유지하고 표시 입력만 교체
        if scene.building is not None:
            scene.plotter.remove_actor(scene.building, reset_camera=False, render=False)
        scene.building = scene.building_mesh = scene.building_coarse = None
        scene.pick_locator = None
        scene.building_textured = textured
        if mesh.n_points:
            scene.building = scene.plotter.add_mesh(
                mesh,
                color=None if texture is not None else BUILDING_COLOR,
                texture=texture,
                name="buildings",
                reset_camera=False,
                render=False,
            )
            light = (PHOTO_AMBIENT, PHOTO_DIFFUSE) if texture is not None else (AMBIENT, DIFFUSE)
            scene.building.prop.ambient, scene.building.prop.diffuse = light
            scene.building_mesh, scene.building_coarse = scene.building.mapper.GetInput(), coarse
            scene.set_interacting(scene.interacting)

    def set_interacting(self, active):
        """조작 중에는 준비된 저해상도 메시를 사용하고 종료 시 원본 입력 복원"""
        scene = self.scene
        scene.interacting = bool(active)
        if scene.building is not None and scene.building_mesh is not None:
            mesh = (
                scene.building_coarse
                if scene.interacting and scene.building_coarse is not None
                else scene.building_mesh
            )
            if scene.building.mapper.GetInput() is not mesh:
                scene.building.mapper.SetInputData(mesh)

    @contextmanager
    def full_detail(self):
        """캡처에는 조작 상태와 관계없이 원본 메시를 사용"""
        scene = self.scene
        active = scene.interacting
        scene.set_interacting(False)
        try:
            yield
        finally:
            scene.set_interacting(active)

    def lay_block_map(self, shown):
        scene = self.scene
        if scene.building is not None:
            scene.building.visibility = bool(scene.settings.buildings.visible) and not shown
        if not shown:
            if scene.block_map is not None:
                scene.block_map.show(False)
            return
        bounds = tuple((float(edge[0]), float(edge[-1])) for edge in scene.plume.column_map.panel.edges)
        if scene.block_map is None or scene.block_map.bounds != bounds:
            if scene.block_map is not None:
                scene.block_map.close()
            plane = scene.plume.column_map.projection_height - scene.origin[2] - 0.1
            scene.block_map = BlockMap(scene, scene.levels, scene.result.grid, bounds, plane)
        scene.block_map.show(True)

    def style_buildings(self, new):
        scene = self.scene
        if scene.building is not None:
            flow = new.particles.visible and new.particles.style == "flow"
            if scene.building_textured:
                scene.building.prop.color = PHOTO_FLOW if flow else "white"
            else:
                scene.building.prop.color = "#525c68" if flow else BUILDING_COLOR
            scene.building.visibility = new.buildings.visible
            scene.building.prop.opacity = new.buildings.opacity
            scene.building.SetForceOpaque(new.buildings.opacity >= 1)
            # 반투명 건물과 등가면의 앞뒤 순서를 맞추도록 깊이 벗기기 사용
            if new.plume.visible and new.plume.section and scene.plotter.renderer.GetUseDepthPeeling():
                scene.plotter.disable_depth_peeling()
            peeled = new.buildings.opacity < 1 or (new.plume.visible and new.plume.shells.visible)
            if peeled and not scene.plotter.renderer.GetUseDepthPeeling():
                window = scene.plotter.renderer.GetRenderWindow()
                window.SetAlphaBitPlanes(1)
                window.SetMultiSamples(0)
                scene.plotter.enable_depth_peeling(number_of_peels=8, occlusion_ratio=0.05)
