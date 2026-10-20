import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { SceneAsset } from "./types";

type AssetProgress = { download: number; ready?: boolean; failed?: boolean };
type ReportProgress = (url: string, progress: AssetProgress) => void;
export const AssetProgressContext = createContext<ReportProgress>(() => {});

export function useAssetProgress(url: string) {
  const report = useContext(AssetProgressContext);
  const currentReport = useRef(report);
  const latest = useRef<{ url: string; progress: AssetProgress } | undefined>(
    undefined,
  );
  useLayoutEffect(() => {
    currentReport.current = report;
  }, [report]);
  useEffect(() => {
    if (latest.current?.url === url) report(url, latest.current.progress);
  }, [url, report]);
  return useCallback(
    (progress: AssetProgress) => {
      latest.current = { url, progress };
      currentReport.current(url, progress);
    },
    [url],
  );
}

export function useSceneProgress(
  key: string,
  assets: SceneAsset[],
  pending: number,
  requests: number,
) {
  const generation = useRef(key);
  const [state, setState] = useState<{
    key: string;
    assets: Record<string, AssetProgress>;
  }>({ key, assets: {} });
  useLayoutEffect(() => {
    generation.current = key;
  }, [key]);
  const report = useCallback<ReportProgress>(
    (url, progress) => {
      if (generation.current !== key) return;
      setState((previous) => ({
        key,
        assets: {
          ...(previous.key === key ? previous.assets : {}),
          [url]: progress,
        },
      }));
    },
    [key],
  );
  const loads = assets.map((asset) =>
    state.key === key ? state.assets[asset.url] : undefined,
  );
  const prepared = requests ? (requests - pending) / requests : 0;
  const downloaded = assets.length
    ? loads.reduce(
        (sum, item) => sum + Math.min(1, Math.max(0, item?.download ?? 0)),
        0,
      ) / assets.length
    : 1;
  const ready = assets.length
    ? loads.filter((item) => item?.ready).length / assets.length
    : 1;
  const progress = requests
    ? Math.floor((100 * (prepared + (pending ? 0 : downloaded + ready))) / 3)
    : 0;
  return {
    report,
    progress,
    indeterminate: pending > 0 && prepared === 0,
    detail: pending
      ? `${Math.max(0, requests - pending)}/${requests}개 표시 요청 완료`
      : `${loads.filter((item) => item?.ready).length}/${assets.length}개 자산 준비 완료`,
    active:
      requests > 0 &&
      !loads.some((item) => item?.failed) &&
      (pending > 0 || ready < 1),
    label: pending
      ? "표시 데이터 준비 중"
      : downloaded < 1
        ? "데이터 다운로드 중"
        : "3D 장면 구성 중",
  };
}
