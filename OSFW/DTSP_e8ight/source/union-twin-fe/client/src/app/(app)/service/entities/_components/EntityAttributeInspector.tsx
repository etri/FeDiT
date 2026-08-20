import { useState } from 'react';

import { Button } from '@e8ight/ui/components/ui/button';
import { Card, CardContent, CardHeader } from '@e8ight/ui/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import { ScrollArea } from '@e8ight/ui/components/ui/scroll-area';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@e8ight/ui/components/ui/toggle-group';
import { partition } from 'es-toolkit';

import EntityAttributeTypeBadge from '@/app/(app)/service/entities/_components/EntityAttributeTypeBadge';
import GeoPropertyValue from '@/app/(app)/service/entities/_components/GeoPropertyValue';
import StructuredValueTree from '@/app/(app)/service/entities/_components/StructuredValueTree';
import { prefixValueForAttributeType } from '@/app/(app)/service/entities/_constants/entity';
import {
  isEntityReferenceValue,
  isGeoJsonGeometry,
  isIsoDateTimeString,
} from '@/app/(app)/service/entities/_utils/entityValue';
import { convertFullDateTimeFromString } from '@/lib/date';
import { AttributeTypes } from '@/types/common';

import type { EntityAttributeSelection } from '@/app/(app)/service/entities/_types/entityAttribute';

type ValueViewMode = 'formatted' | 'raw';

interface IProps {
  selection?: EntityAttributeSelection;
  onOpenEntity: (entityId: string) => void;
}

function isNestedAttributeReference(value: unknown) {
  return (
    typeof value === 'string' && value.startsWith(prefixValueForAttributeType)
  );
}

function getRelatedEntityIdFromEntry(entry: unknown): string | undefined {
  if (isEntityReferenceValue(entry)) {
    return entry;
  }

  if (entry !== null && typeof entry === 'object') {
    const record = entry as Record<string, unknown>;
    const objectRef = record.object;
    if (typeof objectRef === 'string' && isEntityReferenceValue(objectRef)) {
      return objectRef;
    }
    const jsonLdId = record['@id'];
    if (typeof jsonLdId === 'string' && isEntityReferenceValue(jsonLdId)) {
      return jsonLdId;
    }
  }

  return undefined;
}

function formatPrimitiveValue(value: unknown) {
  if (value == null) {
    return '—';
  }

  if (isIsoDateTimeString(value)) {
    return convertFullDateTimeFromString(value);
  }

  return String(value);
}

type DisplayValue =
  { kind: 'primitive'; text: string } | { kind: 'structured'; value: unknown };

function formatDisplayValue(value: unknown): DisplayValue {
  if (
    value == null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return { kind: 'primitive', text: formatPrimitiveValue(value) };
  }

  return { kind: 'structured', value };
}

function RelationshipTargetArrayList({
  items,
  onOpenEntity,
}: {
  items: unknown[];
  onOpenEntity: (entityId: string) => void;
}) {
  return (
    <ul className="divide-border divide-y rounded-md border">
      {items.map((item, index) => {
        const entityId = getRelatedEntityIdFromEntry(item);

        if (entityId) {
          return (
            <li key={`${entityId}-${index}`}>
              <Button
                type="button"
                variant="link"
                className="h-auto min-h-0 w-full justify-start rounded-none px-3 py-2 text-left text-sm font-medium"
                onClick={() => onOpenEntity(entityId)}
                title={entityId}
                aria-label={`Open related entity ${entityId}`}
              >
                <span className="block max-w-full truncate">{entityId}</span>
              </Button>
            </li>
          );
        }

        const fallback =
          typeof item === 'object' && item !== null
            ? JSON.stringify(item, null, 2)
            : String(item);

        return (
          <li
            key={`unresolved-${index}`}
            className="text-muted-foreground px-3 py-2 text-xs leading-5"
          >
            <pre className="overflow-x-auto break-all whitespace-pre-wrap">
              {fallback}
            </pre>
          </li>
        );
      })}
    </ul>
  );
}

