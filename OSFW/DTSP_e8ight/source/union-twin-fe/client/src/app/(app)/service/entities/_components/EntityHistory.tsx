import { useEffect, useMemo, useRef } from 'react';

import { toast } from '@e8ight/ui/components/ui/sonner';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { useDebounce, useInfiniteScroll } from '@e8ight/ui/hooks';
import { cn } from '@e8ight/ui/utils/cn';
import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/navigation';

import { entityQueries } from '@/apis/entity';
import EntityHistoryContent from '@/app/(app)/service/entities/_components/entityHistory/EntityHistoryContent';
import EntityHistoryHeader from '@/app/(app)/service/entities/_components/entityHistory/EntityHistoryHeader';
import EntitySearchForm from '@/app/(app)/service/entities/_components/searchForm/EntitySearchForm';
import { useSwitchEntityTab } from '@/app/(app)/service/entities/_hooks/useActiveEntityTab';
import { useEntityParams } from '@/app/(app)/service/entities/_hooks/useEntityParams';
import { useEntityTableViewport } from '@/app/(app)/service/entities/_hooks/useEntityTableViewport';
import { useEntityTabStore } from '@/app/(app)/service/entities/_stores/useEntityTabStore';
import { qQueryGenerator } from '@/app/(app)/service/entities/_utils/generator';
import { entityHistoryPath } from '@/app/(app)/service/entities/_utils/paths';
import { convertFullDateTimeFromString } from '@/lib/date';

import type {
  EntityHistoryDto,
  EntityHistoryRequestParamsType,
  EntityRequestHeaderType,
  ValueType,
} from '@/apis/entity';
import type {
  EntityTabType,
  ModelInfoReturnTypeForEntity,
} from '@/app/(app)/service/entities/_types/entity';
import type { ApiError } from '@/types/error';

interface IProps {
  targetEntityId: string;
  modelInfo: ModelInfoReturnTypeForEntity;
  showEntityList: () => void;
  appendEntityTabList: (newEntityTab: EntityTabType) => void;
}

