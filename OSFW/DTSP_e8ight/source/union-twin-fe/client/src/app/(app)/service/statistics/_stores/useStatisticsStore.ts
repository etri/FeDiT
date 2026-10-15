import { create } from 'zustand';

import { getDate } from '@/app/(app)/service/statistics/_utils';

export type StatisticsDimension = 'models' | 'providers';

interface ISelectedItem {
  dataModel: string;
  provider: string;
}

interface StatisticsState {
  currentDate: string;
  dimension: StatisticsDimension;
  selectedItems: ISelectedItem;
  setCurrentDate: (currentDate: string) => void;
  setDimension: (dimension: StatisticsDimension) => void;
  setSelectedItems: (selectedItems: ISelectedItem) => void;
}

export const useStatisticsStore = create<StatisticsState>((set) => ({
  currentDate: getDate(new Date(), 0),
  dimension: 'models',
  selectedItems: { dataModel: '', provider: '' },
  setCurrentDate: (currentDate) =>
    set({ currentDate, selectedItems: { dataModel: '', provider: '' } }),
  setDimension: (dimension) =>
    set((state) => ({
      dimension,
      selectedItems:
        dimension === 'models'
          ? { ...state.selectedItems, provider: '' }
          : state.selectedItems,
    })),
  setSelectedItems: (selectedItems) => set({ selectedItems }),
}));
