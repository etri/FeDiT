import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { Canvas } from "@react-three/fiber";
import { Link } from "react-router-dom";
import { GizmoHelper, GizmoViewport, Grid, Html } from "@react-three/drei";
import { Crosshair, Maximize, RotateCcw } from "lucide-react";
import { DoubleSide, Mesh, ShaderMaterial } from "three";
import { Button } from "../../components/ui/button";
import { Empty, Failure } from "../../components/ui/status";
import { useWorkspace } from "../../stores/workspace";
import type { Scene, SceneAsset } from "./types";
import type { Bounds, Dataset } from "../datasets/types";
import { useScene } from "./api";
import { GraphicsBoundary, GraphicsLifecycle } from "./GraphicsBoundary";
import { ScenePortal } from "./ScenePortal";
import { SceneLoading } from "./SceneLoading";
import { AssetProgressContext, useSceneProgress } from "./loading";
import { PointCloud } from "./PointCloud";
import { Geometry, CityTiles } from "./Geometry";
import { Volume } from "./Volume";
import { VolumeSequence } from "./VolumeSequence";
import type { PreparedPlaybackState } from "./usePreparedPlayback";
import { CameraControls } from "./CameraControls";
import { SourcePicker } from "./SourcePicker";
import { ViewCompass } from "./ViewCompass";
import { SceneBounds, SceneBoundsToggle } from "./SceneBounds";
import { SceneDisplayMode } from "./SceneDisplayMode";
import { usePreparedViewStore } from "./preparedViewStore";
import { usePlaybackTransport } from "./playbackTransport";
import { getContourLevels } from "./contourLevels";
import { SceneExport, SceneExportRenderer } from "./SceneExport";
import type { SceneExportRenderer as ExportRenderer } from "./sceneExport";

const unsupportedGraphics = new Error("WebGL 2 is unavailable.");

