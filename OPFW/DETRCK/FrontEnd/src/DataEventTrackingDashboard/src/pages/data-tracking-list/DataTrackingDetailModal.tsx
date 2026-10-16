import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { History, ListTree, RefreshCw, Send, X } from 'lucide-react'
import { getProcStatusMeta, getReqStatusMeta } from './trackingStatus'
import { trackingApi } from '../../config/trackingApi'

interface Props {
    isOpen: boolean
    uuid: string | null
    onClose: () => void
}

const TH =
    'sticky top-0 z-10 bg-subtle px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted whitespace-nowrap'
const TD = 'px-4 py-2.5 align-middle'

function fmtTime(v?: string): string {
    if (!v) return ''
    if (v.includes('T')) {
        const d = new Date(v)
        if (!isNaN(d.getTime())) {
            const p = (n: number) => String(n).padStart(2, '0')
            return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(
                d.getDate()
            )} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
        }
    }
    return v
}

type ProcessItem = {
    trckPrcIdtifier?: string
    trackingProcessIdentifier?: string
    trackingProcessType?: string
    trackingStatus?: string
    createTime?: string
    trackingStatusChangeTime?: string
}

type ProcStatusChange = {
    processStatusChangeId?: number
    trackingProcessId?: number
    trckPrcIdtifier?: string
    trackingProcessIdentifier?: string
    changeStatus?: string
    statusUpdateTime?: string
    statusResultMsg?: string
}

type EventTransmission = {
    eventTransmissionResultId?: number
    trackingProcessId?: number
    trckPrcIdtifier?: string
    trackingProcessIdentifier?: string
    eventTransmissionStatus?: string
    transmissionUrl?: string
    transmissionParam?: string
    eventOccuredMsg?: string
    transmissionTime?: string
    transmissionRespCode?: string
    transmissionRespMsg?: string
}

type StatusTransmission = {
    statusTransmissionId?: number
    trackingProcessId?: number
    trckPrcIdtifier?: string
    trackingProcessIdentifier?: string
    trackingProcessType?: string
    msgStatus?: string
    lastObservedAt?: string
    noDataRefs?: string
    checkedTime?: string
    transmissionTime?: string
    transmissionStatus?: string
    transmissionUrl?: string
    transmissionParam?: string
    transmissionRespCode?: string
    transmissionRespMsg?: string
}

function bodyValue(r: EventTransmission): string {
    if (!r.transmissionParam) return ''
    try {
        const b = JSON.parse(r.transmissionParam)
        const v = b?.trckValue ?? b?.conditionResult
        return v === undefined || v === null ? '' : String(v)
    } catch {
        return ''
    }
}

