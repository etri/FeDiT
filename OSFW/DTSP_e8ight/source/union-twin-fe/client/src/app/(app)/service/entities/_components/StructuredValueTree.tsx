import { Button } from '@e8ight/ui/components/ui/button';

import {
  isEntityReferenceValue,
  isIsoDateTimeString,
} from '@/app/(app)/service/entities/_utils/entityValue';
import { convertFullDateTimeFromString } from '@/lib/date';

const MAX_DEPTH = 6;

interface StructuredValueTreeProps {
  value: unknown;
  onOpenEntity: (entityId: string) => void;
  depth?: number;
}

function LeafValue({
  value,
  onOpenEntity,
}: {
  value: unknown;
  onOpenEntity: (entityId: string) => void;
}) {
  if (isEntityReferenceValue(value)) {
    return (
      <Button
        type="button"
        variant="link"
        className="h-auto min-h-0 w-full justify-start p-0 text-left text-sm font-medium"
        onClick={() => onOpenEntity(value)}
        title={value}
      >
        <span className="block max-w-full truncate">{value}</span>
      </Button>
    );
  }

  const text =
    value == null
      ? '—'
      : isIsoDateTimeString(value)
        ? convertFullDateTimeFromString(value)
        : String(value);

  return <span className="text-sm break-all whitespace-pre-wrap">{text}</span>;
}

function StructuredValueTree({
  value,
  onOpenEntity,
  depth = 0,
}: StructuredValueTreeProps) {
  if (depth > MAX_DEPTH) {
    return (
      <pre className="bg-muted/40 overflow-x-auto rounded-md p-3 text-xs leading-5 break-all whitespace-pre-wrap">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground text-sm">[]</span>;
    }

    return (
      <ul className="border-border ml-1 space-y-1 border-l pl-3">
        {value.map((item, index) => (
          <li key={index} className="grid grid-cols-[auto_1fr] gap-x-2">
            <span className="text-muted-foreground text-xs tabular-nums">
              {index}
            </span>
            <div className="min-w-0">
              <StructuredValueTree
                value={item}
                onOpenEntity={onOpenEntity}
                depth={depth + 1}
              />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return <span className="text-muted-foreground text-sm">{'{}'}</span>;
    }

    return (
      <dl className="border-border ml-1 space-y-1 border-l pl-3">
        {entries.map(([key, child]) => (
          <div
            key={key}
            className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-3"
          >
            <dt title={key} className="text-muted-foreground truncate text-xs">
              {key}
            </dt>
            <dd className="min-w-0">
              <StructuredValueTree
                value={child}
                onOpenEntity={onOpenEntity}
                depth={depth + 1}
              />
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return <LeafValue value={value} onOpenEntity={onOpenEntity} />;
}

export default StructuredValueTree;
