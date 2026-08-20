export const FIELD_CONFIGS = {
  reqIdentifier: {
    label: 'Request Identifier',
    description: '트래킹 명령 요청 식별자',
    placeholder: 'RQ-987',
  },
  callBackURL: {
    label: 'Callback URL',
    description: '트래킹 이벤트 수신을 위한 응답 받을 URL',
    placeholder: 'https://your-callback-url.com',
  },
  federatedTwinId: {
    label: 'Federated Twin ID',
    description: '연합 디지털트윈 식별자',
    placeholder: 'KR-02-K10000-20240000',
    required: true,
  },
  federatedDigitalObjectId: {
    label: 'Federated Digital Object ID',
    description: '연합 디지털트윈 디지털객체 ID',
    placeholder: 'F-KR-104111-0011',
    required: true,
  },
  digitalTwinId: {
    label: 'Digital Twin ID',
    description: '단일 디지털 트윈 ID',
    placeholder: 'KR-109941-0004',
    required: true,
  },
  digitalObjId: {
    label: 'Digital Object ID',
    description: '트래킹 요청할 디지털객체 ID',
    placeholder: 'KR-109941-0004',
    required: true,
  },
  trckTopic: {
    label: 'Track Topic',
    description: '트래킹 프로세스 별 인터페이스 할 Topic',
    placeholder: 'FDO_F-KR-104111-0011',
    required: true,
  },
  evntDelay: {
    label: 'Event Delay (ms)',
    description: 'Tracking 발생 주기',
    placeholder: '30000',
    required: true,
  },
  bufferSize: {
    label: 'Buffer Size',
    description: '1차 필터에 적용할 버퍼의 사이즈',
    placeholder: '100',
    required: true,
  },
  dtFltTp: {
    label: 'Data Filter Type',
    description: '데이터 필터 타입',
    required: true,
  },
  evntOccrCnt: {
    label: 'Event Occur Count',
    description: '-1일 경우 미 적용, default: 100',
  },
} as const;

export const SELECT_OPTIONS = {
  trackingType: [
    {
      value: 'DTP',
      label: 'DTP (Data Tracking Process)',
    },
    {
      value: 'ETP',
      label: 'ETP (Event Tracking Process)',
    },
  ],
  dataFilterType: [
    { value: '', label: 'Select a data filter type', disabled: true },
    { value: 'DF01', label: 'DF01 (min)' },
    { value: 'DF02', label: 'DF02 (max)' },
    { value: 'DF03', label: 'DF03 (average)' },
    { value: 'DF04', label: 'DF04 (sum)' },
    { value: 'DF05', label: 'DF05 (stdevp)' },
  ],
  eventEndInterval: [
    { value: '', label: 'Select Interval', disabled: true },
    { value: 'SECONDS', label: 'SECONDS' },
    { value: 'MINUTES', label: 'MINUTES' },
    { value: 'HOURS', label: 'HOURS' },
    { value: 'DAYS', label: 'DAYS' },
  ],
} as const;
