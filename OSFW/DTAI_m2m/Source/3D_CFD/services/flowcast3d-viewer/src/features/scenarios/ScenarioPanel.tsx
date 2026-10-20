import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Play, Wind } from "lucide-react";
import { post } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Failure, Loading } from "../../components/ui/status";
import { supports, type Dataset } from "../datasets/types";
import { useWorkspace } from "../../stores/workspace";
export function ScenarioPanel({ dataset }: { dataset?: Dataset }) {
  const speed = useWorkspace((state) => state.inflowSpeed),
    direction = useWorkspace((state) => state.inflowDirection),
    set = useWorkspace((state) => state.set);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(),
    [submitted, setSubmitted] = useState(false);
  const client = useQueryClient();
  return (
    <section className="panel-section">
      <h3>
        <Wind size={14} />
        시나리오
      </h3>
      <label>
        유입 풍속
        <span className="input-unit">
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={speed}
            onChange={(event) =>
              set({ inflowSpeed: Number(event.target.value) })
            }
          />
          <span>m/s</span>
        </span>
      </label>
      <label>
        풍향
        <span className="input-unit">
          <input
            type="number"
            min="0"
            max="359.9"
            value={direction}
            onChange={(event) =>
              set({ inflowDirection: Number(event.target.value) })
            }
          />
          <span>°</span>
        </span>
      </label>
      <Button
        disabled={
          !supports(dataset, "predict") ||
          busy ||
          !Number.isFinite(speed) ||
          !Number.isFinite(direction) ||
          speed <= 0 ||
          direction < 0 ||
          direction >= 360
        }
        onClick={async () => {
          setBusy(true);
          setError(undefined);
          setSubmitted(false);
          try {
            await post("/predict", {
              datasetId: dataset?.id,
              speed,
              direction,
              steps: 1,
            });
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
        ) : (
          <>
            <Play size={13} />
            예측 실행
          </>
        )}
      </Button>
      {!supports(dataset, "predict") && (
        <p className="help-text">
          모델 입력이 준비된 데이터셋에서 실행할 수 있습니다
        </p>
      )}
      {submitted && <p className="success-text">실행 요청이 등록되었습니다</p>}
      {Boolean(error) && <Failure error={error} />}
    </section>
  );
}
