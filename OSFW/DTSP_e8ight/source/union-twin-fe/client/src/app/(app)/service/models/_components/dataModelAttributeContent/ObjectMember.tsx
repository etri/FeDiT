import { useEffect, useState } from 'react';

import { Button } from '@e8ight/ui/components/ui/button';
import { Card, CardContent } from '@e8ight/ui/components/ui/card';
import { ChevronsDownUp, ChevronsUpDown, Plus } from 'lucide-react';

import DataModelTreeItem from '@/app/(app)/service/models/_components/dataModelTree/DataModelTreeItem';
import { openDataModelMemberDialog } from '@/app/(app)/service/models/_components/popupContents/DataModelMemberDialog';
import { useDataModelStore } from '@/app/(app)/service/models/_stores/useDataModelStore';
import {
  memberToObject,
  ObjectMemberToArray,
} from '@/app/(app)/service/models/_utils/dataModelUtils';

import type {
  DataModelAttribute,
  ObjectMemberFormatted,
} from '@/types/dataModel';

function ObjectMember({
  setMember,
  propValue,
}: {
  setMember: (value: Record<string, unknown>) => void;
  propValue: Record<string, unknown> | undefined;
}) {
  const editMode = useDataModelStore((s) => s.editMode);
  const [modelSelected, setModelSelected] = useState<Array<string | undefined>>(
    [],
  );

  const [memberValue, setMemberValue] = useState<ObjectMemberFormatted[]>(() =>
    propValue === undefined ? [] : ObjectMemberToArray(propValue),
  );

  useEffect(() => {
    setMember(memberToObject(memberValue));
  }, [memberValue, setMember]);

  const folderHandle = (value: boolean) => {
    setMemberValue((prev) => {
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

  const objectFinder = () => {
    if (modelSelected.length === 0) {
      return true;
    }
    if (modelSelected[0] !== undefined) {
      return false;
    }
    const value = memberValue.find((e) => e.id === modelSelected[1]);

    if (value?.value.valueType === 'Object') {
      return true;
    }
    return false;
  };

  const open = (owner?: string) => {
    openDataModelMemberDialog({
      owner,
      state: memberValue,
      setState: setMemberValue,
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
        {editMode && objectFinder() && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => open()}
          >
            <Plus className="size-4" />
            Add member
          </Button>
        )}
      </div>
      <CardContent className="overflow-auto px-0">
        {memberValue.map((e) => (
          <DataModelTreeItem
            key={e.id}
            id={e.id}
            value={e.value as DataModelAttribute}
            toggle={e.toggle}
            open={() => open(modelSelected[1])}
            setAttributes={setMemberValue}
            modelSelected={modelSelected}
            setModelSelected={setModelSelected}
            type="objectMember"
          />
        ))}
      </CardContent>
    </Card>
  );
}

export default ObjectMember;
