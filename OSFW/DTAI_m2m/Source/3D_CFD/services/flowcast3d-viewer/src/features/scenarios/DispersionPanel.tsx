import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Waves } from "lucide-react";
import { post } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Failure, Loading } from "../../components/ui/status";
import { supports, type Dataset } from "../datasets/types";
import { selectResult } from "../datasets/results";
import { useWorkspace } from "../../stores/workspace";
import {
  statusLabel,
  useDispersionScenarios,
  type DispersionScenario,
} from "./api";

export function DispersionPanel({
  dataset,
  space = dataset,
}: {
  dataset?: Dataset;
  space?: Dataset;
}) {
  const [source, setSource] = useState("0, 0, 0"),
    [duration, setDuration] = useState(60),
    [step, setStep] = useState(1),
    [reference, setReference] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(),
    [submitted, setSubmitted] = useState(false),
    [submittedId, setSubmittedId] = useState("");
  const state = useWorkspace(),
    client = useQueryClient();
  const scenarioMode = Boolean(
    space?.scenarioModes || supports(space, "predict"),
  );
  const modes =
    space?.scenarioModes ?? (supports(space, "predict") ? ["model"] : []);
  const hasReference = modes.includes("reference"),
    hasModel = modes.includes("model");
  const scenarios = useDispersionScenarios(scenarioMode && modes.length > 0);
  const currentScenarios = useMemo(
    () =>
      scenarios.data?.filter((scenario) => scenario.datasetId === space?.id) ??
      [],
    [scenarios.data, space?.id],
  );
  const referenceOptions =
    space?.results?.filter(
      (result) => result.resultRole === "reference_wind",
    ) ?? [];
  const refreshed = useRef("");
  const snapshot = JSON.stringify(
    currentScenarios.map((scenario) => [
      scenario.id,
      scenario.status,
      scenario.branches.reference.resultId,
      scenario.branches.model.resultId,
      scenario.colorRange,
    ]),
  );
  useEffect(() => {
    if (snapshot === refreshed.current) return;
    refreshed.current = snapshot;
    if (snapshot !== "[]") {
      void client.invalidateQueries({ queryKey: ["datasets"] });
      void client.invalidateQueries({ queryKey: ["dataset"] });
      void client.invalidateQueries({ queryKey: ["jobs"] });
    }
  }, [snapshot, client]);
  useEffect(() => {
    if (dataset?.bounds)
      setSource(
        dataset.bounds[0]
          .map((value, index) => (value + dataset.bounds![1][index]) / 2)
          .join(", "),
      );
    setSubmitted(false);
    setSubmittedId("");
    setError(undefined);
    // 같은 공간의 결과 전환에서는 배출원 유지
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset?.id]);
  useEffect(() => {
    setReference(space?.referenceResultId ?? "");
  }, [space?.id, space?.referenceResultId]);
  useEffect(() => {
    if (!submittedId || !dataset) return;
    const scenario = currentScenarios.find((item) => item.id === submittedId);
    const resultId =
      scenario?.branches.model.resultId ??
      scenario?.branches.reference.resultId;
    if (!resultId || !dataset.results?.some((result) => result.id === resultId))
      return;
    selectResult(dataset, resultId);
    setSubmittedId("");
  }, [submittedId, currentScenarios, dataset]);
  const position = source.split(",").map(Number);
  const valid =
    position.length === 3 &&
    position.every(Number.isFinite) &&
    source.split(",").every((value) => value.trim()) &&
    Number.isFinite(duration) &&
    duration >= 1 &&
    duration <= 3600 &&
    Number.isFinite(step) &&
    step >= 0.1 &&
    step <= 60 &&
    Math.ceil(duration / step) <= 360;
  const validWind =
    !hasModel ||
    (Number.isFinite(state.inflowSpeed) &&
      state.inflowSpeed > 0 &&
      state.inflowSpeed <= 30 &&
      Number.isFinite(state.inflowDirection) &&
      state.inflowDirection >= 0 &&
      state.inflowDirection < 360);
  const canRun = scenarioMode ? modes.length > 0 : supports(dataset, "flow");
  return (
    <section className="panel-section">
      <h3>
        <Waves size={14} />
        가상 입자 수송
      </h3>
      <p className="help-text">
        유동장으로 계산한 가상 농도이며 모델이 예측한 농도가 아닙니다
      </p>
      {scenarioMode && !hasReference && hasModel && (
        <p className="help-text">
          참조 풍장이 없어 예측 풍장 기반 가상 농도만 표시합니다
        </p>
      )}
      {scenarioMode && hasReference && hasModel && (
        <p className="help-text">
          같은 배출원과 계산 시간으로 두 농도를 생성하고 해석 결과에서
          전환합니다
        </p>
      )}
      {hasReference && (
        <label>
          참조 풍장
          <select
            value={reference}
            onChange={(event) => setReference(event.target.value)}
          >
            {!space?.referenceResultId && (
              <option value="">등록된 참조 풍장</option>
            )}
            {referenceOptions.map((result) => (
              <option key={result.id} value={result.id}>
                {result.label ?? result.name ?? result.id}
              </option>
            ))}
            {space?.referenceResultId &&
              !referenceOptions.some(
                (result) => result.id === space.referenceResultId,
              ) && (
                <option value={space.referenceResultId}>
                  등록된 참조 풍장
                </option>
              )}
          </select>
        </label>
      )}
      <label>
        배출원 세계좌표 (X, Y, Z)
        <input
          value={source}
          onChange={(event) => setSource(event.target.value)}
        />
      </label>
      <div className="form-row">
        <label>
          계산 시간 (s)
          <input
            type="number"
            min="1"
            max="3600"
            value={duration}
            onChange={(event) => setDuration(Number(event.target.value))}
          />
        </label>
        <label>
          출력 간격 (s)
          <input
            type="number"
            min="0.1"
            max="60"
            step="0.1"
            value={step}
            onChange={(event) => setStep(Number(event.target.value))}
          />
        </label>
      </div>
      <p className="help-text">
        배출량 1 g/s, 고정 시드 0{hasModel ? ", 정상 예측 풍장 사용" : ""}
      </p>
      <Button
        variant="secondary"
        disabled={!canRun || busy || !valid || !validWind}
        onClick={async () => {
          setBusy(true);
          setError(undefined);
          setSubmitted(false);
          try {
            const body = {
              datasetId: scenarioMode ? space?.id : dataset?.id,
              source: position,
              durationSeconds: duration,
              stepSeconds: step,
              seed: 0,
            };
            if (scenarioMode) {
              const response = await post<{ scenario: DispersionScenario }>(
                "/dispersion-scenarios",
                {
                  ...body,
                  direction: state.inflowDirection,
                  speed: state.inflowSpeed,
                  referenceResultId: hasReference
                    ? reference || null
                    : undefined,
                },
              );
              setSubmittedId(response.scenario.id);
              await client.invalidateQueries({
                queryKey: ["dispersion-scenarios"],
              });
            } else {
              await post("/dispersion", {
                ...body,
                resultId: state.resultId || undefined,
              });
            }
            setSubmitted(true);
            await client.invalidateQueries({ queryKey: ["jobs"] });
          } catch (error) {
            setError(error);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? (
          <Loading>요청 중</Loading>
        ) : hasReference && hasModel ? (
          "두 가상 농도 계산"
        ) : (
          "가상 농도 계산"
        )}
      </Button>
      {submitted && <p className="success-text">작업이 등록되었습니다</p>}
      {Boolean(error) && <Failure error={error} />}
      {scenarios.error && <Failure error={scenarios.error} />}
      {currentScenarios.slice(0, 3).map((scenario) => (
        <div className="help-text" key={scenario.id}>
          <strong>
            가상 농도 {scenario.id.slice(0, 8)}:{" "}
            {statusLabel[scenario.status] ?? scenario.status}
          </strong>
          <p>
            배출원 {scenario.request.source.join(", ")} /{" "}
            {scenario.request.durationSeconds}s / {scenario.request.speed}m/s,{" "}
            {scenario.request.direction}°
          </p>
          {["queued", "running"].includes(scenario.status) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  await post(
                    `/dispersion-scenarios/${encodeURIComponent(scenario.id)}/cancel`,
                    {},
                  );
                  await client.invalidateQueries({
                    queryKey: ["dispersion-scenarios"],
                  });
                } catch (error) {
                  setError(error);
                }
              }}
            >
              계산 취소
            </Button>
          )}
          {(["reference", "model"] as const)
            .filter((role) => scenario.branches[role].status !== "unavailable")
            .map((role) => {
              const branch = scenario.branches[role];
              return (
                <div key={role}>
                  <span>
                    {role === "reference" ? "참조 풍장 기반" : "예측 풍장 기반"}
                    : {statusLabel[branch.status] ?? branch.status}
                  </span>
                  {branch.error && <p className="error-text">{branch.error}</p>}
                  {branch.resultId && dataset && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => selectResult(dataset, branch.resultId!)}
                    >
                      결과 보기
                    </Button>
                  )}
                  {["failed", "interrupted", "cancelled"].includes(
                    branch.status,
                  ) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          await post(
                            `/dispersion-scenarios/${encodeURIComponent(scenario.id)}/retry`,
                            { role },
                          );
                          await client.invalidateQueries({
                            queryKey: ["dispersion-scenarios"],
                          });
                        } catch (error) {
                          setError(error);
                        }
                      }}
                    >
                      다시 계산
                    </Button>
                  )}
                </div>
              );
            })}
        </div>
      ))}
    </section>
  );
}
