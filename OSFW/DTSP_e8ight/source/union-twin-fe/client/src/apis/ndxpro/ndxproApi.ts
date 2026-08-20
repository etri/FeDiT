import { ndxproClient } from '@/apis/client';
import { NDXPRO_API } from '@/apis/config';

import type { FdtTourResponse } from '@/apis/ndxpro/ndxpro.types';
import type { AxiosRequestConfig } from 'axios';

export const getFdtTourData = async (
  federatedDigitalObjectId: string,
  secretKey: string,
  measurePositionId?: string,
): Promise<FdtTourResponse> => {
  const { data } = await ndxproClient.get('/api/viewer/fdt/tour/load', {
    params: {
      federated_digital_object_id: federatedDigitalObjectId,
      secret_key: secretKey,
      measure_position_id: measurePositionId,
    },
  });
  return data;
};

export const getLogicalFilesUFID = async (filename: string) => {
  const { data } = await ndxproClient.get(
    `${NDXPRO_API}/file-service/logical-files`,
    {
      params: { filename },
    },
  );
  return data;
};

export const getDownloadFiles = async (
  ufid: string,
  config: AxiosRequestConfig = {},
) => {
  const { data } = await ndxproClient.get(
    `${NDXPRO_API}/file-service/files/${ufid}`,
    {
      ...config,
      responseType: 'blob',
    },
  );
  return data;
};
