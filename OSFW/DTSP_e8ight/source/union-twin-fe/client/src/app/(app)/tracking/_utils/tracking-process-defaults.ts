import type {
  EvntEndDt,
  FormData,
  TrckProcInfo,
} from '@/app/(app)/tracking/_types/trackingProcessForm';

const DEFAULT_EVENT_END_INTERVAL: EvntEndDt['INTERVAL'] = 'HOURS';
const DEFAULT_EVENT_END_VALUE = 1;
const DEFAULT_PROCESS_TYPE: TrckProcInfo['trckTp'] = 'DTP';

const createDefaultEventTermination = (): EvntEndDt => ({
  INTERVAL: DEFAULT_EVENT_END_INTERVAL,
  VALUE: DEFAULT_EVENT_END_VALUE,
});

export const createBlankTrackingProcess = (): TrckProcInfo => ({
  trckTp: DEFAULT_PROCESS_TYPE,
  trckPrcIdtifier: '',
  federatedTwinId: '',
  federatedDigitalObjectId: '',
  digitalTwinId: '',
  digitalObjId: '',
  trckTopic: '',
  trckValInfo: { digitalObjectPath: '', objValType: '' },
  evntDelay: null,
  bufferSize: null,
  dtFltTp: '',
  evntCondition: {
    checkable: false,
    type: '',
    expression: { ctrlStatement: '' },
  },
  evntOccrCnt: 100,
  evntEndDt: createDefaultEventTermination(),
});

export const createInitialTrackingForm = (): FormData => ({
  reqIdentifier: '',
  callBackURL: '',
  trckProcInfo: [createBlankTrackingProcess()],
});
