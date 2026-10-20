import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Html } from "@react-three/drei";
import {
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  Scene as ThreeScene,
  Vector3,
} from "three";
import { SourcePicker } from "./SourcePicker";
import { useSourcePlacement } from "../scenarios/sourcePlacement";
import type { Scene } from "./types";

vi.mock("@react-three/drei", () => ({ Html: () => null }));
const threeContext = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}));
vi.mock("@react-three/fiber", () => ({
  useThree: () => threeContext.value,
}));

const scene: Scene = {
  contextKey: "city",
  origin: [1000, 2000, 10],
  bounds: [
    [1000, 2000, 10],
    [1200, 2200, 110],
  ],
  assets: [],
};
type Node = ReactElement<{
  position: number[];
  children: ReactNode;
  className?: string;
}>;
function annotation(group: Node) {
  return Children.toArray(group.props.children).find(
    (child) => isValidElement(child) && child.type === Html,
  ) as Node;
}

const meshes: Mesh<PlaneGeometry, MeshStandardMaterial>[] = [];
function pickingContext(heights: number[]) {
  const canvas = document.createElement("canvas");
  canvas.style.cursor = "grab";
  vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 200,
    bottom: 200,
    width: 200,
    height: 200,
    toJSON: () => ({}),
  });
  const camera = new PerspectiveCamera(40, 1, 0.1, 1000);
  camera.position.set(50, 50, 200);
  camera.up.set(0, 1, 0);
  camera.lookAt(50, 50, 0);
  camera.updateMatrixWorld(true);
  const models = new Group();
  models.userData.sourcePickable = true;
  for (const height of heights) {
    const material = new MeshStandardMaterial({
      clippingPlanes: [new Plane(new Vector3(0, 0, -1), 100)],
    });
    const mesh = new Mesh(new PlaneGeometry(100, 100), material);
    mesh.position.set(50, 50, height);
    meshes.push(mesh);
    models.add(mesh);
  }
  const rendered = new ThreeScene();
  rendered.add(models);
  rendered.updateMatrixWorld(true);
  const controls = { enabled: true };
  threeContext.value = {
    camera,
    gl: { domElement: canvas },
    scene: rendered,
    controls,
  };
  return { canvas, controls };
}

function clickCenter(canvas: HTMLCanvasElement) {
  for (const type of ["pointerdown", "pointerup"])
    canvas.dispatchEvent(
      new MouseEvent(type, {
        button: 0,
        clientX: 100,
        clientY: 100,
      }),
    );
}

beforeEach(() => {
  threeContext.value = {};
  useSourcePlacement.setState({
    datasetId: "",
    bounds: undefined,
    position: undefined,
    picking: false,
  });
  useSourcePlacement.getState().initialize("city", scene.bounds);
});
afterEach(() => {
  cleanup();
  for (const mesh of meshes.splice(0)) {
    mesh.geometry.dispose();
    mesh.material.dispose();
  }
  vi.restoreAllMocks();
});

describe("source position annotation", () => {
  it("anchors the screen callout to the source without raising physical coordinates", () => {
    const original = [...useSourcePlacement.getState().position!];
    const { result } = renderHook(() =>
      SourcePicker({ scene, datasetId: "city" }),
    );
    const group = result.current as Node;
    expect(group.props.position).toEqual([20, 20, 1.5]);
    expect(annotation(group).props.position).toEqual([0, 0, 0]);
    expect(useSourcePlacement.getState().position).toEqual(original);
  });

  it("keeps the leader and coordinate label attached after a placement change", () => {
    const { result } = renderHook(() =>
      SourcePicker({ scene, datasetId: "city" }),
    );
    act(() => useSourcePlacement.getState().place([1080, 2050, 40]));
    const group = result.current as Node;
    expect(group.props.position).toEqual([80, 50, 30]);
    const callout = annotation(group).props.children as Node;
    expect(callout.props.className).toBe("source-position-callout");
    const [label, leader] = Children.toArray(callout.props.children) as Node[];
    expect(Children.toArray(label.props.children).join("")).toBe(
      "배출원 (1080.00, 2050.00, 40.00)",
    );
    expect(leader.props.className).toBe("source-position-leader");
    expect(useSourcePlacement.getState().position).toEqual([1080, 2050, 40]);
  });
});

describe("source placement on clipped geometry", () => {
  it("selects the visible surface behind a clipped front fragment and preserves the coordinate annotation", () => {
    const { canvas, controls } = pickingContext([180, 20]);
    const { result } = renderHook(() =>
      SourcePicker({ scene, datasetId: "city" }),
    );
    act(() => useSourcePlacement.getState().begin());
    expect(controls.enabled).toBe(false);
    act(() => clickCenter(canvas));

    expect(useSourcePlacement.getState().position).toEqual([1050, 2050, 31.5]);
    expect(useSourcePlacement.getState().height).toBe(1.5);
    expect(useSourcePlacement.getState().picking).toBe(false);
    expect(controls.enabled).toBe(true);
    expect(canvas.style.cursor).toBe("grab");
    const group = result.current as Node;
    expect(group.props.position).toEqual([50, 50, 21.5]);
    expect(annotation(group).props.position).toEqual([0, 0, 0]);
    const callout = annotation(group).props.children as Node;
    const [label, leader] = Children.toArray(callout.props.children) as Node[];
    expect(Children.toArray(label.props.children).join("")).toBe(
      "배출원 (1050.00, 2050.00, 31.50)",
    );
    expect(leader.props.className).toBe("source-position-leader");
  });

  it("falls back to the dataset ground when every intersected surface is clipped", () => {
    const { canvas } = pickingContext([180, 150]);
    const { result } = renderHook(() =>
      SourcePicker({ scene, datasetId: "city" }),
    );
    act(() => useSourcePlacement.getState().begin());
    act(() => clickCenter(canvas));

    expect(useSourcePlacement.getState().position).toEqual([1050, 2050, 11.5]);
    expect((result.current as Node).props.position).toEqual([50, 50, 1.5]);
    expect(useSourcePlacement.getState().picking).toBe(false);
  });

  it("rejects a visible surface whose source height exceeds the dataset bounds", () => {
    const { canvas } = pickingContext([180, 99.5]);
    const previous = [...useSourcePlacement.getState().position!];
    const geometryScene: Scene = {
      ...scene,
      bounds: [
        [900, 1900, -10],
        [1400, 2400, 300],
      ],
    };
    renderHook(() => SourcePicker({ scene: geometryScene, datasetId: "city" }));
    act(() => useSourcePlacement.getState().begin());
    act(() => clickCenter(canvas));

    expect(useSourcePlacement.getState().position).toEqual(previous);
    expect(useSourcePlacement.getState().height).toBe(1.5);
    expect(useSourcePlacement.getState().picking).toBe(true);
    act(() => useSourcePlacement.getState().cancel());
  });
});
