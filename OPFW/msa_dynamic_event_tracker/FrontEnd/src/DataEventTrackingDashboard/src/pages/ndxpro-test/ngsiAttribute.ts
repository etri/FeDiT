const RESERVED = new Set(['id', 'type', '@context'])

export interface NgsiAttributeRow {
    path: string
    group: string | null
    leaf: string
    timeproperty: string
    observedAt?: string
    hasObservedAt: boolean
    value: unknown
    ngsiType: string
    schemaValueType?: string
}

export interface SchemaAttributes {
    [name: string]: { valueType?: string } | undefined
}

export type AttributeSource = 'schema' | 'entity'

export function deriveAttributes(
    entity: Record<string, unknown>,
    schema?: SchemaAttributes,
    observation?: string[]
): NgsiAttributeRow[] {
    const rows: NgsiAttributeRow[] = []

    for (const [key, raw] of Object.entries(entity)) {
        if (RESERVED.has(key) || raw === null || typeof raw !== 'object') continue
        if (observation && !observation.includes(key)) continue

        const node = raw as {
            type?: string
            value?: unknown
            object?: unknown
            observedAt?: string
        }
        const hasObservedAt = node.observedAt != null
        const value = node.type === 'Relationship' ? node.object : node.value
        const isGroup =
            value !== null && typeof value === 'object' && !Array.isArray(value)

        if (isGroup) {
            for (const [leaf, leafValue] of Object.entries(
                value as Record<string, unknown>
            )) {
                rows.push({
                    path: `${key}..${leaf}`,
                    group: key,
                    leaf,
                    timeproperty: `${key}.observedAt`,
                    observedAt: node.observedAt,
                    hasObservedAt,
                    value: leafValue,
                    ngsiType: node.type ?? '-',
                })
            }
        } else {
            rows.push({
                path: key,
                group: null,
                leaf: key,
                timeproperty: `${key}.observedAt`,
                observedAt: node.observedAt,
                hasObservedAt,
                value,
                ngsiType: node.type ?? '-',
                schemaValueType: schema?.[key]?.valueType,
            })
        }
    }

    return rows
}

export function splitFederatedId(
    entityId: string,
    observation?: string[]
): { objectId: string; attribute: string } | null {
    if (!observation?.length) return null
    const last = entityId.split(':').pop() ?? ''
    const i = last.lastIndexOf('-')
    if (i < 0) return null
    const attribute = last.slice(i + 1)
    if (!observation.includes(attribute)) return null
    return { objectId: last.slice(0, i), attribute }
}

export function extractValue(
    entity: Record<string, unknown>,
    path: string
): unknown {
    const [root, ...rest] = path.split('..')
    let cur: unknown = (entity[root] as { value?: unknown } | undefined)?.value
    for (const seg of rest) {
        if (cur === null || cur === undefined) return undefined
        cur = (cur as Record<string, unknown>)[seg]
    }
    return cur
}

export function deriveType(entityId: string): string {
    return entityId.split(':')[2] ?? ''
}

export function deriveTimeprop(path: string): string {
    return `${path.split('..')[0]}.observedAt`
}

export function inferType(value: unknown): string {
    if (typeof value === 'number') return 'Double'
    if (typeof value === 'boolean') return 'Boolean'
    if (typeof value === 'string') return 'String'
    return ''
}

const SELECTABLE = new Set([
    'Boolean',
    'Integer',
    'Long',
    'Float',
    'Double',
    'String',
])
function normalize(valueType: string): string {
    const t = valueType.charAt(0).toUpperCase() + valueType.slice(1).toLowerCase()
    if (SELECTABLE.has(t)) return t
    if (t === 'Int') return 'Integer'
    if (t === 'Bool') return 'Boolean'
    if (t === 'Number') return 'Double'
    if (t === 'Date' || t === 'Datetime') return 'String'
    return ''
}

export function previewValueType(row: NgsiAttributeRow): {
    type: string
    source: 'schema' | 'inferred' | ''
} {
    if (row.schemaValueType) {
        const t = normalize(row.schemaValueType)
        if (t) return { type: t, source: 'schema' }
    }
    const inferred = inferType(row.value)
    return inferred
        ? { type: inferred, source: 'inferred' }
        : { type: '', source: '' }
}
