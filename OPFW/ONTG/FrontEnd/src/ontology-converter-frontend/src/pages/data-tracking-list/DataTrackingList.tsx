import { useEffect, useState } from 'react'
import DataTrackingDetailModal from './DataTrackingDetailModal'

const VITE_DATA_TRACKING_URL =
    import.meta.env.VITE_DATA_TRACKING_URL || 'http://localhost:22419'

type TrackingRequest = {
    reqIdentifier: string
    'uuid-reqIdentifier': string
    reqTrckCmdStatus: string
    reqTrckCmdTime: string
    reqStatusChangeTime: string
    processCnt: number
}

type TrackingListResponse = {
    totalCnt: number
    trckReqInfoList: TrackingRequest[]
}

export default function DataTrackingList() {
    const [list, setList] = useState<TrackingRequest[]>([])
    const [loading, setLoading] = useState(false)

    const [searchKeyword, setSearchKeyword] = useState('')

    const [selectedUUID, setSelectedUUID] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const fetchList = async () => {
        setLoading(true)
        try {
            const res = await fetch(
                `${VITE_DATA_TRACKING_URL}/fdt/detrck/rcv/tracking-request-list`
            )

            if (!res.ok) throw new Error()

            const data: TrackingListResponse = await res.json()
            setList(data.trckReqInfoList || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchList()
    }, [])

    const filteredList = list.filter((item) =>
        item.reqIdentifier.toLowerCase().includes(searchKeyword.toLowerCase())
    )

    const handleRowClick = (uuid: string) => {
        setSelectedUUID(uuid)
        setIsModalOpen(true)
    }

    const handleCancel = async (uuid: string) => {
        if (!confirm('전체 Tracking을 취소하시겠습니까?')) return

        try {
            const res = await fetch(
                `${VITE_DATA_TRACKING_URL}/dataeventtrackingservice/fdt/detrck/rcv/tracking-commands/${uuid}/trckProcInfos`,
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
            <div className="flex items-center justify-between">
                <h2 className="text-[20px] font-bold">Data Tracking List</h2>

                <button
                    onClick={fetchList}
                    className="bg-blue-400 text-white px-4 py-2 rounded-md"
                >
                    Refresh
                </button>
            </div>

            <div className="flex gap-2">
                <input
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Search Request ID"
                    className="border px-3 py-2 rounded w-[250px]"
                />
            </div>

            <div className="rounded border bg-white">
                <table className="w-full text-sm">
                    <thead className="bg-gray-200">
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
                        ) : filteredList.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-6">
                                    No Data
                                </td>
                            </tr>
                        ) : (
                            filteredList.map((item, idx) => (
                                <tr
                                    key={idx}
                                    className="border-t cursor-pointer hover:bg-gray-50"
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
                                        {item.reqTrckCmdStatus}
                                    </td>
                                    <td className="px-4 py-3">
                                        {item.processCnt}
                                    </td>
                                    <td className="px-4 py-3">
                                        {item.reqTrckCmdTime}
                                    </td>

                                    <td className="px-4 py-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleCancel(
                                                    item['uuid-reqIdentifier']
                                                )
                                            }}
                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                                        >
                                            Cancel
                                        </button>
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
