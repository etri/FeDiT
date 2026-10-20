import {
  act,
  cleanup,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AssetProgressContext,
  useAssetProgress,
  useSceneProgress,
} from "./loading";
import { SceneLoading } from "./SceneLoading";
import type { SceneAsset } from "./types";

const assets: SceneAsset[] = [
  {
    kind: "points",
    format: "float32-xyzv",
    url: "/app-api/assets/points.bin",
  },
];

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("scene loading progress", () => {
  it("waits for decoding after all bytes arrive", () => {
    const { result, rerender } = renderHook(
      ({ pending }) => useSceneProgress("first", assets, pending, 1),
      { initialProps: { pending: 1 } },
    );
    expect(result.current.active).toBe(true);
    expect(result.current.indeterminate).toBe(true);
    expect(result.current.detail).toBe("0/1개 표시 요청 완료");
    expect(result.current.progress).toBeLessThanOrEqual(34);
    rerender({ pending: 0 });
    expect(result.current.indeterminate).toBe(false);
    act(() => result.current.report(assets[0].url, { download: 1 }));
    expect(result.current.progress).toBeGreaterThan(33);
    expect(result.current.progress).toBeLessThan(100);
    expect(result.current.active).toBe(true);
    act(() =>
      result.current.report(assets[0].url, { download: 1, ready: true }),
    );
    expect(result.current.progress).toBe(100);
    expect(result.current.active).toBe(false);
  });

  it("ignores reports from a previous selection", () => {
    const { result, rerender } = renderHook(
      ({ selection }) => useSceneProgress(selection, assets, 0, 1),
      { initialProps: { selection: "first" } },
    );
    const previousReport = result.current.report;
    act(() => previousReport(assets[0].url, { download: 0.8 }));
    rerender({ selection: "second" });
    const resetProgress = result.current.progress;
    act(() => previousReport(assets[0].url, { download: 1, ready: true }));
    expect(result.current.progress).toBe(resetProgress);
    expect(result.current.active).toBe(true);
    act(() =>
      result.current.report(assets[0].url, { download: 1, ready: true }),
    );
    expect(result.current.progress).toBe(100);
  });

  it("requires every asset to be ready and stops after a failure", () => {
    const pair = [assets[0], { ...assets[0], url: "/app-api/assets/mask.bin" }];
    const { result } = renderHook(() => useSceneProgress("first", pair, 0, 1));
    act(() => result.current.report(pair[0].url, { download: 1, ready: true }));
    expect(result.current.active).toBe(true);
    expect(result.current.progress).toBeLessThan(100);
    act(() =>
      result.current.report(pair[1].url, { download: 0.5, failed: true }),
    );
    expect(result.current.active).toBe(false);
    expect(result.current.progress).toBeLessThan(100);
  });

  it("keeps an asset callback stable across progress updates", () => {
    const report = vi.fn();
    const { result, rerender } = renderHook(
      () => useAssetProgress(assets[0].url),
      {
        wrapper: ({ children }) => (
          <AssetProgressContext.Provider value={report}>
            {children}
          </AssetProgressContext.Provider>
        ),
      },
    );
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
    act(() => result.current({ download: 0.5 }));
    expect(report).toHaveBeenCalledWith(assets[0].url, { download: 0.5 });
  });

  it("retains a loaded mesh when the field request changes", () => {
    const first = vi.fn(),
      second = vi.fn();
    let report = first;
    const { result, rerender } = renderHook(
      () => useAssetProgress(assets[0].url),
      {
        wrapper: ({ children }) => (
          <AssetProgressContext.Provider value={report}>
            {children}
          </AssetProgressContext.Provider>
        ),
      },
    );
    const callback = result.current;
    act(() => callback({ download: 1, ready: true }));
    report = second;
    rerender();
    expect(result.current).toBe(callback);
    expect(second).toHaveBeenCalledWith(assets[0].url, {
      download: 1,
      ready: true,
    });
    act(() => callback({ download: 0.5 }));
    expect(second).toHaveBeenLastCalledWith(assets[0].url, { download: 0.5 });
    expect(first).toHaveBeenCalledTimes(1);
  });

  it.each([undefined, 0, Number.NaN, Infinity])(
    "shows honest indeterminate progress for unknown initial amount %s",
    (progress) => {
      vi.useFakeTimers();
      const view = render(
        <SceneLoading progress={progress} label="표시 데이터 준비 중" />,
      );
      const bar = screen.getByRole("progressbar", {
        name: "데이터 불러오기 진행률",
      });
      expect(bar).not.toHaveAttribute("value");
      expect(bar).toHaveAttribute("aria-valuetext", "처리 중, 진행량 확인 중");
      expect(screen.queryByText("0%")).not.toBeInTheDocument();
      expect(screen.getByText("처리 중")).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(4000));
      expect(bar).not.toHaveAttribute("value");
      view.rerender(<SceneLoading progress={28} label="데이터 다운로드 중" />);
      expect(bar).toHaveAttribute("value", "28");
      expect(screen.getByText("28%")).toBeInTheDocument();
    },
  );

  it("can remain indeterminate while final GPU work has no measurable total", () => {
    render(
      <SceneLoading
        progress={100}
        label="첫 화면 렌더링 중"
        indeterminate
        detail="GPU 완료 대기"
      />,
    );
    expect(screen.getByRole("progressbar")).not.toHaveAttribute("value");
    expect(screen.queryByText("100%")).not.toBeInTheDocument();
    expect(screen.getByText("GPU 완료 대기")).toBeInTheDocument();
  });

  it("shows an accessible percentage bar and elapsed time", () => {
    vi.useFakeTimers();
    render(<SceneLoading progress={42} label="데이터 다운로드 중" />);
    const bar = screen.getByRole("progressbar", {
      name: "데이터 불러오기 진행률",
    });
    expect(bar).toHaveAttribute("value", "42");
    expect(bar).toHaveAttribute("max", "100");
    expect(screen.getByText("42%")).toBeInTheDocument();
    expect(screen.getByText("데이터 다운로드 중")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText(/2초/)).toBeInTheDocument();
  });
});
