import { create } from "zustand";
import { useWorkspace } from "../../stores/workspace";
import type { PreparedPredictionViews } from "./preparedViews";

export const usePreparedViewStore = create<{
  views?: PreparedPredictionViews;
  resultId?: string;
  datasetId?: string;
  resultVersion?: string;
  roi?: string;
}>()(() => ({}));

// 같은 예측의 풍장과 농도 사이에서는 준비된 세 모드를 유지
useWorkspace.subscribe((state, previous) => {
  const current = usePreparedViewStore.getState();
  if (!current.views) return;
  if (
    state.datasetId !== previous.datasetId ||
    JSON.stringify(state.roi) !== current.roi ||
    (state.resultId !== current.resultId &&
      state.resultId !== current.views.wind?.resultId)
  )
    usePreparedViewStore.setState({}, true);
});
