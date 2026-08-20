export interface UnionSchema {
  title?: string;
  type?: string;
  properties?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface UnionSchemaItem {
  id: string;
  schema: UnionSchema;
  title?: string;
  name?: string;
  digitalTwinId?: string;
}
