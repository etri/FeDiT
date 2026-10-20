import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SetupPanels } from "./SetupPanels";
import { useSetupSettings } from "./setupSettings";
import { useSourcePlacement } from "./sourcePlacement";
import { useWorkspace } from "../../stores/workspace";
import { usePlaybackTransport } from "../viewer/playbackTransport";
import type { Dataset } from "../datasets/types";

const run = vi.fn();
const workflow = vi.hoisted(() => ({
  phase: "idle",
  busy: false,
  progress: 0 as number | undefined,
  preparationLabel: undefined as string | undefined,
  resultId: undefined as string | undefined,
  cancel: vi.fn(),
}));
vi.mock("./usePredictionWorkflow", () => ({
  usePredictionWorkflow: () => ({
    ...workflow,
    run,
  }),
}));
const dataset: Dataset = {
  id: "case:city",
  fields: [],
  times: [],
  bounds: [
    [0, 0, 0],
    [100, 100, 100],
  ],
  capabilities: { geometry: true, predict: true },
};

beforeEach(() => {
  run.mockReset();
  workflow.phase = "idle";
  workflow.busy = false;
  workflow.progress = 0;
  workflow.preparationLabel = undefined;
  workflow.resultId = undefined;
  workflow.cancel.mockReset();
  usePlaybackTransport.getState().reset();
  useSetupSettings.setState(useSetupSettings.getInitialState(), true);
  useSourcePlacement.setState(useSourcePlacement.getInitialState(), true);
  useWorkspace.setState({
    datasetId: dataset.id,
    resultId: "",
    mode: "volume",
  });
});
afterEach(() => {
  cleanup();
  usePlaybackTransport.getState().reset();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function panel() {
  return render(
    <SetupPanels dataset={dataset} onPlaybackLockChange={vi.fn()} />,
  );
}

describe("setup preparation status", () => {
  it("shows unknown replay work without a frozen percentage and keeps cancellation available", () => {
    workflow.phase = "preparing";
    workflow.busy = true;
    workflow.progress = undefined;
    workflow.preparationLabel = "입자 이동 경로 검증 중";
    panel();
    expect(screen.getByRole("status")).toHaveTextContent(
      "입자 이동 경로 검증 중",
    );
    expect(
      screen.getByRole("progressbar", { name: "예측 진행률" }),
    ).not.toHaveAttribute("value");
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(workflow.cancel).toHaveBeenCalledOnce();
  });
  it("shows timing beside active prediction status and removes it after completion", () => {
    workflow.phase = "predicting";
    workflow.busy = true;
    workflow.progress = 35;
    const { rerender } = panel();
    expect(screen.getByLabelText("경과 시간")).toHaveTextContent("경과 00:00");
    expect(screen.queryByLabelText("전체 예상 남은 시간")).not.toBeInTheDocument();
    expect(screen.getByRole("status").parentElement).toHaveClass(
      "setup-status-row",
    );
    expect(screen.getByLabelText("예측 처리 시간").parentElement).toBe(
      screen.getByRole("status").parentElement,
    );

    workflow.phase = "ready";
    workflow.busy = false;
    rerender(<SetupPanels dataset={dataset} onPlaybackLockChange={vi.fn()} />);
    expect(screen.queryByLabelText("예측 처리 시간")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("재생 준비 완료");
  });

  it("keeps elapsed time when the completed result changes the dataset version", () => {
    vi.useFakeTimers();
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    run.mockReturnValue(new Promise(() => {}));
    const { rerender } = panel();
    fireEvent.click(screen.getByRole("button", { name: "예측 시작" }));
    workflow.phase = "predicting";
    workflow.busy = true;
    rerender(
      <SetupPanels
        dataset={{ ...dataset, version: "source-v1" }}
        onPlaybackLockChange={vi.fn()}
      />,
    );
    now = 42_000;
    act(() => vi.advanceTimersByTime(42_000));
    expect(screen.getByLabelText("경과 시간")).toHaveTextContent("경과 00:42");
    workflow.phase = "ready";
    workflow.busy = false;
    workflow.resultId = "new-result-version";
    act(() => {
      useWorkspace.setState({ resultId: "new-result-version" });
      usePlaybackTransport.setState({
        status: "ready",
        displayReady: false,
        clip: {
          key: "new-result-clip",
          frames: [],
          times: [],
          range: [0, 1],
          bytes: 0,
        },
      });
    });
    rerender(
      <SetupPanels
        dataset={{ ...dataset, version: "concentration-v2" }}
        onPlaybackLockChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("경과 시간")).toHaveTextContent("경과 00:42");
    now = 45_000;
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByLabelText("경과 시간")).toHaveTextContent("경과 00:45");
  });

  it("keeps timing and setup locked until first GPU readiness and ignores later buffering", () => {
    workflow.phase = "preparing";
    workflow.busy = true;
    const { rerender } = panel();
    workflow.phase = "ready";
    workflow.busy = false;
    workflow.resultId = "rendered-result";
    act(() => {
      useWorkspace.setState({ resultId: "rendered-result" });
      usePlaybackTransport.setState({
        key: "render-clip",
        status: "ready",
        displayReady: false,
        clip: {
          key: "render-clip",
          frames: [],
          times: [],
          range: [0, 1],
          bytes: 0,
        },
      });
    });
    rerender(<SetupPanels dataset={dataset} onPlaybackLockChange={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent("시각화 준비 중");
    expect(screen.getByRole("button", { name: "준비 중" })).toBeDisabled();
    expect(screen.getByLabelText("예측 처리 시간")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "풍향" })).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "취소" }),
    ).not.toBeInTheDocument();
    act(() => usePlaybackTransport.setState({ displayReady: true }));
    expect(screen.getByRole("status")).toHaveTextContent("재생 준비 완료");
    expect(screen.queryByLabelText("예측 처리 시간")).not.toBeInTheDocument();
    act(() => usePlaybackTransport.setState({ displayReady: false }));
    expect(screen.queryByLabelText("예측 처리 시간")).not.toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "풍향" })).toBeEnabled();
  });

  it("releases the first-display lock and stops timing when GPU rendering fails", () => {
    workflow.phase = "preparing";
    workflow.busy = true;
    const { rerender } = panel();
    workflow.phase = "ready";
    workflow.busy = false;
    workflow.resultId = "gpu-failed-result";
    act(() => {
      useWorkspace.setState({ resultId: "gpu-failed-result" });
      usePlaybackTransport.setState({
        status: "ready",
        displayReady: false,
        clip: {
          key: "gpu-failed-clip",
          frames: [],
          times: [],
          range: [0, 1],
          bytes: 0,
        },
      });
    });
    rerender(<SetupPanels dataset={dataset} onPlaybackLockChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "준비 중" })).toBeDisabled();
    act(() =>
      usePlaybackTransport.setState({
        displayError: new Error("GPU rendering failed."),
      }),
    );
    expect(screen.getByRole("status")).toHaveTextContent("시각화 준비 실패");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "GPU rendering failed.",
    );
    expect(screen.queryByLabelText("예측 처리 시간")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "예측 시작" })).toBeEnabled();
    expect(screen.getByRole("spinbutton", { name: "풍향" })).toBeEnabled();
  });

  it("lets a slice fallback escape first-display preparation without a false success estimate", () => {
    workflow.phase = "preparing";
    workflow.busy = true;
    const { rerender } = panel();
    workflow.phase = "ready";
    workflow.busy = false;
    workflow.resultId = "slice-fallback-result";
    act(() => {
      useWorkspace.setState({ resultId: "slice-fallback-result" });
      usePlaybackTransport.setState({
        status: "ready",
        displayReady: false,
        clip: {
          key: "slice-clip",
          frames: [],
          times: [],
          range: [0, 1],
          bytes: 0,
        },
      });
    });
    rerender(<SetupPanels dataset={dataset} onPlaybackLockChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "준비 중" })).toBeDisabled();
    act(() => useWorkspace.setState({ mode: "slice" }));
    expect(screen.queryByLabelText("예측 처리 시간")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "예측 시작" })).toBeEnabled();
    expect(screen.getByRole("spinbutton", { name: "풍향" })).toBeEnabled();
  });

  it("keeps remaining estimates hidden on another prediction after the dataset version changes", () => {
    vi.useFakeTimers();
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    run.mockReturnValue(new Promise(() => {}));
    const { rerender } = panel();
    fireEvent.click(screen.getByRole("button", { name: "예측 시작" }));
    const transition = (
      phase: string,
      milliseconds: number,
      version: string,
    ) => {
      now += milliseconds;
      act(() => vi.advanceTimersByTime(milliseconds));
      workflow.phase = phase;
      workflow.busy = !["ready", "idle"].includes(phase);
      rerender(
        <SetupPanels
          dataset={{ ...dataset, version }}
          onPlaybackLockChange={vi.fn()}
        />,
      );
    };
    transition("predicting", 0, "source-v1");
    transition("dispersing", 10_000, "source-v1");
    transition("preparing", 20_000, "source-v1");
    workflow.resultId = "profile-result";
    act(() => {
      useWorkspace.setState({ resultId: "profile-result" });
      usePlaybackTransport.setState({
        status: "ready",
        displayReady: false,
        clip: {
          key: "profile-clip",
          frames: [],
          times: [],
          range: [0, 1],
          bytes: 0,
        },
      });
    });
    transition("ready", 30_000, "derived-v2");
    now += 5000;
    act(() => {
      vi.advanceTimersByTime(5000);
      usePlaybackTransport.setState({ displayReady: true });
    });
    expect(screen.queryByLabelText("예측 처리 시간")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "예측 시작" }));
    transition("predicting", 0, "derived-v3");
    expect(screen.queryByLabelText("전체 예상 남은 시간")).not.toBeInTheDocument();
  });

  it.each(["cancelled", "failed"])(
    "removes timing when the run is %s",
    (phase) => {
      workflow.phase = "predicting";
      workflow.busy = true;
      const { rerender } = panel();
      expect(screen.getByLabelText("예측 처리 시간")).toBeInTheDocument();
      workflow.phase = phase;
      workflow.busy = false;
      rerender(
        <SetupPanels dataset={dataset} onPlaybackLockChange={vi.fn()} />,
      );
      expect(screen.queryByLabelText("예측 처리 시간")).not.toBeInTheDocument();
    },
  );

  it.each([
    ["idle", "기본 설정으로 시작할 수 있습니다"],
    ["ready", "재생 준비 완료"],
  ])(
    "hides duplicate %s status during preparation and restores it afterward",
    (phase, label) => {
      workflow.phase = phase;
      panel();
      expect(screen.getByRole("status")).toHaveTextContent(label);
      act(() => {
        usePlaybackTransport.getState().prepare("clip");
        usePlaybackTransport.getState().setProgress("clip", 40);
      });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
      act(() => usePlaybackTransport.getState().reset("clip"));
      expect(screen.getByRole("status")).toHaveTextContent(label);
    },
  );

  it("keeps prediction progress and cancellation while playback is preparing", () => {
    workflow.phase = "predicting";
    workflow.busy = true;
    workflow.progress = 35;
    usePlaybackTransport.getState().prepare("clip");
    panel();
    expect(screen.getByRole("status")).toHaveTextContent("유동장 예측 중");
    expect(
      screen.getByRole("progressbar", { name: "예측 진행률" }),
    ).toHaveAttribute("value", "35");
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(workflow.cancel).toHaveBeenCalledOnce();
  });

  it("keeps changed-settings guidance while playback is preparing", () => {
    panel();
    act(() => {
      useSetupSettings.getState().complete("older-settings", "result-a");
      useWorkspace.setState({ resultId: "result-a" });
      usePlaybackTransport.getState().prepare("clip");
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "설정이 변경되었습니다",
    );
    expect(screen.getByRole("button", { name: "다시 예측" })).toBeEnabled();
  });
});

