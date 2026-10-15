import type { Dispatch, SetStateAction } from 'react';
import { useDeferredValue, useEffect, useState } from 'react';

import { Badge } from '@e8ight/ui/components/ui/badge';
import { Button } from '@e8ight/ui/components/ui/button';
import { Checkbox } from '@e8ight/ui/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@e8ight/ui/components/ui/command';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@e8ight/ui/components/ui/dialog';
import { Field, FieldLabel } from '@e8ight/ui/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@e8ight/ui/components/ui/select';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { useDebounce, useInfiniteScroll } from '@e8ight/ui/hooks';
import { ErrorBoundary, Suspense } from '@suspensive/react';
import {
  useQueryClient,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { cn } from 'cn';
import { overlay } from 'overlay-kit';

import { attributeQueries } from '@/apis/attribute';
import { modelQueries } from '@/apis/model';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';
import { getAttributeTypeBadgeStyle } from '@/constants/attributeTypeBadge';
import { GEO_PROPERTY_VALUE_TYPES } from '@/constants/dataModelValueTypes';

import type { AttributeDetail } from '@/types/attribute';
import type { DataModelAttributeFormatted } from '@/types/dataModel';
import type { QueryClient } from '@tanstack/react-query';

const CHILD_ONLY_ATTRIBUTE_IDS = ['unitCode', 'observedAt'];

async function buildDataModelAttribute(
  queryClient: QueryClient,
  attributeId: string,
  unitCodeGroup: string,
): Promise<DataModelAttributeFormatted> {
  const detail: AttributeDetail = await queryClient.ensureQueryData(
    attributeQueries.detail(attributeId),
  );
  const base = {
    id: detail.id,
    name: `${detail.type}:${detail.id}`,
    toggle: false,
  };

  if (attributeId === 'unitCode') {
    const unitCodes: Array<{ code?: string; symbol?: string }> =
      await queryClient.ensureQueryData(modelQueries.unitCodes(unitCodeGroup));

    return {
      ...base,
      value: {
        type: unitCodeGroup,
        valueType: detail.valueType,
        format: detail.format,
        enum: unitCodes
          .map((unitCode) => unitCode.code || unitCode.symbol || '')
          .filter(Boolean),
      },
    };
  }

  const attributeType = detail.attributeType ?? 'Property';
  const isGeoJson =
    attributeType === 'GeoProperty' && detail.format === 'GeoJSON';
  const hasGeoValueType = (
    GEO_PROPERTY_VALUE_TYPES as readonly string[]
  ).includes(detail.valueType ?? '');

  return {
    ...base,
    value: {
      type: attributeType,
      valueType:
        isGeoJson && !hasGeoValueType
          ? GEO_PROPERTY_VALUE_TYPES[0]
          : detail.valueType,
      ...(attributeId === 'observedAt'
        ? {}
        : { description: detail.description ?? '' }),
      format: detail.format ?? '',
    },
  };
}

function AttributeListFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Spinner className="text-muted-foreground size-6" />
    </div>
  );
}

function AttributeCatalogList({
  searchWord,
  hiddenAttributeIds,
  lockedAttributeIds,
  selectedAttributeIds,
  onToggle,
}: {
  searchWord: string;
  hiddenAttributeIds: string[];
  lockedAttributeIds: string[];
  selectedAttributeIds: string[];
  onToggle: (attributeId: string) => void;
}) {
  const deferredSearchWord = useDeferredValue(searchWord);

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery(
      attributeQueries.infiniteList({ word: deferredSearchWord || undefined }),
    );

  const { containerRef, sentinelRef } = useInfiniteScroll<HTMLDivElement>({
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    fetchNextPage,
  });

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0 });
  }, [containerRef, deferredSearchWord]);

  const attributes = data.pages
    .flatMap((page) => page.data)
    .filter((attribute) => !hiddenAttributeIds.includes(attribute.id));

  return (
    <CommandList ref={containerRef} className="max-h-none min-h-0 flex-1">
      {attributes.length === 0 ? (
        <CommandEmpty>No attributes found.</CommandEmpty>
      ) : (
        <CommandGroup>
          {attributes.map((attribute) => {
            const isLocked = lockedAttributeIds.includes(attribute.id);
            const isChecked =
              isLocked || selectedAttributeIds.includes(attribute.id);

            return (
              <CommandItem
                key={attribute.id}
                value={attribute.id}
                disabled={isLocked}
                onSelect={() => onToggle(attribute.id)}
                className={cn('gap-2', isLocked && 'opacity-50')}
              >
                <Checkbox
                  checked={isChecked}
                  disabled={isLocked}
                  tabIndex={-1}
                  className="pointer-events-none shrink-0"
                />
                <span className="min-w-0 flex-1 truncate" title={attribute.id}>
                  {attribute.id}
                </span>
                {attribute.attributeType && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'shrink-0',
                      getAttributeTypeBadgeStyle(attribute.attributeType),
                    )}
                  >
                    {attribute.attributeType}
                  </Badge>
                )}
                <span className="text-muted-foreground shrink-0 text-xs">
                  {attribute.valueType ?? attribute.type}
                </span>
              </CommandItem>
            );
          })}
          <div ref={sentinelRef} className="flex min-h-4 justify-center py-1">
            {isFetchingNextPage ? (
              <Spinner className="text-muted-foreground size-4" />
            ) : null}
          </div>
        </CommandGroup>
      )}
    </CommandList>
  );
}

