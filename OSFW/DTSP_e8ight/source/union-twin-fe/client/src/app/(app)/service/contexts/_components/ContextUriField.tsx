import type { Ref } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

import { Alert, AlertDescription } from '@e8ight/ui/components/ui/alert';
import { Field, FieldError, FieldLabel } from '@e8ight/ui/components/ui/field';
import { Input as UIInput } from '@e8ight/ui/components/ui/input';
import { AlertCircle } from 'lucide-react';

interface ContextUriFieldProps {
  errorText: string;
  errorMessage?: string;
  hasError: boolean;
  isCreate: boolean;
  field: Omit<UseFormRegisterReturn, 'ref'>;
  inputRef: Ref<HTMLInputElement>;
}

export function ContextUriField({
  errorText,
  errorMessage,
  hasError,
  isCreate,
  field,
  inputRef,
}: ContextUriFieldProps) {
  return (
    <>
      {errorText ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{errorText}</AlertDescription>
        </Alert>
      ) : null}
      <Field data-invalid={hasError}>
        <FieldLabel>Context URI *</FieldLabel>
        <UIInput type="text" {...field} ref={inputRef} readOnly={!isCreate} />
        <FieldError>{errorMessage}</FieldError>
      </Field>
    </>
  );
}
