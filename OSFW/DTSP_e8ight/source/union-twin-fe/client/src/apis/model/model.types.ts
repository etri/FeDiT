export interface IDataModelListItem {
  dataModelId: string;
  type: string;
  isReady: boolean;
}

export interface DataModelAttribute {
  valueType: string;
  type?: string;
  childAttributeNames?: Record<string, string>;
  childAttributes?: Record<string, DataModelAttribute>;
  [key: string]: unknown;
}

export interface DataModelGetResponse {
  attributeNames: Record<string, string>;
  attributes: Record<string, DataModelAttribute>;
  createdAt: string;
  description: string;
  id: string;
  isDynamic: boolean;
  isReady: boolean;
  isUsing: boolean;
  modifiedAt: string;
  reference: string[];
  required: string[];
  title: string;
  type: string;
  observation: string[];
}

export interface DataModelRequestPayload {
  id: string;
  type: string;
  title?: string;
  description?: string;
  reference?: string[];
  attributeNames: Record<string, string>;
  attributes: Record<string, DataModelAttribute>;
}
