import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SceneBounds, SceneBoundsToggle } from "./SceneBounds";
import { useWorkspace } from "../../stores/workspace";
import type { Bounds, Roi } from "../datasets/types";
import type { Scene } from "./types";

const scene: Scene = {
  contextKey: "bounds-fixture",
  origin: [1000, 2000, 30],
  bounds: [
    [1002, 2004, 36],
    [1010, 2020, 60],
  ],
  assets: [],
};
type Outline = ReactElement<{
  name: string;
  position: [number, number, number];
  scale: [number, number, number];
  raycast: (...args: unknown[]) => unknown;
  children: ReactNode;
}>;
function childrenOf(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  return Children.toArray(node).flatMap((child) =>
    isValidElement<Record<string, unknown>>(child)
      ? [child, ...childrenOf(child.props.children as ReactNode)]
      : [],
  );
}

beforeEach(() => {
  useWorkspace.setState(useWorkspace.getInitialState(), true);
});
afterEach(() => {
  cleanup();
  useWorkspace.setState(useWorkspace.getInitialState(), true);
  localStorage.clear();
});

describe("scene boundary display", () => {
  it("starts hidden and follows the display preference without changing the ROI", () => {
    const roi = { min: [1003, 2005, 37], max: [1007, 2010, 44] } as const;
    useWorkspace
      .getState()
      .set({ roi: { min: [...roi.min], max: [...roi.max] } });
    const before = useWorkspace.getState().roi;
    const { result } = renderHook(() => SceneBounds({ scene }));
    expect(result.current).toBeNull();
    act(() => useWorkspace.getState().set({ showBounds: true }));
    expect((result.current as Outline).props.name).toBe("scene-bounds");
    act(() => useWorkspace.getState().set({ showBounds: false }));
    expect(result.current).toBeNull();
    expect(useWorkspace.getState().roi).toBe(before);
  });

  it("draws exactly twelve cube edges at the physical bounds without diagonal lines or ray hits", () => {
    useWorkspace.getState().set({ showBounds: true });
    const { result } = renderHook(() => SceneBounds({ scene }));
    const outline = result.current as Outline;
    expect(outline.type).toBe("lineSegments");
    expect(outline.props.name).toBe("scene-bounds");
    expect(outline.props.position).toEqual([6, 12, 18]);
    expect(outline.props.scale).toEqual([8, 16, 24]);
    const nested = childrenOf(outline.props.children);
    const attribute = nested.find((child) => child.type === "bufferAttribute")!;
    const [positions, itemSize] = attribute.props.args as [
      Float32Array,
      number,
    ];
    expect(positions).toBeInstanceOf(Float32Array);
    expect(positions).toHaveLength(72);
    expect(itemSize).toBe(3);
    const edges = new Set<string>();
    const degree = new Map<string, number>();
    for (let index = 0; index < positions.length; index += 6) {
      const start = [...positions.slice(index, index + 3)];
      const end = [...positions.slice(index + 3, index + 6)];
      expect([...start, ...end].every((value) => Math.abs(value) === 0.5)).toBe(
        true,
      );
      expect(start.filter((value, axis) => value !== end[axis])).toHaveLength(
        1,
      );
      const first = start.join(","),
        second = end.join(",");
      edges.add([first, second].sort().join("|"));
      degree.set(first, (degree.get(first) ?? 0) + 1);
      degree.set(second, (degree.get(second) ?? 0) + 1);
    }
    expect(edges.size).toBe(12);
    expect(degree.size).toBe(8);
    expect([...degree.values()]).toEqual(new Array(8).fill(3));
    const material = nested.find(
      (child) => child.type === "lineBasicMaterial",
    )!;
    expect(material.props.depthWrite).toBe(false);
    const hits: unknown[] = [];
    expect(() => outline.props.raycast({}, hits)).not.toThrow();
    expect(hits).toEqual([]);
  });

  it("uses supplied dataset bounds instead of a smaller displayed field region", () => {
    const bounds: Bounds = [
      [980, 1980, 0],
      [1080, 2180, 80],
    ];
    useWorkspace.getState().set({ showBounds: true });
    const { result } = renderHook(() => SceneBounds({ scene, bounds }));
    const outline = result.current as Outline;
    expect(outline.props.position).toEqual([30, 80, 10]);
    expect(outline.props.scale).toEqual([100, 200, 80]);
  });

  it("offers an accessible native switch and ignores disabled toggles without touching ROI", () => {
    const roi: Roi = { min: [0, 0, 0], max: [10, 20, 30] };
    useWorkspace.getState().set({ roi });
    const view = render(<SceneBoundsToggle disabled={false} />);
    const toggle = screen.getByRole("switch", { name: "정육면체 경계" });
    expect(toggle.tagName).toBe("BUTTON");
    expect(toggle).toHaveAttribute("aria-checked", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");
    view.rerender(<SceneBoundsToggle disabled />);
    expect(toggle).toBeDisabled();
    fireEvent.click(toggle);
    expect(useWorkspace.getState().showBounds).toBe(false);
    expect(useWorkspace.getState().roi).toBe(roi);
  });
});
