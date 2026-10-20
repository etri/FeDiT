import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useWorkspace } from "../../stores/workspace";
import type { Dataset } from "../datasets/types";
import { Inspector } from "./Inspector";

vi.mock("../analysis/api", () => ({
  useAnalysis: () => ({ data: undefined }),
}));

const dataset: Dataset = {
  id: "city",
  fields: [{ id: "speed" }],
  times: [0],
  capabilities: { geometry: true },
};

afterEach(() => {
  cleanup();
  useWorkspace.setState(useWorkspace.getInitialState(), true);
  localStorage.clear();
});

describe("geometry display controls", () => {
  it("starts with buildings and allows explicitly enabling field samples", () => {
    render(<Inspector dataset={dataset} datasets={[dataset]} />);
    const display = screen.getByLabelText("표시 방식");
    expect(display).toHaveValue("geometry");
    expect(
      screen.getByRole("option", { name: "건물 형상" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("slider")).toBeDisabled();
    fireEvent.change(display, { target: { value: "surface" } });
    expect(useWorkspace.getState().mode).toBe("surface");
    expect(screen.getByRole("slider")).toBeEnabled();
  });

  it("keeps prediction comparisons available within one space", () => {
    const space = {
      ...dataset,
      results: [{ id: "prediction:reference", name: "Prediction #1" }],
    };
    render(<Inspector dataset={space} datasets={[space]} />);
    fireEvent.change(screen.getByLabelText("비교 데이터"), {
      target: { value: "prediction:reference" },
    });
    expect(useWorkspace.getState().compareId).toBe("prediction:reference");
  });

  it("shows the actual fallback mode when buildings are unavailable", () => {
    render(
      <Inspector dataset={{ ...dataset, capabilities: [] }} datasets={[]} />,
    );
    expect(screen.getByLabelText("표시 방식")).toHaveValue("surface");
    expect(screen.queryByRole("option", { name: "건물 형상" })).toBeNull();
    expect(screen.getByRole("slider")).toBeEnabled();
  });

  it("allows comparisons with the other concentration in the same scenario", () => {
    const selected: Dataset = {
      ...dataset,
      id: "case:city",
      scenarioId: "paired",
      resultRole: "virtual_model",
      fields: [{ id: "concentration" }],
      results: [
        {
          id: "virtual-reference",
          scenarioId: "paired",
          resultRole: "virtual_reference",
        },
      ],
    };
    render(<Inspector dataset={selected} datasets={[selected]} />);
    fireEvent.change(screen.getByLabelText("비교 데이터"), {
      target: { value: "virtual-reference" },
    });
    expect(useWorkspace.getState()).toMatchObject({
      compareId: "case:city",
      compareResultId: "virtual-reference",
    });
  });

  it("omits comparison controls for a prediction-only scenario", () => {
    const selected: Dataset = {
      ...dataset,
      scenarioId: "single",
      resultRole: "virtual_model",
      results: [],
    };
    render(<Inspector dataset={selected} datasets={[selected]} />);
    expect(screen.queryByLabelText("비교 데이터")).not.toBeInTheDocument();
  });

  it("disables three-dimensional ROI creation for a flat ground map", () => {
    const ground: Dataset = {
      ...dataset,
      analysisKind: "surface",
      bounds: [
        [0, 0, 0],
        [10, 10, 0],
      ],
      supportModes: ["surface"],
    };
    render(<Inspector dataset={ground} datasets={[ground]} />);
    expect(
      screen.getByRole("button", { name: "설정" }),
    ).toBeDisabled();
    expect(
      screen.getByText("평면 자료에는 3차원 ROI를 적용하지 않습니다"),
    ).toBeInTheDocument();
  });
});
