import { useDeferredValue, useEffect, useState } from 'react';

import { useDebounce } from '@e8ight/ui/hooks';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Box } from 'lucide-react';
import { useParams } from 'next/navigation';

import { modelQueries } from '@/apis/model';
import { NavigationAside } from '@/components/common/NavigationAside';
import { usePagination } from '@/hooks/usePagination';

import type { IDataModelListItem } from '@/apis/model/model.types';

const LIST_COUNT = 22;

interface ModelAsideProps {
  onOpenNewDataModel: () => void;
}

function ModelAside({ onOpenNewDataModel }: ModelAsideProps) {
  const modelId = useParams<{ modelId?: string[] }>().modelId?.[0];

  const [searchWord, setSearchWord] = useState('');
  const debouncedWord = useDebounce(searchWord, 300);

  const [totalPages, setTotalPages] = useState(0);
  const pagination = usePagination(totalPages, debouncedWord);
  const { page } = pagination;

  const deferredPage = useDeferredValue(page);
  const deferredWord = useDeferredValue(debouncedWord);

  const { data } = useSuspenseQuery(
    modelQueries.list({
      curPage: deferredPage - 1,
      size: LIST_COUNT,
      word: deferredWord || undefined,
    }),
  );

  const list: IDataModelListItem[] = data.data;

  useEffect(() => {
    setTotalPages(data.totalPage);
  }, [data]);

  return (
    <NavigationAside
      title="Data Model"
      items={list.map((item) => ({
        key: item.type,
        to: `/service/models/${encodeURIComponent(item.type)}`,
        active: item.type === modelId,
        title: item.type,
        primaryText: item.type,
        badge: item.isReady
          ? {
              label: 'Ready',
              className: 'bg-secondary text-secondary-foreground',
            }
          : undefined,
        icon: (
          <Box className="text-muted-foreground size-4 shrink-0 opacity-70" />
        ),
      }))}
      searchValue={searchWord}
      onSearchChange={setSearchWord}
      newAction={{
        label: 'New',
        title: 'New model',
        onClick: onOpenNewDataModel,
      }}
      pagination={pagination}
    />
  );
}

export default ModelAside;
