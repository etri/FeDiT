import { useContext } from 'react';

import {
  SetTreeHistoryContext,
  TreeHistoryContext,
} from '@/app/(app)/service/entities/_components/contexts/TreeHistoryProvider';

export function useTreeHistory() {
  const value = useContext(TreeHistoryContext);
  return value;
}

export function useSetTreeHistory() {
  const value = useContext(SetTreeHistoryContext);
  if (value === undefined) {
    throw new Error(
      'useSetTreeHistory must be used within a TreeHistoryProvider',
    );
  }
  return value;
}
