import type { ValueType } from '@/types/dataModel';

export interface AttributeListItem {
  id: string;
  type: string;
  attributeType?: string;
  valueType?: string;
}

export interface AttributeDetail {
  id: string;
  type: string;
  attributeType?: 'Property' | 'GeoProperty' | 'Relationship';
  valueType?: ValueType;
  title?: string;
  description?: string;
  format?: string;
}

export enum AttributeValueType {
  String = 'String',
  Enum = 'Enum',
  Integer = 'Integer',
  Double = 'Double',
  DateTime = 'DateTime',
}
