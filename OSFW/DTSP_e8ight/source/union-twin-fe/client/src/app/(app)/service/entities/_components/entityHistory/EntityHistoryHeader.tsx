import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@e8ight/ui/components/ui/breadcrumb';
import { Button } from '@e8ight/ui/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface IProps {
  modelId: string | undefined;
  targetEntityId: string;
  showResetButton: boolean;
  onShowEntityList: () => void;
  onReset: () => void;
}

function EntityHistoryHeader({
  modelId,
  targetEntityId,
  showResetButton,
  onShowEntityList,
  onReset,
}: IProps) {
  return (
    <div className="shrink-0">
      <Breadcrumb>
        <BreadcrumbList className="text-xs">
          <BreadcrumbItem>Entity</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground h-auto p-0 text-xs font-medium"
              onClick={onShowEntityList}
            >
              {modelId}
            </Button>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="max-w-[260px] truncate text-xs">
              {targetEntityId}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="mt-1 flex items-center justify-between gap-3">
        <h1
          title={targetEntityId}
          className="text-foreground truncate text-lg font-bold"
        >
          {targetEntityId}
        </h1>
        {showResetButton && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-auto shrink-0 px-1.5 py-1"
            onClick={onReset}
          >
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}

export default EntityHistoryHeader;
