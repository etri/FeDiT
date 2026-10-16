import { useEffect, useState } from 'react'
import axios from 'axios'
import NDXProAttributePanel from './NDXProAttributePanel.tsx'
import {
    deriveAttributes,
    splitFederatedId,
    deriveTimeprop,
    deriveType,
    extractValue,
    previewValueType,
} from './ngsiAttribute.ts'
import type { NgsiAttributeRow } from './ngsiAttribute.ts'
import {
    fetchContext,
    fetchContexts,
    fetchDataModel,
    fetchDataModels,
    fetchEntities,
    fetchEntity,
    fetchHistories,
    fetchHistory,
    extractModels,
    filterModelsWithData,
    toObjectId,
} from './ndxproApi.ts'
import type { DataModel, EntityRef, HistoryRef } from './ndxproApi.ts'

function errorText(err: unknown): string {
    if (axios.isAxiosError(err)) {
        const status = err.response?.status
        const detail =
            (err.response?.data as { detail?: string; error?: string })
                ?.detail ??
            (err.response?.data as { error?: string })?.error ??
            err.message
        return status ? `HTTP ${status} — ${detail}` : detail
    }
    return String(err)
}

const PAGE_SIZE = 20
const DEFAULT_PREVIEW_LIMIT = 100
const PREVIEW_WINDOW_DAYS = 400

function toApiTime(d: Date): string {
    const p = (n: number, len = 2) => String(n).padStart(len, '0')
    return (
        `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` +
        `T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}` +
        `.${p(d.getMilliseconds(), 3)}`
    )
}

export interface NgsiTuple {
    contextUrl: string
    entityId: string
    type: string
    timeproperty: string
    valueExtract: string
}

interface Props {
    onConfirm?: (tuples: NgsiTuple[], preview: TuplePreview) => void
    onCancel?: () => void
    bufferSize?: number
}

export interface TuplePreview {
    federatedTwinId: string | null
    federatedDigitalObjectId: string | null
    trackTopic: string
    objectValueType: string
    objectValueTypeSource: string
}

