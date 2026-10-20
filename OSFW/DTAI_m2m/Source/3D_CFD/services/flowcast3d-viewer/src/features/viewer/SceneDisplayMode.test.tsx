import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SceneDisplayMode } from "./SceneDisplayMode";
import { useDisplaySelection } from "./useDisplaySelection";
import type { Dataset } from "../datasets/types";
import { useWorkspace } from "../../stores/workspace";

const selection = vi.hoisted(() => ({
  value: "" as "" | "streamlines" | "iso" | "volume",
  pending: false,
  available: { streamlines: true, iso: true, volume: true },
  error: undefined as Error | undefined,
  select: vi.fn(),
}));
vi.mock("./useDisplaySelection", () => ({
  useDisplaySelection: vi.fn(() => selection),
}));

const dataset: Dataset = {
  id: "case:display-buttons",
  fields: [{ id: "concentration", range: [0, 10] }],
  times: [0, 1, 2],
};
const controls = () =>
  within(screen.getByRole("group", { name: "표시 방식 전환" }));
const stream = () => controls().getByRole("button", { name: "V1 Stream" });
const iso = () => controls().getByRole("button", { name: "V2 Contour" });
const volume = () => controls().getByRole("button", { name: "V3 Volume" });

beforeEach(() => {
  vi.clearAllMocks();
  useWorkspace.setState(useWorkspace.getInitialState(), true);
  useWorkspace
    .getState()
    .set({ datasetId: dataset.id, resultId: "completed-concentration" });
  selection.value = "";
  selection.pending = false;
  selection.available = { streamlines: true, iso: true, volume: true };
  selection.error = undefined;
});
afterEach(() => {
  cleanup();
  useWorkspace.setState(useWorkspace.getInitialState(), true);
  localStorage.clear();
});

