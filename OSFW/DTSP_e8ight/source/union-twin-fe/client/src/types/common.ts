export enum AttributeTypes {
  Property = 'Property',
  Relationship = 'Relationship',
}

export interface PaginatedResponse<T> {
  data: T[];
  totalData: number;
  totalPage: number;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface PaginationParams {
  curPage?: number;
  size?: number;
  word?: string;
  isReady?: boolean;
}

export interface LogResponse {
  log: string;
  endLineNum: number;
}
