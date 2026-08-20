import { create } from 'zustand';

import lang from '@/app/(app)/service/statistics/_constants/lang.json';
import { getDate } from '@/app/(app)/service/statistics/_utils';

export const TabList = [
  { tabName: lang.en.dataModelStatistics, tabPath: 'DataModelStatistics' },
  {
    tabName: lang.en.dataModelSourceStatistics,
    tabPath: 'DataModelSourceStatistics',
  },
];

interface ISelectedItem {
  dataModel: string;
  provider: string;
}

interface StatisticsState {
  currentDate: string;
  currentTab: string;
  selectedItems: ISelectedItem;
  clickable: boolean;
  setCurrentDate: (currentDate: string) => void;
  setCurrentTab: (currentTab: string) => void;
  setSelectedItems: (selectedItems: ISelectedItem) => void;
  setClickable: (value: boolean) => void;
}

const initialSelectedItems: ISelectedItem = {
  dataModel: '',
  provider: '',
};

function createInitialStatisticsState() {
  return {
    currentDate: getDate(new Date(), 0),
    currentTab: TabList[0].tabPath,
    selectedItems: { ...initialSelectedItems },
    clickable: true,
  };
}

export const useStatisticsStore = create<StatisticsState>((set) => ({
  ...createInitialStatisticsState(),
  setCurrentDate: (currentDate) => set({ currentDate }),
  setCurrentTab: (currentTab) => set({ currentTab }),
  setSelectedItems: (selectedItems) => set({ selectedItems }),
  setClickable: (value) => set({ clickable: value }),
}));
