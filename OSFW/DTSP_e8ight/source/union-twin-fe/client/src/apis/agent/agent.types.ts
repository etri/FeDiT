export interface AgentListItem {
  id: number;
  name: string;
  status: string;
}

export interface AgentListParams {
  curPage: number;
  size?: number;
  name?: string;
  status?: string;
}

export interface AgentModel {
  context: string;
  modelType: string;
}

export interface Agent {
  id: number;
  name: string;
  models: AgentModel[];
  status: string;
  topic: string;
  type: string;
  lastSinkSignalReceivedAt: string;
  lastSourceSignalReceivedAt: string;
  pid: number;
  confFileContents: string;
  isCustomTopic: boolean;
  isCustomConfig: boolean;
  urlAddress: string;
  connTerm: string;
  method: string;
  sourceTopic: string;
}

export type AgentOperation = 'run' | 'stop' | 'rerun';

export interface CreateAgentPayload {
  name: string;
  models: AgentModel[];
  type: string;
  urlAddress: string;
  isCustomTopic: boolean;
  topic?: string;
  method?: string;
  connTerm?: string;
  sourceTopic?: string;
}

export interface AgentModelAttributeSource {
  id: number;
  attributeName: string;
  sourceName: string;
  modelType: string;
}

export interface CreateAttributeSourcePayload {
  modelType: string;
  attributeName: string;
  sourceName: string;
}
