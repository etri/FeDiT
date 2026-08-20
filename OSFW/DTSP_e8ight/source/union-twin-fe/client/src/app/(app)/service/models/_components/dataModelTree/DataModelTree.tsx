import { Button } from '@e8ight/ui/components/ui/button';
import { Card, CardContent } from '@e8ight/ui/components/ui/card';
import { ChevronsDownUp, ChevronsUpDown, Plus } from 'lucide-react';

import DataModelTreeItem from '@/app/(app)/service/models/_components/dataModelTree/DataModelTreeItem';
import { openDataModelAttributeDialog } from '@/app/(app)/service/models/_components/popupContents/DataModelAttributeDialog';
import { useDataModelStore } from '@/app/(app)/service/models/_stores/useDataModelStore';

function DataModelTree() {
  const modelSelected = useDataModelStore((s) => s.modelSelected);
  const setModelSelected = useDataModelStore((s) => s.setModelSelected);
  const attributes = useDataModelStore((s) => s.modelAttribute);
  const setAttributes = useDataModelStore((s) => s.setModelAttribute);
  const editMode = useDataModelStore((s) => s.editMode);

  const folderHandle = (value: boolean) => {
    setAttributes((prev) => {
      if (prev.length === 0) {
        return prev;
      }
      const newAttr = structuredClone(prev);
      newAttr.forEach((e) => {
        e.toggle = value;
      });
      return newAttr;
    });
  };

  const open = (owner?: string) => {
    openDataModelAttributeDialog({
      owner,
      attributes,
      setAttributes,
      setModelSelected,
    });
  };

  return (
    <Card className="w-full min-w-0 flex-1 gap-0 py-0">
      <div className="bg-muted flex shrink-0 flex-wrap items-center justify-between gap-1 border-b p-1">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => folderHandle(false)}
          >
            <ChevronsDownUp className="size-4" />
            Collapse all
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => folderHandle(true)}
          >
            <ChevronsUpDown className="size-4" />
            Expand all
          </Button>
        </div>
        {editMode && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => open()}
          >
            <Plus className="size-4" />
            Add attribute
          </Button>
        )}
      </div>
      <CardContent className="min-h-0 flex-1 overflow-auto px-0">
        {attributes?.map((e) => (
          <DataModelTreeItem
            key={e.id}
            id={e.id}
            value={e.value}
            toggle={e.toggle}
            open={() => open(modelSelected[1])}
            setAttributes={setAttributes}
            modelSelected={modelSelected}
            setModelSelected={setModelSelected}
          />
        ))}
      </CardContent>
    </Card>
  );
}

export default DataModelTree;
