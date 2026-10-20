import { StrictMode } from "react";
import { act, renderHook } from "@testing-library/react";
import { expect, it } from "vitest";
import { useUploader } from "./useUploader";
it("keeps a live uploader after StrictMode remount and destroys it on exit", () => {
  const { result, unmount } = renderHook(useUploader, { wrapper: StrictMode });
  const uploader = result.current;
  expect(uploader?.getPlugin("Tus")).toBeDefined();
  act(() => {
    uploader?.addFile({
      name: "synthetic.npz",
      type: "",
      data: new File([new Uint8Array(16)], "synthetic.npz"),
    });
  });
  expect(uploader?.getFiles()).toHaveLength(1);
  unmount();
  expect(uploader?.getPlugin("Tus")).toBeUndefined();
});