function ValueRow({
  label,
  value,
  parentAttributeType,
  onOpenEntity,
}: {
  label: string;
  value: unknown;
  parentAttributeType: string;
  onOpenEntity: (entityId: string) => void;
}) {
  const isRelationshipMultiTarget =
    parentAttributeType === AttributeTypes.Relationship &&
    (label === 'value' || label === 'object') &&
    Array.isArray(value);

  if (isRelationshipMultiTarget) {
    return (
      <div className="space-y-2 rounded-md border px-3 py-2">
        <div className="text-muted-foreground font-bold tracking-[0.07em] uppercase">
          {label}
        </div>
        <RelationshipTargetArrayList
          items={value}
          onOpenEntity={onOpenEntity}
        />
      </div>
    );
  }

  const displayValue = formatDisplayValue(value);

  return (
    <div className="space-y-2 rounded-md border px-3 py-2">
      <div className="text-muted-foreground font-bold tracking-[0.07em] uppercase">
        {label}
      </div>
      {displayValue.kind === 'primitive' ? (
        isEntityReferenceValue(value) ? (
          <Button
            type="button"
            variant="link"
            className="h-auto min-h-0 w-full justify-start p-0 text-left text-sm font-medium"
            onClick={() => onOpenEntity(value)}
            title={displayValue.text}
          >
            <span className="block max-w-full truncate">
              {displayValue.text}
            </span>
          </Button>
        ) : (
          <div
            title={displayValue.text}
            className="text-sm font-medium break-all whitespace-pre-wrap"
          >
            {displayValue.text}
          </div>
        )
      ) : isGeoJsonGeometry(displayValue.value) ? (
        <GeoPropertyValue value={displayValue.value} />
      ) : (
        <StructuredValueTree
          value={displayValue.value}
          onOpenEntity={onOpenEntity}
        />
      )}
    </div>
  );
}

function EntityAttributeInspector({ selection, onOpenEntity }: IProps) {
  const [viewMode, setViewMode] = useState<ValueViewMode>('formatted');

  if (!selection) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center px-4">
        <Empty className="max-w-sm border-0 bg-transparent">
          <EmptyHeader>
            <EmptyTitle>Select an attribute</EmptyTitle>
            <EmptyDescription>
              Choose an attribute from the list to inspect its value.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const visibleEntries = Object.entries(selection.item.children).filter(
    ([, value]) => !isNestedAttributeReference(value),
  );

  const [primaryEntries, secondaryEntries] = partition(
    visibleEntries,
    ([key]) => key === 'value' || key === 'object',
  );
  const entriesToRender = [...primaryEntries, ...secondaryEntries];

  const rawNode = {
    type: selection.item.type,
    ...Object.fromEntries(visibleEntries),
  };

  return (
    <Card className="flex min-h-0 min-w-0 flex-1 flex-col gap-0 overflow-hidden py-0">
      <CardHeader className="bg-muted/40 flex min-w-0 flex-row items-start justify-between gap-2 px-2 py-1.5">
        <div className="min-w-0 space-y-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <h3
              title={selection.item.target}
              className="text-foreground min-w-0 truncate text-sm font-bold tracking-[.03em]"
            >
              {selection.item.target}
            </h3>
            <EntityAttributeTypeBadge type={selection.item.type} />
          </div>
          <p
            title={selection.path.join(' > ')}
            className="text-muted-foreground min-w-0 truncate text-xs"
          >
            {selection.path.join(' > ')}
          </p>
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={viewMode}
          onValueChange={(value) => {
            if (value) {
              setViewMode(value as ValueViewMode);
            }
          }}
          aria-label="값 표시 방식"
          className="shrink-0"
        >
          <ToggleGroupItem value="formatted" aria-label="필드로 보기">
            필드
          </ToggleGroupItem>
          <ToggleGroupItem value="raw" aria-label="JSON으로 보기">
            JSON
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent className="border-border flex min-h-0 flex-1 flex-col border-t p-0">
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-2 p-2">
            {viewMode === 'raw' ? (
              <pre className="bg-muted/40 overflow-x-auto rounded-md p-3 text-xs leading-5 break-all whitespace-pre-wrap">
                {JSON.stringify(rawNode, null, 2)}
              </pre>
            ) : entriesToRender.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                This attribute does not have a displayable value.
              </p>
            ) : (
              entriesToRender.map(([key, value]) => (
                <ValueRow
                  key={key}
                  label={key}
                  value={value}
                  parentAttributeType={selection.item.type}
                  onOpenEntity={onOpenEntity}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default EntityAttributeInspector;
