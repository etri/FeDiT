import type { Dispatch, SetStateAction } from 'react';

import { create } from 'zustand';

import {
  createDefaultObservedTimeInfo,
  createInitialEntitySearchInfo,
} from '@/app/(app)/service/entities/_utils/searchInfo';

import type { EntitySearchInfoType, ValueType } from '@/apis/entity';
import type { EntityTabType } from '@/app/(app)/service/entities/_types/entity';

const EMPTY_TAB: EntityTabType = {
  title: '',
  subTitle: undefined,
  contextId: '',
  modelId: '',
  entityId: '',
  historyId: undefined,
  detailId: '',
  searchInfo: createInitialEntitySearchInfo(),
};

interface EntityTabStoreState {
  tabs: EntityTabType[];
  appendTab: (tab: EntityTabType) => void;
  removeTab: (detailId: string) => void;

  activeTab: EntityTabType;
  switchTab: Dispatch<SetStateAction<EntityTabType>>;

  searchInfo: EntitySearchInfoType;
  setSearchInfo: (info: EntitySearchInfoType) => void;
  resetSearchInfoForStatic: () => void;
  resetSearchInfoForDynamic: (property: string, valueType: ValueType) => void;
}

export const useEntityTabStore = create<EntityTabStoreState>((set, get) => ({
  tabs: [],
  appendTab: (tab) => {
    if (get().tabs.some((t) => t.detailId === tab.detailId)) {
      return;
    }
    set((s) => ({ tabs: [...s.tabs, tab] }));
  },
  removeTab: (detailId) =>
    set((s) => ({
      tabs: s.tabs.filter((t) => t.detailId !== detailId),
    })),

  activeTab: EMPTY_TAB,
  switchTab: (value) =>
    set((state) => {
      const next = typeof value === 'function' ? value(state.activeTab) : value;
      return {
        activeTab: next,
        searchInfo: next.searchInfo,
      };
    }),

  searchInfo: createInitialEntitySearchInfo(),
  setSearchInfo: (info) => set({ searchInfo: info }),
  resetSearchInfoForStatic: () =>
    set({ searchInfo: createInitialEntitySearchInfo() }),
  resetSearchInfoForDynamic: (property, valueType) =>
    set({
      searchInfo: {
        criteriaInfoList: [{ criteria: '', valueType: '', value: '' }],
        observedTimeInfo: createDefaultObservedTimeInfo(property, valueType),
      },
    }),
}));
