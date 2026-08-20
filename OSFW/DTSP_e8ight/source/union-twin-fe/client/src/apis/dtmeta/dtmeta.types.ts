export interface FederatedTwin {
  dtid: string;
  type: string;
  name: string;
  description?: string;
  countryCode?: string;
  classificationTypeCode?: string;
  classificationCode?: string;
  federatedDigitalTwinObjects?: FederatedDigitalTwinObject[];
}

export interface DtmetaResponse {
  responseCode: number;
  responseMsg: string;
}

export interface FederatedTwinSearchResponse extends DtmetaResponse {
  responseData: FederatedTwin[];
}

export interface FederatedDigitalTwinObject {
  dtoid?: string;
  name: string;
  subjects?: string[] | null;
  description: string;
  creationTime?: string | null;
  countryCode: string;
  objectPrimaryClassificationCode: string;
  objectSecondaryClassificationCode: string;
  relatedDigitalTwinObjects?: string[] | null;
  digitalTwinObjectData?:
    | ({
        schemaInformation?: {
          type?: string;
          properties?: Record<string, unknown>;
        };
        dataAccessURL?: string;
      } & Record<string, unknown>)
    | null;
}

export interface FederatedTwinPutResponse extends DtmetaResponse {
  responseData?: {
    dtid?: string;
    etcInfo?: {
      outputData?: {
        relatedIds?: { federatedDigitalTwinObjects?: string[] };
      };
    }[];
  }[];
}

export interface CreateFederatedTwinObjectPayload {
  federatedTwinId: string;
  federatedDigitalTwinObjects: FederatedDigitalTwinObject[];
}

export interface UpdateFederatedTwinObjectSchemaPayload {
  federatedTwinId: string;
  federatedDigitalTwinObjects: {
    dtoid: string;
    digitalTwinObjectData: NonNullable<
      FederatedDigitalTwinObject['digitalTwinObjectData']
    >;
  }[];
}
