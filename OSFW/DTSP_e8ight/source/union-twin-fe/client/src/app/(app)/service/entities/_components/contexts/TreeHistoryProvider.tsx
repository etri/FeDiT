import type { Dispatch, SetStateAction } from 'react';
import type React from 'react';
import { createContext, useState } from 'react';

import type { TreeHistoryType } from '@/app/(app)/service/entities/_types/entityTree';

export const TreeHistoryContext = createContext<TreeHistoryType[]>([]);
export const SetTreeHistoryContext = createContext<
  Dispatch<SetStateAction<TreeHistoryType[]>> | undefined
>(undefined);

interface IProps {
  children: React.ReactNode;
}

function TreeHistoryProvider({ children }: IProps) {
  const [treeHistory, setTreeHistory] = useState<TreeHistoryType[]>([]);

  return (
    <TreeHistoryContext.Provider value={treeHistory}>
      <SetTreeHistoryContext.Provider value={setTreeHistory}>
        {children}
      </SetTreeHistoryContext.Provider>
    </TreeHistoryContext.Provider>
  );
}

export default TreeHistoryProvider;
