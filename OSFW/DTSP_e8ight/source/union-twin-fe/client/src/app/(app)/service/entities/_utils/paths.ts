export function entityPath(
  contextId: string,
  modelId: string,
  entityId: string,
) {
  return `/service/entities/${encodeURIComponent(contextId)}/${modelId}/${encodeURIComponent(entityId)}`;
}

export function entityHistoryPath(
  contextId: string,
  modelId: string,
  entityId: string,
  historyId: string,
) {
  return `${entityPath(contextId, modelId, entityId)}/${historyId}`;
}