function UnitCodeGroupField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { data: unitCodeGroups = [] } = useSuspenseQuery(
    modelQueries.unitCodeGroups(),
  );

  return (
    <Field>
      <FieldLabel>Unitcode Type</FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select type" />
        </SelectTrigger>
        <SelectContent>
          {unitCodeGroups.map((group: string) => (
            <SelectItem key={group} value={group}>
              {group}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function DataModelAttributePopupContent({
  onClose,
  owner,
  attributes,
  setAttributes,
  setModelSelected,
}: {
  onClose: () => void;
  owner?: string;
  attributes: DataModelAttributeFormatted[];
  setAttributes: Dispatch<SetStateAction<DataModelAttributeFormatted[]>>;
  setModelSelected: Dispatch<SetStateAction<Array<string | undefined>>>;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>(
    [],
  );
  const [unitCodeGroup, setUnitCodeGroup] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const debouncedSearch = useDebounce(search.trim(), 300);

  const ownerAttribute = owner
    ? attributes.find((attribute) => attribute.id === owner)
    : undefined;
  const lockedAttributeIds = (
    owner ? (ownerAttribute?.value.childAttributes ?? []) : attributes
  ).map((attribute) => attribute.id);

  const isUnitCodeSelected = selectedAttributeIds.includes('unitCode');
  const canAdd =
    selectedAttributeIds.length > 0 &&
    (!isUnitCodeSelected || unitCodeGroup !== '');

  const handleToggle = (attributeId: string) =>
    setSelectedAttributeIds((prev) =>
      prev.includes(attributeId)
        ? prev.filter((id) => id !== attributeId)
        : [...prev, attributeId],
    );

  const handleAdd = async () => {
    setIsAdding(true);
    try {
      const newAttributes = await Promise.all(
        selectedAttributeIds.map((attributeId) =>
          buildDataModelAttribute(queryClient, attributeId, unitCodeGroup),
        ),
      );

      setAttributes((prev) => {
        const next = structuredClone(prev);

        if (!owner) {
          return [...next, ...newAttributes];
        }

        const ownerObj = next.find((attribute) => attribute.id === owner);
        if (!ownerObj) {
          return prev;
        }

        ownerObj.value.childAttributes = [
          ...(ownerObj.value.childAttributes ?? []),
          ...newAttributes,
        ];
        ownerObj.toggle = true;
        return next;
      });

      setModelSelected([owner, newAttributes[newAttributes.length - 1]?.id]);
      onClose();
    } catch {
      toast.error('Failed to add attributes.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <DialogContent className="flex h-[70dvh] flex-col overflow-hidden sm:max-w-xl">
      <DialogHeader className="shrink-0">
        <DialogTitle>
          {owner ? 'Add child attributes' : 'Add Attributes'}
        </DialogTitle>
        <DialogDescription>
          Select one or more attributes to add. Their details can be edited
          after adding.
        </DialogDescription>
      </DialogHeader>
      <Command shouldFilter={false} className="min-h-0 flex-1 border">
        <CommandInput
          placeholder="Search attributes…"
          value={search}
          onValueChange={setSearch}
        />
        <ErrorBoundary fallback={<QueryErrorFallback />}>
          <Suspense fallback={<AttributeListFallback />}>
            <AttributeCatalogList
              searchWord={debouncedSearch}
              hiddenAttributeIds={owner ? [] : CHILD_ONLY_ATTRIBUTE_IDS}
              lockedAttributeIds={lockedAttributeIds}
              selectedAttributeIds={selectedAttributeIds}
              onToggle={handleToggle}
            />
          </Suspense>
        </ErrorBoundary>
      </Command>
      {isUnitCodeSelected && (
        <ErrorBoundary fallback={<QueryErrorFallback />}>
          <Suspense
            fallback={
              <div className="flex h-16 items-center justify-center">
                <Spinner className="text-muted-foreground size-4" />
              </div>
            }
          >
            <UnitCodeGroupField
              value={unitCodeGroup}
              onChange={setUnitCodeGroup}
            />
          </Suspense>
        </ErrorBoundary>
      )}
      <DialogFooter className="shrink-0 sm:justify-between">
        <span className="text-muted-foreground self-center text-xs">
          {selectedAttributeIds.length} selected
        </span>
        <div className="flex gap-2">
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogClose>
          <Button
            className="min-w-0 shrink"
            onClick={handleAdd}
            disabled={!canAdd || isAdding}
          >
            {isAdding && <Spinner className="size-4" />}
            {owner ? (
              <span className="truncate" title={owner}>
                Add to {owner}
              </span>
            ) : (
              'Add Attributes'
            )}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}

export function openDataModelAttributeDialog({
  owner,
  attributes,
  setAttributes,
  setModelSelected,
}: {
  owner?: string;
  attributes: DataModelAttributeFormatted[];
  setAttributes: Dispatch<SetStateAction<DataModelAttributeFormatted[]>>;
  setModelSelected: Dispatch<SetStateAction<Array<string | undefined>>>;
}) {
  overlay.open(({ isOpen, close }) => (
    <Dialog open={isOpen} onOpenChange={(v) => !v && close()}>
      <DataModelAttributePopupContent
        onClose={close}
        owner={owner}
        attributes={attributes}
        setAttributes={setAttributes}
        setModelSelected={setModelSelected}
      />
    </Dialog>
  ));
}
