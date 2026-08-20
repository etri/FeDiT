import { Field, FieldLabel } from '@e8ight/ui/components/ui/field';
import { Input } from '@e8ight/ui/components/ui/input';

import type { DataModelAttribute } from '@/types/dataModel';

function DataModelObservedAtContent({
  attribute,
}: {
  attribute: {
    id: string;
    value: DataModelAttribute;
    toggle: boolean;
  };
}) {
  const { value } = attribute;
  return (
    <div className="space-y-4 overflow-auto p-4">
      <Field>
        <FieldLabel>Value Type</FieldLabel>
        <Input readOnly value={value.valueType ?? ''} />
      </Field>
      {value.format !== undefined && (
        <Field>
          <FieldLabel>Format</FieldLabel>
          <Input readOnly value={value.format ?? ''} />
        </Field>
      )}
    </div>
  );
}

export default DataModelObservedAtContent;
