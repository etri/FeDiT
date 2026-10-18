import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import DataTrackingDetailModal from './DataTrackingDetailModal'
import { getReqStatusMeta, isReqStatusActive } from './trackingStatus'
import { trackingApi } from '../../config/trackingApi'

type TrackingRequest = {
    reqIdentifier: string
    'uuid-reqIdentifier': string
    reqTrckCmdStatus: string
    reqTrckCmdTime: string
    reqStatusChangeTime: string
    processCnt: number
    trckPrcIdtifierList?: string[]
}

type TrackingListResponse = {
    totalCnt: number
    trckReqInfoList: TrackingRequest[]
}

function getDefaultRange() {
    const pad = (n: number) => String(n).padStart(2, '0')
    const now = new Date()
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        now.getDate()
    )}`
    const from = new Date(now.getTime() - 3 * 60 * 60 * 1000)
    const sameDay =
        from.getFullYear() === now.getFullYear() &&
        from.getMonth() === now.getMonth() &&
        from.getDate() === now.getDate()
    const timeFrom = sameDay
        ? `${pad(from.getHours())}:${pad(from.getMinutes())}`
        : '00:00'
    const timeTo = `${pad(now.getHours())}:${pad(now.getMinutes())}`
    return { dateFrom: today, dateTo: today, timeFrom, timeTo }
}

export default function DataTrackingList() {
    const [list, setList] = useState<TrackingRequest[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)

    const [searchKeyword, setSearchKeyword] = useState('')
    const [searchProcId, setSearchProcId] = useState('')
    const [dateFrom, setDateFrom] = useState(() => getDefaultRange().dateFrom)
    const [dateTo, setDateTo] = useState(() => getDefaultRange().dateTo)
    const [timeFrom, setTimeFrom] = useState(() => getDefaultRange().timeFrom)
    const [timeTo, setTimeTo] = useState(() => getDefaultRange().timeTo)

    const [statusFilter, setStatusFilter] = useState<
        'ALL' | 'ACTIVE' | 'ENDED'
    >('ALL')

    const resetSearch = () => {
        const d = getDefaultRange()
        setSearchKeyword('')
        setSearchProcId('')
        setDateFrom(d.dateFrom)
        setDateTo(d.dateTo)
        setTimeFrom(d.timeFrom)
        setTimeTo(d.timeTo)
        setStatusFilter('ALL')
    }

    const [selectedUUID, setSelectedUUID] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const fetchList = async () => {
        setLoading(true)
        setError(false)
        try {
            const res = await fetch(trackingApi('/tracking-request-list'), {
                cache: 'no-store',
            })

            if (!res.ok) throw new Error()

            const data: TrackingListResponse = await res.json()
            setList(data.trckReqInfoList || [])
        } catch (err) {
            console.error(err)
            setError(true)
            setList([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchList()
    }, [])

    const filteredList = list.filter((item) => {
        const matchKeyword = item.reqIdentifier
            .toLowerCase()
            .includes(searchKeyword.toLowerCase())

        const matchProcId =
            !searchProcId ||
            (item.trckPrcIdtifierList || []).some((id) =>
                (id || '').toLowerCase().includes(searchProcId.toLowerCase())
            )

        const itemDT = (item.reqTrckCmdTime || '').slice(0, 16)
        const fromDT = dateFrom ? `${dateFrom} ${timeFrom || '00:00'}` : ''
        const toDT = dateTo ? `${dateTo} ${timeTo || '23:59'}` : ''
        const matchDateFrom = !fromDT || itemDT >= fromDT
        const matchDateTo = !toDT || itemDT <= toDT

        const active = isReqStatusActive(item.reqTrckCmdStatus)
        const matchStatus =
            statusFilter === 'ALL' ||
            (statusFilter === 'ACTIVE' && active) ||
            (statusFilter === 'ENDED' && !active)

        return (
            matchKeyword &&
            matchProcId &&
            matchDateFrom &&
            matchDateTo &&
            matchStatus
        )
    })

    const handleRowClick = (uuid: string) => {
        setSelectedUUID(uuid)
        setIsModalOpen(true)
    }

    const handleCancel = async (uuid: string) => {
        if (!confirm('전체 Tracking을 취소하시겠습니까?')) return

        try {
            const res = await fetch(
                trackingApi(`/tracking-commands/${uuid}/trckProcInfos`),
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            )

            if (res.ok) {
                alert('취소 완료')
                fetchList()
            } else {
                alert('취소 실패')
            }
        } catch (err) {
            console.error(err)
            alert('에러 발생')
        }
    }

    return (
        <div className="flex w-full flex-col gap-[16px]">
            <div className="flex flex-wrap items-end gap-3 rounded-card border border-line bg-subtle px-4 py-3">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-muted">
                        요청 ID
                    </label>
                    <input
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        placeholder="Request ID"
                        className="border border-line px-3 py-2 rounded-control bg-white w-[200px]"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-muted">
                        프로세스 ID
                    </label>
                    <input
                        value={searchProcId}
                        onChange={(e) => setSearchProcId(e.target.value)}
                        placeholder="Process ID"
                        className="border border-line px-3 py-2 rounded-control bg-white w-[200px]"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-muted">
                        처리 상태
                    </label>
                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(
                                e.target.value as 'ALL' | 'ACTIVE' | 'ENDED'
                            )
                        }
                        className="border border-line px-3 py-2 rounded-control bg-white"
                    >
                        <option value="ALL">전체</option>
                        <option value="ACTIVE">진행중</option>
                        <option value="ENDED">종료됨</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-muted">
                        요청 기간
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="border border-line px-3 py-2 rounded-control bg-white"
                        />
                        <input
                            type="time"
                            value={timeFrom}
                            onChange={(e) => setTimeFrom(e.target.value)}
                            className="border border-line px-3 py-2 rounded-control bg-white"
                        />
                        <span className="text-muted">~</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="border border-line px-3 py-2 rounded-control bg-white"
                        />
                        <input
                            type="time"
                            value={timeTo}
                            onChange={(e) => setTimeTo(e.target.value)}
                            className="border border-line px-3 py-2 rounded-control bg-white"
                        />
                    </div>
                </div>

                <button
                    onClick={resetSearch}
                    className="border border-line bg-white px-4 py-2 rounded-control text-sm hover:bg-subtle"
                >
                    초기화
                </button>
                <button
                    onClick={fetchList}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 border border-line bg-white px-4 py-2 rounded-control text-sm hover:bg-subtle disabled:opacity-50"
                >
                    <RefreshCw
                        size={14}
                        className={loading ? 'animate-spin' : ''}
                    />
                    새로고침
                </button>
            </div>

            <div className="overflow-hidden rounded-card border border-line bg-white">
                <table className="w-full text-sm">
                    <thead className="bg-[var(--sky)]">
                        <tr>
                            <th className="px-4 py-3 text-left">Req ID</th>
                            <th className="px-4 py-3 text-left">UUID</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Process</th>
                            <th className="px-4 py-3 text-left">Time</th>
                            <th className="px-4 py-3 text-left">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="text-center py-6">
                                    Loading...
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan={6} className="text-center py-6">
                                    목록을 불러오지 못했습니다. 잠시 후 다시
                                    시도해주세요.
                                </td>
                            </tr>
                        ) : filteredList.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-6">
                                    No Data
                                </td>
                            </tr>
                        ) : (
                            filteredList.map((item) => (
                                <tr
                                    key={item['uuid-reqIdentifier']}
                                    className="border-t border-line cursor-pointer hover:bg-subtle"
                                    onClick={() =>
                                        handleRowClick(
                                            item['uuid-reqIdentifier']
                                        )
                                    }
                                >
                                    <td className="px-4 py-3">
                                        {item.reqIdentifier}
                                    </td>
                                    <td className="px-4 py-3">
                                        {item['uuid-reqIdentifier']}
                                    </td>
                                    <td className="px-4 py-3">
                                        {(() => {
                                            const meta = getReqStatusMeta(
                                                item.reqTrckCmdStatus
                                            )
                                            return (
                                                <span
                                                    className={`inline-block rounded-control px-2 py-1 text-xs font-medium ${meta.badge}`}
                                                >
                                                    {meta.label
                                                        ? `${meta.label} (${item.reqTrckCmdStatus})`
                                                        : item.reqTrckCmdStatus}
                                                </span>
                                            )
                                        })()}
                                    </td>
                                    <td className="px-4 py-3">
                                        {item.processCnt}
                                    </td>
                                    <td className="px-4 py-3">
                                        {item.reqTrckCmdTime}
                                    </td>

                                    <td className="px-4 py-3">
                                        {isReqStatusActive(
                                            item.reqTrckCmdStatus
                                        ) ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleCancel(
                                                        item[
                                                            'uuid-reqIdentifier'
                                                        ]
                                                    )
                                                }}
                                                className="bg-[var(--color-danger)] hover:bg-[var(--color-danger-hover)] text-white px-3 py-1 rounded-control text-sm"
                                            >
                                                Cancel
                                            </button>
                                        ) : (
                                            <span className="text-muted text-sm">
                                                -
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <DataTrackingDetailModal
                isOpen={isModalOpen}
                uuid={selectedUUID}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    )
}
