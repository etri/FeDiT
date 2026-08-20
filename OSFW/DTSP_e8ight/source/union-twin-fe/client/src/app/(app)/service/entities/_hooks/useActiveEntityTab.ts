import type { Dispatch, SetStateAction } from 'react';

import { useEntityTabStore } from '@/app/(app)/service/entities/_stores/useEntityTabStore';

import type { EntityTabType } from '@/app/(app)/service/entities/_types/entity';

export function useActiveEntityTab(): EntityTabType {
  return useEntityTabStore((s) => s.activeTab);
}

export function useSwitchEntityTab(): Dispatch<SetStateAction<EntityTabType>> {
  return useEntityTabStore((s) => s.switchTab);
}
