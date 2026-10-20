import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SceneExportMenu } from "./SceneExportMenu";

afterEach(cleanup);

const props = () => ({
  disabled: false,
  animated: true,
  onExport: vi.fn(),
  onCancel: vi.fn(),
});
const open = () =>
  fireEvent.click(screen.getByRole("button", { name: "장면 다운로드" }));

describe("scene export menu", () => {
  it.each([
    ["PNG 이미지 현재 장면", "png"],
    ["GIF 애니메이션 전체 예측 구간", "gif"],
    ["MP4 동영상 전체 예측 구간", "mp4"],
  ])("exports %s from the explicit format menu", (name, format) => {
    const callbacks = props();
    render(<SceneExportMenu {...callbacks} />);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    open();
    expect(screen.getByRole("menu")).toHaveAccessibleDescription(
      "현재 시점을 유지하고 도시 주변 여백을 줄여 저장합니다",
    );
    fireEvent.click(screen.getByRole("menuitem", { name }));
    expect(callbacks.onExport).toHaveBeenCalledExactlyOnceWith(format);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "장면 다운로드" })).toHaveFocus();
  });

  it("blocks all downloads without a renderable scene and animation without prepared playback", () => {
    const callbacks = props();
    const view = render(<SceneExportMenu {...callbacks} disabled />);
    expect(
      screen.getByRole("button", { name: "장면 다운로드" }),
    ).toBeDisabled();
    open();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    view.rerender(<SceneExportMenu {...callbacks} animated={false} />);
    open();
    expect(
      screen.getByRole("menuitem", { name: "PNG 이미지 현재 장면" }),
    ).toBeEnabled();
    for (const name of [
      "GIF 애니메이션 전체 예측 구간",
      "MP4 동영상 전체 예측 구간",
    ]) {
      expect(screen.getByRole("menuitem", { name })).toBeDisabled();
      fireEvent.click(screen.getByRole("menuitem", { name }));
    }
    expect(callbacks.onExport).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        "애니메이션은 예측 결과의 재생 준비 후 저장할 수 있습니다",
      ),
    ).toBeInTheDocument();
    view.rerender(<SceneExportMenu {...callbacks} animated />);
    for (const item of screen.getAllByRole("menuitem"))
      expect(item).toBeEnabled();
  });

  it("supports keyboard movement, skips unavailable formats, and dismisses without exporting", () => {
    const callbacks = props();
    const view = render(<SceneExportMenu {...callbacks} />);
    const trigger = screen.getByRole("button", { name: "장면 다운로드" });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const items = screen.getAllByRole("menuitem");
    expect(items[0]).toHaveFocus();
    expect(screen.getByRole("menu")).toHaveAttribute(
      "aria-orientation",
      "horizontal",
    );
    fireEvent.keyDown(items[0], { key: "ArrowRight" });
    expect(items[1]).toHaveFocus();
    fireEvent.keyDown(items[1], { key: "End" });
    expect(items[2]).toHaveFocus();
    fireEvent.keyDown(items[2], { key: "ArrowDown" });
    expect(items[0]).toHaveFocus();
    fireEvent.keyDown(items[0], { key: "ArrowLeft" });
    expect(items[2]).toHaveFocus();
    fireEvent.keyDown(items[2], { key: "Home" });
    expect(items[0]).toHaveFocus();
    fireEvent.keyDown(items[0], { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    view.rerender(<SceneExportMenu {...callbacks} animated={false} />);
    open();
    fireEvent.keyDown(screen.getAllByRole("menuitem")[0], { key: "ArrowDown" });
    expect(screen.getAllByRole("menuitem")[0]).toHaveFocus();
    fireEvent.click(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(callbacks.onExport).not.toHaveBeenCalled();
  });

  it("keeps saving modal focus isolated, allows cancellation, and restores focus", () => {
    const callbacks = props();
    const view = render(
      <>
        <button>배경 버튼</button>
        <SceneExportMenu {...callbacks} />
      </>,
    );
    const trigger = screen.getByRole("button", { name: "장면 다운로드" });
    trigger.focus();
    view.rerender(
      <>
        <button>배경 버튼</button>
        <SceneExportMenu
          {...callbacks}
          busy={{ format: "mp4", progress: 31.2 }}
        />
      </>,
    );
    const modal = screen.getByRole("dialog", { name: "MP4 동영상 저장 중" });
    expect(modal).toHaveAttribute("aria-modal", "true");
    expect(within(modal).getByRole("progressbar")).toHaveAttribute(
      "value",
      "31",
    );
    const cancel = within(modal).getByRole("button", { name: "취소" });
    expect(cancel).toHaveFocus();
    expect(trigger).toBeDisabled();
    screen.getByRole("button", { name: "배경 버튼" }).focus();
    expect(cancel).toHaveFocus();
    fireEvent.keyDown(cancel, { key: "Tab", shiftKey: true });
    expect(cancel).toHaveFocus();
    fireEvent.click(cancel);
    expect(callbacks.onCancel).toHaveBeenCalledOnce();
    fireEvent.keyDown(cancel, { key: "Escape" });
    expect(callbacks.onCancel).toHaveBeenCalledTimes(2);
    view.rerender(
      <>
        <button>배경 버튼</button>
        <SceneExportMenu {...callbacks} />
      </>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });

  it("retains modal focus during progress updates and presents errors after completion", () => {
    const callbacks = props();
    const view = render(
      <SceneExportMenu {...callbacks} busy={{ format: "gif", progress: -5 }} />,
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute("value", "0");
    view.rerender(
      <SceneExportMenu
        {...callbacks}
        busy={{ format: "gif", progress: 120 }}
      />,
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute("value", "100");
    expect(screen.getByRole("button", { name: "취소" })).toHaveFocus();
    view.rerender(
      <SceneExportMenu {...callbacks} error="MP4 encoding failed." />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("MP4 encoding failed.");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "장면 다운로드" })).toBeEnabled();
  });

  it("places the blocking dialog inside the browser fullscreen root", () => {
    const fullscreen = document.createElement("div");
    document.body.append(fullscreen);
    const original = Object.getOwnPropertyDescriptor(
      document,
      "fullscreenElement",
    );
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: fullscreen,
    });
    try {
      render(
        <SceneExportMenu {...props()} busy={{ format: "png", progress: 50 }} />,
      );
      expect(fullscreen).toContainElement(
        screen.getByRole("dialog", { name: "PNG 이미지 저장 중" }),
      );
    } finally {
      cleanup();
      fullscreen.remove();
      if (original)
        Object.defineProperty(document, "fullscreenElement", original);
      else Reflect.deleteProperty(document, "fullscreenElement");
    }
  });
});
