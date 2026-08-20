import { useEffect, useRef } from 'react';

import { Badge } from '@e8ight/ui/components/ui/badge';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import { Field, FieldLabel } from '@e8ight/ui/components/ui/field';
import { Input } from '@e8ight/ui/components/ui/input';
import { ScrollArea } from '@e8ight/ui/components/ui/scroll-area';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { ErrorBoundary, Suspense } from '@suspensive/react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { isEqual } from 'es-toolkit';
import { FileQuestion } from 'lucide-react';

import { modelQueries } from '@/apis/model';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';

interface IUnitCode {
  code: string;
  symbol: string;
  groupName: string;
  [key: string]: unknown;
}

const NON_UNITCODE_TYPES: Array<string | undefined | null> = [
  'Property',
  'GeoProperty',
  'Relationship',
  '',
  undefined,
  null,
];

function UnitCodeEmpty() {
  return (
    <ScrollArea className="border-input bg-muted/50 h-28 w-full rounded-md border p-2">
      <Empty className="border-0 bg-transparent py-4">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileQuestion className="size-4" />
          </EmptyMedia>
          <EmptyTitle className="text-sm">
            No unit codes available for this type.
          </EmptyTitle>
        </EmptyHeader>
      </Empty>
    </ScrollArea>
  );
}

function UnitCodesInner({
  unitCodeType,
  onEnumChange,
}: {
  unitCodeType: string;
  onEnumChange: (enumValues: string[]) => void;
}) {
  const { data: unitCodeData } = useSuspenseQuery(
    modelQueries.unitCodes(unitCodeType),
  );

  const prevEnumRef = useRef<string[]>([]);

  useEffect(() => {
    if (!unitCodeData || unitCodeData.length === 0) return;

    const enumValues = unitCodeData
      .map((e: IUnitCode) => e.code || e.symbol || '')
      .filter(Boolean);

    if (isEqual(prevEnumRef.current, enumValues)) {
      return;
    }

    prevEnumRef.current = enumValues;
    onEnumChange(enumValues);
  }, [unitCodeData, onEnumChange]);

  if (unitCodeData.length === 0) {
    return <UnitCodeEmpty />;
  }

  return (
    <ScrollArea className="border-input bg-muted/50 h-28 w-full rounded-md border p-2">
      <div className="flex flex-wrap gap-1">
        {unitCodeData.map((e: IUnitCode, idx: number) => (
          <Badge variant="secondary" key={`${e.code || 'N/A'}-${idx}`}>
            {e.symbol || e.code || 'Unknown'}
          </Badge>
        ))}
      </div>
    </ScrollArea>
  );
}

function DataModelUnitCodeContent({
  unitCodeType,
  valueType,
  format,
  onEnumChange,
}: {
  unitCodeType: string;
  valueType?: string;
  format?: string;
  onEnumChange: (enumValues: string[]) => void;
}) {
  const shouldFetch = !NON_UNITCODE_TYPES.includes(unitCodeType);

  return (
    <div className="space-y-4 overflow-auto p-4">
      <Field>
        <FieldLabel>Value Type</FieldLabel>
        <Input readOnly value={valueType ?? ''} />
      </Field>
      {format !== undefined && format !== '' && (
        <Field>
          <FieldLabel>Format</FieldLabel>
          <Input readOnly value={format ?? ''} />
        </Field>
      )}
      <Field>
        <FieldLabel>Unitcode</FieldLabel>
        {shouldFetch ? (
          <ErrorBoundary fallback={<QueryErrorFallback />}>
            <Suspense
              fallback={
                <div className="flex h-28 w-full items-center justify-center">
                  <Spinner className="text-muted-foreground size-6" />
                </div>
              }
            >
              <UnitCodesInner
                unitCodeType={unitCodeType}
                onEnumChange={onEnumChange}
              />
            </Suspense>
          </ErrorBoundary>
        ) : (
          <UnitCodeEmpty />
        )}
      </Field>
    </div>
  );
}

export default DataModelUnitCodeContent;
