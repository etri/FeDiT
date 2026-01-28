import { forwardRef, useImperativeHandle } from 'react';
import { useForm, Controller } from 'react-hook-form';
import useProjectStore from '../../../stores/projectStore';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { classNames } from 'primereact/utils';
import type { FormRef } from '../../../types/formTypes';

interface GeneralFormData {
  projectName: string;
  description: string;
  projectType: string | null;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
}

const GeneralForm = forwardRef<FormRef<GeneralFormData>>((_props, ref) => {
  // Get project data from Zustand store
  const { projectName } = useProjectStore();
  
  const {
    control,
    formState: { errors, touchedFields },
    watch,
    getValues,
    trigger
  } = useForm<GeneralFormData>({
    defaultValues: {
      projectName: projectName || '',
      description: '',
      projectType: null,
      startDate: null,
      endDate: null,
      status: 'active'
    }
  });

  const startDate = watch('startDate');

  const projectTypes = [
    { label: 'Dredged LBM', value: 'dredged-lbm' }
  ];

  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'On Hold', value: 'on-hold' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' }
  ];

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    getData: () => {
      return getValues();
    },
    validate: async () => {
      const result = await trigger();
      return result;
    },
    getErrors: () => errors,
    getTouchedFields: () => touchedFields
  }));

  const getFormErrorMessage = (fieldName: keyof GeneralFormData) => {
    return errors[fieldName] ? (
      <small className="p-error">{errors[fieldName]?.message}</small>
    ) : (
      <small className="p-error">&nbsp;</small>
    );
  };

  return (
    <form className="p-fluid">
      <div className="field">
        <label htmlFor="projectName" className={classNames({ 'p-error': errors.projectName })}>
          Project Name *
        </label>
        <Controller
          name="projectName"
          control={control}
          rules={{ 
            required: 'Project name is required',
            minLength: {
              value: 3,
              message: 'Project name must be at least 3 characters'
            }
          }}
          render={({ field, fieldState }) => (
            <InputText
              id={field.name}
              {...field}
              className={classNames({ 'p-invalid': fieldState.error })}
            />
          )}
        />
        {getFormErrorMessage('projectName')}
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <Controller
          name="description"
          control={control}
          render={({ field, fieldState }) => (
            <InputTextarea
              id={field.name}
              {...field}
              rows={4}
              className={classNames({ 'p-invalid': fieldState.error })}
            />
          )}
        />
      </div>

      <div className="field">
        <label htmlFor="projectType">Project Type</label>
        <Controller
          name="projectType"
          control={control}
          render={({ field }) => (
            <Dropdown
              id={field.name}
              value={field.value}
              onChange={(e) => field.onChange(e.value)}
              onBlur={field.onBlur}
              options={projectTypes}
              placeholder="Select a project type"
            />
          )}
        />
      </div>

      <div className="grid">
        <div className="col-6">
          <div className="field">
            <label htmlFor="startDate">Start Date</label>
            <Controller
              name="startDate"
              control={control}
              render={({ field, fieldState }) => (
                <Calendar
                  id={field.name}
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  onBlur={field.onBlur}
                  showIcon
                  dateFormat="yy-mm-dd"
                  className={classNames({ 'p-invalid': fieldState.error })}
                  placeholder="Select start date"
                />
              )}
            />
            {getFormErrorMessage('startDate')}
          </div>
        </div>
        <div className="col-6">
          <div className="field">
            <label htmlFor="endDate">End Date</label>
            <Controller
              name="endDate"
              control={control}
              rules={{
                validate: (value) => {
                  if (value && startDate && value < startDate) {
                    return 'End date must be after start date';
                  }
                  return true;
                }
              }}
              render={({ field, fieldState }) => (
                <Calendar
                  id={field.name}
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  onBlur={field.onBlur}
                  showIcon
                  dateFormat="yy-mm-dd"
                  minDate={startDate || undefined}
                  className={classNames({ 'p-invalid': fieldState.error })}
                  placeholder="Select end date"
                />
              )}
            />
            {getFormErrorMessage('endDate')}
          </div>
        </div>
      </div>

      <div className="field">
        <label htmlFor="status">Status</label>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Dropdown
              id={field.name}
              value={field.value}
              onChange={(e) => field.onChange(e.value)}
              onBlur={field.onBlur}
              options={statusOptions}
            />
          )}
        />
      </div>
    </form>
  );
});

GeneralForm.displayName = 'GeneralForm';

export default GeneralForm;
