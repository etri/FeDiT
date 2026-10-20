import type { ReactNode } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { boundedAsset } from "./decode";
import { AssetProgressContext, useSceneProgress } from "./loading";
import { Volume } from "./Volume";
import type { Scene, SceneAsset } from "./types";

vi.mock("./decode", () => ({ boundedAsset: vi.fn() }));
vi.mock("@react-three/fiber", () => ({
  useFrame: vi.fn(),
  useThree: () => ({
    camera: {},
    gl: {},
    scene: {},
    size: { width: 100, height: 100 },
  }),
}));
vi.mock("@react-three/drei", () => ({
  Html: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const asset: SceneAsset = {
  kind: "volume",
  format: "float32",
  url: "/app-api/assets/volume.bin",
  maskUrl: "/app-api/assets/mask.bin",
  dimensions: [2, 2, 2],
};
const scene: Scene = {
  contextKey: "volume-test",
  origin: [0, 0, 0],
  bounds: [
    [0, 0, 0],
    [2, 2, 2],
  ],
  assets: [asset],
};

function ProgressHarness() {
  const loading = useSceneProgress("volume-test", scene.assets, 0, 1);
  return (
    <AssetProgressContext.Provider value={loading.report}>
      <output data-testid="loading-active">{String(loading.active)}</output>
      <Volume asset={asset} scene={scene} />
    </AssetProgressContext.Provider>
  );
}

afterEach(cleanup);

it("keeps volume loading stopped when a sibling transfer reports after failure", async () => {
  const requests = new Map<
    string,
    {
      signal: AbortSignal;
      report?: (received: number, total?: number) => void;
      resolve: (buffer: ArrayBuffer) => void;
      reject: (error: Error) => void;
    }
  >();
  vi.mocked(boundedAsset).mockImplementation(
    (url, signal, _budget, report) =>
      new Promise<ArrayBuffer>((resolve, reject) => {
        requests.set(url, { signal, report, resolve, reject });
      }),
  );
  render(<ProgressHarness />);
  const volume = requests.get(asset.url)!,
    mask = requests.get(asset.maskUrl!)!;
  expect(screen.getByTestId("loading-active")).toHaveTextContent("true");
  await act(async () => {
    mask.reject(new Error("Mask asset unavailable"));
  });
  expect(screen.getByRole("alert")).toHaveTextContent("Mask asset unavailable");
  expect(screen.getByTestId("loading-active")).toHaveTextContent("false");
  expect(volume.signal.aborted).toBe(true);
  await act(async () => {
    volume.report?.(32, 32);
    volume.resolve(new ArrayBuffer(32));
  });
  expect(screen.getByTestId("loading-active")).toHaveTextContent("false");
});
