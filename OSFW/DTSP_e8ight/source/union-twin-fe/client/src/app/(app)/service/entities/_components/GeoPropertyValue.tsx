import type { GeoJsonGeometry } from '@/app/(app)/service/entities/_utils/entityValue';

interface GeoPropertyValueProps {
  value: GeoJsonGeometry;
}

function flattenPositions(
  coordinates: unknown,
  acc: [number, number][] = [],
): [number, number][] {
  if (!Array.isArray(coordinates)) {
    return acc;
  }

  if (
    typeof coordinates[0] === 'number' &&
    typeof coordinates[1] === 'number'
  ) {
    acc.push([coordinates[0], coordinates[1]]);
    return acc;
  }

  coordinates.forEach((entry) => flattenPositions(entry, acc));
  return acc;
}

function GeoPropertyValue({ value }: GeoPropertyValueProps) {
  const positions = flattenPositions(value.coordinates);

  return (
    <div className="space-y-1.5">
      <div className="text-muted-foreground font-bold tracking-[0.07em] uppercase">
        {value.type}
      </div>
      {positions.length === 0 ? (
        <p className="text-muted-foreground text-sm">좌표 없음 (—)</p>
      ) : positions.length === 1 ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted-foreground">위도 (lat)</dt>
          <dd className="font-medium tabular-nums">{positions[0][1]}</dd>
          <dt className="text-muted-foreground">경도 (lng)</dt>
          <dd className="font-medium tabular-nums">{positions[0][0]}</dd>
        </dl>
      ) : (
        <ul className="space-y-1 text-sm">
          {positions.map(([lng, lat], index) => (
            <li
              key={index}
              className="grid grid-cols-[auto_1fr] gap-x-2 tabular-nums"
            >
              <span className="text-muted-foreground text-xs">{index}</span>
              <span className="font-medium">
                {lat}, {lng}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default GeoPropertyValue;
