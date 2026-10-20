import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { post } from "../../lib/api";
import { useWorkspace } from "../../stores/workspace";
import { DispersionPanel } from "./DispersionPanel";
import { ScenarioPanel } from "./ScenarioPanel";
import { useDispersionScenarios } from "./api";
import type { Dataset } from "../datasets/types";

vi.mock("../../lib/api", () => ({ post: vi.fn() }));
vi.mock("./api", () => ({ useDispersionScenarios: vi.fn(), statusLabel: {} }));

const space: Dataset = {
  id: "case:city",
  fields: [],
  times: [],
  bounds: [
    [0, 0, 0],
    [10, 10, 10],
  ],
  capabilities: { predict: true },
  scenarioModes: ["reference", "model"],
  referenceResultId: "cfd-wind",
  results: [{ id: "cfd-wind", resultRole: "reference_wind" }],
};
let client: QueryClient;
function show(dataset: Dataset = space) {
  return render(
    <QueryClientProvider client={client}>
      <ScenarioPanel dataset={dataset} />
      <DispersionPanel dataset={dataset} space={dataset} />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useWorkspace.setState(useWorkspace.getInitialState(), true);
  vi.mocked(post)
    .mockReset()
    .mockResolvedValue({ scenario: { id: "pair" } });
  vi.mocked(useDispersionScenarios).mockReturnValue({
    data: [],
    error: null,
  } as unknown as ReturnType<typeof useDispersionScenarios>);
});
afterEach(() => {
  cleanup();
  client.clear();
  localStorage.clear();
});

describe("paired virtual concentration submission", () => {
  it("uses one common source and the shared wind controls for both branches", async () => {
    show();
    fireEvent.change(screen.getByLabelText(/유입 풍속/), {
      target: { value: "12" },
    });
    fireEvent.change(screen.getByLabelText(/^풍향/), {
      target: { value: "72" },
    });
    fireEvent.click(screen.getByRole("button", { name: "두 가상 농도 계산" }));
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/dispersion-scenarios", {
        datasetId: "case:city",
        referenceResultId: "cfd-wind",
        source: [5, 5, 5],
        speed: 12,
        direction: 72,
        durationSeconds: 60,
        stepSeconds: 1,
        seed: 0,
      }),
    );
  });

  it("offers only predicted concentration when no reference wind exists", async () => {
    show({
      ...space,
      scenarioModes: ["model"],
      referenceResultId: null,
      results: [],
    });
    expect(screen.queryByLabelText("참조 풍장")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "참조 풍장이 없어 예측 풍장 기반 가상 농도만 표시합니다",
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "가상 농도 계산" }));
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        "/dispersion-scenarios",
        expect.not.objectContaining({ referenceResultId: expect.anything() }),
      ),
    );
  });

  it("keeps the existing single wind endpoint for legacy imported data", async () => {
    show({ ...space, capabilities: { flow: true }, scenarioModes: undefined });
    fireEvent.click(screen.getByRole("button", { name: "가상 농도 계산" }));
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        "/dispersion",
        expect.objectContaining({ source: [5, 5, 5] }),
      ),
    );
  });

  it("requests one steady prediction through the existing prediction control", async () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: "예측 실행" }));
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        "/predict",
        expect.objectContaining({ steps: 1 }),
      ),
    );
  });

  it("keeps the successful branch accessible while retrying the failed branch", async () => {
    vi.mocked(useDispersionScenarios).mockReturnValue({
      data: [
        {
          id: "partial",
          datasetId: space.id,
          status: "partial",
          request: {
            source: [5, 5, 5],
            durationSeconds: 60,
            stepSeconds: 1,
            seed: 0,
            direction: 0,
            speed: 5,
          },
          branches: {
            reference: { status: "succeeded", resultId: "ready-reference" },
            model: { status: "failed", error: "Model inference failed" },
          },
        },
      ],
      error: null,
    } as unknown as ReturnType<typeof useDispersionScenarios>);
    show({
      ...space,
      results: [
        ...space.results!,
        {
          id: "ready-reference",
          scenarioId: "partial",
          resultRole: "virtual_reference",
        },
      ],
    });
    fireEvent.click(screen.getByRole("button", { name: "결과 보기" }));
    expect(useWorkspace.getState().resultId).toBe("ready-reference");
    fireEvent.click(screen.getByRole("button", { name: "다시 계산" }));
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/dispersion-scenarios/partial/retry", {
        role: "model",
      }),
    );
  });
});