function EntityHistory({
  targetEntityId,
  modelInfo,
  showEntityList,
  appendEntityTabList,
}: IProps) {
  const searchInfo = useEntityTabStore((s) => s.searchInfo);
  const resetSearchInfoForStatic = useEntityTabStore(
    (s) => s.resetSearchInfoForStatic,
  );
  const resetSearchInfoForDynamic = useEntityTabStore(
    (s) => s.resetSearchInfoForDynamic,
  );
  const debouncedSearchInfo = useDebounce(searchInfo, 300);

  const { contextId, modelId, historyId } = useEntityParams();
  const switchEntityTab = useSwitchEntityTab();
  const router = useRouter();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const limitKey = `${contextId}:${modelId}:${targetEntityId}`;
  const pageLimit = useEntityTableViewport(
    viewportRef,
    modelInfo,
    limitKey,
    `${limitKey}:${JSON.stringify(debouncedSearchInfo)}`,
  );
  const timePropertyList = modelInfo.timePropertyList;
  const searchCriteriaInfoList = useMemo(
    () =>
      modelInfo.searchCriteriaInfoList.filter(
        (searchCriteriaInfo) =>
          modelInfo.timePropertyList.includes(searchCriteriaInfo.criteria) ||
          searchCriteriaInfo.criteria.includes('.observedAt'),
      ),
    [modelInfo],
  );
  const defaultObservedTimeFilter = useMemo(() => {
    const property = timePropertyList[0];
    const valueType = searchCriteriaInfoList.find(
      (searchCriteriaInfo) => searchCriteriaInfo.criteria === property,
    )?.valueType as ValueType | undefined;

    return property && valueType ? { property, valueType } : undefined;
  }, [searchCriteriaInfoList, timePropertyList]);

  const requestConfig = useMemo(() => {
    if (
      !contextId ||
      !targetEntityId ||
      !debouncedSearchInfo.observedTimeInfo?.property ||
      pageLimit === 0
    ) {
      return undefined;
    }

    const { observedTimeInfo, criteriaInfoList } = debouncedSearchInfo;
    const headers: EntityRequestHeaderType = {
      Link: `<${contextId}>`,
    };
    const params: EntityHistoryRequestParamsType = {
      entityId: targetEntityId,
      limit: pageLimit,
      timeproperty: `${observedTimeInfo.property}.observedAt`,
      sortproperty: `${observedTimeInfo.property}.observedAt`,
    };

    const excludeList = ['_id.id', '_id.servicePath'];
    const qQuery =
      criteriaInfoList
        .map((criteriaInfo) =>
          qQueryGenerator(
            criteriaInfo.criteria,
            criteriaInfo.valueType,
            criteriaInfo.value,
            excludeList,
          ),
        )
        .join('') +
      qQueryGenerator(
        observedTimeInfo.property,
        observedTimeInfo.valueType,
        observedTimeInfo.value,
        excludeList,
      );

    if (qQuery) {
      params.q = qQuery;
    }

    if (observedTimeInfo.startTime) {
      params.time = `${observedTimeInfo.startTime}:00.0`;
    }

    if (observedTimeInfo.startTime && observedTimeInfo.endTime) {
      params.endTime = `${observedTimeInfo.endTime}:00.0`;
    } else if (observedTimeInfo.endTime) {
      params.time = `${observedTimeInfo.endTime}:00.0`;
    }

    if (observedTimeInfo.timerel) {
      params.timerel = observedTimeInfo.timerel;
    }

    return { headers, params };
  }, [pageLimit, contextId, debouncedSearchInfo, targetEntityId]);

  const isHistoryQueryReady = Boolean(requestConfig);

  const {
    data,
    error,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    ...entityQueries.history({
      contextId: contextId ?? '',
      entityId: targetEntityId,
      pageLimit,
      searchInfo: debouncedSearchInfo,
      requestConfig,
    }),
  });

  const showHistoryLoading =
    isHistoryQueryReady && (isFetching || isFetchingNextPage);

  const entitiesHistoryData = useMemo(
    () => data?.pages.flatMap((page) => page.entityHistoryList) ?? [],
    [data],
  );
  const { containerRef, sentinelRef } = useInfiniteScroll<HTMLDivElement>({
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    fetchNextPage: () => {
      void fetchNextPage();
    },
  });

  const handleReset = () => {
    if (defaultObservedTimeFilter) {
      resetSearchInfoForDynamic(
        defaultObservedTimeFilter.property,
        defaultObservedTimeFilter.valueType,
      );
    } else {
      resetSearchInfoForStatic();
    }
  };

  useEffect(() => {
    if (!error) {
      return;
    }

    let errMsg = 'err';
    if (axios.isAxiosError(error)) {
      const errorResponse = error.response?.data as ApiError | undefined;
      errMsg = errorResponse?.title ?? 'Request failed';
    }

    toast.error('An error occurred. Please contact the development team.');
    console.error(errMsg);
  }, [error]);

  const onSelectHistory = (historyData: EntityHistoryDto) => {
    if (!contextId || !modelId) {
      return;
    }

    const newEntityTabInfo: EntityTabType = {
      title: historyData.entityId,
      subTitle: `${
        searchInfo.observedTimeInfo?.property || timePropertyList[0]
      } ${convertFullDateTimeFromString(historyData.observedAt)}`,
      contextId,
      modelId,
      entityId: historyData.entityId,
      historyId: historyData.historyId,
      detailId: historyData.historyId,
      searchInfo,
    };

    switchEntityTab(newEntityTabInfo);
    appendEntityTabList(newEntityTabInfo);
    router.push(
      entityHistoryPath(
        contextId,
        modelId,
        historyData.entityId,
        historyData.historyId,
      ),
    );
  };

  const shouldShowSelectObservedTimePrompt =
    !isHistoryQueryReady &&
    entitiesHistoryData.length === 0 &&
    timePropertyList.length > 0;

  const shouldShowNoHistoryEmpty =
    isHistoryQueryReady &&
    entitiesHistoryData.length === 0 &&
    !showHistoryLoading;

  return (
    <div className="bg-background box-border flex h-full min-h-0 w-full min-w-0 flex-1 flex-col gap-3 px-3 py-3">
      <EntityHistoryHeader
        modelId={modelId}
        targetEntityId={targetEntityId}
        showResetButton={searchCriteriaInfoList.length > 0}
        onShowEntityList={showEntityList}
        onReset={handleReset}
      />
      {searchCriteriaInfoList.length > 0 && (
        <section
          key={`${contextId ?? ''}-${modelId ?? ''}-${targetEntityId}`}
          className="border-border/70 shrink-0 border-b pb-3"
        >
          <EntitySearchForm
            timePropertyList={timePropertyList}
            searchCriteriaInfoList={searchCriteriaInfoList}
            isDynamic
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
          <EntityHistoryContent
            entitiesHistoryData={entitiesHistoryData}
            activeHistoryId={historyId}
            shouldShowSelectObservedTimePrompt={
              shouldShowSelectObservedTimePrompt
            }
            shouldShowNoHistoryEmpty={shouldShowNoHistoryEmpty}
            showHistoryLoading={showHistoryLoading}
            onSelectHistory={onSelectHistory}
          />
          {isHistoryQueryReady && (hasNextPage || isFetchingNextPage) && (
            <div
              ref={sentinelRef}
              className={cn(
                'flex justify-center p-4',
                entitiesHistoryData.length === 0 && 'h-full items-center',
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

export default EntityHistory;
