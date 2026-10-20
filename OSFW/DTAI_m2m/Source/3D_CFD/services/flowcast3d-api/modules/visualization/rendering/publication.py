import io
import json
import math
from numbers import Integral
from pathlib import Path

from PIL import Image, PngImagePlugin

from modules.infrastructure.mongo.assets import discard_export, export_target, persist_outputs, read_settings
from modules.infrastructure.mongo.storage import open_group, store_exists
from modules.settings.rendering import RenderSettings as Settings
from modules.visualization.geometry.citymesh import CityMesh, MeshNotPrepared
from modules.visualization.media.capture import MAX_PIXELS, capture_png, capture_settings
from modules.visualization.readers.adapter import DataAdapter, FlowResult
from modules.visualization.rendering.scene import Scene
from modules.visualization.rendering.scene_support import PLUME_COLOR
from modules.visualization.rendering.settings import Plume, SceneSettings


def render_publication(args):
    """저장한 장면 설정과 고정 범위로 발표용 PNG 내보내기"""
    size = (args.width, args.height)
    if any(isinstance(n, bool) or not isinstance(n, Integral) or not 1 <= n <= 4096 for n in size):
        raise ValueError("Image dimensions must be integers from 1 to 4096.")
    if math.prod(size) > MAX_PIXELS:
        raise ValueError("Output image exceeds the 16-megapixel limit.")
    output = Path(args.output).expanduser().resolve()
    if output.suffix.lower() != ".png":
        raise ValueError("Output file must use the .png extension.")
    saved = (
        SceneSettings.model_validate_json(read_settings(args.settings_file)) if args.settings_file else None
    )
    if saved is not None and saved.case_id != args.case_id:
        raise ValueError("Saved scene settings do not match the requested case.")
    output = export_target(output)
    adapter, scene = DataAdapter(Settings.from_env()), None
    try:
        case = adapter.case(args.case_id)
        logical_dir = adapter.settings.case_dir(case.id)
        source = (logical_dir / case.flow.source).resolve() if case.flow else None
        path = Path(args.result).expanduser().resolve() if args.result else source
        if path is None:
            raise ValueError("Case has no initial flow field. Specify a store with --result.")
        if not store_exists(path):
            raise FileNotFoundError(f"Flow store was not found: {path}")
        group = open_group(path, mode="r")
        provenance = group.attrs.get("provenance") or {}
        if provenance.get("case_id") not in (None, case.id):
            raise ValueError("Result store does not match the requested case.")
        job_id = None if path == source else provenance.get("job_id") or path.name.removesuffix(".zarr")
        metadata = adapter.store_metadata(case, path, job_id=job_id)
        result = FlowResult(metadata, case, path, adapter.cache, adapter.executor, adapter.settings.max_cells)
        if result.n_frames == 0:
            raise ValueError("No completed flow frames are available.")
        if saved is not None and saved.job_id != metadata.job_id:
            raise ValueError(
                "Saved scene settings do not match the selected result job. Specify the original --result."
            )
        frame = args.frame
        if frame is None:
            frame = (
                saved.frame
                if saved is not None
                else (metadata.history_frames if metadata.completed_steps else 0)
            )
        if isinstance(frame, bool) or not isinstance(frame, Integral) or not 0 <= frame < result.n_frames:
            raise ValueError(f"Frame must be an integer from 0 to {result.n_frames - 1}.")
        initial = (
            saved.model_copy(deep=True)
            if saved is not None
            else SceneSettings(
                case_id=case.id, job_id=metadata.job_id, plume=Plume(visible=False, transport="prediction")
            )
        )
        initial.frame = int(frame)
        try:
            case_dir = adapter.asset_directory(case) if case.mesh else logical_dir
            city = CityMesh.open(case_dir, case) if case.mesh else None
        except MeshNotPrepared:
            city = None
        scene = Scene(
            case,
            result,
            city=city,
            settings=initial,
            live=True,
            window_size=size,
            mesh_bytes=adapter.settings.mesh_mb * 2**20,
        )
        if saved is None:
            base = scene.default_settings()
            base.frame = int(frame)
            base.plume.transport = "prediction"
            base.dynamic_wind.enabled = False
            scene.update(base)
            scene.update(scene.presentation_settings(args.preset))
        if getattr(args, "texture", False):
            look = scene.settings.model_copy(deep=True)
            look.buildings.texture = True
            scene.update(look)
        look = scene.settings.buildings
        if look.texture and look.geometry == "mesh" and city is not None and not scene.building_textured:
            raise ValueError("Photo texture cache was not found. Run prepare-mesh --textures first.")
        target = min(scene.settings.frame + scene.settings.phase, result.n_frames - 1)
        start = (
            min(max(0, metadata.history_frames - 1), target)
            if args.release_start is None
            else float(args.release_start)
        )
        if not math.isfinite(start) or not 0 <= start <= target:
            raise ValueError(f"Release start must be a frame position from 0 to {target:g}.")
        look = scene.settings
        transport = look.plume.visible and (
            look.plume.cloud
            or look.plume.field
            or look.plume.shells.visible
            or look.plume.footprint
            or look.plume.section
            or look.plume.cube
            or (look.arrows.visible and (scene.plume_arrows(look) or look.arrows.color == PLUME_COLOR))
        )
        if transport and scene.plume is not None:
            scene.plume.follow(start, target, result.metadata.time_step)
            scene.plume.draw()
            scene.refresh_plume_arrows()
        if saved is None or saved.camera is None:
            scene.fit_presentation(args.preset)
        # 레이어 준비 후 깊이 범위를 고정하여 입자와 건물 경계 재현
        scene.plotter.reset_camera_clipping_range()
        saved_scene = capture_settings(scene)
        content = capture_png(scene, scale=1, caption=True)
        with Image.open(io.BytesIO(content)) as image:
            recorded = json.loads(image.info["flowcast"])
            recorded["settings"] = saved_scene.model_dump(mode="json")
            recorded["publication"] = {
                "preset": args.preset if saved is None else None,
                "release_start": float(start) if transport else None,
                "release_target": float(target) if transport else None,
                "time_step_seconds": result.metadata.time_step,
                "settings_file": str(Path(args.settings_file).expanduser().resolve())
                if args.settings_file
                else None,
                "flow_particle_initialization": (
                    "Deterministic seeding near the requested frame, integrated through available original frames; earlier interactive history is not reconstructed."
                    if recorded["flow_particles"] is not None
                    else None
                ),
            }
            info = PngImagePlugin.PngInfo()
            info.add_text("flowcast", json.dumps(recorded, ensure_ascii=False, allow_nan=False))
            buffer = io.BytesIO()
            image.save(buffer, format="PNG", pnginfo=info, dpi=(300, 300))
            content = buffer.getvalue()
        paths = {
            "image": output,
            "settings": output.with_suffix(".scene.json"),
            "metadata": output.with_suffix(".metadata.json"),
        }
        output.parent.mkdir(parents=True, exist_ok=True)
        paths["settings"].write_text(saved_scene.model_dump_json(indent=2) + "\n", encoding="utf-8")
        paths["metadata"].write_text(
            json.dumps(recorded, ensure_ascii=False, allow_nan=False, indent=2) + "\n", encoding="utf-8"
        )
        output.write_bytes(content)
        return persist_outputs(paths, case.id)
    finally:
        if scene is not None:
            scene.close()
        adapter.close()
        discard_export(output)