describe("setup number editing", () => {
  it("lets the user clear zero and type 90 without restoring zero or changing the source", () => {
    panel();
    const direction = screen.getByRole("spinbutton", { name: "풍향" });
    const source = [...useSourcePlacement.getState().position!];
    expect(
      screen.getByRole("button", { name: /배출원 위치/ }),
    ).toBeInTheDocument();
    fireEvent.change(direction, { target: { value: "" } });
    expect(direction).toHaveValue(null);
    expect(useSetupSettings.getState().input.direction).toBe(0);
    expect(screen.getByRole("button", { name: "예측 시작" })).toBeDisabled();
    fireEvent.change(direction, { target: { value: "9" } });
    fireEvent.change(direction, { target: { value: "90" } });
    expect(direction).toHaveValue(90);
    expect(useSetupSettings.getState().input.direction).toBe(90);
    fireEvent.blur(direction);
    expect(direction).toHaveValue(90);
    expect(screen.getByRole("button", { name: "예측 시작" })).toBeEnabled();
    expect(useSourcePlacement.getState().position).toEqual(source);
  });

  it("keeps out-of-range directions out of the store and restores the last valid value on blur", () => {
    panel();
    const direction = screen.getByRole("spinbutton", { name: "풍향" });
    fireEvent.change(direction, { target: { value: "359" } });
    expect(useSetupSettings.getState().input.direction).toBe(359);
    fireEvent.change(direction, { target: { value: "360" } });
    expect(direction).toHaveValue(360);
    expect(direction).toHaveAttribute("aria-invalid", "true");
    expect(useSetupSettings.getState().input.direction).toBe(359);
    expect(screen.getByRole("button", { name: "예측 시작" })).toBeDisabled();
    fireEvent.blur(direction);
    expect(direction).toHaveValue(359);
    expect(direction).not.toHaveAttribute("aria-invalid");
    expect(screen.getByRole("button", { name: "예측 시작" })).toBeEnabled();
  });

  it("also preserves empty drafts and intermediate decimal input in other settings", () => {
    panel();
    const speed = screen.getByRole("spinbutton", { name: "유입 풍속" });
    fireEvent.change(speed, { target: { value: "" } });
    expect(speed).toHaveValue(null);
    expect(useSetupSettings.getState().input.speed).toBe(5);
    fireEvent.change(speed, { target: { value: "0" } });
    expect(speed).toHaveValue(0);
    expect(useSetupSettings.getState().input.speed).toBe(5);
    fireEvent.change(speed, { target: { value: "0.5" } });
    expect(speed).toHaveValue(0.5);
    expect(useSetupSettings.getState().input.speed).toBe(0.5);
    const duration = screen.getByRole("spinbutton", { name: "계산 시간" });
    fireEvent.change(duration, { target: { value: "" } });
    expect(duration).toHaveValue(null);
    expect(useSetupSettings.getState().input.durationSeconds).toBe(60);
    fireEvent.blur(duration);
    expect(duration).toHaveValue(60);
  });
});
