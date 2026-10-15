export const VALUE_TYPES = [
  'String',
  'Integer',
  'Double',
  'Boolean',
  'Date',
  'Object',
  'ArrayString',
  'ArrayDouble',
] as const;

export const FEDERATED_REQUIRED_ATTRIBUTES: Record<
  string,
  { valueType: 'String' | 'Object'; description?: string }
> = {
  owner: {
    valueType: 'String',
    description: '디지털 객체 소유자에 대한 정보',
  },
  creator: {
    valueType: 'String',
    description: '디지털 객체 리소스 생성자에 대한 정보',
  },
  keywords: {
    valueType: 'String',
    description: '디지털 객체 검색을 위한 키워드',
  },
  contactPoint: {
    valueType: 'String',
    description: '디지털 객체 소유자의 연락정보',
  },
  modifiedAt: {
    valueType: 'String',
    description: '디지털 객체 리소스 수정 시간',
  },
  subject: {
    valueType: 'String',
    description: '디지털 객체 검색을 위한 주제어',
  },
  federatedOri: {
    valueType: 'Object',
    description: '연합 디지털 객체 기준 위치 정보',
  },
  description: { valueType: 'String', description: '설명' },
  createdAt: {
    valueType: 'String',
    description: '디지털 객체 리소스 생성 시간',
  },
  name: { valueType: 'String' },
  federatedAt: {
    valueType: 'String',
    description: '연합 디지털 객체 연합시점에 대한 정보',
  },
};
