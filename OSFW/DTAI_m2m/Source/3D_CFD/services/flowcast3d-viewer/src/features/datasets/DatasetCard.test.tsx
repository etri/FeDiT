import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { StrictMode } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DatasetCard } from "./DatasetCard";
import { datasetName, type Dataset } from "./types";
import { datasetSchema } from "./schema";

const dataset: Dataset = {
  id: "prediction:a/b",
  name: "Kalasatama (2)",
  label: "Prediction 123456",
  spaceName: "Kalasatama",
  fields: [{ id: "speed", unit: "m/s" }],
  times: [0],
  fileFormat: "OBJ",
  synthetic: true,
  results: [{ id: "prediction:result" }],
};

function mount(value: Dataset = dataset, strict = false) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onOpen = vi.fn();
  function Card() {
    const query = useQuery({
      queryKey: ["datasets"],
      queryFn: async () => ({ datasets: [value] }),
      initialData: { datasets: [value] },
      enabled: false,
    });
    return <DatasetCard dataset={query.data.datasets[0]} onOpen={onOpen} />;
  }
  const content = (
    <QueryClientProvider client={client}>
      <Card />
    </QueryClientProvider>
  );
  render(strict ? <StrictMode>{content}</StrictMode> : content);
  return { client, onOpen };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("dataset cards", () => {
  it("accepts only dataset thumbnail endpoints on the same origin", () => {
    expect(
      datasetSchema.safeParse({
        ...dataset,
        thumbnailUrl: "/app-api/datasets/prediction%3Aabc/thumbnail?v=1",
      }).success,
    ).toBe(true);
    for (const thumbnailUrl of [
      "https://other.example/preview.png",
      "//other.example/preview.png",
      "/app-api/assets/scene.bin",
      "/app-api/datasets/one/thumbnail#fragment",
      "/app-api/datasets/one/thumbnail\\other",
    ])
      expect(
        datasetSchema.safeParse({ ...dataset, thumbnailUrl }).success,
      ).toBe(false);
  });

  it("shows the thumbnail and title with one selection button", () => {
    const { onOpen } = mount();
    expect(
      screen.getByRole("heading", { name: "Kalasatama (2)" }),
    ).toBeVisible();
    expect(datasetName(datasetSchema.parse(dataset))).toBe("Kalasatama (2)");
    for (const label of [
      "OBJ",
      "ready",
      "OBJ 3D 공간",
      "서버 데이터",
      "해석 결과 1개",
      "등록 정보 확인됨",
      "작업공간 열기",
      "SYNTHETIC DATA",
    ])
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    const select = screen.getByRole("button", { name: "Kalasatama (2) 선택" });
    expect(select).toHaveAttribute("type", "button");
    expect(select.querySelector("button")).toBeNull();
    fireEvent.click(select);
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it("omits recognized format suffixes without requiring source format metadata", () => {
    for (const format of [
      "OBJ",
      "STL",
      "VTK",
      "VTU",
      "VTP",
      "VTI",
      "VTR",
      "VTS",
      "PVD",
      "VTM",
      "NPY",
      "NPZ",
      "OBJ/STL",
      "vTu",
    ]) {
      const name = `Harbor (North) (${format})`;
      mount({
        ...dataset,
        name,
        spaceName: undefined,
        fileFormat: null,
      });
      expect(datasetName({ ...dataset, name, fileFormat: null })).toBe(
        "Harbor (North)",
      );
      expect(
        screen.getByRole("heading", { name: "Harbor (North)" }),
      ).toBeVisible();
      expect(
        screen.getByRole("button", { name: "Harbor (North) 선택" }),
      ).toBeEnabled();
      expect(
        screen.getByRole("article", { name: "Harbor (North)" }),
      ).toBeVisible();
      cleanup();
    }
  });

  it.each([
    {
      raw: "Kalasatama, Helsinki (OBJ)",
      display: "Kalasatama, Helsinki",
      fileFormat: "OBJ",
    },
    {
      raw: "Virtual concentration — Kalasatama, Helsinki (OBJ)",
      display: "Virtual concentration — Kalasatama, Helsinki",
      fileFormat: null,
    },
    { raw: "Custom harbor (STL)", display: "Custom harbor", fileFormat: null },
  ])(
    "keeps $raw metadata unchanged when its displayed title is saved without edits",
    async ({ raw, display, fileFormat }) => {
      const value = {
        ...dataset,
        name: raw,
        spaceName: "Kalasatama, Helsinki (OBJ)",
        fileFormat,
      };
      const fetcher = vi.fn();
      vi.stubGlobal("fetch", fetcher);
      const { client } = mount(value);
      for (const action of ["Enter", "blur"]) {
        fireEvent.click(
          screen.getByRole("button", { name: `${display} 제목 편집` }),
        );
        const input = screen.getByRole("textbox", { name: "데이터셋 제목" });
        expect(input).toHaveValue(display);
        await act(async () => {
          if (action === "Enter") fireEvent.keyDown(input, { key: "Enter" });
          fireEvent.blur(input);
        });
        expect(screen.getByRole("heading", { name: display })).toBeVisible();
        expect(client.getQueryData(["datasets"])).toEqual({
          datasets: [value],
        });
      }
      cleanup();
      mount(value);
      expect(screen.getByRole("heading", { name: display })).toBeVisible();
      expect(fetcher).not.toHaveBeenCalled();
    },
  );

  it.each([
    {
      reason: "a custom title",
      name: "Harbor (OBJ)",
      display: "Harbor",
      spaceName: "Kalasatama (OBJ)",
      fileFormat: "OBJ",
    },
    {
      reason: "ordinary parentheses",
      name: "Harbor (North)",
      display: "Harbor (North)",
      spaceName: "Harbor (North)",
      fileFormat: "OBJ",
    },
    {
      reason: "a suffix that disagrees with the source format",
      name: "Harbor (OBJ)",
      display: "Harbor",
      spaceName: "Harbor (OBJ)",
      fileFormat: "NPZ",
    },
    {
      reason: "an unverified title without a generated space name",
      name: "Harbor (OBJ)",
      display: "Harbor",
      spaceName: undefined,
      fileFormat: "OBJ",
    },
    {
      reason: "a concentration result without fileFormat",
      name: "Virtual concentration — Kalasatama, Helsinki (OBJ)",
      display: "Virtual concentration — Kalasatama, Helsinki",
      spaceName: "Virtual concentration — Kalasatama, Helsinki (OBJ)",
      fileFormat: null,
    },
    {
      reason: "a format marker inside the name body",
      name: "Harbor (OBJ) North (2)",
      display: "Harbor (OBJ) North (2)",
      spaceName: undefined,
      fileFormat: null,
    },
  ])("uses the global display name for $reason and editing", (value) => {
    mount({ ...dataset, ...value });
    expect(datasetName({ ...dataset, ...value })).toBe(value.display);
    expect(screen.getByRole("heading", { name: value.display })).toBeVisible();
    expect(screen.getByRole("article", { name: value.display })).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: `${value.display} 제목 편집` }),
    );
    expect(screen.getByRole("textbox", { name: "데이터셋 제목" })).toHaveValue(
      value.display,
    );
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
  });

  it("cleans label fallbacks without changing metadata or the final ID fallback", () => {
    const value = {
      ...dataset,
      name: undefined,
      label: "Legacy concentration (VTK / NPZ)",
      fileFormat: null,
    };
    const before = JSON.stringify(value);
    expect(datasetName(value)).toBe("Legacy concentration");
    expect(JSON.stringify(value)).toBe(before);
    expect(datasetName({ ...value, label: undefined })).toBe(dataset.id);
  });

  it("keeps invalid datasets unavailable and ignores informational validation", () => {
    const { onOpen } = mount({
      ...dataset,
      validation: [
        { level: "warning", message: "Display uses sampled cells." },
        { level: "error", message: "Dataset geometry is missing." },
      ],
    });
    const select = screen.getByRole("button", { name: "Kalasatama (2) 선택" });
    expect(select).toBeDisabled();
    expect(select).toHaveAccessibleDescription("Dataset geometry is missing.");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Dataset geometry is missing.",
    );
    expect(
      screen.queryByText("Display uses sampled cells."),
    ).not.toBeInTheDocument();
    fireEvent.click(select);
    expect(onOpen).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Kalasatama (2) 제목 편집" }),
    ).toBeEnabled();
  });

  it("saves a trimmed inline title with Enter and updates list and detail caches", async () => {
    const renamed = { ...dataset, name: "Harbor view" };
    const fetcher = vi.fn(async (url: string, options?: RequestInit) => {
      if (url === "/app-api/session")
        return Response.json({ csrfToken: "test-token" });
      expect(url).toBe("/app-api/datasets/prediction%3Aa%2Fb");
      expect(options?.method).toBe("PATCH");
      expect(JSON.parse(String(options?.body))).toEqual({
        title: "Harbor view",
      });
      return Response.json(renamed);
    });
    vi.stubGlobal("fetch", fetcher);
    const { client, onOpen } = mount();
    client.setQueryData(["dataset", dataset.id, "result"], {
      ...dataset,
      fields: [{ id: "pressure" }],
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Kalasatama (2) 제목 편집" }),
    );
    const input = screen.getByRole("textbox", { name: "데이터셋 제목" });
    expect(input).toHaveFocus();
    expect(input.closest("form")).toBeNull();
    expect(
      screen.queryByRole("heading", { name: dataset.name }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "저장" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "취소" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Kalasatama (2) 제목 편집" }),
    ).toBeDisabled();
    fireEvent.change(input, { target: { value: "  Harbor view  " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(
      await screen.findByRole("heading", { name: "Harbor view" }),
    ).toBeVisible();
    expect(
      client.getQueryData(["dataset", dataset.id, "result"]),
    ).toMatchObject({
      name: "Harbor view",
      fields: [{ id: "pressure" }],
    });
    expect(onOpen).not.toHaveBeenCalled();
    expect(
      fetcher.mock.calls.filter(([url]) => url !== "/app-api/session"),
    ).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Harbor view 선택" }),
    ).toBeEnabled();
  });

  it("saves an edited title on blur without opening the workspace", async () => {
    const renamed = { ...dataset, name: "Harbor after blur" };
    const fetcher = vi.fn(async (url: string, options?: RequestInit) => {
      if (url === "/app-api/session")
        return Response.json({ csrfToken: "test-token" });
      expect(options?.method).toBe("PATCH");
      expect(JSON.parse(String(options?.body))).toEqual({
        title: renamed.name,
      });
      return Response.json(renamed);
    });
    vi.stubGlobal("fetch", fetcher);
    const { onOpen } = mount();
    fireEvent.click(
      screen.getByRole("button", { name: "Kalasatama (2) 제목 편집" }),
    );
    const input = screen.getByRole("textbox", { name: "데이터셋 제목" });
    fireEvent.change(input, { target: { value: renamed.name } });
    fireEvent.blur(input);
    expect(
      await screen.findByRole("heading", { name: renamed.name }),
    ).toBeVisible();
    expect(
      fetcher.mock.calls.filter(([url]) => url !== "/app-api/session"),
    ).toHaveLength(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("closes unchanged titles on Enter or blur without a request", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    const { onOpen } = mount();
    for (const action of ["Enter", "blur"]) {
      fireEvent.click(
        screen.getByRole("button", { name: "Kalasatama (2) 제목 편집" }),
      );
      const input = screen.getByRole("textbox", { name: "데이터셋 제목" });
      fireEvent.change(input, { target: { value: `  ${dataset.name}  ` } });
      await act(async () => {
        if (action === "Enter") fireEvent.keyDown(input, { key: "Enter" });
        fireEvent.blur(input);
      });
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { name: dataset.name })).toBeVisible();
    }
    expect(fetcher).not.toHaveBeenCalled();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("rejects empty titles and cancels with Escape without saving on blur", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    const { onOpen } = mount();
    const edit = screen.getByRole("button", {
      name: "Kalasatama (2) 제목 편집",
    });
    fireEvent.keyDown(edit, { key: "Enter" });
    fireEvent.click(edit);
    expect(
      screen.getByRole("button", { name: "Kalasatama (2) 선택" }),
    ).toBeDisabled();
    const input = screen.getByRole("textbox", { name: "데이터셋 제목" });
    fireEvent.click(input);
    fireEvent.keyDown(input, { key: " " });
    fireEvent.change(input, { target: { value: "   " } });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
      fireEvent.blur(input);
    });
    expect(fetcher).not.toHaveBeenCalled();
    expect(input).toHaveAttribute("aria-invalid", "true");
    fireEvent.change(input, { target: { value: "Discarded title" } });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Escape" });
      fireEvent.blur(input);
    });
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: dataset.name })).toBeVisible();
    expect(fetcher).not.toHaveBeenCalled();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("keeps pending input read-only and submits Enter plus blur only once", async () => {
    let complete!: (response: Response) => void;
    const response = new Promise<Response>((resolve) => {
      complete = resolve;
    });
    const fetcher = vi.fn(async (url: string) =>
      url === "/app-api/session"
        ? Response.json({ csrfToken: "test-token" })
        : response,
    );
    vi.stubGlobal("fetch", fetcher);
    const { onOpen } = mount();
    fireEvent.click(
      screen.getByRole("button", { name: "Kalasatama (2) 제목 편집" }),
    );
    const input = screen.getByRole("textbox", { name: "데이터셋 제목" });
    fireEvent.change(input, { target: { value: "One submission" } });
    act(() => {
      fireEvent.keyDown(input, { key: "Enter" });
      fireEvent.blur(input);
    });
    await waitFor(() =>
      expect(
        fetcher.mock.calls.filter(([url]) => url !== "/app-api/session"),
      ).toHaveLength(1),
    );
    expect(input).toHaveAttribute("readonly");
    expect(input).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Kalasatama (2) 제목 편집" }),
    ).toBeDisabled();
    await act(async () => {
      complete(Response.json({ ...dataset, name: "One submission" }));
    });
    expect(
      await screen.findByRole("heading", { name: "One submission" }),
    ).toBeVisible();
    expect(
      fetcher.mock.calls.filter(([url]) => url !== "/app-api/session"),
    ).toHaveLength(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("ignores Enter while composing and saves after composition finishes", async () => {
    const fetcher = vi.fn(async (url: string) =>
      url === "/app-api/session"
        ? Response.json({ csrfToken: "test-token" })
        : Response.json({ ...dataset, name: "항구 제목" }),
    );
    vi.stubGlobal("fetch", fetcher);
    const { onOpen } = mount();
    fireEvent.click(
      screen.getByRole("button", { name: "Kalasatama (2) 제목 편집" }),
    );
    const input = screen.getByRole("textbox", { name: "데이터셋 제목" });
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "항구 제목" } });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    });
    expect(fetcher).not.toHaveBeenCalled();
    expect(input).toHaveValue("항구 제목");
    fireEvent.compositionEnd(input);
    fireEvent.keyDown(input, { key: "Enter", isComposing: false });
    expect(
      await screen.findByRole("heading", { name: "항구 제목" }),
    ).toBeVisible();
    expect(
      fetcher.mock.calls.filter(([url]) => url !== "/app-api/session"),
    ).toHaveLength(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("keeps the failed draft and retries with Enter while preserving the original cache", async () => {
    let attempts = 0;
    const fetcher = vi.fn(async (url: string) => {
      if (url === "/app-api/session")
        return Response.json({ csrfToken: "test-token" });
      attempts += 1;
      return attempts === 1
        ? Response.json(
            { detail: "Dataset title could not be saved." },
            { status: 503 },
          )
        : Response.json({ ...dataset, name: "Updated title" });
    });
    vi.stubGlobal("fetch", fetcher);
    const { client, onOpen } = mount();
    fireEvent.click(
      screen.getByRole("button", { name: "Kalasatama (2) 제목 편집" }),
    );
    const input = screen.getByRole("textbox", { name: "데이터셋 제목" });
    fireEvent.change(input, { target: { value: "Updated title" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Dataset title could not be saved.",
    );
    expect(input).toHaveValue("Updated title");
    expect(input).not.toHaveAttribute("readonly");
    expect(client.getQueryData(["datasets"])).toEqual({ datasets: [dataset] });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(
      await screen.findByRole("heading", { name: "Updated title" }),
    ).toBeVisible();
    expect(attempts).toBe(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("loads a thumbnail instead of full scene data and releases its blob URL", async () => {
    const createObjectURL = vi.fn(() => "blob:preview");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    const fetcher = vi.fn<typeof fetch>(
      async () => new Response(new Blob(["png"])),
    );
    vi.stubGlobal("fetch", fetcher);
    mount(
      { ...dataset, thumbnailUrl: "/app-api/datasets/one/thumbnail?v=1" },
      true,
    );
    const image = await screen.findByRole("img", {
      name: "Kalasatama (2) 3D 공간 미리보기",
    });
    expect(image).toHaveAttribute("src", "blob:preview");
    expect(image).toHaveAttribute("loading", "lazy");
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe(
      "/app-api/datasets/one/thumbnail?v=1",
    );
    fireEvent.load(image);
    expect(screen.queryByText("미리보기 준비 중")).not.toBeInTheDocument();
    cleanup();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });

  it("waits until a card is near the viewport before requesting its thumbnail", async () => {
    const observe = vi.fn();
    let enter: IntersectionObserverCallback | undefined;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          enter = callback;
        }
        observe = observe;
        disconnect = vi.fn();
      },
    );
    vi.stubGlobal("URL", {
      createObjectURL: () => "blob:preview",
      revokeObjectURL: vi.fn(),
    });
    const fetcher = vi.fn(async () => new Response(new Blob(["png"])));
    vi.stubGlobal("fetch", fetcher);
    mount({ ...dataset, thumbnailUrl: "/app-api/datasets/one/thumbnail" });
    expect(observe).toHaveBeenCalledOnce();
    expect(fetcher).not.toHaveBeenCalled();
    enter?.(
      [{ isIntersecting: true }] as IntersectionObserverEntry[],
      {} as IntersectionObserver,
    );
    await waitFor(() => expect(fetcher).toHaveBeenCalledOnce());
  });

  it("retries a busy renderer and shows a fallback for an unavailable preview", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, { status: 503, headers: { "Retry-After": "0" } }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 404 }));
    vi.stubGlobal("fetch", fetcher);
    mount({ ...dataset, thumbnailUrl: "/app-api/datasets/one/thumbnail" });
    expect(await screen.findByText("Preview unavailable")).toBeVisible();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(
      screen.getByRole("button", { name: "Kalasatama (2) 선택" }),
    ).toBeEnabled();
  });
});