describe("scene display buttons", () => {
  it("offers three native buttons and forwards enabled display choices", () => {
    const range: [number, number] = [0, 10];
    render(<SceneDisplayMode dataset={dataset} range={range} />);
    expect(useDisplaySelection).toHaveBeenCalledWith(dataset, range);
    expect(controls().getAllByRole("button")).toHaveLength(3);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    for (const button of [stream(), iso(), volume()]) {
      expect(button.tagName).toBe("BUTTON");
      expect(button).toHaveAttribute("type", "button");
      expect(button).toHaveAttribute("aria-pressed", "false");
      fireEvent.click(button);
    }
    expect(selection.select.mock.calls).toEqual([
      ["streamlines"],
      ["iso"],
      ["volume"],
    ]);
  });

  it("marks the selected value as pressed and ignores a repeated active choice", () => {
    selection.value = "volume";
    const view = render(<SceneDisplayMode dataset={dataset} />);
    expect(volume()).toHaveAttribute("aria-pressed", "true");
    expect(stream()).toHaveAttribute("aria-pressed", "false");
    expect(iso()).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(volume());
    expect(selection.select).not.toHaveBeenCalled();
    fireEvent.click(iso());
    expect(selection.select).toHaveBeenCalledExactlyOnceWith("iso");
    selection.value = "iso";
    view.rerender(<SceneDisplayMode dataset={dataset} />);
    expect(iso()).toHaveAttribute("aria-pressed", "true");
    expect(volume()).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(iso());
    expect(selection.select).toHaveBeenCalledOnce();
  });

  it("blocks every choice while disabled, without a dataset, or while preparing", () => {
    const view = render(<SceneDisplayMode dataset={dataset} disabled />);
    for (const condition of [
      { dataset, disabled: true, pending: false },
      { dataset: undefined, disabled: false, pending: false },
      { dataset, disabled: false, pending: true },
    ]) {
      selection.pending = condition.pending;
      view.rerender(
        <SceneDisplayMode
          dataset={condition.dataset}
          disabled={condition.disabled}
        />,
      );
      for (const button of controls().getAllByRole("button")) {
        expect(button).toBeDisabled();
        fireEvent.click(button);
      }
    }
    expect(selection.select).not.toHaveBeenCalled();
  });

  it("blocks unsupported modes while preserving supported choices", () => {
    selection.available.iso = false;
    const view = render(<SceneDisplayMode dataset={dataset} />);
    expect(iso()).toBeDisabled();
    fireEvent.click(iso());
    expect(selection.select).not.toHaveBeenCalled();
    expect(stream()).toBeEnabled();
    expect(volume()).toBeEnabled();
    fireEvent.click(stream());
    expect(selection.select).toHaveBeenCalledExactlyOnceWith("streamlines");
    selection.available = { streamlines: false, iso: false, volume: false };
    view.rerender(<SceneDisplayMode dataset={dataset} />);
    for (const button of controls().getAllByRole("button")) {
      expect(button).toBeDisabled();
      fireEvent.click(button);
    }
    expect(selection.select).toHaveBeenCalledOnce();
  });

  it("keeps selection errors readable and clears the alert after recovery", () => {
    selection.error = new Error("Source wind does not support streamlines.");
    const view = render(<SceneDisplayMode dataset={dataset} />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Source wind does not support streamlines.",
    );
    expect(volume()).toBeEnabled();
    fireEvent.click(volume());
    expect(selection.select).toHaveBeenCalledExactlyOnceWith("volume");
    selection.error = undefined;
    view.rerender(<SceneDisplayMode dataset={dataset} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("prediction display gate", () => {
  it.each(["", "saved-wind"])(
    "disables every display for source wind before concentration prediction (%s)",
    (resultId) => {
      useWorkspace.getState().set({ resultId });
      selection.value = "streamlines";
      render(
        <SceneDisplayMode
          dataset={{ ...dataset, fields: [{ id: "speed", unit: "m/s" }] }}
        />,
      );
      for (const button of controls().getAllByRole("button")) {
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute("aria-pressed", "false");
        fireEvent.click(button);
      }
      expect(selection.select).not.toHaveBeenCalled();
    },
  );
  it.each(["pending", "running", "processing", "failed", "cancelled"])(
    "blocks %s concentration results, including catalog fallback",
    (status) => {
      const view = render(
        <SceneDisplayMode dataset={{ ...dataset, status }} />,
      );
      for (const button of controls().getAllByRole("button"))
        expect(button).toBeDisabled();
      view.rerender(
        <SceneDisplayMode
          dataset={{
            ...dataset,
            status: "ready",
            results: [{ id: "completed-concentration", status }],
          }}
        />,
      );
      for (const button of controls().getAllByRole("button"))
        expect(button).toBeDisabled();
    },
  );
  it("blocks an unselected or stale dataset even if concentration fields remain available", () => {
    const view = render(<SceneDisplayMode dataset={dataset} />);
    useWorkspace.getState().set({ resultId: "" });
    view.rerender(<SceneDisplayMode dataset={dataset} />);
    for (const button of controls().getAllByRole("button"))
      expect(button).toBeDisabled();
    useWorkspace
      .getState()
      .set({ resultId: "completed-concentration", datasetId: "other-city" });
    view.rerender(<SceneDisplayMode dataset={dataset} />);
    for (const button of controls().getAllByRole("button"))
      expect(button).toBeDisabled();
  });
  it("enables modes when a completed concentration result arrives and disables them again on source selection", () => {
    const view = render(
      <SceneDisplayMode dataset={{ ...dataset, fields: [{ id: "speed" }] }} />,
    );
    expect(stream()).toBeDisabled();
    view.rerender(
      <SceneDisplayMode
        dataset={{
          ...dataset,
          status: "ready",
          results: [{ id: "completed-concentration", status: "succeeded" }],
        }}
      />,
    );
    for (const button of controls().getAllByRole("button"))
      expect(button).toBeEnabled();
    fireEvent.click(stream());
    expect(selection.select).toHaveBeenCalledExactlyOnceWith("streamlines");
    useWorkspace.getState().set({ resultId: "" });
    view.rerender(<SceneDisplayMode dataset={dataset} />);
    expect(stream()).toBeDisabled();
  });
});
