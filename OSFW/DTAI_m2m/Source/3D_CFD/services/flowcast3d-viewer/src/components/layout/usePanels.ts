import { useCallback, useLayoutEffect, useState } from "react";
import { useWorkspace } from "../../stores/workspace";
export function usePanels() {
  const [narrow, setNarrow] = useState(
    () => window.matchMedia("(max-width: 1279px)").matches,
  );
  useLayoutEffect(() => {
    const media = window.matchMedia("(max-width: 1279px)");
    const update = () => {
      setNarrow(media.matches);
      if (media.matches)
        useWorkspace.getState().set({ leftOpen: false, rightOpen: false });
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const toggle = useCallback(
    (side: "left" | "right") => {
      const state = useWorkspace.getState(),
        next = side === "left" ? !state.leftOpen : !state.rightOpen;
      state.set(
        side === "left"
          ? { leftOpen: next, ...(narrow ? { rightOpen: false } : {}) }
          : { rightOpen: next, ...(narrow ? { leftOpen: false } : {}) },
      );
    },
    [narrow],
  );
  const close = useCallback(
    () => useWorkspace.getState().set({ leftOpen: false, rightOpen: false }),
    [],
  );
  return { narrow, toggle, close };
}
