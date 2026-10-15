import type { HTMLAttributeReferrerPolicy } from 'react';

export type EmbeddedAppId =
  | 'viewer'
  | 'demo'
  | 'docsJeju'
  | 'docsDataModel'
  | 'docsEntity'
  | 'docsVizwide'
  | 'metadataSearch'
  | 'metadataRegistration'
  | 'metadataGraph'
  | 'syncEngine'
  | 'verification'
  | 'serviceLogic'
  | 'predictor'
  | 'simulation'
  | 'dataTracking'
  | 'dataTrackingList';

export interface EmbeddedAppConfig {
  url: string;
  origin: string;
  sandbox: string;
  allow?: string;
  referrerPolicy: HTMLAttributeReferrerPolicy;
  errorTitle?: string;
  errorMessage?: string;
}

interface DigitalTwinObjectData {
  contextURL?: string;
  updateInterval?: number;
  dataAccessURL?: string;
  schemaInformation?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface DigitalTwinObjectPayload {
  dtoid: string;
  name: string;
  description?: string;
  digitalTwinId?: string;
  digitalTwinObjectData?: DigitalTwinObjectData;
  [key: string]: unknown;
}
