import { isValid } from '@/app/(app)/tracking/_utils/tracking-process-validation';

import type {
  FormData,
  TrckProcInfo,
} from '@/app/(app)/tracking/_types/trackingProcessForm';

const mapProcessToPayload = (process: TrckProcInfo) => {
  const commonFields = {
    trckTp: process.trckTp,
    trckPrcIdtifier: process.trckPrcIdtifier,
    evntOccrCnt: process.evntOccrCnt,
    evntEndDt: process.evntEndDt,
    evntCondition: process.evntCondition,
  };

  const hasLatencyValue =
    process.evntDelay !== null && process.evntDelay !== undefined;
  const hasBufferedValue =
    process.bufferSize !== null && process.bufferSize !== undefined;

  if (process.trckTp !== 'DTP') {
    return {
      ...commonFields,
      ...(hasLatencyValue && { evntDelay: process.evntDelay }),
      ...(hasBufferedValue && { bufferSize: process.bufferSize }),
    };
  }

  const shouldIncludeTrackingValue =
    isValid(process.trckValInfo?.digitalObjectPath) &&
    isValid(process.trckValInfo?.objValType);

  return {
    ...commonFields,
    ...(isValid(process.federatedTwinId) && {
      federatedTwinId: process.federatedTwinId,
    }),
    ...(isValid(process.federatedDigitalObjectId) && {
      federatedDigitalObjectId: process.federatedDigitalObjectId,
    }),
    ...(isValid(process.digitalTwinId) && {
      digitalTwinId: process.digitalTwinId,
    }),
    ...(isValid(process.digitalObjId) && {
      digitalObjId: process.digitalObjId,
    }),
    ...(isValid(process.trckTopic) && { trckTopic: process.trckTopic }),
    ...(shouldIncludeTrackingValue && {
      trckValInfo: {
        digitalObjectPath: process.trckValInfo?.digitalObjectPath ?? '',
        objValType: process.trckValInfo?.objValType ?? '',
      },
    }),
    ...(hasLatencyValue && { evntDelay: process.evntDelay }),
    ...(hasBufferedValue && { bufferSize: process.bufferSize }),
    ...(isValid(process.dtFltTp) && { dtFltTp: process.dtFltTp }),
  };
};

type TrackingProcessPayload = ReturnType<typeof mapProcessToPayload>;

interface TrackingCommandPayload {
  reqIdentifier: FormData['reqIdentifier'];
  callBackURL: FormData['callBackURL'];
  trckProcInfo: TrackingProcessPayload[];
}

export const createTrackingCommandPayload = (
  formData: FormData,
): TrackingCommandPayload => ({
  reqIdentifier: formData.reqIdentifier,
  callBackURL: formData.callBackURL,
  trckProcInfo: formData.trckProcInfo.map(mapProcessToPayload),
});
