const GEO_JSON_GEOMETRY_TYPES = [
  'Point',
  'MultiPoint',
  'LineString',
  'MultiLineString',
  'Polygon',
  'MultiPolygon',
];

const ISO_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export interface GeoJsonGeometry {
  type: string;
  coordinates: unknown;
}

export function isEntityReferenceValue(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('urn:ngsi-ld:');
}

export function isGeoJsonGeometry(value: unknown): value is GeoJsonGeometry {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.type === 'string' &&
    GEO_JSON_GEOMETRY_TYPES.includes(record.type) &&
    'coordinates' in record
  );
}

export function isIsoDateTimeString(value: unknown): value is string {
  return typeof value === 'string' && ISO_DATE_TIME_PATTERN.test(value);
}
