import { useState, useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import "./SceneLoading.css";

export function SceneLoading({
  progress,
  label,
  compact = false,
  indeterminate = false,
  detail,
}: {
  progress?: number;
  label: string;
  compact?: boolean;
  indeterminate?: boolean;
  detail?: string;
}) {
  const [started] = useState(() => performance.now());
  const [elapsed, setElapsed] = useState(0);
  const measured =
    !indeterminate &&
    progress !== undefined &&
    Number.isFinite(progress) &&
    progress > 0;
  const value = measured ? Math.min(100, progress) : undefined;
  useEffect(() => {
    const timer = window.setInterval(
      () => setElapsed(Math.floor((performance.now() - started) / 1000)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [started]);
  return (
    <div
      className={`scene-progress ${compact ? "scene-progress-compact" : ""}`}
    >
      <div className="scene-progress-heading" role="status">
        <LoaderCircle size={16} className="spin" aria-hidden="true" />
        <span>{label}</span>
        <strong>
          {value === undefined
            ? "처리 중"
            : value < 1
              ? "1% 미만"
              : `${Math.floor(value)}%`}
        </strong>
      </div>
      <progress
        aria-label="데이터 불러오기 진행률"
        aria-valuetext={
          value === undefined ? "처리 중, 진행량 확인 중" : undefined
        }
        value={value}
        max={100}
      />
      <div className="scene-progress-detail">
        <span>{elapsed}초 경과</span>
        <span>
          {detail ?? (value === undefined ? "진행량 확인 중" : "단계별 진행률")}
        </span>
      </div>
    </div>
  );
}
