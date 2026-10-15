import {
  createElement,
  createContext,
  useContext,
  useRef,
  type PropsWithChildren,
} from 'react';

import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

import { DEFAULT_TOPIC } from '@/app/(app)/service/agents/_constants/kafkaAgent';

import type { AgentModel, Agent } from '@/apis/agent';

type AgentMode = 'read' | 'add' | 'edit';

interface AgentStoreData {
  agent: Agent;
  agentModel: AgentModel[];
  agentMode: AgentMode;
}

interface AgentStoreState extends AgentStoreData {
  setAgent: (value: Agent | ((prev: Agent) => Agent)) => void;
  setAgentModel: (
    value: AgentModel[] | ((prev: AgentModel[]) => AgentModel[]),
  ) => void;
  setAgentMode: (value: AgentMode) => void;
}

function createInitialAgent(): Agent {
  return {
    id: 0,
    name: '',
    models: [],
    status: '',
    topic: DEFAULT_TOPIC,
    type: 'HTTP',
    method: 'GET',
    lastSinkSignalReceivedAt: '',
    lastSourceSignalReceivedAt: '',
    pid: 0,
    confFileContents: '',
    isCustomTopic: true,
    isCustomConfig: false,
    urlAddress: '',
    connTerm: '',
    sourceTopic: '',
  };
}

function createInitialData(): AgentStoreData {
  return {
    agent: createInitialAgent(),
    agentModel: [],
    agentMode: 'read',
  };
}

function createAgentStore(initialState?: Partial<AgentStoreData>) {
  return createStore<AgentStoreState>((set) => ({
    ...createInitialData(),
    ...initialState,
    setAgent: (value) =>
      set((state) => ({
        agent: typeof value === 'function' ? value(state.agent) : value,
      })),
    setAgentModel: (value) =>
      set((state) => ({
        agentModel:
          typeof value === 'function' ? value(state.agentModel) : value,
      })),
    setAgentMode: (value) => set({ agentMode: value }),
  }));
}

const defaultAgentStore = createAgentStore();
const AgentStoreContext = createContext<ReturnType<
  typeof createAgentStore
> | null>(null);

export function AgentStoreProvider({
  children,
  initialState,
}: PropsWithChildren<{ initialState?: Partial<AgentStoreData> }>) {
  const storeRef = useRef<ReturnType<typeof createAgentStore> | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createAgentStore(initialState);
  }
  return createElement(
    AgentStoreContext.Provider,
    { value: storeRef.current },
    children,
  );
}

export function useAgentStore<T>(selector: (state: AgentStoreState) => T): T {
  const store = useContext(AgentStoreContext) ?? defaultAgentStore;
  return useStore(store, selector);
}
