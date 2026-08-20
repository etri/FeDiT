export interface ContextModel {
  type: string;
  title: string;
}

export interface CreateContextPayload {
  url: string;
  version: string;
  defaultUrl: string;
  '@context': Record<string, string>;
}

export interface ContextVersion {
  url: string;
  version?: string;
}
