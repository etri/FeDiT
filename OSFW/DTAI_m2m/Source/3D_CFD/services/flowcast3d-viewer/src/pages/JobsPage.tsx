import { useQueryClient } from "@tanstack/react-query";
import { Clock3 } from "lucide-react";
import { useState } from "react";
import { cancelJob, statusLabel, useJobs } from "../features/scenarios/api";
import { Empty, Failure, Loading } from "../components/ui/status";
import { Button } from "../components/ui/button";
export function JobsPage() {
  const jobs = useJobs(),
    client = useQueryClient(),
    [error, setError] = useState<unknown>();
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <h1>작업 이력</h1>
          <p>데이터 준비, 예측과 내보내기 상태를 확인합니다</p>
        </div>
        <Clock3 size={28} />
      </div>
      {Boolean(error) && <Failure error={error} />}
      {jobs.isPending ? (
        <Loading />
      ) : jobs.error ? (
        <Failure error={jobs.error} />
      ) : !jobs.data?.length ? (
        <Empty title="등록된 작업이 없습니다">
          분석을 실행하면 실제 처리 단계가 표시됩니다
        </Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>작업</th>
                <th>상태</th>
                <th>처리 단계</th>
                <th>시각</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {jobs.data.map((job) => (
                <tr key={job.id}>
                  <td>
                    <strong>{job.name ?? job.id}</strong>
                    <small>{job.id}</small>
                    {job.error && (
                      <span className="error-text">{job.error}</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${job.status}`}>
                      {statusLabel[job.status] ?? job.status}
                    </span>
                  </td>
                  <td>
                    {job.progress?.stage ?? "—"}
                    {job.progress && job.progress.total > 0 && (
                      <progress
                        value={job.progress.current}
                        max={job.progress.total}
                      />
                    )}
                  </td>
                  <td>
                    {job.updatedAt
                      ? new Date(
                          job.updatedAt * (job.updatedAt < 1e12 ? 1000 : 1),
                        ).toLocaleString("ko-KR")
                      : "—"}
                  </td>
                  <td>
                    {job.cancellable && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                          try {
                            await cancelJob(job.id);
                            await client.invalidateQueries({
                              queryKey: ["jobs"],
                            });
                          } catch (error) {
                            setError(error);
                          }
                        }}
                      >
                        취소
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
