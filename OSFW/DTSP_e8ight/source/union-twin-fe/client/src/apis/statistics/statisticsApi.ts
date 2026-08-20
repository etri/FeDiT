import { ndxproClient } from '@/apis/client';
import { NDXPRO_API } from '@/apis/config';

export interface DateRangeParams {
  startDate: string;
  endDate: string;
  dataModel?: string;
  provider?: string;
}

export interface StatisticsRecord {
  dataModel?: string;
  provider?: string;
  date: string;
  totalEntities: number;
  successEntities: number;
  failEntities: number;
}

interface DateRangeResponse {
  startDate: string;
  endDate: string;
  dataModel?: string;
  provider?: string;
  statistics: StatisticsRecord[];
}

export interface DateParams {
  date: string;
  dataModel?: string;
}

export const getStatisticsByDateWithRange = async (
  param: DateRangeParams | undefined,
): Promise<DateRangeResponse> => {
  const { data } = await ndxproClient.get(
    `${NDXPRO_API}/broker/statistics/date-range`,
    {
      params: param,
    },
  );
  return data;
};

export const getModelStatisticsList = async (param?: DateParams) => {
  const { data } = await ndxproClient.get(
    `${NDXPRO_API}/broker/statistics/model-type`,
    {
      params: param,
    },
  );
  return data;
};

export const getModelStatisticsNameList = async (
  param?: DateParams,
): Promise<string[]> => {
  const { data } = await ndxproClient.get(
    `${NDXPRO_API}/broker/statistics/list/model-type`,
    {
      params: param,
    },
  );
  return data;
};

export const getSourceStatisticsList = async (param?: DateParams) => {
  const { data } = await ndxproClient.get(
    `${NDXPRO_API}/broker/statistics/provider`,
    {
      params: param,
    },
  );
  return data;
};
