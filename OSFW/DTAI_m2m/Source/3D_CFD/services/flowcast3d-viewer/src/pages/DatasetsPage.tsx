import { useNavigate } from "react-router-dom";
import { useDatasets } from "../features/datasets/api";
import { DatasetCard } from "../features/datasets/DatasetCard";
import { UploadDatasetCard } from "../features/datasets/UploadDatasetCard";
import { useWorkspace } from "../stores/workspace";
import { Empty, Failure, Loading } from "../components/ui/status";
export function DatasetsPage() {
  const datasets = useDatasets(),
    select = useWorkspace((state) => state.selectDataset),
    navigate = useNavigate();
  return (
    <div className="page-content">
      {datasets.isPending ? (
        <Loading />
      ) : datasets.error ? (
        <Failure error={datasets.error} />
      ) : (
        <>
          {!datasets.data?.length && (
            <Empty title="아직 등록된 데이터가 없습니다" />
          )}
          <div className="dataset-grid">
            {datasets.data?.map((dataset) => (
              <DatasetCard
                key={dataset.id}
                dataset={dataset}
                onOpen={() => {
                  if (useWorkspace.getState().datasetId !== dataset.id)
                    select(dataset.id, dataset.fields?.[0]?.id);
                  navigate("/");
                }}
              />
            ))}
            <UploadDatasetCard />
          </div>
        </>
      )}
    </div>
  );
}
