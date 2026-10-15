import 'server-only';

import { connection } from 'next/server';

import type { RuntimeConfig } from '@/lib/runtime-config.types';

const DEFAULT_BROKER_PORT = '54011';
const DEFAULT_MANAGER_PORT = '54008';
const DEFAULT_FDT_SYNC_KAFKA_PORT = '9092';

function withPort(url: string | undefined, port: string) {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    parsed.port = port;
    parsed.pathname = '';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return undefined;
  }
}

function hostOf(url: string | undefined) {
  if (!url) return undefined;
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

function trimSlash(value: string | undefined) {
  return value?.trim().replace(/\/$/, '') || undefined;
}

export async function getRuntimeConfig(): Promise<RuntimeConfig> {
  await connection();
  const gateway = trimSlash(process.env.NDXPRO_API_URL);
  const brokerUrl =
    trimSlash(process.env.NDXPRO_BROKER_URL) ??
    withPort(gateway, DEFAULT_BROKER_PORT) ??
    '';
  const managerUrl =
    trimSlash(process.env.NDXPRO_MANAGER_URL) ??
    withPort(gateway, DEFAULT_MANAGER_PORT) ??
    '';
  const fdtSyncHost = hostOf(process.env.FDT_SYNC_API_URL);
  const fdtSyncKafkaUrl =
    process.env.FDT_SYNC_KAFKA_URL?.trim() ||
    (fdtSyncHost ? `${fdtSyncHost}:${DEFAULT_FDT_SYNC_KAFKA_PORT}` : '');

  const viewerAppUrl = process.env.VIEWER_APP_URL?.trim() || '';
  const predictorUrl = trimSlash(process.env.PREDICTOR_URL) ?? '';

  return { brokerUrl, managerUrl, fdtSyncKafkaUrl, viewerAppUrl, predictorUrl };
}
