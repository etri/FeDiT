export const ATTRIBUTE_VALUE_TYPES = [
  'String',
  'Integer',
  'Double',
  'Boolean',
  'Date',
  'Object',
  'ArrayString',
  'ArrayInteger',
  'ArrayDouble',
  'ArrayBoolean',
  'ArrayObject',
] as const;

export const GEO_PROPERTY_VALUE_TYPES = [
  'LINE_STRING',
  'MULTI_LINE_STRING',
  'MULTI_POINT',
  'MULTI_POLYGON',
  'POINT',
  'POLYGON',
] as const;

export const ATTRIBUTE_TYPES = [
  'Property',
  'Relationship',
  'GeoProperty',
] as const;
