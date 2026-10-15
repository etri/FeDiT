import type { Dispatch, SetStateAction } from 'react';

import { Badge } from '@e8ight/ui/components/ui/badge';
import { Button } from '@e8ight/ui/components/ui/button';
import { cn } from 'cn';
import { Box, ChevronDown, ChevronRight, Plus, X } from 'lucide-react';

import { useDataModelStore } from '@/app/(app)/service/models/_stores/useDataModelStore';
import { getAttributeTypeBadgeStyle } from '@/constants/attributeTypeBadge';

import type { DataModelAttribute } from '@/types/dataModel';

type TreeBranch = Record<string, { id: string }[] | undefined>;

function DataModelTreeItem<
  T extends { id: string; toggle: boolean; value: object },
>({
  id,
  value,
  owner,
  toggle,
  open,
  setAttributes,
  modelSelected,
  setModelSelected,
  type = 'childAttributes',
}: {
  id: string;
  value: DataModelAttribute;
  owner?: string;
  toggle: boolean;
  open?: () => void;
  setAttributes: Dispatch<SetStateAction<T[]>>;
  modelSelected: Array<string | undefined>;
  setModelSelected: Dispatch<SetStateAction<Array<string | undefined>>>;
  type?: 'childAttributes' | 'objectMember';
}) {
  const editMode = useDataModelStore((s) => s.editMode);
  const isActive = () => {
    const [selectedOwner, selectedId] = modelSelected;
    if (selectedOwner === owner && selectedId === id) {
      return true;
    }
    return false;
  };

  const handleRemove = (targetId: string, targetOwner: string | undefined) => {
    if (!targetOwner) {
      setAttributes((prev) =>
        structuredClone(prev).filter((e) => e.id !== targetId),
      );
    } else {
      setAttributes((prev) => {
        const newAttribute = structuredClone(prev);
        const ownerValue = newAttribute.find((e) => e.id === targetOwner)
          ?.value as TreeBranch | undefined;
        if (!ownerValue) {
          return newAttribute;
        }
        const newChild = (ownerValue[type] ?? []).filter(
          (c) => c.id !== targetId,
        );
        ownerValue[type] = newChild;
        if (newChild.length === 0) {
          delete ownerValue[type];
        }
        return newAttribute;
      });
    }
    setModelSelected([]);
  };

  const handleToggle = () => {
    setAttributes((prev) => {
      const next = structuredClone(prev);
      const item = next.find((e) => e.id === (owner ?? id));
      if (item) {
        item.toggle = !item.toggle;
      }
      return next;
    });
  };

  const renderIcon = value[type] ? (
    <Button
      variant="ghost"
      size="icon-sm"
      type="button"
      className="shrink-0 opacity-70 hover:opacity-100"
      aria-label={toggle ? 'Collapse item' : 'Expand item'}
      onClick={handleToggle}
    >
      {toggle ? (
        <ChevronDown className="size-4" />
      ) : (
        <ChevronRight className="size-4" />
      )}
    </Button>
  ) : (
    <span className="flex size-8 shrink-0 items-center justify-center opacity-70">
      <Box className="size-4" />
    </span>
  );

  const renderLabel = (
    <>
      {type === 'childAttributes' && value.type && (
        <Badge
          variant="outline"
          className={getAttributeTypeBadgeStyle(value.type)}
        >
          {value.type}
        </Badge>
      )}
      {type === 'objectMember' && value.valueType && (
        <Badge
          variant="outline"
          className="border-border bg-muted/80 text-muted-foreground"
        >
          {value.valueType}
        </Badge>
      )}
    </>
  );

  const renderTreeItemController = editMode ? (
    <div
      className={cn('mr-1 flex items-center gap-1', !isActive() && 'hidden')}
    >
      {((type === 'childAttributes' && !owner) ||
        (type === 'objectMember' &&
          value.valueType === 'Object' &&
          !owner)) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-xs opacity-70 hover:opacity-100"
          onClick={open}
        >
          <Plus className="size-4" />
          {type === 'objectMember' ? 'Add member' : 'Add child'}
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 gap-1 px-2 text-xs opacity-70 hover:opacity-100"
        onClick={() => handleRemove(id, owner)}
      >
        <X className="size-4" />
        Remove
      </Button>
    </div>
  ) : null;

  const row = (
    <div
      className={cn(
        'hover:bg-muted flex min-w-0 items-center',
        isActive() && 'bg-accent',
        owner && 'pl-6',
      )}
    >
      {renderIcon}
      <Button
        variant="ghost"
        className="text-foreground h-full min-w-0 flex-1 justify-start gap-1.5 text-left text-sm leading-8"
        type="button"
        onClick={() => setModelSelected([owner, id])}
      >
        <span className="truncate" title={id}>
          {id}
        </span>
        {renderLabel}
      </Button>
      {renderTreeItemController}
    </div>
  );

  return (
    <div>
      {row}
      {toggle &&
        Array.isArray(value[type]) &&
        value[type].map((child) => (
          <DataModelTreeItem
            key={child.id ?? child.name}
            id={child.id ?? child.name}
            value={child.value ?? child}
            owner={owner ?? id}
            toggle={false}
            setAttributes={setAttributes}
            modelSelected={modelSelected}
            setModelSelected={setModelSelected}
            type={type}
          />
        ))}
    </div>
  );
}

export default DataModelTreeItem;
