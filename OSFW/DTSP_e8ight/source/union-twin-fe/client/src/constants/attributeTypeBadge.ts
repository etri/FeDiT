const ATTRIBUTE_TYPE_STYLES: Record<string, string> = {
  relationship: 'border-chart-1/30 bg-chart-1/15 text-chart-1',
  geoproperty: 'border-chart-2/30 bg-chart-2/15 text-chart-2',
};

const DEFAULT_ATTRIBUTE_TYPE_STYLE =
  'border-primary/20 bg-primary/10 text-primary';

export function getAttributeTypeBadgeStyle(type: string): string {
  return (
    ATTRIBUTE_TYPE_STYLES[type.toLowerCase()] ?? DEFAULT_ATTRIBUTE_TYPE_STYLE
  );
}
