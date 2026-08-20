export interface AttributeSchemaDetail {
  id: string;
  isReadOnly: boolean;
  value: Record<string, string>;
}

export interface UpdateAttributeSchemaPayload {
  id: string;
  attributes: string[];
  isReadOnly: boolean;
}

export interface CreateAttributeSchemaPayload {
  reqBody: { id: string };
}