function layerKey(scene: Scene) {
  return JSON.stringify([
    scene.contextKey,
    scene.assets,
    scene.range,
    scene.time,
  ]);
}
function RoiBox({ scene }: { scene: Scene }) {
  const roi = useWorkspace((state) => state.roi);
  if (!roi) return null;
  const center = roi.min.map(
    (value, index) => (value + roi.max[index]) / 2 - scene.origin[index],
  ) as [number, number, number];
  const scale = roi.min.map((value, index) => roi.max[index] - value) as [
    number,
    number,
    number,
  ];
  return (
    <mesh position={center} scale={scale}>
      <boxGeometry />
      <meshBasicMaterial color="#2556e8" wireframe transparent opacity={0.65} />
    </mesh>
  );
}
function BackgroundGrid({ scene }: { scene: Scene }) {
  const grid = useRef<Mesh>(null);
  useLayoutEffect(() => {
    const material = grid.current?.material;
    if (!(material instanceof ShaderMaterial)) return;
    const vertexShader = material.vertexShader;
    const depthWrite = material.depthWrite;

    // 격자를 배경 깊이에 배치하여 모든 시점에서 모형을 우선 표시
    material.vertexShader = `${vertexShader.replace(/void\s+main\s*\(\s*\)/, "void gridPosition()")}
      void main() { gridPosition(); gl_Position.z = gl_Position.w; }`;
    material.depthWrite = false;
    material.needsUpdate = true;
    return () => {
      material.vertexShader = vertexShader;
      material.depthWrite = depthWrite;
      material.needsUpdate = true;
    };
  }, []);
  return (
    <Grid
      ref={grid}
      args={[2, 2]}
      side={DoubleSide}
      onUpdate={(mesh) => mesh.updateWorldMatrix(true, false)}
      renderOrder={-1}
      rotation={[Math.PI / 2, 0, 0]}
      cellSize={10}
      sectionSize={50}
      cellColor="#d4dce6"
      sectionColor="#b4c2d3"
      position={[0, 0, scene.bounds[0][2] - scene.origin[2] - 0.02]}
      fadeDistance={1500}
      infiniteGrid
      followCamera
    />
  );
}
function SceneLayer({
  scene,
  assets = scene.assets,
  visible = true,
  sourcePickable = false,
  onPick,
  onReady,
  pointSize,
  clipBounds,
}: {
  scene: Scene;
  assets?: SceneAsset[];
  visible?: boolean;
  sourcePickable?: boolean;
  onPick: (position: [number, number, number]) => void;
  onReady: (count: number) => void;
  pointSize: number;
  clipBounds?: Bounds;
}) {
  return (
    <group visible={visible} userData={{ sourcePickable }}>
      {assets.map((asset) =>
        asset.kind === "geometry" ? (
          <Geometry
            key={asset.url}
            asset={asset}
            scene={scene}
            clipBounds={clipBounds}
          />
        ) : asset.kind === "tiles" ? (
          <CityTiles
            key={asset.url}
            asset={asset}
            scene={scene}
            clipBounds={clipBounds}
          />
        ) : asset.kind === "volume" ? (
          <Volume key={asset.url} asset={asset} scene={scene} />
        ) : (
          <PointCloud
            key={asset.url}
            asset={asset}
            scene={scene}
            onPick={onPick}
            onReady={onReady}
            pointSize={pointSize}
          />
        ),
      )}
    </group>
  );
}
export function SceneCanvas({
  dataset,
  preparedPlayback,
  onBufferingChange,
}: {
  dataset?: Dataset;
  preparedPlayback?: PreparedPlaybackState;
  onBufferingChange?: (buffering: boolean) => void;
}) {
  const canRender = typeof WebGL2RenderingContext !== "undefined";
  const continuous = Boolean(preparedPlayback?.key);
  const field = useScene(dataset, false, continuous),
    geometry = useScene(dataset, true),
    state = useWorkspace();
  const retained = usePreparedViewStore();
  const related =
    retained.datasetId === state.datasetId &&
    retained.roi === JSON.stringify(state.roi) &&
    dataset?.version ===
      (state.resultId === retained.resultId
        ? retained.resultVersion
        : retained.views?.wind?.dataset.version) &&
    (state.resultId === retained.resultId ||
      state.resultId === retained.views?.wind?.resultId);
  const preparedViews = related ? retained.views : undefined;
  const volumeClip = preparedPlayback?.clip ?? preparedViews?.playback;
  const [samples, setSamples] = useState(0),
    [graphicsError, setGraphicsError] = useState<Error>(),
    [canvasKey, setCanvasKey] = useState(0),
    [preparedVolumeKey, setPreparedVolumeKey] = useState("");
  const volumeKey = volumeClip ? `${volumeClip.key}:${canvasKey}` : "";
  const displayKey = `${volumeKey}:${state.mode}`;
  const sequenceReady = Boolean(volumeKey && preparedVolumeKey === displayKey);
  const renderedSequence = useRef({ key: "", time: 0, mix: 0, draws: 0 });
  const sequenceFrame = useCallback(
    (
      time: number,
      mix: number,
      stats?: { cityCaptures: number; depthCaptures: number },
    ) => {
      const count =
        renderedSequence.current.key === volumeKey
          ? renderedSequence.current.draws + 1
          : 1;
      renderedSequence.current = { key: volumeKey, time, mix, draws: count };
      if (host.current) {
        host.current.dataset.renderedTime = String(time);
        host.current.dataset.volumeMix = String(mix);
        host.current.dataset.volumeDraws = String(count);
        if (stats) {
          host.current.dataset.cityCaptures = String(stats.cityCaptures);
          host.current.dataset.depthCaptures = String(stats.depthCaptures);
        }
      }
    },
    [volumeKey],
  );
  const sequenceRendered = useCallback(
    () => setPreparedVolumeKey(displayKey),
    [displayKey],
  );
  const graphicsFailed = useCallback((error: Error) => {
    setGraphicsError(error);
    window.dispatchEvent(new Event("flowcast:graphics-lost"));
  }, []);
  const restoreGraphics = useCallback(() => {
    setGraphicsError(undefined);
    setCanvasKey((value) => value + 1);
  }, []);
  const [picking, setPicking] = useState(false);
  const exportRenderer = useRef<ExportRenderer | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const portal = useRef<HTMLDivElement>(null!);
  const [displayed, setDisplayed] = useState<{
    context: string;
    key: string;
    scene: Scene;
  }>();
  const previous =
    field.enabled && displayed?.context === field.contextKey
      ? displayed
      : undefined;
  const fieldKey = field.data ? layerKey(field.data) : "";
  const warnings = [
    ...new Set([
      ...(geometry.data?.warnings ?? []),
      ...(field.data?.warnings ?? []),
      ...(preparedPlayback?.clip?.frames[0].scene.warnings ?? []),
    ]),
  ].filter(
    (message) =>
      message !==
        "Display is sampled; quantitative analysis uses original cells." &&
      message !==
        "Texture files are preserved but the texture cache is not prepared.",
  );
  const pick = (position: [number, number, number]) => {
    if (!picking || state.probes.length >= 5) return;
    let index = 1;
    while (state.probes.some((probe) => probe.id === `P${index}`)) index++;
    state.set({
      probes: [...state.probes, { id: `P${index}`, position }],
      selectedProbeId: `P${index}`,
    });
    setPicking(false);
  };
  const allAssets = [
    ...(geometry.data?.assets ?? []),
    ...(field.data?.assets ?? []),
  ].filter(
    (asset, index, items) =>
      items.findIndex((item) => item.url === asset.url) === index,
  );
  const requests = [field, geometry].filter((query) => query.enabled);
  const progressKey = JSON.stringify([
    dataset?.id,
    ...requests.map((query) => query.requestKey),
    canvasKey,
  ]);
  const loading = useSceneProgress(
    progressKey,
    allAssets,
    requests.filter((query) => query.isPending || query.isFetching).length,
    requests.length,
  );
  const ready =
    (requests.length > 0 ? loading.progress === 100 : continuous) &&
    !requests.some(
      (query) => query.isPending || query.isFetching || query.error,
    ) &&
    (!continuous || (preparedPlayback?.status === "ready" && sequenceReady));
  const buffering = Boolean(
    dataset && (requests.length || continuous) && (!ready || graphicsError),
  );
  const failedRequest =
    field.enabled && field.error
      ? field
      : geometry.enabled && geometry.error
        ? geometry
        : undefined;
  const scene =
    continuous && preparedPlayback?.clip
      ? {
          ...preparedPlayback.clip.frames[0].scene,
          range: preparedPlayback.clip.range,
        }
      : ((ready ? field.data : previous?.scene) ?? geometry.data ?? field.data);
  const fieldLayers = [
    ...(preparedViews
      ? [preparedViews.wind?.scene, preparedViews.iso?.scene]
          .filter((scene): scene is Scene => Boolean(scene))
          .filter((scene) =>
            scene.assets.every(
              (asset) => asset.kind === "geometry" || asset.kind === "points",
            ),
          )
          .map((scene) => ({
            context: "prepared",
            key: layerKey(scene),
            scene,
          }))
      : []),
    ...(previous && previous.key !== fieldKey ? [previous] : []),
    ...(field.data
      ? [{ context: field.contextKey, key: fieldKey, scene: field.data }]
      : []),
  ].filter(
    (layer, index, layers) =>
      layers.findIndex((item) => item.key === layer.key) === index,
  );
  useEffect(() => {
    if (
      ready &&
      field.data &&
      (displayed?.key !== fieldKey || displayed.context !== field.contextKey)
    )
      setDisplayed({
        context: field.contextKey,
        key: fieldKey,
        scene: field.data,
      });
  }, [
    ready,
    field.data,
    field.contextKey,
    fieldKey,
    displayed?.key,
    displayed?.context,
  ]);
  useLayoutEffect(() => {
    onBufferingChange?.(buffering);
  }, [onBufferingChange, buffering]);
  useLayoutEffect(() => {
    if (!continuous || !volumeClip) return;
    const key = volumeClip.key;
    const transport = usePlaybackTransport.getState();
    transport.setDisplayError(
      key,
      !canRender
        ? unsupportedGraphics
        : (graphicsError ?? failedRequest?.error ?? undefined),
    );
    transport.setDisplayReady(key, canRender && ready && !graphicsError);
    return () => usePlaybackTransport.getState().setDisplayReady(key, false);
  }, [
    continuous,
    volumeClip,
    ready,
    graphicsError,
    failedRequest?.error,
    canRender,
  ]);
  useLayoutEffect(() => {
    renderedSequence.current = { key: volumeKey, time: 0, mix: 0, draws: 0 };
    if (continuous && host.current) {
      delete host.current.dataset.renderedTime;
      host.current.dataset.volumeMix = "0";
      host.current.dataset.volumeDraws = "0";
    }
  }, [volumeKey, continuous]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPicking(false);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  return (
    <AssetProgressContext.Provider value={loading.report}>
      <section
        ref={host}
        className="scene-panel"
        aria-label="3D 유동장"
        data-sample-count={samples}
        data-buffering={buffering}
        data-rendered-time={continuous ? undefined : scene?.time}
        data-continuous-playback={continuous}
        data-display-mode={state.mode}
        data-emission-segments={
          (volumeClip?.streamlines?.positions.length ?? 0) / 6
        }
        data-emission-path-kind={volumeClip?.streamlines?.kind}
        data-volume-mix={continuous ? 0 : undefined}
        data-volume-draws={continuous ? 0 : undefined}
        data-prepared-frames={preparedPlayback?.clip?.frames.length ?? 0}
        data-prepared-bytes={preparedPlayback?.clip?.bytes ?? 0}
        data-rendered-context={scene?.contextKey}
        data-field-layers={
          fieldLayers.filter(
            (layer) => layer.key === fieldKey || layer.key === previous?.key,
          ).length
        }
      >
        <div className="scene-tools">
          <div className="scene-tool-buttons">
            <Button
              variant={picking ? "default" : "secondary"}
              size="icon"
              title="Probe 추가: 장면 더블클릭"
              aria-label="Probe 추가"
              disabled={
                !scene ||
                !field.enabled ||
                !dataset?.fields.length ||
                Boolean(graphicsError) ||
                state.probes.length >= 5
              }
              onClick={() => setPicking(!picking)}
            >
              <Crosshair size={17} />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              title="카메라 초기화"
              aria-label="카메라 초기화"
              onClick={() =>
                state.set({
                  cameraRevision: state.cameraRevision + 1,
                  camera: undefined,
                })
              }
            >
              <RotateCcw size={17} />
            </Button>
            <SceneExport
              bridge={exportRenderer}
              disabled={
                !scene || !ready || !canRender || Boolean(graphicsError)
              }
              animated={Boolean(
                continuous &&
                sequenceReady &&
                volumeClip &&
                volumeClip.times.length > 1,
              )}
              context={`${dataset?.id}:${state.resultId}:${volumeKey}:${state.mode}:${canvasKey}`}
            />
            <Button
              variant="secondary"
              size="icon"
              title="전체 화면"
              aria-label="전체 화면"
              onClick={() =>
                document.fullscreenElement
                  ? document.exitFullscreen()
                  : host.current?.requestFullscreen()
              }
            >
              <Maximize size={17} />
            </Button>
          </div>
          <SceneBoundsToggle
            disabled={!scene || !canRender || Boolean(graphicsError)}
          />
          <SceneDisplayMode
            dataset={dataset}
            range={
              scene?.field?.id.toLowerCase().includes("concentration")
                ? scene.range
                : undefined
            }
            disabled={!canRender || Boolean(graphicsError)}
          />
        </div>
        {!dataset ? (
          <Empty title="분석할 데이터를 선택하세요">
            <Link to="/datasets" className="scene-dataset-link">
              데이터셋에서 공간 선택
            </Link>
          </Empty>
        ) : !canRender ? (
          <Empty title="WebGL 2를 사용할 수 없습니다">
            그래픽 가속을 지원하는 브라우저에서 3D 화면을 열어주세요
          </Empty>
        ) : scene ? (
          <ScenePortal.Provider value={portal}>
            <div ref={portal} className="scene-html" />
            <GraphicsBoundary key={canvasKey} onError={graphicsFailed}>
              <Canvas
                frameloop={graphicsError ? "never" : "demand"}
                fallback={
                  <Empty title="WebGL 2를 사용할 수 없습니다">
                    그래픽 가속을 지원하는 브라우저를 사용하세요
                  </Empty>
                }
                dpr={[1, 1.5]}
                gl={{
                  antialias: true,
                  alpha: false,
                  preserveDrawingBuffer: true,
                  localClippingEnabled: true,
                }}
                camera={{ position: [120, 140, 120], up: [0, 0, 1], fov: 40 }}
              >
                <GraphicsLifecycle
                  onLost={graphicsFailed}
                  onRestored={restoreGraphics}
                />
                <color attach="background" args={["#edf2f7"]} />
                <ambientLight intensity={0.7} />
                <directionalLight position={[50, -30, 100]} intensity={1.6} />
                <Suspense fallback={null}>
                  <group>
                    {geometry.data && (
                      <SceneLayer
                        scene={geometry.data}
                        sourcePickable
                        onPick={pick}
                        onReady={setSamples}
                        pointSize={3}
                        clipBounds={dataset?.bounds}
                      />
                    )}
                    {volumeClip && (
                      <VolumeSequence
                        key={volumeKey}
                        clip={volumeClip}
                        active={continuous}
                        mode={
                          state.mode === "iso" || state.mode === "streamlines"
                            ? state.mode
                            : "volume"
                        }
                        streamlines={volumeClip.streamlines}
                        onReady={sequenceRendered}
                        onFrame={sequenceFrame}
                      />
                    )}
                    {fieldLayers.map((layer) => (
                      <SceneLayer
                        key={layer.key}
                        scene={layer.scene}
                        assets={layer.scene.assets.filter(
                          (asset) =>
                            !geometry.data?.assets.some(
                              (item) => item.url === asset.url,
                            ),
                        )}
                        visible={
                          layer.key === (ready ? fieldKey : previous?.key)
                        }
                        onPick={pick}
                        onReady={setSamples}
                        pointSize={geometry.data?.assets.length ? 2 : 3}
                        clipBounds={dataset?.bounds}
                      />
                    ))}
                    <RoiBox scene={scene} />
                    <SceneBounds scene={scene} bounds={dataset?.bounds} />
                    {state.probes.map((probe) => (
                      <Html
                        portal={portal}
                        key={probe.id}
                        position={
                          probe.position.map(
                            (value, index) => value - scene.origin[index],
                          ) as [number, number, number]
                        }
                      >
                        <button
                          className={`probe-label ${state.selectedProbeId === probe.id ? "active" : ""}`}
                          onClick={() =>
                            state.set({ selectedProbeId: probe.id })
                          }
                        >
                          {probe.id}
                        </button>
                      </Html>
                    ))}
                  </group>
                </Suspense>
                {state.showGrid && (
                  <BackgroundGrid scene={geometry.data ?? scene} />
                )}
                <GizmoHelper
                  alignment="bottom-right"
                  margin={[62, 62]}
                  renderPriority={preparedPlayback?.clip ? 2 : 1}
                >
                  <GizmoViewport
                    axisColors={["#d75b63", "#3eab80", "#4c78d0"]}
                    labelColor="white"
                  />
                </GizmoHelper>
                <CameraControls scene={geometry.data ?? scene} />
                <SourcePicker
                  scene={geometry.data ?? scene}
                  datasetId={dataset?.id ?? ""}
                />
                <ViewCompass />
                <SceneExportRenderer
                  bridge={exportRenderer}
                  host={host}
                  source={geometry.data ?? scene}
                  bounds={dataset?.bounds ?? scene.bounds}
                  clip={continuous ? volumeClip : undefined}
                />
              </Canvas>
            </GraphicsBoundary>
          </ScenePortal.Provider>
        ) : loading.active ? (
          <div className="scene-overlay" />
        ) : (
          <Empty title="표시할 장면이 없습니다">
            {field.error?.message ??
              geometry.error?.message ??
              "데이터 검증 상태와 지원 필드를 확인하세요"}
          </Empty>
        )}
        {graphicsError && (
          <div className="graphics-failure" role="alert">
            <Failure error={graphicsError} />
            <div>
              <Button variant="secondary" size="sm" onClick={restoreGraphics}>
                렌더링 다시 시도
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  state.set({ mode: "slice" });
                  restoreGraphics();
                }}
              >
                단면으로 전환
              </Button>
            </div>
          </div>
        )}
        {scene?.range && (
          <div
            title={
              scene.field?.id.toLowerCase().includes("concentration")
                ? continuous
                  ? state.mode === "streamlines"
                    ? "동일 확산 계산으로 검증한 입자 이동 경로, 색상은 현재 시각 농도, 기록 시각 사이는 화면 보간"
                    : state.mode === "iso"
                      ? Number.isFinite(state.threshold) &&
                        state.threshold > scene.range[0] &&
                        state.threshold < scene.range[1]
                        ? `등농도면: ${state.threshold.toPrecision(3)} ${scene.field?.unit ?? ""}, 시점 사이 값은 화면 보간`
                        : `등농도면: ${
                            volumeClip
                              ? getContourLevels(volumeClip)
                                  .map((value) => value.toPrecision(3))
                                  .join(", ")
                              : ""
                          } ${scene.field?.unit ?? ""}, 전체 시점의 고정 농도값, 시점 사이 값은 화면 보간`
                      : "색상: 시선 방향 최대 농도, 시점 사이 값은 화면 보간"
                  : "색상: 시선 방향 최대 농도"
                : undefined
            }
            className={
              "scalar-legend" +
              (scene.field?.id.toLowerCase().includes("concentration")
                ? " concentration-legend" +
                  (continuous && state.mode === "iso" ? " contour-legend" : "")
                : "")
            }
          >
            <div>
              <b>{scene.field?.label ?? scene.field?.id}</b>
              <span>{scene.field?.unit}</span>
            </div>
            <i />
            <div>
              <span>{scene.range[0].toPrecision(3)}</span>
              <span>{scene.range[1].toPrecision(3)}</span>
            </div>
          </div>
        )}
        {warnings.length ? (
          <div className="scene-warning">{warnings.join(" ")}</div>
        ) : null}
        {picking && (
          <div className="pick-hint">
            샘플 위치를 더블클릭하여 Probe를 추가하세요
          </div>
        )}
        {dataset &&
          canRender &&
          !graphicsError &&
          continuous &&
          preparedPlayback?.error && (
            <div className="graphics-failure">
              <Failure error={preparedPlayback.error} />
              <Button variant="secondary" onClick={preparedPlayback.retry}>
                재생 데이터 다시 준비
              </Button>
            </div>
          )}
        {dataset &&
          canRender &&
          !graphicsError &&
          (loading.active ||
            (continuous &&
              !ready &&
              preparedPlayback?.status !== "failed")) && (
            <div
              key={progressKey}
              className={scene ? "scene-loading" : "scene-overlay"}
            >
              <SceneLoading
                progress={
                  continuous && preparedPlayback?.status === "preparing"
                    ? preparedPlayback.progress
                    : loading.active
                      ? loading.progress
                      : undefined
                }
                indeterminate={
                  continuous && preparedPlayback?.status === "preparing"
                    ? preparedPlayback.indeterminate ||
                      preparedPlayback.progress === 0
                    : loading.active
                      ? loading.indeterminate
                      : true
                }
                label={
                  continuous && preparedPlayback?.status === "preparing"
                    ? (preparedPlayback.label ?? "재생 데이터 준비 중")
                    : loading.active
                      ? loading.label
                      : "3D 화면 준비 중"
                }
                detail={
                  continuous && preparedPlayback?.status === "preparing"
                    ? "전체 시점 데이터 준비"
                    : loading.active
                      ? loading.detail
                      : "첫 화면 렌더링 중"
                }
                compact={Boolean(scene)}
              />
            </div>
          )}
        {!graphicsError && failedRequest && (
          <div className="graphics-failure">
            <Failure error={failedRequest.error} />
            <Button
              variant="secondary"
              size="sm"
              aria-label="장면 다시 불러오기"
              disabled={failedRequest.isFetching}
              onClick={() => void failedRequest.refetch()}
            >
              다시 불러오기
            </Button>
          </div>
        )}
      </section>
    </AssetProgressContext.Provider>
  );
}
