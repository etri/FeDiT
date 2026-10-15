const MODEL_TYPE_FROM_DTOID = /^([A-Z]{2})(\d{6})(\d{4})$/;

export function modelTypeToDtoid(modelType: string) {
  const match = MODEL_TYPE_FROM_DTOID.exec(modelType);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

export function entityAccessUrl(
  brokerUrl: string,
  modelType: string,
  dtoid: string,
) {
  return `${brokerUrl}/ndxpro/v1/broker/entities?id=urn:ngsi-ld:${modelType}:${dtoid}`;
}
