import { useEffect, useState } from 'react'

interface Props {
    isOpen: boolean
    uuid: string | null
    onClose: () => void
}

const VITE_DATA_TRACKING_URL =
    import.meta.env.VITE_DATA_TRACKING_URL || 'http://localhost:22419'

export default function DataTrackingDetailModal({
    isOpen,
    uuid,
    onClose,
}: Props) {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen && uuid) {
            fetchDetail(uuid)
        }
    }, [isOpen, uuid])

    const fetchDetail = async (uuid: string) => {
        setLoading(true)
        try {
            const res = await fetch(
                `${VITE_DATA_TRACKING_URL}/fdt/detrck/rcv/tracking-process-list/${uuid}`
            )

            const result = await res.json()
            setData(result)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[900px] max-h-[80vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Tracking Detail</h2>

                {loading ? (
                    <p>Loading...</p>
                ) : data ? (
                    <>
                        <div className="mb-4 bg-gray-100 p-3 rounded text-sm">
                            <p>
                                <strong>Req ID:</strong>{' '}
                                {data.trckReqInfo?.req_identifier}
                            </p>
                            <p>
                                <strong>UUID:</strong>{' '}
                                {data.trckReqInfo?.['uuid-reqIdentifier']}
                            </p>
                            <p>
                                <strong>Status:</strong>{' '}
                                {data.trckReqInfo?.reqTrckCmdStatus}
                            </p>
                        </div>

                        <table className="w-full text-sm border">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-3 py-2">Identifier</th>
                                    <th className="px-3 py-2">Type</th>
                                    <th className="px-3 py-2">Status</th>
                                    <th className="px-3 py-2">Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.trckProcInfoList?.map(
                                    (item: any, idx: number) => (
                                        <tr key={idx} className="border-t">
                                            <td className="px-3 py-2">
                                                {item.trckPrcIdtifier}
                                            </td>
                                            <td className="px-3 py-2">
                                                {item.trackingProcessType}
                                            </td>
                                            <td className="px-3 py-2">
                                                {item.trackingStatus}
                                            </td>
                                            <td className="px-3 py-2">
                                                {item.createTime}
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </>
                ) : (
                    <p>No Data</p>
                )}

                <div className="flex justify-end mt-4">
                    <button
                        onClick={onClose}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    )
}
