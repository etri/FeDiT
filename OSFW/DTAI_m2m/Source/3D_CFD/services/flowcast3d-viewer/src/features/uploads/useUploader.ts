import { useEffect, useState } from "react";
import Uppy from "@uppy/core";
import Tus from "@uppy/tus";
import { csrf } from "../../lib/api";
import { fileFingerprint, verifyResume } from "./identity";
export const uploadFormats = [
  ".stl",
  ".vtk",
  ".vti",
  ".vtu",
  ".vtp",
  ".vtr",
  ".vts",
  ".npz",
];
function createUploader() {
  const uppy = new Uppy({
    id: "flowcast3d-upload",
    autoProceed: false,
    restrictions: {
      maxFileSize: 32 * 1024 ** 3,
      maxTotalFileSize: 64 * 1024 ** 3,
      maxNumberOfFiles: 512,
      allowedFileTypes: uploadFormats,
    },
    onBeforeFileAdded: (file) => {
      if (!file.name || file.name.includes(".."))
        throw new Error("Invalid upload filename");
      return file;
    },
  });
  uppy.addPreProcessor(async (ids) => {
    await Promise.all(
      ids.map(async (id) => {
        const file = uppy.getFile(id);
        if (!(file?.data instanceof Blob))
          throw new Error("Upload source is unavailable");
        uppy.setFileMeta(id, { fingerprint: await fileFingerprint(file.data) });
      }),
    );
  });
  uppy.use(Tus, {
    endpoint: "/app-api/uploads",
    chunkSize: 32 * 1024 ** 2,
    limit: 2,
    retryDelays: [0, 1000, 3000, 5000],
    removeFingerprintOnSuccess: true,
    storeFingerprintForResuming: true,
    withCredentials: true,
    fingerprint: async (file) =>
      `flowcast3d-${encodeURIComponent(file.name ?? "")}-${await fileFingerprint(file)}`,
    onBeforeRequest: async (request, file) => {
      request.setHeader("X-CSRF-Token", csrf());
      if (!(file.data instanceof Blob))
        throw new Error("Upload source is unavailable");
      if (["HEAD", "PATCH"].includes(request.getMethod()))
        await verifyResume(
          request.getURL(),
          file.data,
          file.name ?? "",
          request.getMethod() === "HEAD",
        );
    },
  });
  return uppy;
}
export function useUploader() {
  const [uppy, setUppy] = useState<ReturnType<typeof createUploader>>();
  useEffect(() => {
    const instance = createUploader();
    setUppy(instance);
    return () => instance.destroy();
  }, []);
  return uppy;
}
