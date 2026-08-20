import type { Dispatch, SetStateAction } from 'react';

import { create } from 'zustand';

import type { DataModelAttributeFormatted } from '@/types/dataModel';

interface DataModelState {
  modelAttribute: DataModelAttributeFormatted[];
  modelSelected: Array<string | undefined>;
  editMode: boolean;
  setModelAttribute: Dispatch<SetStateAction<DataModelAttributeFormatted[]>>;
  setModelSelected: Dispatch<SetStateAction<Array<string | undefined>>>;
  setEditMode: (value: boolean) => void;
  resetDataModel: () => void;
}

const INITIAL_STATE = {
  modelAttribute: [] as DataModelAttributeFormatted[],
  modelSelected: [] as Array<string | undefined>,
  editMode: false,
};

export const useDataModelStore = create<DataModelState>((set) => ({
  ...INITIAL_STATE,
  setModelAttribute: (value) =>
    set((state) => ({
      modelAttribute:
        typeof value === 'function' ? value(state.modelAttribute) : value,
    })),
  setModelSelected: (value) =>
    set((state) => ({
      modelSelected:
        typeof value === 'function' ? value(state.modelSelected) : value,
    })),
  setEditMode: (value) => set({ editMode: value }),
  resetDataModel: () => set({ ...INITIAL_STATE }),
}));
