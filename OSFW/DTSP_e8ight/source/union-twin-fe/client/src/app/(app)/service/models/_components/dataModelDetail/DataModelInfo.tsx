import { useFormContext, Controller } from 'react-hook-form';

import { Field, FieldLabel, FieldError } from '@e8ight/ui/components/ui/field';
import { Input } from '@e8ight/ui/components/ui/input';

import EditableList from '@/app/(app)/service/models/_components/EditableList';
import { useDataModelStore } from '@/app/(app)/service/models/_stores/useDataModelStore';

import type { DataModelFormValues } from '@/app/(app)/service/models/_schemas/dataModel.schema';

function DataModelInfo({ EditableType }: { EditableType?: boolean }) {
  const editMode = useDataModelStore((s) => s.editMode);
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = useFormContext<DataModelFormValues>();

  const typeValue = watch('type');
  const idValue = watch('id');

  return (
    <div className="space-y-4">
      <Field>
        <FieldLabel>ID *</FieldLabel>
        <Input
          readOnly
          value={
            idValue && idValue !== '' ? idValue : `urn:ngsi-ld:${typeValue}:`
          }
        />
      </Field>
      <Field>
        <FieldLabel>Type *</FieldLabel>
        {EditableType ? (
          <Input
            type="text"
            {...register('type')}
            aria-invalid={!!errors.type}
          />
        ) : (
          <Input readOnly value={typeValue} />
        )}
        <FieldError errors={[errors.type]} />
      </Field>
      <Field>
        <FieldLabel htmlFor="title">Title</FieldLabel>
        <Input
          id="title"
          type="text"
          {...register('title')}
          readOnly={!editMode}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="description">Description</FieldLabel>
        <Input
          id="description"
          type="text"
          {...register('description')}
          readOnly={!editMode}
        />
      </Field>
      <Controller
        control={control}
        name="reference"
        render={({ field }) => (
          <EditableList
            key={idValue}
            label="reference"
            setState={field.onChange}
            propValue={field.value}
            isUnable={!editMode}
          />
        )}
      />
    </div>
  );
}

export default DataModelInfo;
