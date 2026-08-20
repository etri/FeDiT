import { useDeferredValue, useEffect, useState } from 'react';

import { useDebounce } from '@e8ight/ui/hooks';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Box, Layers, Plus } from 'lucide-react';
import { useParams } from 'next/navigation';

import { attributeQueries } from '@/apis/attribute/attribute.queries';
import { NavigationAside } from '@/components/common/NavigationAside';
import { usePagination } from '@/hooks/usePagination';

const LIST_COUNT = 22;

interface AttributeAsideProps {
  onOpenNewAttribute: () => void;
  onOpenAddAttributeSchema: () => void;
}

function AttributeAside({
  onOpenNewAttribute,
  onOpenAddAttributeSchema,
}: AttributeAsideProps) {
  const { attrId: _rawAttrId } = useParams<{ attrId: string }>();
  const attrId = _rawAttrId ? decodeURIComponent(_rawAttrId) : undefined;

  const [searchWord, setSearchWord] = useState('');
  const debouncedWord = useDebounce(searchWord, 300);

  const [totalPages, setTotalPages] = useState(0);
  const pagination = usePagination(totalPages, debouncedWord);
  const { page } = pagination;

  const deferredPage = useDeferredValue(page);
  const deferredWord = useDeferredValue(debouncedWord);

  const { data } = useSuspenseQuery(
    attributeQueries.list({
      curPage: deferredPage - 1,
      size: LIST_COUNT,
      word: deferredWord || undefined,
    }),
  );

  const list = data.data;

  useEffect(() => {
    setTotalPages(data.totalPage);
  }, [data]);

  return (
    <NavigationAside
      title="Attribute"
      items={list.map((item) => ({
        key: item.id,
        to: `/service/attributes/${encodeURIComponent(item.id)}`,
        active: item.id === attrId,
        title: item.id,
        primaryText: item.id,
        secondaryText: item.type !== 'e8ight' ? item.type : undefined,
        icon: (
          <Box className="text-muted-foreground size-4 shrink-0 opacity-70" />
        ),
      }))}
      searchValue={searchWord}
      onSearchChange={setSearchWord}
      newAction={{
        title: 'Add attribute',
        ariaLabel: 'Add attribute',
        icon: <Plus className="size-4" />,
        onClick: onOpenNewAttribute,
      }}
      secondaryNewAction={{
        title: 'Add attribute schema',
        ariaLabel: 'Add attribute schema',
        icon: <Layers className="size-4" />,
        onClick: onOpenAddAttributeSchema,
      }}
      pagination={pagination}
    />
  );
}

export default AttributeAside;
