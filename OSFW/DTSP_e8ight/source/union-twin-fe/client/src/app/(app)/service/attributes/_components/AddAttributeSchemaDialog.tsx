import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { Button } from '@e8ight/ui/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@e8ight/ui/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@e8ight/ui/components/ui/dialog';
import { Field, FieldLabel, FieldError } from '@e8ight/ui/components/ui/field';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@e8ight/ui/components/ui/popover';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { useDebounce, useInfiniteScroll } from '@e8ight/ui/hooks';
import { cn } from '@e8ight/ui/utils/cn';
import { ErrorBoundary, Suspense } from '@suspensive/react';
import {
  useQuery,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';
import axios from 'axios';
import { Check, ChevronsUpDown } from 'lucide-react';
import { overlay } from 'overlay-kit';

import { attributeQueries } from '@/apis/attribute';
import {
  attributeSchemaQueries,
  useCreateAttributeSchemaMutation,
  useUpdateAttributeSchemaMutation,
} from '@/apis/attributeSchema';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';

import type { ApiError } from '@/types/error';

const EMPTY_IDS: string[] = [];

function AddAttributeSchemaDialogBody({
  onClose,
}: {
  onClose: (savedSchemaId?: string) => void;
}) {
  const [schemaId, setSchemaId] = useState('');
  const [schemaPickerOpen, setSchemaPickerOpen] = useState(false);
  const [schemaPickerQuery, setSchemaPickerQuery] = useState('');
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>(
    [],
  );
  const [attrSearch, setAttrSearch] = useState('');
  const debouncedWord = useDebounce(attrSearch.trim(), 300) || undefined;
  const trimmedSchemaId = schemaId.trim();

  const createMutation = useCreateAttributeSchemaMutation();
  const updateMutation = useUpdateAttributeSchemaMutation();

  const { data: schemaList } = useSuspenseQuery(attributeSchemaQueries.list());

  const isExistingSchema =
    trimmedSchemaId !== '' && schemaList.includes(trimmedSchemaId);

  const schemaDetailQuery = useQuery({
    ...attributeSchemaQueries.detail(trimmedSchemaId),
    enabled: isExistingSchema && Boolean(trimmedSchemaId),
  });
  const schemaDetail = schemaDetailQuery.data;

  const deferredWord = useDeferredValue(debouncedWord);
  const {
    data: attrInfinite,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useSuspenseInfiniteQuery(
    attributeQueries.infiniteList({ word: deferredWord }),
  );

  const { containerRef, sentinelRef } = useInfiniteScroll<HTMLDivElement>({
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    fetchNextPage,
  });

  const catalogItems = useMemo(
    () => attrInfinite.pages.flatMap((p) => p.data),
    [attrInfinite],
  );

  const trimmedPickerQuery = schemaPickerQuery.trim();
  const filteredSchemaIds = useMemo(() => {
    if (!trimmedPickerQuery) return schemaList;
    const q = trimmedPickerQuery.toLowerCase();
    return schemaList.filter((id) => id.toLowerCase().includes(q));
  }, [schemaList, trimmedPickerQuery]);

  const showCreateSchemaOption =
    trimmedPickerQuery !== '' && !schemaList.includes(trimmedPickerQuery);

  useEffect(() => {
    if (!trimmedSchemaId || !schemaList.includes(trimmedSchemaId)) {
      setSelectedAttributeIds(EMPTY_IDS);
      return;
    }
    if (!schemaDetail || schemaDetail.id !== trimmedSchemaId) return;
    const v = schemaDetail.value;
    if (!v || typeof v !== 'object') {
      setSelectedAttributeIds(EMPTY_IDS);
      return;
    }
    setSelectedAttributeIds(Object.keys(v));
  }, [schemaList, trimmedSchemaId, schemaDetail]);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0 });
  }, [containerRef, deferredWord]);

  const toggleAttribute = (id: string) => {
    setSelectedAttributeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = async () => {
    if (!trimmedSchemaId) return;

    if (!isExistingSchema && !trimmedSchemaId.endsWith('.json')) {
      toast.error('New schema IDs must end with .json');
      return;
    }

    try {
      if (!isExistingSchema) {
        await createMutation.mutateAsync({
          reqBody: { id: trimmedSchemaId },
        });
        if (selectedAttributeIds.length > 0) {
          await updateMutation.mutateAsync({
            id: trimmedSchemaId,
            attributes: selectedAttributeIds,
            isReadOnly: false,
          });
        }
        toast.success(`Schema '${trimmedSchemaId}' created.`);
      } else {
        await updateMutation.mutateAsync({
          id: trimmedSchemaId,
          attributes: selectedAttributeIds,
          isReadOnly: schemaDetail ? schemaDetail.isReadOnly : false,
        });
        toast.success(`Schema '${trimmedSchemaId}' updated.`);
      }
      onClose(trimmedSchemaId);
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? ((error.response?.data as ApiError | undefined)?.detail ??
              'Request failed')
          : 'Request failed',
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const needsJsonSuffix =
    !isExistingSchema &&
    trimmedSchemaId !== '' &&
    !trimmedSchemaId.endsWith('.json');
  const canSubmit = trimmedSchemaId !== '' && !needsJsonSuffix && !isPending;

  return (
    <DialogContent className="flex max-h-[85svh] flex-col sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Attribute Schema</DialogTitle>
        <DialogDescription>
          Select an existing schema or create a new one, then toggle attributes.
        </DialogDescription>
      </DialogHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        <Field>
          <FieldLabel>Schema</FieldLabel>
          <Popover
            open={schemaPickerOpen}
            onOpenChange={(next) => {
              setSchemaPickerOpen(next);
              if (!next) setSchemaPickerQuery('');
            }}
          >
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={schemaPickerOpen}
                className="h-auto min-h-9 w-full justify-between px-3 py-2 font-normal"
              >
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate text-left',
                    !schemaId && 'text-muted-foreground',
                  )}
                >
                  {trimmedSchemaId || 'Select existing or type new…'}
                </span>
                <ChevronsUpDown className="text-muted-foreground size-4 shrink-0 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-(--radix-popover-trigger-width) p-0"
              align="start"
            >
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search or type new schema id…"
                  value={schemaPickerQuery}
                  onValueChange={setSchemaPickerQuery}
                />
                <CommandList>
                  <CommandGroup heading="Existing">
                    {filteredSchemaIds.map((id) => (
                      <CommandItem
                        key={id}
                        value={id}
                        onSelect={() => {
                          setSchemaId(id);
                          setSchemaPickerOpen(false);
                          setSchemaPickerQuery('');
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 size-4 shrink-0',
                            trimmedSchemaId === id
                              ? 'opacity-100'
                              : 'opacity-0',
                          )}
                        />
                        <span className="truncate">{id}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {filteredSchemaIds.length === 0 && !showCreateSchemaOption ? (
                    <CommandEmpty>No schemas found.</CommandEmpty>
                  ) : null}
                  {showCreateSchemaOption ? (
                    <>
                      <CommandSeparator />
                      <CommandGroup heading="Create new">
                        <CommandItem
                          value={`__new__:${trimmedPickerQuery}`}
                          onSelect={() => {
                            setSchemaId(trimmedPickerQuery);
                            setSchemaPickerOpen(false);
                            setSchemaPickerQuery('');
                          }}
                        >
                          Create &quot;{trimmedPickerQuery}&quot;
                        </CommandItem>
                      </CommandGroup>
                    </>
                  ) : null}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {needsJsonSuffix ? (
            <FieldError>New schema IDs must end with .json</FieldError>
          ) : null}
        </Field>

        <Field>
          <FieldLabel>Attributes</FieldLabel>
          <Command shouldFilter={false} className="rounded-lg border">
            <CommandInput
              placeholder="Search attributes…"
              value={attrSearch}
              onValueChange={setAttrSearch}
            />
            <CommandList ref={containerRef}>
              {catalogItems.length === 0 ? (
                <CommandEmpty>No attributes found.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {catalogItems.map((item) => {
                    const isSelected = selectedAttributeIds.includes(item.id);
                    return (
                      <CommandItem
                        key={item.id}
                        value={item.id}
                        onSelect={() => toggleAttribute(item.id)}
                      >
                        <Check
                          className={cn(
                            'mr-2 size-4 shrink-0',
                            isSelected ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {item.id}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {item.type}
                        </span>
                      </CommandItem>
                    );
                  })}
                  <div
                    ref={sentinelRef}
                    className="flex min-h-4 justify-center py-1"
                  >
                    {isFetchingNextPage ? (
                      <Spinner className="text-muted-foreground size-4" />
                    ) : null}
                  </div>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </Field>
      </div>

      <DialogFooter>
        <Button variant="outline" size="sm" onClick={() => onClose()}>
          Cancel
        </Button>
        <Button size="sm" disabled={!canSubmit} onClick={handleSubmit}>
          {isPending ? (
            <Spinner className="size-4" />
          ) : isExistingSchema ? (
            'Save'
          ) : (
            'Create'
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function openAddAttributeSchemaDialog() {
  return overlay.openAsync<string | undefined>(({ isOpen, close }) => (
    <Dialog open={isOpen} onOpenChange={(v) => !v && close(undefined)}>
      <ErrorBoundary fallback={<QueryErrorFallback />}>
        <Suspense>
          <AddAttributeSchemaDialogBody onClose={close} />
        </Suspense>
      </ErrorBoundary>
    </Dialog>
  ));
}
