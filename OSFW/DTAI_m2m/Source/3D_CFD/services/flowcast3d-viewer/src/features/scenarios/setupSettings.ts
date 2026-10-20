import { create } from "zustand";

interface Settings {
  speed: number;
  direction: number;
  durationSeconds: number;
  stepSeconds: number;
}
interface State {
  datasetId: string;
  input: Settings;
  completed?: { fingerprint: string; resultId: string };
  initialize: (datasetId: string) => void;
  update: (input: Partial<Settings>) => void;
  complete: (fingerprint: string, resultId: string) => void;
}
const defaults: Settings = {
  speed: 5,
  direction: 0,
  durationSeconds: 60,
  stepSeconds: 1,
};
export const useSetupSettings = create<State>((set, get) => ({
  datasetId: "",
  input: defaults,
  initialize: (datasetId) => {
    if (get().datasetId !== datasetId)
      set({ datasetId, input: { ...defaults }, completed: undefined });
  },
  update: (input) => set((state) => ({ input: { ...state.input, ...input } })),
  complete: (fingerprint, resultId) =>
    set({ completed: { fingerprint, resultId } }),
}));
