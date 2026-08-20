import { useEffect, useMemo, useRef } from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@e8ight/ui/components/ui/breadcrumb';
import { Button } from '@e8ight/ui/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@e8ight/ui/components/ui/table';
import { useDebounce, useInfiniteScroll } from '@e8ight/ui/hooks';
import { cn } from '@e8ight/ui/utils/cn';
import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import { RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { entityQueries } from '@/apis/entity';
import { EntityTableSkeleton } from '@/app/(app)/service/entities/_components/EntityTableSkeleton';
import EntitySearchForm from '@/app/(app)/service/entities/_components/searchForm/EntitySearchForm';
import { useSwitchEntityTab } from '@/app/(app)/service/entities/_hooks/useActiveEntityTab';
import { useEntityParams } from '@/app/(app)/service/entities/_hooks/useEntityParams';
import { useEntityTableViewport } from '@/app/(app)/service/entities/_hooks/useEntityTableViewport';
import { useEntityTabStore } from '@/app/(app)/service/entities/_stores/useEntityTabStore';
import { qQueryGenerator } from '@/app/(app)/service/entities/_utils/generator';
import { entityPath } from '@/app/(app)/service/entities/_utils/paths';

import type {
  EntitiesRequestParamsType,
  EntityRequestHeaderType,
} from '@/apis/entity';
import type {
  EntityTabType,
  ModelInfoReturnTypeForEntity,
} from '@/app/(app)/service/entities/_types/entity';
import type { ApiError } from '@/types/error';

interface IProps {
  modelInfo: ModelInfoReturnTypeForEntity;
  appendEntityTabList: (newEntityTab: EntityTabType) => void;
}

function EntityList({ modelInfo, appendEntityTabList }: IProps) {
  const searchInfo = useEntityTabStore((s) => s.searchInfo);
  const resetSearchInfoForStatic = useEntityTabStore(
    (s) => s.resetSearchInfoForStatic,
  );
  const debouncedSearchInfo = useDebounce(searchInfo, 300);

  const { contextId, modelId, entityId: routeEntityId } = useEntityParams();
  const switchEntityTab = useSwitchEntityTab();
  const router = useRouter();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const limitKey = `${contextId}:${modelId}`;
  const pageLimit = useEntityTableViewport(
    viewportRef,
    modelInfo,
    limitKey,
    `${limitKey}:${JSON.stringify(debouncedSearchInfo)}`,
  );
  const isDynamic = modelInfo.isDynamic;
  const searchCriteriaInfoList = useMemo(
    () =>
      modelInfo.searchCriteriaInfoList.filter(
        (searchCriteriaInfo) =>
          !modelInfo.timePropertyList.includes(searchCriteriaInfo.criteria),
      ),
    [modelInfo],
  );

  const requestConfig = useMemo(() => {
    if (!contextId || !modelId || pageLimit === 0) {
      return undefined;
    }

    const headers: EntityRequestHeaderType = {
      Link: `<${contextId}>`,
    };
    const params: EntitiesRequestParamsType = {
      type: modelId,
      limit: pageLimit,
    };

    const excludeList = ['.observedAt'];
    const qQuery = debouncedSearchInfo.criteriaInfoList
      .map((criteriaInfo) =>
        qQueryGenerator(
          criteriaInfo.criteria,
          criteriaInfo.valueType,
          criteriaInfo.value,
          excludeList,
        ),
      )
      .join('');

    if (qQuery) {
      params.q = qQuery;
    }

    return { headers, params };
  }, [pageLimit, contextId, modelId, debouncedSearchInfo]);

  const {
    data,
    error,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    fetchNextPage,
  } = useInfiniteQuery({
    ...entityQueries.list({
      contextId: contextId ?? '',
      modelId: modelId ?? '',
      isDynamic,
      pageLimit,
      searchInfo: debouncedSearchInfo,
      requestConfig,
    }),
  });

  const entitiesData = useMemo(
    () => data?.pages.flatMap((page) => page.entities) ?? [],
    [data],
  );
  const { containerRef, sentinelRef } = useInfiniteScroll<HTMLDivElement>({
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    fetchNextPage: () => {
      void fetchNextPage();
    },
  });

  useEffect(() => {
    if (!error) {
      return;
    }

    let errMsg = 'err';

    if (axios.isAxiosError(error)) {
      const errorResponse = error.response?.data as ApiError | undefined;
      errMsg = errorResponse?.title ?? 'Request failed';
    }

    toast.error('Something went wrong. Please contact support.');
    console.error(errMsg);
  }, [error]);

  const onSelectEntity = (entityId: string) => {
    if (!contextId || !modelId) {
      return;
    }

    const newEntityTab: EntityTabType = {
      title: entityId,
      contextId,
      modelId,
      entityId,
      detailId: entityId,
      searchInfo,
    };

    switchEntityTab(newEntityTab);
    appendEntityTabList(newEntityTab);
    router.push(entityPath(contextId, modelId, entityId));
  };

  return (
    <div className="bg-background box-border flex h-full min-h-0 w-full min-w-0 flex-1 flex-col gap-3 px-3 py-3">
      <div className="shrink-0">
        <Breadcrumb>
          <BreadcrumbList className="text-xs">
            <BreadcrumbItem>Entity</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="max-w-[240px] truncate text-xs">
                {modelId}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="mt-1 flex items-center justify-between gap-3">
          <h1 className="text-foreground truncate text-lg font-bold">
            {modelId}
          </h1>
          {searchCriteriaInfoList.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-auto shrink-0 px-1.5 py-1"
              onClick={resetSearchInfoForStatic}
            >
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
          )}
        </div>
      </div>
      {searchCriteriaInfoList.length > 0 && (
        <section
          key={`${contextId ?? ''}-${modelId ?? ''}`}
          className="border-border/70 shrink-0 border-b pb-3"
        >
          <EntitySearchForm
            searchCriteriaInfoList={searchCriteriaInfoList}
            isDynamic={isDynamic}
          />
        </section>
      )}
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          ref={(node) => {
            containerRef.current = node;
            viewportRef.current = node;
          }}
          className="relative min-h-0 flex-1 overflow-y-auto [&_[data-slot=table-container]]:overflow-visible"
        >
          <EntityListContent
            entitiesData={entitiesData}
            isPending={isPending}
            routeEntityId={routeEntityId}
            onSelectEntity={onSelectEntity}
          />
          {(hasNextPage || isFetchingNextPage) && (
            <div
              ref={sentinelRef}
              className={cn(
                'flex justify-center p-4',
                entitiesData.length === 0 && 'h-full items-center',
              )}
            >
              {isFetchingNextPage && <Spinner className="size-6" />}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function EntityListContent({
  entitiesData,
  isPending,
  routeEntityId,
  onSelectEntity,
}: {
  entitiesData: { entityId: string; provider: string }[];
  isPending: boolean;
  routeEntityId: string | undefined;
  onSelectEntity: (entityId: string) => void;
}) {
  if (entitiesData.length > 0) {
    return (
      <Table className="table-fixed">
        <TableHeader className="bg-background/95 sticky top-0 z-10 backdrop-blur-sm">
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-11 px-4 font-bold tracking-[0.07em] uppercase">
              Entity ID
            </TableHead>
            <TableHead className="h-11 w-[28%] px-4 font-bold tracking-[0.07em] uppercase">
              Provider
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entitiesData.map(({ entityId, provider }) => {
            const isActive = routeEntityId === entityId;

            return (
              <TableRow
                key={entityId}
                data-state={isActive ? 'selected' : undefined}
                tabIndex={0}
                className="cursor-pointer"
                onClick={() => onSelectEntity(entityId)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectEntity(entityId);
                  }
                }}
              >
                <TableCell className="px-4 py-3">
                  <div
                    title={entityId}
                    className="truncate text-sm font-medium"
                  >
                    {entityId}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div
                    title={provider}
                    className="text-muted-foreground truncate text-sm"
                  >
                    {provider}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  }

  if (!isPending && entitiesData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center py-10">
        <Empty className="max-w-sm border-0 bg-transparent">
          <EmptyHeader>
            <EmptyTitle>No entities found</EmptyTitle>
            <EmptyDescription>
              Adjust the filters or choose a different context and model.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return <EntityTableSkeleton />;
}

export default EntityList;
