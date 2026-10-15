'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

import { Button } from '@e8ight/ui/components/ui/button';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldTitle,
} from '@e8ight/ui/components/ui/field';

import InputRenderer from '@/app/(app)/tracking/_components/InputRenderer';
import TrackingProcessAccordion from '@/app/(app)/tracking/_components/TrackingProcessAccordion';
import { FIELD_CONFIGS } from '@/app/(app)/tracking/_constants/formFieldConfigs';
import {
  createBlankTrackingProcess,
  createInitialTrackingForm,
} from '@/app/(app)/tracking/_utils/tracking-process-defaults';
import { collectTrackingFormErrors } from '@/app/(app)/tracking/_utils/tracking-process-validation';

import type {
  FormData,
  TrckProcInfo,
} from '@/app/(app)/tracking/_types/trackingProcessForm';

function TrackingForm() {
  const [formData, setFormData] = useState<FormData>(createInitialTrackingForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  const rootFields = [
    {
      field: 'reqIdentifier',
      value: formData.reqIdentifier,
      config: FIELD_CONFIGS.reqIdentifier,
    },
    {
      field: 'callBackURL',
      value: formData.callBackURL,
      config: FIELD_CONFIGS.callBackURL,
    },
  ] as const;

  const updateRootField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateProcess = (
    index: number,
    updater: (current: TrckProcInfo) => TrckProcInfo,
  ) => {
    setFormData((prev) => ({
      ...prev,
      trckProcInfo: prev.trckProcInfo.map((process, i) =>
        i === index ? updater(process) : process,
      ),
    }));
  };

  const addProcess = () => {
    setFormData((prev) => ({
      ...prev,
      trckProcInfo: [...prev.trckProcInfo, createBlankTrackingProcess()],
    }));
  };

  const removeProcess = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      trckProcInfo: prev.trckProcInfo.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors(collectTrackingFormErrors(formData));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-border bg-muted/40 mb-4 flex w-full max-w-4xl flex-col gap-5 rounded-xl border p-4 md:p-5"
    >
      <div className="bg-card @container/field-group flex flex-col gap-4 rounded-lg border p-4 md:p-5">
        {rootFields.map(({ field, value, config }) => (
          <Field key={field} orientation="responsive" className="gap-4">
            <FieldContent
              className={'w-full md:w-[300px] md:flex-none md:shrink-0'}
            >
              <FieldTitle className="text-foreground text-sm font-medium">
                {config.label}
                <span className="text-destructive">*</span>
              </FieldTitle>
              <FieldDescription>{config.description}</FieldDescription>
            </FieldContent>
            <div className={'w-full md:min-w-0 md:flex-1'}>
              <InputRenderer
                type="text"
                value={value}
                error={Boolean(fieldErrors[field])}
                onChange={(val) => updateRootField(field, val as string)}
                placeholder={config.placeholder}
              />
            </div>
          </Field>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-foreground text-sm font-bold tracking-[.03em]">
          트래킹 프로세스 정보 (Tracking Process Information)
        </h3>
        <Button
          type="button"
          onClick={addProcess}
          className="w-full sm:ml-auto sm:w-[200px]"
        >
          Add Process
        </Button>
      </div>

      <TrackingProcessAccordion
        processes={formData.trckProcInfo}
        onProcessChange={updateProcess}
        fieldErrors={fieldErrors}
        onRemoveProcess={removeProcess}
      />

      <div className="flex w-full flex-col items-end gap-2">
        <p className="text-muted-foreground text-xs">
          추적 명령 전송 API가 아직 연결되지 않았습니다.
        </p>
        <Button type="submit" disabled className="mt-1 w-[200px]">
          Submit
        </Button>
      </div>
    </form>
  );
}

export default TrackingForm;
