import { type Dispatch, type SetStateAction } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { Button } from '@e8ight/ui/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@e8ight/ui/components/ui/dialog';
import {
  Field,
  FieldError,
  FieldLabel,
  FieldSet,
} from '@e8ight/ui/components/ui/field';
import { Input } from '@e8ight/ui/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@e8ight/ui/components/ui/select';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { overlay } from 'overlay-kit';
import { z } from 'zod';

import { AddAttributeOrMemberHandle } from '@/app/(app)/service/models/_utils/dataModelUtils';
import { ATTRIBUTE_VALUE_TYPES } from '@/constants/dataModelValueTypes';

import type { ObjectMemberFormatted } from '@/types/dataModel';

const memberSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  value: z.object({
    valueType: z.string(),
  }),
  toggle: z.boolean(),
});

type MemberFormValues = z.infer<typeof memberSchema>;

function DataModelMemberDialogBody({
  onClose,
  owner,
  state,
  setState,
}: {
  onClose: () => void;
  owner?: string;
  state: ObjectMemberFormatted[];
  setState: Dispatch<SetStateAction<ObjectMemberFormatted[]>>;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      id: '',
      value: { valueType: ATTRIBUTE_VALUE_TYPES[0] },
      toggle: false,
    },
  });

  const onSubmit = (data: MemberFormValues) => {
    AddAttributeOrMemberHandle(
      owner,
      onClose,
      'objectMember',
      data,
      state,
      setState,
    );
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {owner ? 'Add child object Member' : 'Add object member'}
        </DialogTitle>
        <DialogDescription>
          Define the member ID and value type, then add it to the object.
        </DialogDescription>
      </DialogHeader>
      <FieldSet>
        <Field data-invalid={!!errors.id}>
          <FieldLabel>ID</FieldLabel>
          <Input {...register('id')} />
          {errors.id && <FieldError>{errors.id.message}</FieldError>}
        </Field>
        <Field>
          <FieldLabel>Value Type</FieldLabel>
          <Controller
            control={control}
            name="value.valueType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ATTRIBUTE_VALUE_TYPES.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </FieldSet>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogClose>
        <Button
          className="min-w-0 truncate"
          onClick={handleSubmit(onSubmit, () =>
            toast.error('Please check the form fields.'),
          )}
        >
          {owner ? `Add child to ${owner}` : 'Add object member'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function openDataModelMemberDialog({
  owner,
  state,
  setState,
}: {
  owner?: string;
  state: ObjectMemberFormatted[];
  setState: Dispatch<SetStateAction<ObjectMemberFormatted[]>>;
}) {
  overlay.open(({ isOpen, close }) => (
    <Dialog open={isOpen} onOpenChange={(v) => !v && close()}>
      <DataModelMemberDialogBody
        onClose={close}
        owner={owner}
        state={state}
        setState={setState}
      />
    </Dialog>
  ));
}
