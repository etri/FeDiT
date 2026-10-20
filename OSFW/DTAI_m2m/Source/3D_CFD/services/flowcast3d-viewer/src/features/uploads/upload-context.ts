import { createContext, useContext } from "react";

export interface UploadEntry {
  id: string;
  name: string;
  status:
    | "uploading"
    | "registering"
    | "preparing"
    | "complete"
    | "error"
    | "uncertain";
  progress: number;
  error?: string;
  retry?: "upload" | "job";
  jobId?: string;
  attempt?: number;
}

export interface DirectUpload {
  ready: boolean;
  entries: UploadEntry[];
  error?: string;
  addFiles: (files: File[]) => Promise<void>;
  retry: (id: string) => Promise<void>;
  dismiss: (id: string) => void;
}

export const UploadContext = createContext<DirectUpload | undefined>(undefined);

export function useDirectUpload() {
  const context = useContext(UploadContext);
  if (!context) throw new Error("Upload provider is unavailable");
  return context;
}
