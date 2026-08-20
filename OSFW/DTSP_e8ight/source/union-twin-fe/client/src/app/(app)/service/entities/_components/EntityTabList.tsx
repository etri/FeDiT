import { Button } from '@e8ight/ui/components/ui/button';
import { ScrollArea, ScrollBar } from '@e8ight/ui/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@e8ight/ui/components/ui/tabs';
import { X } from 'lucide-react';
import Link from 'next/link';

import { useSwitchEntityTab } from '@/app/(app)/service/entities/_hooks/useActiveEntityTab';
import { useEntityParams } from '@/app/(app)/service/entities/_hooks/useEntityParams';
import {
  entityHistoryPath,
  entityPath,
} from '@/app/(app)/service/entities/_utils/paths';

import type { EntityTabType } from '@/app/(app)/service/entities/_types/entity';

interface IProps2 {
  entityTabInfo: EntityTabType;
  isActive: boolean;
  removeEntityTabList: (entityDetailId: string) => void;
}

function EntityTabItem({
  entityTabInfo,
  isActive,
  removeEntityTabList,
}: IProps2) {
  const switchEntityTab = useSwitchEntityTab();
  const { title, contextId, modelId, entityId, historyId, detailId, subTitle } =
    entityTabInfo;

  const routeURL = historyId
    ? entityHistoryPath(contextId, modelId, entityId, historyId)
    : entityPath(contextId, modelId, entityId);

  const anchorClickHandler = () => {
    switchEntityTab(entityTabInfo);
  };

  return (
    <div
      data-active={isActive}
      className="data-[active=true]:bg-accent/30 group relative max-w-full shrink-0"
    >
      <TabsTrigger
        value={detailId}
        asChild
        className="data-[state=active]:text-foreground h-auto max-w-sm min-w-0 justify-start rounded-none border-0 px-2.5 py-1.5 pr-9 text-left"
      >
        <Link
          href={routeURL}
          onClick={anchorClickHandler}
          className="block w-full min-w-0"
        >
          <div className="flex min-w-0 flex-col gap-0.5 overflow-hidden">
            <strong
              title={title}
              className="truncate text-sm leading-none font-semibold"
            >
              {title}
            </strong>
            {subTitle && (
              <span
                title={subTitle}
                className="text-muted-foreground truncate text-xs leading-none font-medium"
              >
                {subTitle}
              </span>
            )}
          </div>
        </Link>
      </TabsTrigger>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          removeEntityTabList(detailId);
        }}
        className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-1 my-auto size-8 opacity-60 hover:opacity-100 data-[active=true]:opacity-100"
        aria-label={`Close ${title}`}
        data-active={isActive}
      >
        <X size={16} />
      </Button>
    </div>
  );
}

interface IProps1 {
  entityTabList: EntityTabType[];
  removeEntityTabList: (entityDetailId: string) => void;
}

function EntityTabList({ entityTabList, removeEntityTabList }: IProps1) {
  const { entityId, historyId } = useEntityParams();
  const activeDetailId =
    historyId ?? entityId ?? entityTabList[0]?.detailId ?? '';

  return (
    <Tabs value={activeDetailId} className="flex min-h-0 w-full flex-col">
      <ScrollArea className="w-full min-w-0">
        <TabsList
          variant="line"
          className="flex h-10 justify-start gap-0 rounded-none bg-transparent p-0 pb-1"
        >
          {entityTabList.map((entityTabInfo) => {
            return (
              <EntityTabItem
                key={entityTabInfo.detailId}
                entityTabInfo={entityTabInfo}
                isActive={entityTabInfo.detailId === activeDetailId}
                removeEntityTabList={removeEntityTabList}
              />
            );
          })}
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Tabs>
  );
}

export default EntityTabList;
