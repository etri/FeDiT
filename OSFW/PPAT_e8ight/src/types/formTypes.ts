import type { FieldErrors, FieldValues } from 'react-hook-form';

// Form ref interface for accessing form data and validation
// Used by forms in ProjectPanel
// Now with proper TypeScript generics for type safety
export interface FormRef<TFormData extends FieldValues = FieldValues> {
  getData: () => TFormData;
  validate: () => Promise<boolean>;
  getErrors?: () => FieldErrors<TFormData>;
  getTouchedFields?: () => Partial<Record<keyof TFormData, boolean>>;
  setData?: (data: Partial<TFormData>) => void;
}
