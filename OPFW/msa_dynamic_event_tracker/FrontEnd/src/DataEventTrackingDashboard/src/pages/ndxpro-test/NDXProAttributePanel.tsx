import { useState } from 'react'
import type { NgsiAttributeRow } from './ngsiAttribute.ts'
import { previewValueType } from './ngsiAttribute.ts'

interface Props {
    rows: NgsiAttributeRow[]
    source?: 'schema' | 'entity' | ''
    selectedPaths: string[]
    onToggle: (row: NgsiAttributeRow) => void
}

function preview(value: unknown): string {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
}

interface Unit {
    name: string
    rows: NgsiAttributeRow[]
    isGroup: boolean
    observedAt?: string
    hasObservedAt: boolean
}

function toUnits(rows: NgsiAttributeRow[]): Unit[] {
    const units = new Map<string, Unit>()
    for (const row of rows) {
        const name = row.group ?? row.leaf
        const unit = units.get(name)
        if (unit) {
            unit.rows.push(row)
        } else {
            units.set(name, {
                name,
                rows: [row],
                isGroup: row.group !== null,
                observedAt: row.observedAt,
                hasObservedAt: row.hasObservedAt,
            })
        }
    }
    return [...units.values()].sort(
        (a, b) => Number(a.isGroup) - Number(b.isGroup)
    )
}

export default function NDXProAttributePanel({
    rows,
    source = '',
    selectedPaths,
    onToggle,
}: Props) {
    const units = toUnits(rows)
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

    const toggleFold = (name: string) =>
        setCollapsed((prev) => {
            const next = new Set(prev)
            if (next.has(name)) next.delete(name)
            else next.add(name)
            return next
        })

    const selectable = rows.filter((r) => r.hasObservedAt).length

    return (
        <section className="min-w-0 rounded-card border border-line">
            <h2 className="border-b border-line px-4 py-3 text-sm font-bold text-gray-800">
                4. Attribute
                <span className="ml-2 font-normal text-muted">
                    {rows.length > 0 && `${selectable}/${rows.length} 선택 가능`}
                </span>
                {selectedPaths.length > 0 && (
                    <span className="ml-2 rounded-control bg-main-soft px-2 py-0.5 text-xs font-normal text-main">
                        {selectedPaths.length}개 선택
                    </span>
                )}
                {source && (
                    <span className="ml-2 rounded-control bg-subtle px-2 py-0.5 text-xs font-normal text-muted">
                        {source === 'schema'
                            ? '모델 스키마(observation)'
                            : '엔티티 본문'}
                    </span>
                )}
            </h2>

            <div className="h-[260px] overflow-y-auto">
                {rows.length === 0 && (
                    <p className="px-4 py-3 text-sm text-muted">
                        엔티티를 먼저 선택하세요.
                    </p>
                )}

                {units.map((unit) => {
                    const blocked = !unit.hasObservedAt
                    const isOpen = !collapsed.has(unit.name)

                    if (!unit.isGroup) {
                        const row = unit.rows[0]
                        const { type, source: typeSource } =
                            previewValueType(row)
                        const checked = selectedPaths.includes(row.path)
                        return (
                            <button
                                key={unit.name}
                                type="button"
                                disabled={blocked}
                                title={
                                    blocked
                                        ? '관측시각(observedAt)이 없어 이력을 조회할 수 없습니다'
                                        : `${row.path}\n${preview(row.value)}`
                                }
                                className={`flex w-full items-center gap-2 border-b border-line px-3 py-2 text-left text-sm ${
                                    blocked
                                        ? 'cursor-not-allowed bg-subtle/50 text-muted'
                                        : checked
                                          ? 'bg-main-soft text-main'
                                          : 'text-gray-700 hover:bg-subtle'
                                }`}
                                onClick={() => onToggle(row)}
                            >
                                <span className="shrink-0">
                                    {blocked ? '▸' : checked ? '☑' : '☐'}
                                </span>
                                <span className="flex-1 truncate font-medium">
                                    {row.leaf}
                                </span>
                                <span className="shrink-0 text-xs text-muted">
                                    {blocked
                                        ? 'observedAt 없음'
                                        : (unit.observedAt ?? '-')}
                                </span>
                                {type && !blocked && (
                                    <span className="shrink-0 text-xs text-muted">
                                        {type}
                                        {typeSource === 'inferred' && '*'}
                                    </span>
                                )}
                            </button>
                        )
                    }

                    return (
                        <div key={unit.name} className="border-b border-line">
                            <button
                                type="button"
                                disabled={blocked}
                                title={
                                    blocked
                                        ? '관측시각(observedAt)이 없어 이력을 조회할 수 없습니다'
                                        : undefined
                                }
                                className={`flex w-full items-center gap-2 px-3 py-2 text-left ${
                                    blocked
                                        ? 'cursor-not-allowed bg-subtle/50 text-muted'
                                        : 'bg-subtle hover:bg-subtle/70'
                                }`}
                                onClick={() => !blocked && toggleFold(unit.name)}
                            >
                                <span className="shrink-0 text-muted">
                                    {blocked ? '▸' : isOpen ? '▾' : '▸'}
                                </span>
                                <span className="flex-1 truncate text-sm font-medium text-gray-800">
                                    {unit.name}
                                </span>
                                <span className="shrink-0 text-xs text-muted">
                                    {blocked
                                        ? 'observedAt 없음'
                                        : (unit.observedAt ?? '-')}
                                </span>
                                <span className="shrink-0 text-xs text-muted">
                                    {unit.rows.length}개
                                </span>
                            </button>

                            {isOpen && !blocked && (
                                <ul className="flex flex-wrap gap-1 px-3 py-2">
                                    {unit.rows.map((row) => {
                                        const { type, source: typeSource } =
                                            previewValueType(row)
                                        const checked =
                                            selectedPaths.includes(row.path)
                                        return (
                                            <li key={row.path}>
                                                <button
                                                    type="button"
                                                    title={`${row.path}\n${preview(row.value)}${
                                                        type
                                                            ? `\n${type}${typeSource === 'inferred' ? ' (추론)' : ''}`
                                                            : ''
                                                    }`}
                                                    className={`rounded-control border px-2 py-1 text-xs ${
                                                        checked
                                                            ? 'border-main bg-main-soft font-medium text-main'
                                                            : 'border-line text-gray-700 hover:bg-subtle'
                                                    }`}
                                                    onClick={() => onToggle(row)}
                                                >
                                                    {checked ? '☑ ' : '☐ '}
                                                    {row.leaf}
                                                </button>
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </div>
                    )
                })}
            </div>

            {selectable > 0 && (
                <p className="border-t border-line px-3 py-2 text-xs text-muted">
                    리프 1개 = 프로세스 1행. 여러 개를 고르면 그만큼 프로세스가
                    생성됩니다.
                </p>
            )}
        </section>
    )
}