export default function NDXProSelector({
    onConfirm,
    onCancel,
    bufferSize,
}: Props) {
    const previewLimit =
        bufferSize && bufferSize > 0 ? bufferSize : DEFAULT_PREVIEW_LIMIT
    const [contexts, setContexts] = useState<string[]>([])
    const [contextUrl, setContextUrl] = useState('')

    const [models, setModels] = useState<string[]>([])
    const [modelType, setModelType] = useState('')
    const [model, setModel] = useState<DataModel | null>(null)
    const [registered, setRegistered] = useState<Set<string>>(new Set())
    const [unregistered, setUnregistered] = useState(false)

    const [entities, setEntities] = useState<EntityRef[]>([])
    const [totalData, setTotalData] = useState(0)
    const [page, setPage] = useState(0)
    const [selectedEntityId, setSelectedEntityId] = useState('')
    const [trackable, setTrackable] = useState<Record<string, boolean>>({})

    const [rows, setRows] = useState<NgsiAttributeRow[]>([])
    const [entityBody, setEntityBody] = useState<Record<string, unknown> | null>(
        null
    )
    const [provider, setProvider] = useState('')
    const [picked, setPicked] = useState<NgsiAttributeRow[]>([])
    const [previewRow, setPreviewRow] = useState<NgsiAttributeRow | null>(null)
    const [attrSource, setAttrSource] = useState<'schema' | 'entity' | ''>('')

    const [histories, setHistories] = useState<HistoryRef[]>([])
    const [historyTotal, setHistoryTotal] = useState(0)
    const [samples, setSamples] = useState<
        { historyId: string; observedAt: string; value: unknown }[]
    >([])
    const [window, setWindow] = useState<{ from: string; to: string } | null>(
        null
    )

    const [loading, setLoading] = useState('')
    const [error, setError] = useState('')
    const [warning, setWarning] = useState('')

    useEffect(() => {
        setLoading('컨텍스트 · 등록 모델 목록 조회 중...')
        Promise.all([fetchContexts(), fetchDataModels()])
            .then(([ctxs, models]) => {
                setContexts(ctxs)
                setRegistered(new Set(models.map((m) => m.type)))
            })
            .catch((err) => setError(errorText(err)))
            .finally(() => setLoading(''))
    }, [])

    const resetBelow = (from: 'context' | 'model' | 'entity') => {
        if (from === 'context') {
            setModels([])
            setModelType('')
            setModel(null)
            setUnregistered(false)
        }
        if (from === 'context' || from === 'model') {
            setEntities([])
            setTotalData(0)
            setPage(0)
            setTrackable({})
        }
        setSelectedEntityId('')
        setEntityBody(null)
        setProvider('')
        setRows([])
        setAttrSource('')
        setPicked([])
        setPreviewRow(null)
        setHistories([])
        setHistoryTotal(0)
        setSamples([])
        setWindow(null)
        setWarning('')
    }

    const handleSelectContext = async (url: string) => {
        setContextUrl(url)
        resetBelow('context')
        setError('')
        setLoading('모델 목록 조회 중...')
        try {
            const declared = extractModels(await fetchContext(url))
            if (declared.length === 0) {
                setModels([])
                setWarning('이 컨텍스트에 모델이 없습니다.')
                return
            }
            const withData = await filterModelsWithData(declared, url)
            setModels(withData)
            if (withData.length === 0) {
                setWarning('데이터가 적재된 모델이 없습니다.')
            }
        } catch (err) {
            setError(errorText(err))
        } finally {
            setLoading('')
        }
    }

    const handleSelectModel = async (type: string) => {
        setModelType(type)
        resetBelow('model')
        setError('')
        setLoading('모델 상세 조회 중...')
        try {
            const isRegistered = registered.has(type)
            const detail = isRegistered ? await fetchDataModel(type) : null
            setModel(detail)
            setUnregistered(!isRegistered || detail === null)
            await loadEntities(type, detail === null || detail.isDynamic === true, 0)
        } catch (err) {
            setError(errorText(err))
        } finally {
            setLoading('')
        }
    }

    const loadEntities = async (
        type: string,
        isDynamic: boolean,
        nextPage: number
    ) => {
        setLoading('엔티티 목록 조회 중...')
        try {
            const res = await fetchEntities({
                modelType: type,
                contextUrl,
                isDynamic,
                offset: nextPage,
                limit: PAGE_SIZE,
            })
            const list = res.entities ?? []
            setEntities(list)
            setTotalData(res.totalData ?? 0)
            setPage(nextPage)
            prefetchTrackable(list, isDynamic)
        } catch (err) {
            setError(errorText(err))
        } finally {
            setLoading('')
        }
    }

    const prefetchTrackable = async (
        list: EntityRef[],
        isDynamic: boolean
    ) => {
        for (const item of list) {
            try {
                const res = await fetchEntity({
                    entityId: item.entityId,
                    contextUrl,
                    isDynamic,
                })
                const ok = deriveAttributes(res.entity).some(
                    (a) => a.hasObservedAt
                )
                setTrackable((prev) => ({ ...prev, [item.entityId]: ok }))
            } catch {
            }
            await new Promise((r) => setTimeout(r, 300))
        }
    }

    const handleSelectEntity = async (entityId: string) => {
        setError('')
        resetBelow('entity')
        setLoading('엔티티 단건 조회 중...')
        try {
            const res = await fetchEntity({
                entityId,
                contextUrl,
                isDynamic: unregistered || model?.isDynamic === true,
            })
            const attrs = deriveAttributes(res.entity, model?.attributes)
            setAttrSource(model?.attributes ? 'schema' : 'entity')
            setSelectedEntityId(entityId)
            setProvider(res.provider)
            setEntityBody(res.entity)
            setRows(attrs)
            setTrackable((prev) => ({
                ...prev,
                [entityId]: attrs.some((a) => a.hasObservedAt),
            }))
            if (!res.entity.federatedDigitalObjectId) {
                setWarning(
                    '연합 식별자가 없는 엔티티입니다. Track Topic 이 entityId 기반으로 생성됩니다.'
                )
            }
        } catch (err) {
            setError(errorText(err))
        } finally {
            setLoading('')
        }
    }

    const handleToggleAttribute = async (row: NgsiAttributeRow) => {
        if (picked.some((p) => p.path === row.path)) {
            const next = picked.filter((p) => p.path !== row.path)
            setPicked(next)
            if (previewRow?.path === row.path) {
                setPreviewRow(next[next.length - 1] ?? null)
            }
            return
        }
        setPicked([...picked, row])
        setPreviewRow(row)
        setHistories([])
        setHistoryTotal(0)
        setSamples([])
        setError('')
        setLoading('이력 미리보기 조회 중...')
        try {
            const now = new Date()
            const from = new Date(
                now.getTime() - PREVIEW_WINDOW_DAYS * 24 * 60 * 60_000
            )
            const time = toApiTime(from)
            const endTime = toApiTime(now)
            setWindow({ from: time, to: endTime })
            const res = await fetchHistories({
                entityId: selectedEntityId,
                contextUrl,
                timeproperty: row.timeproperty,
                time,
                endTime,
                limit: previewLimit,
            })
            const list = res.entityHistoryList ?? []
            setHistories(list)
            setHistoryTotal(res.totalData ?? 0)

            const recent = [...list]
                .sort((a, b) => b.observedAt.localeCompare(a.observedAt))
                .slice(0, 3)
            const detail = await Promise.all(
                recent.map((h) =>
                    fetchHistory({
                        historyId: h.historyId,
                        timeproperty: row.timeproperty,
                    })
                )
            )
            setSamples(
                detail.map((d) => ({
                    historyId: d.historyId,
                    observedAt: d.observedAt,
                    value: extractValue(d.entity, row.path),
                }))
            )
        } catch (err) {
            setError(errorText(err))
        } finally {
            setLoading('')
        }
    }

    const entityGroups: [string, EntityRef[]][] = (() => {
        const map = new Map<string, EntityRef[]>()
        for (const item of entities) {
            const fed = splitFederatedId(item.entityId, model?.observation)
            const key = fed?.objectId ?? ''
            map.set(key, [...(map.get(key) ?? []), item])
        }
        return [...map.entries()]
    })()

    const totalPages = Math.max(1, Math.ceil(totalData / PAGE_SIZE))
    const isDynamicPath = unregistered || model?.isDynamic === true

    const tuples: NgsiTuple[] = picked.map((row) => ({
        contextUrl,
        entityId: selectedEntityId,
        type: deriveType(selectedEntityId),
        timeproperty: deriveTimeprop(row.path),
        valueExtract: row.path,
    }))

    const fdoId =
        (entityBody?.federatedDigitalObjectId as { value?: string })?.value ??
        null
    const twinId =
        (entityBody?.federatedDigitalTwinId as { value?: string })?.value ?? null
    const trackTopic = fdoId
        ? `FDO_${fdoId}`
        : selectedEntityId
          ? `ENT_${selectedEntityId.split(':').pop()}`
          : ''
    const valueType = previewRow ? previewValueType(previewRow) : null

    const dedupCount = new Set(
        samples.map((s) => `${s.observedAt}|${JSON.stringify(s.value)}`)
    ).size

    const preview: TuplePreview = {
        federatedTwinId: twinId,
        federatedDigitalObjectId: fdoId,
        trackTopic,
        objectValueType: valueType?.type ?? '',
        objectValueTypeSource: valueType?.source ?? '',
    }

    return (
        <div className="dt-scope">
            <div className="h-full w-full">
                <p className="mb-[8px] text-[18px] font-bold text-main">
                    NDXPro 트래킹 대상 선택 (NGSI-LD)
                </p>
                <p className="mb-[16px] text-sm text-muted">
                    컨텍스트 → 모델 → 엔티티 → 속성 순으로 고르면 트래킹 명령에
                    실을 5-튜플이 만들어집니다. 아래 참고 항목은 저장 시
                    백엔드가 확정하며 전송하지 않습니다.
                </p>

                <div className="mb-4 min-h-[38px]">
                    {loading && (
                        <div className="rounded-control bg-main-soft px-4 py-2 text-sm text-main">
                            {loading}
                        </div>
                    )}
                    {!loading && error && (
                        <div className="rounded-control border border-danger px-4 py-2 text-sm text-danger">
                            {error}
                        </div>
                    )}
                    {!loading && !error && warning && (
                        <div className="rounded-control border border-warn px-4 py-2 text-sm text-gray-700">
                            {warning}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-4 gap-4">
                    <section className="min-w-0 rounded-card border border-line">
                        <h2 className="border-b border-line px-4 py-3 text-sm font-bold text-gray-800">
                            1. Context
                        </h2>
                        <ul className="h-[260px] overflow-y-auto">
                            {contexts.map((url) => (
                                <li key={url}>
                                    <button
                                        type="button"
                                        className={`w-full break-all px-4 py-3 text-left text-xs hover:bg-subtle ${
                                            contextUrl === url
                                                ? 'bg-main-soft font-medium text-main'
                                                : 'text-gray-700'
                                        }`}
                                        onClick={() => handleSelectContext(url)}
                                    >
                                        {url}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="min-w-0 rounded-card border border-line">
                        <h2 className="border-b border-line px-4 py-3 text-sm font-bold text-gray-800">
                            2. Data Model
                            <span className="ml-2 font-normal text-muted">
                                {models.length > 0 && `${models.length}개`}
                            </span>
                        </h2>
                        <ul className="h-[260px] overflow-y-auto">
                            {models.map((type) => (
                                <li key={type}>
                                    <button
                                        type="button"
                                        className={`w-full px-4 py-3 text-left text-sm hover:bg-subtle ${
                                            modelType === type
                                                ? 'bg-main-soft font-medium text-main'
                                                : 'text-gray-700'
                                        }`}
                                        onClick={() => handleSelectModel(type)}
                                    >
                                        <span className="flex items-center justify-between gap-2">
                                            <span className="truncate">
                                                {type}
                                            </span>
                                            <span className="shrink-0 text-xs text-muted">
                                                {registered.has(type)
                                                    ? '등록'
                                                    : '미등록'}
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                            {models.length === 0 && (
                                <li className="px-4 py-3 text-sm text-muted">
                                    컨텍스트를 먼저 선택하세요.
                                </li>
                            )}
                        </ul>
                    </section>

                    <section className="min-w-0 rounded-card border border-line">
                        <h2 className="border-b border-line px-4 py-3 text-sm font-bold text-gray-800">
                            3. Entity
                            <span className="ml-2 font-normal text-muted">
                                {modelType && `총 ${totalData}건`}
                            </span>
                        </h2>
                        <ul className="h-[260px] overflow-y-auto">
                            {entityGroups.map(([objectId, items]) => (
                                <li key={objectId}>
                                    {objectId && (
                                        <p className="border-y border-line bg-subtle px-4 py-2 text-xs font-medium text-gray-800">
                                            {objectId}
                                            <span className="ml-2 font-normal text-muted">
                                                {items.length}개 속성
                                            </span>
                                        </p>
                                    )}
                                    <ul>
                                        {items.map((item) => {
                                            const fed = splitFederatedId(
                                                item.entityId,
                                                model?.observation
                                            )
                                            return (
                                                <li key={item.entityId}>
                                                    <button
                                                        type="button"
                                                        className={`w-full px-4 py-3 text-left ${
                                                            selectedEntityId ===
                                                            item.entityId
                                                                ? 'bg-main-soft'
                                                                : 'hover:bg-subtle'
                                                        }`}
                                                        onClick={() =>
                                                            handleSelectEntity(
                                                                item.entityId
                                                            )
                                                        }
                                                    >
                                                        <span className="block break-all text-xs text-gray-700">
                                                            {fed
                                                                ? fed.attribute
                                                                : item.entityId}
                                                        </span>
                                                        <span className="text-xs text-muted">
                                                            {fed
                                                                ? item.entityId
                                                                : `${toObjectId(item.entityId)} · ${item.provider}`}
                                                        </span>
                                                        {trackable[
                                                            item.entityId
                                                        ] === false && (
                                                            <span className="mt-1 block w-fit rounded-control bg-subtle px-2 py-0.5 text-[11px] text-muted">
                                                                이력 추적 불가
                                                            </span>
                                                        )}
                                                    </button>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </li>
                            ))}
                            {modelType && entities.length === 0 && !loading && (
                                <li className="px-4 py-3 text-sm text-muted">
                                    적재된 데이터가 없습니다.
                                </li>
                            )}
                        </ul>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-line px-4 py-2 text-xs">
                                <button
                                    type="button"
                                    className="text-main disabled:text-muted"
                                    disabled={page === 0}
                                    onClick={() =>
                                        loadEntities(
                                            modelType,
                                            isDynamicPath,
                                            page - 1
                                        )
                                    }
                                >
                                    이전
                                </button>
                                <span className="text-muted">
                                    {page + 1} / {totalPages}
                                </span>
                                <button
                                    type="button"
                                    className="text-main disabled:text-muted"
                                    disabled={page + 1 >= totalPages}
                                    onClick={() =>
                                        loadEntities(
                                            modelType,
                                            isDynamicPath,
                                            page + 1
                                        )
                                    }
                                >
                                    다음
                                </button>
                            </div>
                        )}
                    </section>

                    <NDXProAttributePanel
                        rows={rows}
                        source={attrSource}
                        selectedPaths={picked.map((p) => p.path)}
                        onToggle={handleToggleAttribute}
                    />
                </div>

                {modelType && (
                    <div className="mt-4 rounded-card border border-line p-4 text-sm">
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                            {unregistered ? (
                                <>
                                    <span className="rounded-control bg-subtle px-2 py-1 font-medium text-gray-700">
                                        미등록 모델 · 경로 B
                                    </span>
                                    <span className="text-muted">
                                        → /entities/iot 폴백. 속성은 엔티티
                                        본문에서 2단계 중첩으로 도출합니다.
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span>
                                        <span className="text-muted">
                                            모델 ID{' '}
                                        </span>
                                        <span className="font-medium">
                                            {model?.id}
                                        </span>
                                    </span>
                                    <span>
                                        <span className="text-muted">
                                            isDynamic{' '}
                                        </span>
                                        <span className="rounded-control bg-main-soft px-2 py-1 font-medium text-main">
                                            {String(model?.isDynamic)}
                                        </span>
                                        <span className="ml-2 text-muted">
                                            {model?.isDynamic
                                                ? '→ /entities/iot'
                                                : '→ /entities (정적)'}
                                        </span>
                                    </span>
                                    <span className="rounded-control bg-subtle px-2 py-1 font-medium text-gray-700">
                                        등록 모델 · 경로 A
                                    </span>
                                    {model?.observation && (
                                        <span>
                                            <span className="text-muted">
                                                observation{' '}
                                            </span>
                                            <span className="font-mono text-xs">
                                                {model.observation.join(', ')}
                                            </span>
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {tuples.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="min-w-0 rounded-card border border-line p-4 text-sm">
                            <h3 className="mb-3 font-bold text-gray-800">
                                전송 값
                                <span className="ml-2 text-xs font-normal text-muted">
                                    리프 1개 = 프로세스 1행 · {tuples.length}건
                                </span>
                            </h3>
                            <dl className="grid grid-cols-[110px_1fr] gap-y-2">
                                <dt className="text-muted">contextUrl</dt>
                                <dd className="break-all font-mono text-xs">
                                    {contextUrl}
                                </dd>
                                <dt className="text-muted">entityId</dt>
                                <dd className="break-all font-mono text-xs">
                                    {selectedEntityId}
                                </dd>
                                <dt className="text-muted">type</dt>
                                <dd className="font-mono text-xs">
                                    {deriveType(selectedEntityId)}
                                </dd>
                            </dl>
                            <p className="mt-3 text-xs text-muted">
                                위 3개는 모든 행이 공유합니다. 아래가 행마다
                                달라지는 값입니다.
                            </p>
                            <table className="mt-2 w-full table-fixed text-left text-xs">
                                <thead className="bg-subtle text-muted">
                                    <tr>
                                        <th className="w-[46%] px-2 py-1">
                                            valueExtract
                                        </th>
                                        <th className="px-2 py-1">
                                            timeproperty
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tuples.map((t) => (
                                        <tr
                                            key={t.valueExtract}
                                            className="border-b border-line"
                                        >
                                            <td className="break-all px-2 py-1 font-mono font-medium text-main">
                                                {t.valueExtract}
                                            </td>
                                            <td className="break-all px-2 py-1 font-mono">
                                                {t.timeproperty}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="min-w-0 rounded-card border border-line p-4 text-sm">
                            <h3 className="mb-3 font-bold text-gray-800">
                                저장 시 자동 입력
                                <span className="ml-2 text-xs font-normal text-muted">
                                    전송하지 않음 · 백엔드가 확정
                                </span>
                            </h3>
                            <dl className="grid grid-cols-[150px_1fr] gap-y-2">
                                <dt className="text-muted">
                                    Federated Twin ID
                                </dt>
                                <dd className="break-all">{twinId ?? '없음'}</dd>
                                <dt className="text-muted">
                                    Federated Object ID
                                </dt>
                                <dd className="break-all">{fdoId ?? '없음'}</dd>
                                <dt className="text-muted">
                                    Object Value Type
                                </dt>
                                <dd>
                                    <span className="font-medium text-main">
                                        {valueType?.type || '-'}
                                    </span>
                                    {valueType?.source && (
                                        <span className="ml-2 text-xs text-muted">
                                            {valueType.source} ·{' '}
                                            {previewRow?.leaf}
                                        </span>
                                    )}
                                </dd>
                                <dt className="text-muted">provider</dt>
                                <dd>{provider}</dd>
                            </dl>
                        </div>
                    </div>
                )}

                {previewRow && (
                    <div className="mt-4 rounded-card border border-line p-4 text-sm">
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                            <h3 className="font-bold text-gray-800">
                                데이터 확인
                            </h3>
                            <span className="text-muted">
                                timeproperty ={' '}
                                <span className="font-mono">
                                    {previewRow.timeproperty}
                                </span>
                            </span>
                            <span className="text-muted">
                                기준 리프{' '}
                                <span className="font-mono">
                                    {previewRow.leaf}
                                </span>
                            </span>
                        </div>

                        <dl className="grid grid-cols-[150px_1fr] gap-y-2">
                            <dt className="text-muted">조회 건수</dt>
                            <dd>
                                {historyTotal}건
                                <span className="ml-2 text-muted">
                                    (이번 조회 {histories.length}건)
                                </span>
                            </dd>
                            <dt className="text-muted">최신 observedAt</dt>
                            <dd className="font-mono text-xs">
                                {samples[0]?.observedAt ?? '-'}
                            </dd>
                            <dt className="text-muted">시간창 (KST)</dt>
                            <dd className="font-mono text-xs">
                                {window
                                    ? `${window.from} ~ ${window.to}`
                                    : '-'}
                            </dd>
                            <dt className="text-muted">추출값 최근 3건</dt>
                            <dd>
                                {samples.length === 0 ? (
                                    <span className="text-muted">
                                        조회된 이력이 없습니다. 이 엔티티에 해당
                                        속성이 없거나, 시간창 밖이거나, 아직
                                        수집되지 않았을 수 있습니다.
                                    </span>
                                ) : (
                                    <ul className="space-y-1">
                                        {samples.map((s) => (
                                            <li
                                                key={s.historyId}
                                                className="font-mono text-xs"
                                            >
                                                <span className="text-muted">
                                                    {s.observedAt}
                                                </span>{' '}
                                                <span className="font-medium">
                                                    {JSON.stringify(s.value)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </dd>
                            {samples.length > 0 && (
                                <>
                                    <dt className="text-muted">
                                        dedup 후 (샘플)
                                    </dt>
                                    <dd>
                                        {dedupCount}건
                                        <span className="ml-2 text-xs text-muted">
                                            키 = (observedAt, 추출값)
                                        </span>
                                    </dd>
                                </>
                            )}
                        </dl>
                        <p className="mt-3 text-xs text-muted">
저장 전 검증용 읽기 전용 1회 호출입니다(offset=0 고정, limit=
                            {previewLimit}
                            {bufferSize ? ' · Buffer Size' : ' · 기본값'}). 폴링
                            · 워터마크 · dedup 저장은 백엔드가 맡습니다.
                        </p>
                    </div>
                )}

                {onConfirm && (
                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            type="button"
                            className="rounded-control border border-line px-4 py-2 text-sm text-gray-700 hover:bg-subtle"
                            onClick={onCancel}
                        >
                            취소
                        </button>
                        <button
                            type="button"
                            className="rounded-control bg-main px-4 py-2 text-sm text-white hover:bg-main-hover disabled:opacity-50"
                            disabled={tuples.length === 0}
                            onClick={() =>
                                tuples.length > 0 && onConfirm(tuples, preview)
                            }
                        >
                            {tuples.length > 1
                                ? `${tuples.length}개 프로세스로 확인`
                                : '이 대상으로 확인'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
