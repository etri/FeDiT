import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { Badge } from '@e8ight/ui/components/ui/badge';
import { Button } from '@e8ight/ui/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@e8ight/ui/components/ui/command';
import { Field, FieldLabel } from '@e8ight/ui/components/ui/field';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@e8ight/ui/components/ui/popover';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { useDebounce, useInfiniteScroll } from '@e8ight/ui/hooks';
import { ErrorBoundary, Suspense } from '@suspensive/react';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import Link from 'next/link';

import { modelQueries } from '@/apis/model';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';

import type { IDataModelListItem } from '@/apis/model/model.types';

function modelTypeHref(modelUrn: string) {
  const type = modelUrn.replace(/^urn:ngsi-ld:/, '').replace(/:$/, '');
  return `/service/models/${encodeURIComponent(type)}`;
}

interface ModelTypeSelectorProps {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  isUnable?: boolean;
}

function ModelTypeOptionList({
  word,
  selected,
  onToggle,
}: {
  word: string | undefined;
  selected: string[];
  onToggle: (modelId: string) => void;
}) {
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery(modelQueries.infiniteList({ word }));

  const { containerRef, sentinelRef } = useInfiniteScroll<HTMLDivElement>({
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    fetchNextPage,
  });

  const models = useMemo<IDataModelListItem[]>(
    () => data.pages.flatMap((page) => page.data),
    [data],
  );

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0 });
  }, [containerRef, word]);

  return (
    <CommandList ref={containerRef}>
      {models.length === 0 ? (
        <CommandEmpty>No data models found.</CommandEmpty>
      ) : (
        <CommandGroup>
          {models.map((model) => {
            const isSelected = selected.includes(model.id);
            return (
              <CommandItem
                key={model.id}
                value={model.id}
                onSelect={() => onToggle(model.id)}
              >
                <Check
                  className={cn(
                    'mr-2 size-4 shrink-0',
                    isSelected ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <span className="min-w-0 flex-1 truncate" title={model.type}>
                  {model.type}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {model.id}
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

function ModelTypeSelector({
  label,
  value,
  onChange,
  isUnable,
}: ModelTypeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedWord = useDebounce(search.trim(), 300) || undefined;
  const deferredWord = useDeferredValue(debouncedWord);

  const toggleModel = (modelId: string) => {
    onChange(
      value.includes(modelId)
        ? value.filter((id) => id !== modelId)
        : [...value, modelId],
    );
  };

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      {!isUnable && (
        <Popover
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setSearch('');
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between font-normal"
            >
              <span className="text-muted-foreground min-w-0 flex-1 truncate text-left">
                Select data models…
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
                placeholder="Search data models…"
                value={search}
                onValueChange={setSearch}
              />
              <ErrorBoundary fallback={<QueryErrorFallback />}>
                <Suspense
                  fallback={
                    <div className="flex justify-center py-6">
                      <Spinner className="text-muted-foreground size-4" />
                    </div>
                  }
                >
                  <ModelTypeOptionList
                    word={deferredWord}
                    selected={value}
                    onToggle={toggleModel}
                  />
                </Suspense>
              </ErrorBoundary>
            </Command>
          </PopoverContent>
        </Popover>
      )}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {value.map((modelId) => (
            <Badge
              key={modelId}
              variant="secondary"
              className="max-w-full gap-1 whitespace-normal"
            >
              <Link
                href={modelTypeHref(modelId)}
                className="min-w-0 text-left wrap-anywhere hover:underline"
              >
                {modelId}
              </Link>
              {!isUnable && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="rounded-sm"
                  onClick={() => onChange(value.filter((id) => id !== modelId))}
                >
                  <X className="size-3" />
                  <span className="sr-only">Remove {modelId}</span>
                </Button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </Field>
  );
}

export default ModelTypeSelector;
