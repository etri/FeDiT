import { useCallback, useMemo } from 'react';

import { Button } from '@e8ight/ui/components/ui/button';
import { Card } from '@e8ight/ui/components/ui/card';
import { X } from 'lucide-react';

import DataModelAttributeContent from '@/app/(app)/service/models/_components/dataModelAttributeContent/DataModelAttributeContent';
import DataModelObservedAtContent from '@/app/(app)/service/models/_components/dataModelAttributeContent/DataModelObservedAtContent';
import DataModelUnitCodeContent from '@/app/(app)/service/models/_components/dataModelAttributeContent/DataModelUnitCodeContent';
import { useDataModelStore } from '@/app/(app)/service/models/_stores/useDataModelStore';

import type {
  DataModelAttribute as DataModelAttributeValue,
  DataModelAttributeFormatted,
} from '@/types/dataModel';

function DataModelAttribute({
  parentId,
  id,
  onClose,
}: {
  parentId?: string;
  id?: string;
  onClose?: () => void;
}) {
  const attributes = useDataModelStore((s) => s.modelAttribute);
  const setAttributes = useDataModelStore((s) => s.setModelAttribute);

  const currentAttribute = useMemo(() => {
    if (!id) return undefined;
    if (!parentId) {
      return attributes.find((e) => e.id === id);
    }
    const parentNode = attributes.find((e) => e.id === parentId);
    return parentNode?.value?.childAttributes?.find((e) => e.id === id);
  }, [attributes, parentId, id]);

  const updateAttributeValue = useCallback(
    (valueItem: Partial<DataModelAttributeValue>) => {
      setAttributes((prev) => {
        const next: DataModelAttributeFormatted[] = structuredClone(prev);
        const target = parentId
          ? next
              .find((e) => e.id === parentId)
              ?.value?.childAttributes?.find((e) => e.id === id)
          : next.find((e) => e.id === id);
        if (target) {
          target.value = { ...target.value, ...valueItem };
        }
        return next;
      });
    },
    [setAttributes, parentId, id],
  );

  const handleEnumChange = useCallback(
    (enums: string[]) => updateAttributeValue({ enum: enums }),
    [updateAttributeValue],
  );

  if (!id || !currentAttribute) return null;

  const attributeContent = (attrId: string) => {
    switch (attrId) {
      case 'unitCode':
        return (
          <DataModelUnitCodeContent
            unitCodeType={currentAttribute.value.type ?? ''}
            valueType={currentAttribute.value.valueType}
            format={currentAttribute.value.format}
            onEnumChange={handleEnumChange}
          />
        );
      case 'observedAt':
        return <DataModelObservedAtContent attribute={currentAttribute} />;
      default:
        return (
          <DataModelAttributeContent
            keyId={`${parentId ?? 'owner'}-${currentAttribute.id}`}
            value={currentAttribute.value}
            setValue={updateAttributeValue}
          />
        );
    }
  };

  return (
    <Card className="min-w-0 flex-1 gap-0 py-0">
      <div className="bg-muted text-foreground flex w-full min-w-0 items-center justify-between border-b px-2 py-1 text-sm font-bold tracking-[.03em]">
        <span
          className="truncate"
          title={`${parentId ? `${parentId} > ` : ''}${id ?? ''}`}
        >
          {parentId ? `${parentId} > ` : ''}
          {id ?? ''}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={onClose}
        >
          <X className="size-4" />
          Close
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">{attributeContent(id)}</div>
    </Card>
  );
}

export default DataModelAttribute;
