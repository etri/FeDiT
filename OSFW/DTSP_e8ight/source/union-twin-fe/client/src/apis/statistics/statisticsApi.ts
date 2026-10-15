import { ndxproClient } from '@/apis/client';
import { NDXPRO_API } from '@/apis/config';

export interface DateRangeParams {
  startDate: string;
  endDate: string;
  dataModel?: string;
  provider?: string;
}

export interface StatisticsTotals {
  totalEntities: number;
  successEntities: number;
  failEntities: number;
}

export interface StatisticsRecord extends StatisticsTotals {
  dataModel?: string;
  provider?: string;
  date: string;
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

export interface EntityStatisticsParams extends DateParams {
  provider?: string;
}

interface EntityStatisticsResponse {
  date: string;
  dataModel?: string;
  provider?: string;
  statistics: StatisticsTotals | null;
}

export interface MonthParams {
  year: number;
  month: number;
}

export interface FailParams extends EntityStatisticsParams {
  offset?: number;
  limit?: number;
}

export interface FailEntityPage {
  records: FailEntityRecord[];
  totalData: number;
}

export interface FailEntityRecord {
  result?: string;
  cause?: string;
  entity?: {
    _id?: {
      id?: string;
      type?: string;
      servicePath?: string;
    };
    creDate?: string;
    modDate?: string;
  };
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

export const getStatisticsTotal = async (
  param: EntityStatisticsParams,
): Promise<EntityStatisticsResponse> => {
  const { data } = await ndxproClient.get(`${NDXPRO_API}/broker/statistics`, {
    params: param,
  });
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

export const getSourceStatisticsList = async (param?: DateParams) => {
  const { data } = await ndxproClient.get(
    `${NDXPRO_API}/broker/statistics/provider`,
    {
      params: param,
    },
  );
  return data;
};

export const getCollectionDateList = async (
  param: MonthParams,
): Promise<string[]> => {
  const { data } = await ndxproClient.get<string[] | null>(
    `${NDXPRO_API}/broker/statistics/list/date`,
    {
      params: param,
    },
  );
  return data ?? [];
};

export const getFailStatisticsList = async (
  param: FailParams,
): Promise<FailEntityPage> => {
  const { data, headers } = await ndxproClient.get<FailEntityRecord[] | null>(
    `${NDXPRO_API}/broker/statistics/fail`,
    {
      params: { ...param, options: 'count' },
    },
  );
  const records = data ?? [];
  const totalData = Number(headers['totaldata']);

  return {
    records,
    totalData: Math.max(
      records.length,
      Number.isFinite(totalData) ? totalData : 0,
    ),
  };
};
