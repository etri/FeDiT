import { create } from 'zustand';

import { DEFAULT_USERS_QUERY } from '@/app/(app)/admin/users/_constants/users';

import type { SortOrder } from '@/app/(app)/admin/_types/admin';

interface UsersPageState {
  search: string;
  page: number;
  size: number;
  sortBy: string;
  sortOrder: SortOrder;
  pendingOnly: boolean;
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  setSize: (size: number) => void;
  setPendingOnly: (pendingOnly: boolean) => void;
  toggleSort: (column: string) => void;
}

const INITIAL_STATE = {
  ...DEFAULT_USERS_QUERY,
  search: '',
  pendingOnly: false,
};

export const useUsersPageStore = create<UsersPageState>((set, get) => ({
  ...INITIAL_STATE,
  setSearch: (search) => set({ search, page: 1 }),
  setPage: (page) => set({ page }),
  setSize: (size) => set({ size, page: 1 }),
  setPendingOnly: (pendingOnly) => set({ pendingOnly, page: 1 }),
  toggleSort: (column) => {
    const { sortBy, sortOrder } = get();
    if (sortBy === column) {
      set({ sortOrder: sortOrder === 'ASC' ? 'DESC' : 'ASC', page: 1 });
    } else {
      set({ sortBy: column, sortOrder: 'ASC', page: 1 });
    }
  },
}));
