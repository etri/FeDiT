'use client';

import { useEffect, useMemo, useState } from 'react';

import { useDebounce } from '@e8ight/ui/hooks';
import { useSuspenseQueries, useSuspenseQuery } from '@tanstack/react-query';
import { attempt, uniqBy } from 'es-toolkit';
import { Box } from 'lucide-react';
import { useParams } from 'next/navigation';

import { contextQueries } from '@/apis/context';
import { NavigationAside } from '@/components/common/NavigationAside';
import { usePagination } from '@/hooks/usePagination';

import type { ContextVersion } from '@/types/context';

function orderContextBaseUrls(rawList: string[]): string[] {
  const res = [...rawList];
  const ngsiIdx = res.findIndex((el) => el.includes('ngsi-ld'));
  if (ngsiIdx === -1) {
    return res;
  }
  const [item] = res.splice(ngsiIdx, 1);
  res.unshift(item);
  return res;
}

function contextDisplayName(item: ContextVersion): string {
  const v = item.version?.trim();
  if (v) {
    return v;
  }
  return item.url;
}

function isRowActive(routeId: string | undefined, itemUrl: string): boolean {
  if (routeId == null || !itemUrl) {
    return false;
  }
  if (routeId === itemUrl) {
    return true;
  }
  const [, decoded] = attempt(() => decodeURIComponent(routeId));
  if (decoded === itemUrl) return true;
  if (routeId === encodeURIComponent(itemUrl)) {
    return true;
  }
  return false;
}

function matchesContextSearch(item: ContextVersion, word: string): boolean {
  const normalizedWord = word.trim().toLowerCase();

  if (!normalizedWord) {
    return true;
  }

  return (
    contextDisplayName(item).toLowerCase().includes(normalizedWord) ||
    item.url.toLowerCase().includes(normalizedWord)
  );
}

const LIST_COUNT = 22;

interface ContextAsideProps {
  onOpenNewContext: () => void;
}

export function ContextAside({ onOpenNewContext }: ContextAsideProps) {
  const { contextId: _ctxSlug } = useParams<{ contextId?: string[] }>();
  const routeContextId = _ctxSlug?.[0]
    ? decodeURIComponent(_ctxSlug[0])
    : undefined;
  const [searchWord, setSearchWord] = useState('');
  const debouncedWord = useDebounce(searchWord, 300);

  const { data: rawList } = useSuspenseQuery(contextQueries.list());

  const baseUrls = useMemo(() => orderContextBaseUrls(rawList), [rawList]);

  const versionQueries = useSuspenseQueries({
    queries: baseUrls.map((contextUrl) => ({
      ...contextQueries.versions(contextUrl),
    })),
  });

  const contextRows = useMemo(
    () =>
      uniqBy(
        versionQueries
          .flatMap((query) => query.data ?? [])
          .filter((item) => item.url),
        (item) => item.url,
      ),
    [versionQueries],
  );

  const filteredRows = useMemo(
    () =>
      contextRows.filter((item) => matchesContextSearch(item, debouncedWord)),
    [contextRows, debouncedWord],
  );
  const totalPages =
    filteredRows.length === 0 ? 0 : Math.ceil(filteredRows.length / LIST_COUNT);
  const pagination = usePagination(totalPages, debouncedWord);
  const { page, goToPage } = pagination;
  const start = (page - 1) * LIST_COUNT;
  const pagedRows = filteredRows.slice(start, start + LIST_COUNT);

  useEffect(() => {
    if (!routeContextId) {
      return;
    }
    if (debouncedWord) {
      return;
    }
    if (filteredRows.length === 0) {
      return;
    }

    const targetIndex = filteredRows.findIndex((item) =>
      isRowActive(routeContextId, item.url),
    );

    if (targetIndex === -1) {
      return;
    }

    const targetPage = Math.floor(targetIndex / LIST_COUNT) + 1;

    if (targetPage !== page) {
      goToPage(targetPage);
    }
  }, [routeContextId, debouncedWord, filteredRows, page, goToPage]);

  return (
    <NavigationAside
      title="Context"
      items={pagedRows.map((item) => ({
        key: item.url,
        to: `/service/contexts/${encodeURIComponent(item.url)}`,
        active: isRowActive(routeContextId, item.url),
        title: item.url,
        primaryText: contextDisplayName(item),
        icon: (
          <Box className="text-muted-foreground size-4 shrink-0 opacity-70" />
        ),
      }))}
      searchValue={searchWord}
      onSearchChange={setSearchWord}
      newAction={{
        label: 'New',
        title: 'New context',
        onClick: onOpenNewContext,
      }}
      pagination={pagination}
    />
  );
}
