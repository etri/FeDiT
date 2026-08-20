import type {
  CriteriaInfoTypeList,
  EntitySearchInfoType,
} from '@/apis/entity/entity.types';

export interface EntityTabType {
  title: string;
  subTitle?: string;
  contextId: string;
  modelId: string;
  entityId: string;
  historyId?: string;
  detailId: string;
  searchInfo: EntitySearchInfoType;
}

export interface ModelInfoReturnTypeForEntity {
  isDynamic: boolean;
  timePropertyList: string[];
  searchCriteriaInfoList: CriteriaInfoTypeList;
}
