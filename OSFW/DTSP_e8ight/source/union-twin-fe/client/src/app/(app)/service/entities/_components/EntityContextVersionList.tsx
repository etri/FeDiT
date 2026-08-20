import { useState } from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@e8ight/ui/components/ui/collapsible';
import { cn } from '@e8ight/ui/utils/cn';
import { ErrorBoundary, Suspense } from '@suspensive/react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { contextQueries } from '@/apis/context';
import { EntityBranchSkeleton } from '@/app/(app)/service/entities/_components/EntityBranchSkeleton';
import EntityDataModelList from '@/app/(app)/service/entities/_components/EntityDataModelList';
import { useEntityParams } from '@/app/(app)/service/entities/_hooks/useEntityParams';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';

import type { ContextVersion } from '@/types/context';

interface IProps {
  contextId: string;
}

function EntityContextVersionList({ contextId }: IProps) {
  const { data: contextVersionInfoList } = useSuspenseQuery(
    contextQueries.versions(contextId),
  );

  const visibleVersionList = contextVersionInfoList.filter((item) =>
    Boolean(item.url),
  );

  if (visibleVersionList.length === 1) {
    return (
      <ErrorBoundary fallback={<QueryErrorFallback />}>
        <Suspense fallback={<EntityBranchSkeleton />}>
          <EntityDataModelList contextId={visibleVersionList[0].url} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ul className="mt-1 ml-3 min-w-0 space-y-1 border-l pl-3">
      {visibleVersionList.map((contextVersionInfo, idx) => {
        return (
          <EntityContextVersionListItem
            key={contextVersionInfo.url}
            contextVersionInfo={contextVersionInfo}
            idx={idx}
          />
        );
      })}
    </ul>
  );
}

export default EntityContextVersionList;

interface IProps2 {
  contextVersionInfo: ContextVersion;
  idx: number;
}

function EntityContextVersionListItem({ contextVersionInfo, idx }: IProps2) {
  const router = useRouter();
  const { contextId: routeContextId } = useEntityParams();
  const isActiveVersion = routeContextId === contextVersionInfo.url;
  const versionLabel =
    contextVersionInfo.version?.trim() || `Version ${idx + 1}`;
  const [userToggled, setUserToggled] = useState<boolean | null>(null);
  const open = userToggled ?? isActiveVersion;

  return (
    <li className="min-w-0">
      <Collapsible open={open} onOpenChange={setUserToggled}>
        <CollapsibleTrigger
          className="hover:bg-muted/70 data-[state=open]:bg-muted/50 grid min-h-8 w-full min-w-0 grid-cols-[16px_minmax(0,1fr)] items-center gap-2 overflow-hidden rounded-lg px-3 text-left transition-colors"
          onClick={() => {
            router.push(
              `/service/entities/${encodeURIComponent(contextVersionInfo.url)}`,
            );
          }}
        >
          <ChevronRight
            size={16}
            className={cn(
              'text-muted-foreground shrink-0 transition-transform',
              open && 'rotate-90',
            )}
          />
          <p
            title={versionLabel}
            className="text-muted-foreground min-w-0 truncate text-sm font-medium select-text"
          >
            {versionLabel}
          </p>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {open ? (
            <ErrorBoundary fallback={<QueryErrorFallback />}>
              <Suspense fallback={<EntityBranchSkeleton />}>
                <EntityDataModelList contextId={contextVersionInfo.url} />
              </Suspense>
            </ErrorBoundary>
          ) : null}
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}