function fmtRefs(v?: string): string {
    if (!v) return ''
    try {
        const arr = JSON.parse(v)
        if (Array.isArray(arr))
            return arr.map((x) => String(x).replace(/^#\{|\}$/g, '')).join(', ')
    } catch {
    }
    return v
}

type StatusHistoryResponse = {
    procStatusChangeList?: ProcStatusChange[]
    eventTransmissionList?: EventTransmission[]
    statusTransmissionList?: StatusTransmission[]
}

function ModalFrame({
    title,
    subtitle,
    widthClass,
    zClass,
    onClose,
    onRefresh,
    refreshing,
    children,
}: {
    title: string
    subtitle?: string
    widthClass: string
    zClass: string
    onClose: () => void
    onRefresh?: () => void
    refreshing?: boolean
    children: ReactNode
}) {
    return (
        <div
            className={`fixed inset-0 ${zClass} flex items-center justify-center p-4 bg-black/40`}
        >
            <div
                className={`flex max-h-[88vh] w-full ${widthClass} flex-col overflow-hidden rounded-card bg-white shadow-2xl`}
            >
                <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold text-main">{title}</h2>
                        {subtitle && (
                            <p className="mt-0.5 truncate font-mono text-xs text-muted">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <div className="-mr-1 flex shrink-0 items-center gap-1">
                        {onRefresh && (
                            <button
                                onClick={onRefresh}
                                aria-label="새로고침"
                                title="새로고침"
                                className="rounded-control p-1.5 text-muted hover:bg-subtle hover:text-main"
                            >
                                <RefreshCw
                                    size={16}
                                    className={refreshing ? 'animate-spin' : ''}
                                />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            aria-label="닫기"
                            className="rounded-control p-1.5 text-muted hover:bg-subtle hover:text-main"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                    {children}
                </div>
            </div>
        </div>
    )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                {label}
            </dt>
            <dd className="mt-1 break-all text-sm text-main">{children}</dd>
        </div>
    )
}

function SectionTitle({
    icon: Icon,
    title,
    hint,
}: {
    icon: typeof ListTree
    title: string
    hint?: string
}) {
    return (
        <div className="flex items-center gap-2">
            <Icon size={16} className="text-main" />
            <h3 className="text-sm font-semibold text-main">{title}</h3>
            {hint && <span className="text-xs text-muted">{hint}</span>}
        </div>
    )
}

function StatusBadge({
    code,
    kind,
}: {
    code?: string | null
    kind: 'req' | 'proc'
}) {
    const meta =
        kind === 'req' ? getReqStatusMeta(code) : getProcStatusMeta(code)
    return (
        <span
            className={`inline-block rounded-control px-2 py-0.5 text-xs font-medium ${meta.badge}`}
        >
            {meta.label ? `${meta.label} (${code})` : code || '-'}
        </span>
    )
}

function RespCode({ code }: { code?: string }) {
    if (!code) return <span className="text-muted">-</span>
    const c = code.trim()
    const color = /^2/.test(c)
        ? 'bg-green-100 text-green-700'
        : /^[45]/.test(c)
          ? 'bg-red-100 text-red-700'
          : 'bg-gray-100 text-gray-600'
    return (
        <span
            className={`inline-block max-w-[140px] truncate rounded-control px-2 py-0.5 text-xs font-medium ${color}`}
            title={c}
        >
            {c}
        </span>
    )
}

function Truncated({
    value,
    width = 'max-w-[240px]',
    mono,
}: {
    value?: string
    width?: string
    mono?: boolean
}) {
    return (
        <div
            className={`${width} truncate ${mono ? 'font-mono text-xs' : ''}`}
            title={value || ''}
        >
            {value}
        </div>
    )
}

function isSameProcess(
    proc: ProcessItem,
    rec: { trackingProcessIdentifier?: string; trckPrcIdtifier?: string }
): boolean {
    if (
        proc.trackingProcessIdentifier &&
        rec.trackingProcessIdentifier &&
        proc.trackingProcessIdentifier === rec.trackingProcessIdentifier
    )
        return true
    if (
        proc.trckPrcIdtifier &&
        rec.trckPrcIdtifier &&
        proc.trckPrcIdtifier === rec.trckPrcIdtifier
    )
        return true
    return false
}

function copyText(text: string) {
    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => fallbackCopy(text))
    } else {
        fallbackCopy(text)
    }
}
function fallbackCopy(text: string) {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try {
        document.execCommand('copy')
    } catch {
    }
    document.body.removeChild(ta)
}

function prettyJson(v?: string): string {
    if (!v) return ''
    try {
        return JSON.stringify(JSON.parse(v), null, 2)
    } catch {
        return v
    }
}

function CopyBtn({ text }: { text?: string }) {
    const [done, setDone] = useState(false)
    if (!text) return null
    return (
        <button
            onClick={() => {
                copyText(text)
                setDone(true)
                setTimeout(() => setDone(false), 1200)
            }}
            className="rounded-control border border-line bg-white px-2 py-0.5 text-xs text-muted hover:bg-subtle"
        >
            {done ? '복사됨' : '복사'}
        </button>
    )
}

function CodeBlock({ text }: { text?: string }) {
    if (!text) return <span className="text-sm text-muted">-</span>
    return (
        <div className="relative">
            <pre className="max-h-[240px] overflow-auto whitespace-pre-wrap break-all rounded-control border border-line bg-subtle p-3 pr-16 font-mono text-xs">
                {text}
            </pre>
            <div className="absolute right-2 top-2">
                <CopyBtn text={text} />
            </div>
        </div>
    )
}

function DetailField({
    label,
    children,
}: {
    label: string
    children: ReactNode
}) {
    return (
        <div>
            <dt className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
                {label}
            </dt>
            <dd>{children}</dd>
        </div>
    )
}

function TransmissionDetailModal({
    row,
    onClose,
}: {
    row: EventTransmission
    onClose: () => void
}) {
    return (
        <ModalFrame
            title="전송 상세"
            subtitle={row.trckPrcIdtifier}
            widthClass="max-w-[760px]"
            zClass="z-[70]"
            onClose={onClose}
        >
            <dl className="space-y-4">
                <DetailField label="전송 일시">
                    <span className="text-sm">
                        {fmtTime(row.transmissionTime)}
                    </span>
                </DetailField>
                <DetailField label="프로세스 식별자">
                    <span className="font-mono text-xs">
                        {row.trckPrcIdtifier}
                    </span>
                </DetailField>
                <DetailField label="전송 상태">
                    <span className="rounded-control bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {row.eventTransmissionStatus || '-'}
                    </span>
                </DetailField>
                <DetailField label="수신 대상 URL">
                    <CodeBlock text={row.transmissionUrl} />
                </DetailField>
                <DetailField label="발생 이벤트 메시지">
                    <CodeBlock text={row.eventOccuredMsg} />
                </DetailField>
                <DetailField label="전송 파라미터">
                    <CodeBlock text={prettyJson(row.transmissionParam)} />
                </DetailField>
                <DetailField label="응답 코드">
                    <CodeBlock text={row.transmissionRespCode} />
                </DetailField>
                <DetailField label="응답 메시지">
                    <CodeBlock text={row.transmissionRespMsg} />
                </DetailField>
            </dl>
        </ModalFrame>
    )
}

function NoDataStatus({ status }: { status?: string }) {
    if (!status) return <span className="text-muted">-</span>
    const color =
        status === 'COLLECT_ERROR'
            ? 'bg-red-100 text-red-700'
            : 'bg-gray-100 text-gray-600'
    return (
        <span
            className={`inline-block rounded-control px-2 py-0.5 text-xs font-medium ${color}`}
        >
            {status}
        </span>
    )
}

function StatusTransmissionDetailModal({
    row,
    onClose,
}: {
    row: StatusTransmission
    onClose: () => void
}) {
    return (
        <ModalFrame
            title="전송 상세 (값 없음)"
            subtitle={row.trckPrcIdtifier}
            widthClass="max-w-[760px]"
            zClass="z-[70]"
            onClose={onClose}
        >
            <dl className="space-y-4">
                <DetailField label="전송 일시">
                    <span className="text-sm">
                        {fmtTime(row.transmissionTime)}
                    </span>
                </DetailField>
                <DetailField label="프로세스 식별자">
                    <span className="font-mono text-xs">
                        {row.trckPrcIdtifier}
                    </span>
                </DetailField>
                <DetailField label="상태">
                    <NoDataStatus status={row.msgStatus} />
                </DetailField>
                <DetailField label="확인 시각">
                    <span className="text-sm">
                        {fmtTime(row.checkedTime) || '-'}
                    </span>
                </DetailField>
                {row.lastObservedAt && (
                    <DetailField label="마지막 관측 시각">
                        <span className="text-sm">
                            {fmtTime(row.lastObservedAt)}
                        </span>
                    </DetailField>
                )}
                {row.noDataRefs && (
                    <DetailField label="값 없는 참조">
                        <span className="font-mono text-xs">
                            {fmtRefs(row.noDataRefs)}
                        </span>
                    </DetailField>
                )}
                <DetailField label="전송 상태">
                    <span className="rounded-control bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {row.transmissionStatus || '-'}
                    </span>
                </DetailField>
                <DetailField label="수신 대상 URL">
                    <CodeBlock text={row.transmissionUrl} />
                </DetailField>
                <DetailField label="전송 파라미터">
                    <CodeBlock text={prettyJson(row.transmissionParam)} />
                </DetailField>
                <DetailField label="응답 코드">
                    <CodeBlock text={row.transmissionRespCode} />
                </DetailField>
                <DetailField label="응답 메시지">
                    <CodeBlock text={row.transmissionRespMsg} />
                </DetailField>
            </dl>
        </ModalFrame>
    )
}

function StatusTransmissionTable({ rows }: { rows: StatusTransmission[] }) {
    const [selected, setSelected] = useState<StatusTransmission | null>(null)
    return (
        <>
            {rows.length > 0 && (
                <p className="mb-2 text-xs text-muted">
                    행을 클릭하면 전체 내용을 볼 수 있습니다.
                </p>
            )}
            <div className="max-h-[320px] overflow-auto rounded-control border border-line">
                <table className="w-full min-w-[860px] border-collapse text-sm">
                    <thead>
                        <tr>
                            <th className={TH}>전송 일시</th>
                            <th className={TH}>프로세스</th>
                            <th className={TH}>상태</th>
                            <th className={TH}>확인 시각</th>
                            <th className={TH}>마지막 관측 / 값 없는 참조</th>
                            <th className={TH}>수신 대상 URL</th>
                            <th className={TH}>응답 코드</th>
                            <th className={TH}>응답 메시지</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length ? (
                            rows.map((r, idx) => {
                                return (
                                    <tr
                                        key={r.statusTransmissionId ?? idx}
                                        onClick={() => setSelected(r)}
                                        className="cursor-pointer border-t border-line hover:bg-subtle"
                                    >
                                        <td
                                            className={`${TD} whitespace-nowrap tabular-nums text-muted`}
                                        >
                                            {fmtTime(r.transmissionTime)}
                                        </td>
                                        <td
                                            className={`${TD} whitespace-nowrap font-mono text-xs`}
                                        >
                                            {r.trckPrcIdtifier}
                                        </td>
                                        <td
                                            className={`${TD} whitespace-nowrap`}
                                        >
                                            <NoDataStatus
                                                status={r.msgStatus}
                                            />
                                        </td>
                                        <td
                                            className={`${TD} whitespace-nowrap tabular-nums text-muted`}
                                        >
                                            {fmtTime(r.checkedTime) || '-'}
                                        </td>
                                        <td
                                            className={`${TD} whitespace-nowrap tabular-nums text-muted`}
                                        >
                                            {r.lastObservedAt
                                                ? fmtTime(r.lastObservedAt)
                                                : fmtRefs(r.noDataRefs) || '-'}
                                        </td>
                                        <td className={TD}>
                                            <Truncated
                                                value={r.transmissionUrl}
                                                width="max-w-[200px]"
                                                mono
                                            />
                                        </td>
                                        <td
                                            className={`${TD} whitespace-nowrap`}
                                        >
                                            <RespCode
                                                code={r.transmissionRespCode}
                                            />
                                        </td>
                                        <td className={TD}>
                                            <Truncated
                                                value={r.transmissionRespMsg}
                                            />
                                        </td>
                                    </tr>
                                )
                            })
                        ) : (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-4 py-8 text-center text-sm text-muted"
                                >
                                    값 없는 전송 내역이 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selected && (
                <StatusTransmissionDetailModal
                    row={selected}
                    onClose={() => setSelected(null)}
                />
            )}
        </>
    )
}

function EventTransmissionTable({
    rows,
    showProcess,
}: {
    rows: EventTransmission[]
    showProcess?: boolean
}) {
    const cols = showProcess ? 9 : 8
    const [selected, setSelected] = useState<EventTransmission | null>(null)
    return (
        <>
            {rows.length > 0 && (
                <p className="mb-2 text-xs text-muted">
                    행을 클릭하면 전체 내용을 볼 수 있습니다.
                </p>
            )}
            <div className="max-h-[320px] overflow-auto rounded-control border border-line">
                <table className="w-full min-w-[860px] border-collapse text-sm">
                    <thead>
                        <tr>
                            <th className={TH}>전송 일시</th>
                            {showProcess && <th className={TH}>프로세스</th>}
                            <th className={TH}>전송 상태</th>
                            <th className={TH}>값</th>
                            <th className={TH}>수신 대상 URL</th>
                            <th className={TH}>발생 이벤트</th>
                            <th className={TH}>전송 파라미터</th>
                            <th className={TH}>응답 코드</th>
                            <th className={TH}>응답 메시지</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length ? (
                            rows.map((r, idx) => (
                                <tr
                                    key={r.eventTransmissionResultId ?? idx}
                                    onClick={() => setSelected(r)}
                                    className="cursor-pointer border-t border-line hover:bg-subtle"
                                >
                                    <td
                                        className={`${TD} whitespace-nowrap tabular-nums text-muted`}
                                    >
                                        {fmtTime(r.transmissionTime)}
                                    </td>
                                    {showProcess && (
                                        <td
                                            className={`${TD} whitespace-nowrap font-mono text-xs`}
                                        >
                                            {r.trckPrcIdtifier}
                                        </td>
                                    )}
                                    <td className={`${TD} whitespace-nowrap`}>
                                        <span className="rounded-control bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                                            {r.eventTransmissionStatus || '-'}
                                        </span>
                                    </td>
                                    <td className={TD}>
                                        <Truncated
                                            value={bodyValue(r)}
                                            width="max-w-[120px]"
                                            mono
                                        />
                                    </td>
                                    <td className={TD}>
                                        <Truncated
                                            value={r.transmissionUrl}
                                            width="max-w-[200px]"
                                            mono
                                        />
                                    </td>
                                    <td className={TD}>
                                        <Truncated value={r.eventOccuredMsg} />
                                    </td>
                                    <td className={TD}>
                                        <Truncated
                                            value={r.transmissionParam}
                                            mono
                                        />
                                    </td>
                                    <td className={`${TD} whitespace-nowrap`}>
                                        <RespCode
                                            code={r.transmissionRespCode}
                                        />
                                    </td>
                                    <td className={TD}>
                                        <Truncated
                                            value={r.transmissionRespMsg}
                                        />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={cols}
                                    className="px-4 py-8 text-center text-sm text-muted"
                                >
                                    이벤트 전송 내역이 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selected && (
                <TransmissionDetailModal
                    row={selected}
                    onClose={() => setSelected(null)}
                />
            )}
        </>
    )
}

function ProcessHistoryModal({
    proc,
    statusRecords,
    loading,
    error,
    onClose,
    onRefresh,
    refreshing,
}: {
    proc: ProcessItem
    statusRecords: ProcStatusChange[]
    loading: boolean
    error: boolean
    onClose: () => void
    onRefresh?: () => void
    refreshing?: boolean
}) {
    return (
        <ModalFrame
            title="프로세스 상세"
            subtitle={proc.trckPrcIdtifier}
            widthClass="max-w-[920px]"
            zClass="z-[60]"
            onClose={onClose}
            onRefresh={onRefresh}
            refreshing={refreshing}
        >
            <div className="mb-5 rounded-card border border-line bg-subtle px-5 py-4">
                <dl className="grid grid-cols-3 gap-x-8 gap-y-3">
                    <Field label="프로세스 식별자">
                        <span className="font-mono text-xs">
                            {proc.trckPrcIdtifier}
                        </span>
                    </Field>
                    <Field label="트래킹 유형">
                        {proc.trackingProcessType}
                    </Field>
                    <Field label="현재 처리 상태">
                        <StatusBadge code={proc.trackingStatus} kind="proc" />
                    </Field>
                </dl>
            </div>

            {loading ? (
                <p className="py-6 text-center text-muted">Loading...</p>
            ) : error ? (
                <p className="py-6 text-center text-muted">
                    실행 내역을 불러오지 못했습니다.
                </p>
            ) : (
                <div>
                    <div className="mb-3">
                        <SectionTitle
                            icon={History}
                            title="프로세스 상태 변경 이력"
                        />
                    </div>
                    <div className="max-h-[440px] overflow-auto rounded-control border border-line">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr>
                                    <th className={TH}>변경 일시</th>
                                    <th className={TH}>처리 상태</th>
                                    <th className={TH}>처리 결과 메시지</th>
                                </tr>
                            </thead>
                            <tbody>
                                {statusRecords.length ? (
                                    statusRecords.map((r, idx) => (
                                        <tr
                                            key={r.processStatusChangeId ?? idx}
                                            className="border-t border-line hover:bg-subtle"
                                        >
                                            <td
                                                className={`${TD} whitespace-nowrap tabular-nums text-muted`}
                                            >
                                                {fmtTime(r.statusUpdateTime)}
                                            </td>
                                            <td className={TD}>
                                                <StatusBadge
                                                    code={r.changeStatus}
                                                    kind="proc"
                                                />
                                            </td>
                                            <td className={TD}>
                                                {r.statusResultMsg}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="px-4 py-8 text-center text-sm text-muted"
                                        >
                                            상태 변경 이력이 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </ModalFrame>
    )
}

function RequestTransmissionModal({
    reqId,
    transmissions,
    statusTransmissions,
    loading,
    error,
    onClose,
    onRefresh,
    refreshing,
}: {
    reqId?: string
    transmissions: EventTransmission[]
    statusTransmissions: StatusTransmission[]
    loading: boolean
    error: boolean
    onClose: () => void
    onRefresh?: () => void
    refreshing?: boolean
}) {
    const [tab, setTab] = useState<'value' | 'status'>('value')
    const valueRows = transmissions
    const statusRows = statusTransmissions

    const tabs = [
        { key: 'value' as const, label: '값 있음', count: valueRows.length },
        { key: 'status' as const, label: '값 없음', count: statusRows.length },
    ]

    return (
        <ModalFrame
            title="요청 전체 실행 내역"
            subtitle={reqId}
            widthClass="max-w-[1040px]"
            zClass="z-[60]"
            onClose={onClose}
            onRefresh={onRefresh}
            refreshing={refreshing}
        >
            <div className="mb-3">
                <SectionTitle
                    icon={Send}
                    title="이벤트 전송 결과"
                    hint="이 요청에 속한 모든 프로세스의 송수신 내역"
                />
            </div>
            <div className="mb-3 flex gap-1 border-b border-line">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
                            tab === t.key
                                ? 'border-main text-main'
                                : 'border-transparent text-muted hover:text-main'
                        }`}
                    >
                        {t.label}
                        <span className="ml-1.5 rounded-control bg-subtle px-1.5 py-0.5 text-xs tabular-nums">
                            {t.count}
                        </span>
                    </button>
                ))}
            </div>
            {loading ? (
                <p className="py-6 text-center text-muted">Loading...</p>
            ) : error ? (
                <p className="py-6 text-center text-muted">
                    실행 내역을 불러오지 못했습니다.
                </p>
            ) : tab === 'value' ? (
                <EventTransmissionTable rows={valueRows} showProcess />
            ) : (
                <StatusTransmissionTable rows={statusRows} />
            )}
        </ModalFrame>
    )
}

export default function DataTrackingDetailModal({
    isOpen,
    uuid,
    onClose,
}: Props) {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const [history, setHistory] = useState<StatusHistoryResponse | null>(null)
    const [historyLoading, setHistoryLoading] = useState(false)
    const [historyError, setHistoryError] = useState(false)

    const [selectedProc, setSelectedProc] = useState<ProcessItem | null>(null)
    const [showReqTrans, setShowReqTrans] = useState(false)

    useEffect(() => {
        if (isOpen && uuid) {
            setSelectedProc(null)
            setShowReqTrans(false)
            setHistory(null)
            setHistoryError(false)
            fetchDetail(uuid)
            fetchHistory(uuid)
        }
    }, [isOpen, uuid])

    const fetchDetail = async (uuid: string) => {
        setLoading(true)
        setData(null)
        try {
            const res = await fetch(
                trackingApi(`/tracking-process-list/${uuid}`),
                { cache: 'no-store' }
            )
            if (!res.ok) throw new Error(`상세 조회 실패 (${res.status})`)
            const result = await res.json()
            setData(result)
        } catch (err) {
            console.error(err)
            setData(null)
        } finally {
            setLoading(false)
        }
    }

    const fetchHistory = async (uuid: string) => {
        setHistoryLoading(true)
        setHistoryError(false)
        try {
            const res = await fetch(
                trackingApi(`/tracking-status-history/${uuid}`),
                { cache: 'no-store' }
            )
            if (!res.ok) throw new Error(`실행 내역 조회 실패 (${res.status})`)
            const result: StatusHistoryResponse = await res.json()
            setHistory(result || {})
        } catch (err) {
            console.error(err)
            setHistoryError(true)
            setHistory({})
        } finally {
            setHistoryLoading(false)
        }
    }

    const refresh = () => {
        if (!uuid) return
        fetchDetail(uuid)
        fetchHistory(uuid)
    }
    const refreshing = loading || historyLoading

    if (!isOpen) return null

    const procStatusList = history?.procStatusChangeList ?? []
    const eventTransList = history?.eventTransmissionList ?? []
    const statusTransList = history?.statusTransmissionList ?? []

    const selectedProcStatusRecords = selectedProc
        ? procStatusList.filter((r) => isSameProcess(selectedProc, r))
        : []

    const req = data?.trckReqInfo
    const procList: ProcessItem[] = data?.trckProcInfoList ?? []

    return (
        <ModalFrame
            title="트래킹 요청 상세"
            subtitle={req?.req_identifier}
            widthClass="max-w-[900px]"
            zClass="z-50"
            onClose={onClose}
            onRefresh={refresh}
            refreshing={refreshing}
        >
            {loading ? (
                <p className="py-6 text-center text-muted">Loading...</p>
            ) : data ? (
                <div className="space-y-6">
                    <div className="rounded-card border border-line bg-subtle px-5 py-4">
                        <dl className="grid grid-cols-3 gap-x-8 gap-y-3">
                            <Field label="요청 식별자">
                                {req?.req_identifier}
                            </Field>
                            <Field label="요청 UUID">
                                <span className="font-mono text-xs">
                                    {req?.['uuid-reqIdentifier']}
                                </span>
                            </Field>
                            <Field label="명령 처리 상태">
                                <StatusBadge
                                    code={req?.reqTrckCmdStatus}
                                    kind="req"
                                />
                            </Field>
                            <Field label="명령 시각">
                                {fmtTime(req?.reqTrckCmdTime)}
                            </Field>
                            <Field label="상태 변경 시각">
                                {fmtTime(req?.reqStatusChangeTime)}
                            </Field>
                            <Field label="프로세스 수">{procList.length}</Field>
                        </dl>
                    </div>

                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <SectionTitle
                                icon={ListTree}
                                title="프로세스 목록"
                            />
                            <button
                                onClick={() => setShowReqTrans(true)}
                                className="inline-flex items-center gap-1.5 rounded-control border border-line bg-white px-3 py-1.5 text-sm font-medium text-main hover:bg-subtle"
                            >
                                <Send size={14} />
                                요청 전체 실행 내역
                            </button>
                        </div>
                        <div className="max-h-[420px] overflow-auto rounded-control border border-line">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr>
                                        <th className={TH}>프로세스 식별자</th>
                                        <th className={TH}>트래킹 유형</th>
                                        <th className={TH}>처리 상태</th>
                                        <th className={TH}>생성 일시</th>
                                        <th className={TH}>상태 변경 일시</th>
                                        <th className={TH}>상세</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {procList.length ? (
                                        procList.map((item, idx) => (
                                            <tr
                                                key={
                                                    item.trckPrcIdtifier ?? idx
                                                }
                                                className="border-t border-line hover:bg-subtle"
                                            >
                                                <td
                                                    className={`${TD} whitespace-nowrap font-mono text-xs`}
                                                >
                                                    {item.trckPrcIdtifier}
                                                </td>
                                                <td
                                                    className={`${TD} whitespace-nowrap`}
                                                >
                                                    {item.trackingProcessType}
                                                </td>
                                                <td className={TD}>
                                                    <StatusBadge
                                                        code={
                                                            item.trackingStatus
                                                        }
                                                        kind="proc"
                                                    />
                                                </td>
                                                <td
                                                    className={`${TD} whitespace-nowrap tabular-nums text-muted`}
                                                >
                                                    {fmtTime(item.createTime)}
                                                </td>
                                                <td
                                                    className={`${TD} whitespace-nowrap tabular-nums text-muted`}
                                                >
                                                    {fmtTime(
                                                        item.trackingStatusChangeTime
                                                    )}
                                                </td>
                                                <td className={TD}>
                                                    <button
                                                        onClick={() =>
                                                            setSelectedProc(
                                                                item
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1 rounded-control bg-main px-3 py-1 text-xs font-medium text-white hover:bg-main-hover"
                                                    >
                                                        상태 이력
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-8 text-center text-sm text-muted"
                                            >
                                                프로세스 내역이 없습니다.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <p className="py-6 text-center text-muted">No Data</p>
            )}

            {selectedProc && (
                <ProcessHistoryModal
                    proc={selectedProc}
                    statusRecords={selectedProcStatusRecords}
                    loading={historyLoading}
                    error={historyError}
                    onClose={() => setSelectedProc(null)}
                    onRefresh={refresh}
                    refreshing={refreshing}
                />
            )}

            {showReqTrans && (
                <RequestTransmissionModal
                    reqId={req?.req_identifier}
                    transmissions={eventTransList}
                    statusTransmissions={statusTransList}
                    loading={historyLoading}
                    error={historyError}
                    onClose={() => setShowReqTrans(false)}
                    onRefresh={refresh}
                    refreshing={refreshing}
                />
            )}
        </ModalFrame>
    )
}
