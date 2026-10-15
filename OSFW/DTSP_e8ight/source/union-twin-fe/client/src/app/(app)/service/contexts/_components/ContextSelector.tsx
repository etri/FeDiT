import type { Dispatch, SetStateAction } from 'react';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { Badge } from '@e8ight/ui/components/ui/badge';
import { Button } from '@e8ight/ui/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@e8ight/ui/components/ui/input-group';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@e8ight/ui/components/ui/item';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { useDebounce, useInfiniteScroll } from '@e8ight/ui/hooks';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import { Check, Database, PlusCircle, Search, SearchX } from 'lucide-react';

import { modelQueries } from '@/apis/model';
import { prependModel } from '@/app/(app)/service/contexts/_utils/modelList';

import type { IDataModelListItem } from '@/apis/model/model.types';
import type { ContextModel } from '@/types/context';

interface ContextSelectorProps {
  ContextModelList: ContextModel[];
  setContextModelList: Dispatch<SetStateAction<ContextModel[]>>;
}

export function ContextSelector({
  ContextModelList,
  setContextModelList,
}: ContextSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const normalizedSearchQuery = debouncedSearchQuery.trim() || undefined;
  const deferredSearchQuery = useDeferredValue(normalizedSearchQuery);

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery(
      modelQueries.infiniteList({ word: deferredSearchQuery }),
    );

  const { containerRef, sentinelRef } = useInfiniteScroll<HTMLDivElement>({
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    fetchNextPage,
  });

  const dataModelList = useMemo<IDataModelListItem[]>(
    () => data.pages.flatMap((page) => page.data),
    [data],
  );

  useEffect(() => {
    if (containerRef.current === null) {
      return;
    }

    containerRef.current?.scroll({ top: 0 });
  }, [containerRef, deferredSearchQuery]);

  const onClickAddDataModel = (title: string) => {
    setContextModelList((prev) => prependModel(prev, title));
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <InputGroup className="h-9 w-full shrink-0">
        <InputGroupInput
          placeholder="Search data models..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <InputGroupAddon align="inline-end">
          <Search className="text-muted-foreground size-4" />
        </InputGroupAddon>
      </InputGroup>
      <div
        ref={containerRef}
        className="max-h-[min(52vh,380px)] min-h-[11rem] flex-1 overflow-auto rounded-lg border"
      >
        <div className="px-3 py-2.5">
          <ItemGroup className="gap-2">
            {dataModelList.map((item) => {
              const inContext = ContextModelList.some(
                (data) => data.type === 'Model' && data.title === item.type,
              );
              return (
                <Item
                  key={item.type}
                  role="listitem"
                  variant={inContext ? 'muted' : 'outline'}
                  size="sm"
                  className={cn(inContext && 'border-primary/30 bg-primary/5')}
                >
                  <ItemMedia variant="icon">
                    <Database
                      className={
                        inContext ? 'text-primary' : 'text-muted-foreground'
                      }
                    />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle
                      className="w-full min-w-0 truncate"
                      title={item.type}
                    >
                      {item.type}
                    </ItemTitle>
                  </ItemContent>
                  <ItemActions className="gap-1.5">
                    {inContext ? (
                      <>
                        <Check
                          className="text-primary size-4 shrink-0"
                          aria-hidden
                        />
                        <Badge variant="secondary">In context</Badge>
                      </>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-1"
                        onClick={() => onClickAddDataModel(item.type)}
                      >
                        <PlusCircle className="size-3.5" />
                        Add
                      </Button>
                    )}
                  </ItemActions>
                </Item>
              );
            })}
          </ItemGroup>
          {hasNextPage || isFetchingNextPage ? (
            <div ref={sentinelRef} className="flex justify-center pt-3 pb-1">
              {isFetchingNextPage && (
                <Spinner className="text-muted-foreground size-4" />
              )}
            </div>
          ) : null}
          {dataModelList.length === 0 ? (
            <Empty className="py-6">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchX />
                </EmptyMedia>
                <EmptyTitle>No data models found</EmptyTitle>
                <EmptyDescription>
                  Try a different search term.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : null}
        </div>
      </div>
    </div>
  );
}
