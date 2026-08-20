import { Button } from '@e8ight/ui/components/ui/button';
import { cn } from '@e8ight/ui/utils/cn';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Database } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { contextQueries } from '@/apis/context';
import { useEntityParams } from '@/app/(app)/service/entities/_hooks/useEntityParams';

interface IProps1 {
  contextId: string;
}

function EntityDataModelList({ contextId }: IProps1) {
  const { data: contextInfo } = useSuspenseQuery(
    contextQueries.info(contextId),
  );

  const dataModelList = Object.keys(contextInfo).filter((dataModel) =>
    dataModel[0].match(/[A-Z]/),
  );

  return (
    <ul className="mt-1 ml-3 min-w-0 space-y-1 border-l pl-3">
      {dataModelList.map((dataModel) => {
        return (
          <DataModelListItem
            key={dataModel}
            contextId={contextId}
            dataModel={dataModel}
          />
        );
      })}
    </ul>
  );
}

interface IProps2 {
  contextId: string;
  dataModel: string;
}

function DataModelListItem({ contextId, dataModel }: IProps2) {
  const { contextId: routeContextId, modelId: routeModelId } =
    useEntityParams();
  const router = useRouter();

  const isActive = routeContextId === contextId && routeModelId === dataModel;

  const onClickDataModel = () => {
    router.push(
      `/service/entities/${encodeURIComponent(contextId)}/${dataModel}`,
    );
  };

  return (
    <li key={dataModel} className="min-w-0">
      <Button
        variant="ghost"
        onClick={onClickDataModel}
        className={cn(
          'hover:bg-muted/70 grid min-h-8 w-full min-w-0 grid-cols-[16px_minmax(0,1fr)] items-center justify-start gap-2 overflow-hidden rounded-lg px-3 text-left',
          isActive && 'bg-accent text-accent-foreground hover:bg-accent',
        )}
      >
        <Database size={16} className="text-muted-foreground shrink-0" />
        <span
          title={dataModel}
          className="w-full min-w-0 truncate text-sm font-medium select-text"
        >
          {dataModel}
        </span>
      </Button>
    </li>
  );
}

export default EntityDataModelList;
