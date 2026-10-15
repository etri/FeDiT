import { useState } from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@e8ight/ui/components/ui/collapsible';
import { ErrorBoundary, Suspense } from '@suspensive/react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { contextQueries } from '@/apis/context';
import { EntityBranchSkeleton } from '@/app/(app)/service/entities/_components/EntityBranchSkeleton';
import EntityContextVersionList from '@/app/(app)/service/entities/_components/EntityContextVersionList';
import { useEntityParams } from '@/app/(app)/service/entities/_hooks/useEntityParams';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';

function EntityContextList() {
  const { data: rawList } = useSuspenseQuery(contextQueries.list());
  const contextList = rawList.filter((el) => !el.includes('ngsi-ld'));

  return (
    <ul className="min-h-0 w-full min-w-0 space-y-1">
      {contextList.map((contextData) => {
        return <ContextListItem key={contextData} contextData={contextData} />;
      })}
    </ul>
  );
}

interface IProps2 {
  contextData: string;
}

function ContextListItem({ contextData }: IProps2) {
  const router = useRouter();
  const { contextId: routeContextId } = useEntityParams();
  const isActiveContext = Boolean(
    routeContextId && routeContextId.startsWith(contextData),
  );
  const [userToggled, setUserToggled] = useState<boolean | null>(null);
  const open = userToggled ?? isActiveContext;

  return (
    <li className="min-w-0">
      <Collapsible open={open} onOpenChange={setUserToggled}>
        <CollapsibleTrigger
          className="hover:bg-muted/70 data-[state=open]:bg-muted/50 grid min-h-9 w-full min-w-0 grid-cols-[16px_minmax(0,1fr)] items-center gap-2 overflow-hidden rounded-lg text-left transition-colors"
          onClick={() => {
            router.push(`/service/entities/${encodeURIComponent(contextData)}`);
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
            title={contextData}
            className="text-foreground min-w-0 truncate text-sm font-semibold select-text"
          >
            {contextData}
          </p>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {open ? (
            <ErrorBoundary fallback={<QueryErrorFallback />}>
              <Suspense fallback={<EntityBranchSkeleton />}>
                <EntityContextVersionList contextId={contextData} />
              </Suspense>
            </ErrorBoundary>
          ) : null}
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

export default EntityContextList;
