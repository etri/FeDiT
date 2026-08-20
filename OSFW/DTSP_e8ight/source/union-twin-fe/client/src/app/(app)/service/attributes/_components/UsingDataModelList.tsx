import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import { Item, ItemGroup } from '@e8ight/ui/components/ui/item';
import { useSuspenseQuery } from '@tanstack/react-query';
import { SearchX } from 'lucide-react';

import { attributeQueries } from '@/apis/attribute';

export function UsingDataModelList({ attrId }: { attrId: string }) {
  const { data: modelList } = useSuspenseQuery(
    attributeQueries.usingModels(attrId),
  );

  if (modelList.length === 0) {
    return (
      <Empty className="border-0 bg-transparent">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchX />
          </EmptyMedia>
          <EmptyTitle>연결된 데이터 모델 없음</EmptyTitle>
          <EmptyDescription>
            이 속성을 사용하는 데이터 모델이 없습니다.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ItemGroup className="border-border divide-border gap-0 divide-y rounded border">
      {modelList.map((e: string) => (
        <Item key={e} role="listitem" className="px-3 py-2 wrap-anywhere">
          {e}
        </Item>
      ))}
    </ItemGroup>
  );
}
