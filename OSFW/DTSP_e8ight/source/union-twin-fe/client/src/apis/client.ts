import axios from 'axios';

import type { ApiError } from '@/types/error';
import type { AxiosError, AxiosInstance } from 'axios';

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _authRetried?: boolean;
  }
}

const HEADERS = {
  'Content-Type': 'application/json;charset=UTF-8',
  Accept: 'application/json',
} as const;

export const ndxproClient = axios.create({ headers: HEADERS });

export const bffClient = axios.create({ headers: HEADERS });

const AUTH_PATHS = [
  '/api/auth/logout',
  '/api/auth/refresh',
  '/api/auth/register',
];

let refreshPromise: Promise<boolean> | null = null;

function refreshOnce(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch('/api/auth/refresh', { method: 'POST' })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function authRetryInterceptor(instance: AxiosInstance) {
  return async (error: AxiosError<Partial<ApiError>>) => {
    const detail = error.response?.data?.detail;
    if (detail) error.message = detail;

    const config = error.config;
    const url: string = config?.url ?? '';

    const shouldRetry =
      error.response?.status === 401 &&
      config &&
      !config._authRetried &&
      !AUTH_PATHS.some((p) => url.startsWith(p));

    if (!shouldRetry) throw error;

    config._authRetried = true;
    if (await refreshOnce()) {
      return instance(config);
    }

    if (typeof window !== 'undefined') {
      window.location.href = '/signin';
    }
    throw error;
  };
}

ndxproClient.interceptors.response.use(
  (response) => response,
  authRetryInterceptor(ndxproClient),
);

bffClient.interceptors.response.use(
  (response) => response,
  authRetryInterceptor(bffClient),
);
