export interface EntityRequestHeaderType {
  Link: string;
  [key: string]: string;
}

export interface EntitiesRequestType {
  params: EntitiesRequestParamsType;
  headers: EntityRequestHeaderType;
}

export interface EntityDetailRequestType {
  headers: EntityRequestHeaderType;
}

export interface EntitiesRequestParamsType {
  type: string;
  q?: string;
  offset?: number;
  limit?: number;
  sort?: string;
  sortproperty?: string;
}

export interface EntityHistoryRequestType {
  params: EntityHistoryRequestParamsType;
  headers: EntityRequestHeaderType;
}

export interface EntityHistoryRequestParamsType {
  entityId: string;
  timeproperty: string;
  timerel?: TimerelType;
  time?: string;
  endTime?: string;
  q?: string;
  offset?: number;
  limit?: number;
  sort?: string;
  sortproperty?: string;
}

export interface EntityHistoryDetailRequestType {
  params: { timeproperty: string };
}

export interface EntityInfo {
  provider: string;
  entityId: string;
}

export interface EntitiesResponseType {
  context: string;
  model: string;
  entities: EntityInfo[];
  totalData: number;
  totalPage: number;
}

export interface NGSILDType {
  id: string;
  type: string;
  '@context': string;
  [key: string]: unknown;
}

export interface EntityDetailType {
  provider: string;
  entity: NGSILDType;
}

export interface EntityHistoryType {
  context: string;
  timeproperty: string;
  totalPage: number;
  totalData: number;
  entityHistoryList: EntityHistoryDto[];
}

export interface EntityHistoryDto {
  entityId: string;
  historyId: string;
  observedAt: string;
  provider: string;
}

export interface EntityHistoryDetailType {
  historyId: string;
  timeproperty: string;
  observedAt: string;
  provider: string;
  entity: NGSILDType;
}

export type ValueType =
  | 'String'
  | 'Enum'
  | 'Integer'
  | 'Double'
  | 'Boolean'
  | 'Object'
  | 'ArrayString'
  | 'ArrayInteger'
  | 'ArrayDouble'
  | 'ArrayBoolean'
  | 'DateTime'
  | 'POINT'
  | 'MULTI_POINT'
  | 'LINE_STRING'
  | 'MULTI_LINE_STRING'
  | 'POLYGON'
  | 'MULTI_POLYGON'
  | '';

export type TimerelType = 'between' | 'before' | 'after' | undefined;

export interface CriteriaInfoType {
  criteria: string;
  valueType: ValueType;
  type: 'Property' | 'Relationship' | 'Geoproperty' | undefined;
}

export type CriteriaInfoTypeList = CriteriaInfoType[];

export interface SearchCriteriaInfoType {
  criteria: string;
  valueType: ValueType;
  value: string;
}

export interface ObservedTimeInfoType {
  property: string;
  startTime: string;
  endTime: string;
  timerel?: TimerelType;
  value: string;
  valueType: ValueType;
}

export interface EntitySearchInfoType {
  observedTimeInfo?: ObservedTimeInfoType;
  criteriaInfoList: SearchCriteriaInfoType[];
}
