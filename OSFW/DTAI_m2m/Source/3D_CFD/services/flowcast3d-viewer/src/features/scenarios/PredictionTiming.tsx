import { useEffect, useState } from "react";
import type { PredictionPhase } from "./usePredictionWorkflow";
import {
  isTimedPhase,
  observePredictionTime,
  type PredictionClock,
} from "./predictionTimeEstimate";

interface Props {
  phase: PredictionPhase;
  progress?: number;
  progressKey?: string;
  contextKey?: string;
  finishing?: boolean;
}

function duration(seconds: number) {
  const value = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const remaining = String(value % 60).padStart(2, "0");
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${remaining}`
    : `${String(minutes).padStart(2, "0")}:${remaining}`;
}

export function PredictionTiming({
  phase,
  progress,
  progressKey,
  contextKey = "",
  finishing = false,
}: Props) {
  const [now, setNow] = useState(() => performance.now());
  const [clock, setClock] = useState<PredictionClock>();
  const timedPhase = phase === "ready" && finishing ? "rendering" : phase;
  const active = isTimedPhase(timedPhase);

  // 실행 전체의 경과 시간은 계산 단계가 바뀌어도 이어서 표시
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(performance.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active]);
  useEffect(() => {
    const observedAt = performance.now();
    setNow(observedAt);
    setClock((previous) =>
      observePredictionTime(
        previous,
        contextKey,
        timedPhase,
        finishing ? undefined : progress,
        progressKey,
        observedAt,
      ),
    );
  }, [contextKey, timedPhase, progressKey, progress, finishing]);

  if (!active) return null;
  const current = clock?.context === contextKey ? clock : undefined;
  return (
    <span className="prediction-timing" aria-label="예측 처리 시간">
      <span aria-label="경과 시간">
        경과 {duration((now - (current?.startedAt ?? now)) / 1000)}
      </span>
    </span>
  );
}
