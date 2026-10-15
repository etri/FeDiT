export type ValueType =
  | 'String'
  | 'Integer'
  | 'Double'
  | 'Boolean'
  | 'Date'
  | 'Object'
  | 'ArrayString'
  | 'ArrayInteger'
  | 'ArrayDouble'
  | 'ArrayBoolean'
  | 'ArrayObject'
  | 'LINE_STRING'
  | 'MULTI_LINE_STRING'
  | 'MULTI_POINT'
  | 'MULTI_POLYGON'
  | 'POINT'
  | 'POLYGON';

export type AttributeType = 'Property' | 'GeoProperty' | 'Relationship';

export interface DataModelAttribute {
  type?: AttributeType | string;
  valueType?: ValueType;
  description?: string;
  valid?: {
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
  };
  format?: string;
  modelType?: string[];
  enum?: string[];
  objectMember?: Record<string, unknown>;
  childAttributeNames?: Record<string, string>;
  childAttributes?: DataModelAttributeFormatted[];
}

export interface DataModelAttributeFormatted {
  id: string;
  value: DataModelAttribute;
  name: string;
  toggle: boolean;
}

export interface ObjectMemberRecord {
  objectMember?: Record<string, ObjectMemberRecord>;
  [key: string]: unknown;
}

export interface ObjectMemberValue {
  objectMember?: ObjectMemberFormatted[];
  [key: string]: unknown;
}

export interface ObjectMemberFormatted {
  id: string;
  value: ObjectMemberValue;
  toggle: boolean;
}
