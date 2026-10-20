import { createContext, type RefObject } from "react";
export const ScenePortal = createContext<RefObject<HTMLDivElement>>({
  current: null!,
});
