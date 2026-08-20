import { useSuspenseQuery } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';

import { statisticsQueries, type StatisticsTableKind } from '@/apis/statistics';
import { useStatisticsStore } from '@/app/(app)/service/statistics/_stores';

export type StatisticsTableType =
  'dataModelStatistics' | 'dataModelNameList' | 'sourceStatistics';

const KIND_BY_TYPE: Record<StatisticsTableType, StatisticsTableKind> = {
  dataModelStatistics: 'model',
  dataModelNameList: 'modelNameList',
  sourceStatistics: 'source',
};

export const useStatisticsTable = (type: StatisticsTableType) => {
  const selectedDate = useStatisticsStore((s) => s.currentDate);
  const selectedItem = useStatisticsStore(useShallow((s) => s.selectedItems));

  return useSuspenseQuery(
    statisticsQueries.table(KIND_BY_TYPE[type], {
      date: selectedDate,
      dataModel: selectedItem.dataModel,
    }),
  );
};
