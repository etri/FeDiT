import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'

const BASE_URL = ''
const MANAGER = `${BASE_URL}/ndxpro/v1/manager`
const SERVICE = `${BASE_URL}/ndxpro/v1/service`

const TOKEN: string = import.meta.env.VITE_NDXPRO_TOKEN ?? ''

if (!TOKEN) {
    console.warn(
        '[NDXPro] VITE_NDXPRO_TOKEN 이 없습니다. .env.local 에 토큰을 넣어주세요.'
    )
}

function auth(): AxiosRequestConfig {
    return { headers: { Authorization: `Bearer ${TOKEN}` } }
}

function withLink(contextUrl: string): AxiosRequestConfig {
    return {
        headers: {
            Authorization: `Bearer ${TOKEN}`,
            Link: `<${contextUrl}>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"`,
        },
    }
}

export async function fetchContexts(): Promise<string[]> {
    const res = await axios.get(`${MANAGER}/contexts`, auth())
    return Array.isArray(res.data) ? res.data : []
}

export async function fetchContext(
    contextUrl: string
): Promise<Record<string, string>> {
    const res = await axios.get(`${MANAGER}/context`, {
        ...auth(),
        params: { contextUrl },
    })
    return res.data?.['@context'] ?? {}
}

export function extractModels(context: Record<string, string>): string[] {
    return Object.entries(context)
        .filter(
            ([key, iri]) =>
                /^[A-Z]/.test(key) &&
                typeof iri === 'string' &&
                iri.startsWith('https://uri.etsi.org/ngsi-ld/')
        )
        .map(([key]) => key)
}

export interface DataModelAttribute {
    type?: string
    valueType?: string
}

export interface DataModel {
    id: string
    type: string
    version?: string
    isDynamic?: boolean
    isReady?: boolean
    attributes?: Record<string, DataModelAttribute>
    observation?: string[]
}

export interface DataModelRef {
    id: string
    type: string
    version?: string
    isReady?: boolean
}

export async function fetchDataModels(): Promise<DataModelRef[]> {
    const res = await axios.get(`${MANAGER}/data-models`, {
        ...auth(),
        params: { limit: 1000 },
    })
    return Array.isArray(res.data?.data) ? res.data.data : []
}

export async function fetchDataModel(
    modelType: string
): Promise<DataModel | null> {
    try {
        const res = await axios.get(
            `${MANAGER}/data-models/${encodeURIComponent(modelType)}`,
            auth()
        )
        return res.data
    } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) return null
        throw err
    }
}

export async function filterModelsWithData(
    candidates: string[],
    contextUrl: string
): Promise<string[]> {
    const checked = await Promise.all(
        candidates.map(async (type) => {
            try {
                const res = await axios.get(`${SERVICE}/entities/iot`, {
                    ...withLink(contextUrl),
                    params: { type, offset: 0, limit: 1 },
                })
                return { type, count: res.data?.totalData ?? 0 }
            } catch {
                return { type, count: 0 }
            }
        })
    )
    return checked.filter((m) => m.count > 0).map((m) => m.type)
}

export interface EntityRef {
    entityId: string
    provider: string
}

export interface EntityListResponse {
    context: string | null
    model: string
    totalPage: number
    totalData: number
    entities: EntityRef[]
}

export async function fetchEntities(params: {
    modelType: string
    contextUrl: string
    isDynamic: boolean
    offset?: number
    limit?: number
    q?: string
}): Promise<EntityListResponse> {
    const {
        modelType,
        contextUrl,
        isDynamic,
        offset = 0,
        limit = 50,
        q,
    } = params
    void isDynamic
    const url = `${SERVICE}/entities/iot`
    const res = await axios.get(url, {
        ...withLink(contextUrl),
        params: { type: modelType, offset, limit, ...(q ? { q } : {}) },
    })
    return res.data
}

export interface NgsiProperty {
    type: string
    value?: unknown
    object?: unknown
    observedAt?: string
    unitCode?: string
}

export interface EntityResponse {
    provider: string
    entity: Record<string, unknown> & {
        id: string
        type: string
        '@context': string
    }
}

export async function fetchEntity(params: {
    entityId: string
    contextUrl: string
    isDynamic: boolean
}): Promise<EntityResponse> {
    const { entityId, contextUrl, isDynamic } = params
    void isDynamic
    const res = await axios.get(
        `${SERVICE}/entities/iot/${entityId}`,
        withLink(contextUrl)
    )
    return res.data
}

export interface HistoryRef {
    historyId: string
    entityId: string
    observedAt: string
    provider: string
}

export interface HistoryListResponse {
    context: string | null
    timeproperty: string
    totalPage: number
    totalData: number
    entityHistoryList: HistoryRef[]
}

export async function fetchHistories(params: {
    entityId: string
    contextUrl: string
    timeproperty: string
    time?: string
    endTime?: string
    limit?: number
}): Promise<HistoryListResponse> {
    const { entityId, contextUrl, timeproperty, time, endTime, limit = 50 } =
        params
    const period = time && endTime ? { timerel: 'between', time, endTime } : {}
    const res = await axios.get(`${SERVICE}/entities/iot/history`, {
        ...withLink(contextUrl),
        params: { entityId, timeproperty, ...period, offset: 0, limit },
    })
    return res.data
}

export interface HistoryResponse {
    historyId: string
    timeproperty: string
    observedAt: string
    provider: string
    entity: Record<string, unknown> & {
        id: string
        type: string
        '@context': string
    }
}

export async function fetchHistory(params: {
    historyId: string
    timeproperty: string
}): Promise<HistoryResponse> {
    const { historyId, timeproperty } = params
    const res = await axios.get(
        `${SERVICE}/entities/iot/history/${historyId}`,
        { ...auth(), params: { timeproperty } }
    )
    return res.data
}

export function toEntityId(modelType: string, objectId: string): string {
    return `urn:ngsi-ld:${modelType}:${objectId}`
}

export function toObjectId(entityId: string): string {
    const parts = entityId.split(':')
    return parts[parts.length - 1] ?? ''
}
