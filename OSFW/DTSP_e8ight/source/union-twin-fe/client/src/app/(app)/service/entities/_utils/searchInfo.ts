import { convertDateTimeLocalFormat, subtractMonth } from '@/lib/date';

import type {
  EntitySearchInfoType,
  ObservedTimeInfoType,
  SearchCriteriaInfoType,
  ValueType,
} from '@/apis/entity';

export function createEmptyCriteriaInfo(): SearchCriteriaInfoType {
  return {
    criteria: '',
    valueType: '',
    value: '',
  };
}

export function createEmptyObservedTimeInfo(): ObservedTimeInfoType {
  return {
    property: '',
    startTime: '',
    endTime: '',
    timerel: undefined,
    value: '',
    valueType: '',
  };
}

export function createDefaultObservedTimeInfo(
  property: string,
  valueType: ValueType,
): ObservedTimeInfoType {
  return {
    property,
    valueType,
    startTime: convertDateTimeLocalFormat(subtractMonth(new Date(), 2)),
    endTime: convertDateTimeLocalFormat(new Date()),
    timerel: 'between',
    value: '',
  };
}

export function createInitialEntitySearchInfo(): EntitySearchInfoType {
  return {
    observedTimeInfo: undefined,
    criteriaInfoList: [createEmptyCriteriaInfo()],
  };
}

export const INIT_ENTITY_SEARCH_INFO = createInitialEntitySearchInfo();
