import type {
  FormData,
  TrckProcInfo,
} from '@/app/(app)/tracking/_types/trackingProcessForm';

type TrackingFieldErrors = Record<string, boolean>;

export const isValid = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (typeof value === 'number') {
    return !Number.isNaN(value);
  }
  return true;
};

const validateProcess = (
  process: TrckProcInfo,
  index: number,
): TrackingFieldErrors => {
  const errors: TrackingFieldErrors = {};
  const isDtp = process.trckTp === 'DTP';

  ['trckTp', 'trckPrcIdtifier', 'evntOccrCnt'].forEach((field) => {
    if (!isValid(process[field as keyof TrckProcInfo])) {
      errors[`${field}-${index}`] = true;
    }
  });

  if (!isValid(process.evntCondition?.type)) {
    errors[`evntCondition.type-${index}`] = true;
  }
  if (!isValid(process.evntCondition?.expression?.ctrlStatement)) {
    errors[`evntCondition.expression.ctrlStatement-${index}`] = true;
  }
  if (!isValid(process.evntEndDt?.VALUE)) {
    errors[`evntEndDt.VALUE-${index}`] = true;
  }
  if (!isValid(process.evntEndDt?.INTERVAL)) {
    errors[`evntEndDt.INTERVAL-${index}`] = true;
  }

  if (isDtp) {
    [
      'federatedTwinId',
      'federatedDigitalObjectId',
      'digitalTwinId',
      'digitalObjId',
      'trckTopic',
      'evntDelay',
      'bufferSize',
      'dtFltTp',
    ].forEach((field) => {
      if (!isValid(process[field as keyof TrckProcInfo])) {
        errors[`${field}-${index}`] = true;
      }
    });
    if (!isValid(process.trckValInfo?.digitalObjectPath)) {
      errors[`trckValInfo.digitalObjectPath-${index}`] = true;
    }
    if (!isValid(process.trckValInfo?.objValType)) {
      errors[`trckValInfo.objValType-${index}`] = true;
    }
  }

  return errors;
};

export const collectTrackingFormErrors = (
  formData: FormData,
): TrackingFieldErrors => {
  const errors: TrackingFieldErrors = {};

  if (!isValid(formData.reqIdentifier)) {
    errors.reqIdentifier = true;
  }
  if (!isValid(formData.callBackURL)) {
    errors.callBackURL = true;
  }

  formData.trckProcInfo.forEach((process, index) => {
    Object.assign(errors, validateProcess(process, index));
  });

  return errors;
};
