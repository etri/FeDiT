export interface FormData {
  reqIdentifier: string;
  callBackURL: string;
  trckProcInfo: TrckProcInfo[];
}

export interface TrckProcInfo {
  trckTp: 'DTP' | 'ETP';
  trckPrcIdtifier: string;
  federatedTwinId: string;
  federatedDigitalObjectId: string;
  digitalTwinId: string;
  digitalObjId: string;
  trckTopic: string;
  trckValInfo: TrckValInfo;
  evntDelay: number | null;
  bufferSize: number | null;
  dtFltTp: string;
  evntCondition: EvntCondition;
  evntOccrCnt: number;
  evntEndDt: EvntEndDt;
}

interface TrckValInfo {
  digitalObjectPath: string;
  objValType: string;
}

interface EvntCondition {
  checkable: boolean;
  type?: string;
  expression?: Expression;
}

interface Expression {
  ctrlStatement: string;
}

export interface EvntEndDt {
  INTERVAL: 'SECONDS' | 'MINUTES' | 'HOURS' | 'DAYS' | '';
  VALUE: number;
}
