import { Button } from '@e8ight/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@e8ight/ui/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@e8ight/ui/components/ui/collapsible';
import { ScrollArea } from '@e8ight/ui/components/ui/scroll-area';
import { cn } from '@e8ight/ui/utils/cn';
import {
  Box,
  ChevronsDownUp,
  ChevronsUpDown,
  ChevronRight,
  Clock,
} from 'lucide-react';

import EntityAttributeTypeBadge from '@/app/(app)/service/entities/_components/EntityAttributeTypeBadge';
import { useTreeToggle } from '@/app/(app)/service/entities/_hooks/useTreeToggle';

import type { EntityAttributeSelection } from '@/app/(app)/service/entities/_types/entityAttribute';
import type {
  TreeItemType,
  TreeJsonType,
} from '@/app/(app)/service/entities/_types/entityTree';

interface IProps {
  treeJson: TreeJsonType;
  selectedTreePath?: string;
  onSelect: (selection: EntityAttributeSelection) => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  observationHints?: string[];
}

interface EntityAttributeNavigatorItemProps {
  item: TreeItemType;
  depth: number;
  treeJson: TreeJsonType;
  selectedTreePath?: string;
  treePath: string;
  path: string[];
  onSelect: (selection: EntityAttributeSelection) => void;
}

function getChildAttributes(
  treeJson: TreeJsonType,
  depth: number,
  parent: string,
) {
  return treeJson[depth + 1]?.filter((item) => item.parent === parent) ?? [];
}

function EntityAttributeNavigatorItem({
  item,
  depth,
  treeJson,
  selectedTreePath,
  treePath,
  path,
  onSelect,
}: EntityAttributeNavigatorItemProps) {
  const childAttributes = getChildAttributes(treeJson, depth, item.target);
  const hasChildren = childAttributes.length > 0;
  const [open, setOpen] = useTreeToggle(depth === 0, treePath);

  const isSelected = selectedTreePath === treePath;

  const row = (
    <div
      className={cn(
        'hover:bg-muted flex min-w-0 items-center overflow-hidden rounded-md',
        isSelected && 'bg-accent text-accent-foreground hover:bg-accent',
      )}
    >
      {hasChildren ? (
        <CollapsibleTrigger className="text-muted-foreground hover:text-foreground rounded-md p-2 transition-colors">
          <ChevronRight
            className={cn('size-4 transition-transform', open && 'rotate-90')}
          />
        </CollapsibleTrigger>
      ) : (
        <span className="text-muted-foreground flex size-8 shrink-0 items-center justify-center">
          <Box className="size-4" />
        </span>
      )}
      <Button
        variant="ghost"
        type="button"
        data-selected={isSelected}
        onClick={() =>
          onSelect({
            depth,
            item,
            path,
            treePath,
          })
        }
        className={cn(
          'h-10 min-w-0 flex-1 justify-start rounded-md px-1.5 text-left text-sm font-semibold',
          'hover:bg-transparent data-[selected=true]:bg-transparent data-[selected=true]:text-current',
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          <span title={item.target} className="min-w-0 truncate">
            {item.target}
          </span>
          <EntityAttributeTypeBadge type={item.type} />
        </span>
      </Button>
    </div>
  );

  if (!hasChildren) {
    return <li>{row}</li>;
  }

  return (
    <li>
      <Collapsible open={open} onOpenChange={setOpen}>
        {row}
        <CollapsibleContent>
          <ul className="border-border mt-0.5 ml-3 space-y-1 border-l pl-3">
            {childAttributes.map((childAttribute) => {
              const childTreePath = `${treePath}/${childAttribute.target}`;

              return (
                <EntityAttributeNavigatorItem
                  key={childTreePath}
                  item={childAttribute}
                  depth={depth + 1}
                  treeJson={treeJson}
                  selectedTreePath={selectedTreePath}
                  treePath={childTreePath}
                  path={[...path, childAttribute.target]}
                  onSelect={onSelect}
                />
              );
            })}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

function EntityAttributeNavigator({
  treeJson,
  selectedTreePath,
  onSelect,
  onCollapseAll,
  onExpandAll,
  observationHints = [],
}: IProps) {
  const topLevelAttributes = treeJson[0] ?? [];

  return (
    <Card className="flex min-h-0 min-w-0 flex-1 flex-col gap-0 overflow-hidden py-0">
      <CardHeader className="bg-muted/40 flex flex-row items-center justify-between px-2 py-0.5">
        <div className="flex items-center gap-2">
          <CardTitle className="text-foreground text-sm font-bold tracking-[.03em]">
            Attributes
          </CardTitle>
          <span className="text-muted-foreground text-xs">
            {topLevelAttributes.length}
          </span>
        </div>
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="opacity-60 hover:opacity-100"
            onClick={onCollapseAll}
            title="Collapse all"
          >
            <ChevronsDownUp className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="opacity-60 hover:opacity-100"
            onClick={onExpandAll}
            title="Expand all"
          >
            <ChevronsUpDown className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="border-border flex min-h-0 flex-1 flex-col border-t p-0">
        <ScrollArea className="min-h-0 flex-1 [&>[data-slot=scroll-area-viewport]>div]:!block [&>[data-slot=scroll-area-viewport]>div]:min-w-0">
          <ul className="space-y-1 p-1 pb-2">
            {topLevelAttributes.map((item) => {
              const treePath = `root/${item.target}`;

              return (
                <EntityAttributeNavigatorItem
                  key={treePath}
                  item={item}
                  depth={0}
                  treeJson={treeJson}
                  selectedTreePath={selectedTreePath}
                  treePath={treePath}
                  path={[item.target]}
                  onSelect={onSelect}
                />
              );
            })}
          </ul>
          {observationHints.length > 0 && (
            <div className="border-border mx-1 mb-2 rounded-md border border-dashed p-2">
              <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Clock className="size-3.5 shrink-0" />
                관측 시점을 선택하면 로드되는 속성
              </p>
              <ul className="mt-1.5 space-y-1 pl-5">
                {observationHints.map((attribute) => (
                  <li
                    key={attribute}
                    className="text-muted-foreground/80 truncate text-xs"
                    title={attribute}
                  >
                    {attribute}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default EntityAttributeNavigator;
