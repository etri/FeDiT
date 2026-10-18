import { useEffect, useState } from 'react'
import { trackingApi } from '../../config/trackingApi'

interface TrackingResultModalProps {
    isOpen: boolean
    sentData: any
    responseData: any
    onClose: () => void
}

export default function DataTrackingResultModal({
    isOpen,
    sentData,
    responseData,
    onClose,
}: TrackingResultModalProps) {
    const [trackingUUIDs, setTrackingUUIDs] = useState<
        { trckPrcIdtifier: string; uuid: string }[]
    >([])

    const [uuidReqIdentifier, setUuidReqIdentifier] = useState<string>('')

    useEffect(() => {
        if (isOpen && responseData) {
            setUuidReqIdentifier(responseData['uuid-reqIdentifier'] || '')

            if (Array.isArray(responseData.trckProcInfo)) {
                const uuids = responseData.trckProcInfo
                    .filter((item: any) => item['uuid-trckPrcIdtifier'])
                    .map((item: any) => ({
                        trckPrcIdtifier: item.trckPrcIdtifier,
                        uuid: item['uuid-trckPrcIdtifier'],
                    }))
                setTrackingUUIDs(uuids)
            }
        }
    }, [isOpen, responseData])

    const handleClickCancelButton = async (uuid: string) => {
        if (!window.confirm('해당 트래킹을 취소하시겠습니까?')) return

        try {
            const res = await fetch(
                trackingApi(
                    `/tracking-commands/${uuidReqIdentifier}/trckProcInfos/${uuid}`
                ),
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            )

            if (res.ok) {
                alert('개별 취소가 성공하였습니다. \n')
                setTrackingUUIDs((prev) =>
                    prev.filter((item) => item.uuid !== uuid)
                )
            } else {
                alert('개별 취소 중 오류 발생 관리자에게 문의해 주십시오. \n')
            }
        } catch (err) {
            alert('개별 취소 중 오류 발생: ' + err)
        }
    }

    const handleClickAllCancelButton = async () => {
        if (!uuidReqIdentifier) {
            alert('uuid-reqIdentifier 값이 없습니다.')
            return
        }

        if (!window.confirm('전체 트래킹을 취소하시겠습니까?')) return

        try {
            const res = await fetch(
                trackingApi(
                    `/tracking-commands/${uuidReqIdentifier}/trckProcInfos`
                ),
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            )

            if (res.ok) {
                alert('전체 취소가 성공하였습니다. \n')
                setTrackingUUIDs([])
            } else {
                alert('전체 취소 중 오류 발생 관리자에게 문의해 주십시오. \n')
            }
        } catch (err) {
            alert('전체 취소 중 오류 발생: ' + err)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/10 backdrop-brightness-90 flex items-center justify-center z-50">
            <div className="bg-white rounded-card p-6 w-[90vw] max-w-[900px] max-h-[80vh] overflow-y-auto shadow-lg">
                <h2 className="text-xl font-bold mb-4">전송 결과</h2>

                <div className="mb-4">
                    <p className="font-semibold">전송한 데이터:</p>
                    <pre className="bg-subtle text-sm p-3 rounded-control overflow-x-auto">
                        {JSON.stringify(sentData, null, 2)}
                    </pre>
                </div>

                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold">서버 응답 (Raw):</p>
                        <button
                            onClick={handleClickAllCancelButton}
                            className="bg-[var(--color-danger)] hover:bg-[var(--color-danger-hover)] text-white px-3 py-1 rounded-control text-sm"
                        >
                            전체 취소
                        </button>
                    </div>

                    <div className="mb-4 text-sm bg-subtle rounded-control p-3">
                        <p>
                            <strong>reqIdentifier:</strong>{' '}
                            {responseData?.requestIdtifier ||
                                responseData?.reqIdentifier ||
                                '-'}
                        </p>
                        <p>
                            <strong>uuid-reqIdentifier:</strong>{' '}
                            {responseData?.['uuid-reqIdentifier'] || '-'}
                        </p>
                    </div>

                    {trackingUUIDs.length > 0 && (
                        <table className="w-full text-sm border border-line">
                            <thead className="bg-subtle">
                                <tr>
                                    <th className="border border-line px-4 py-2 text-left">
                                        Tracking ID
                                    </th>
                                    <th className="border border-line px-4 py-2 text-left">
                                        UUID
                                    </th>
                                    <th className="border border-line px-4 py-2 text-center">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {trackingUUIDs.map((item) => (
                                    <tr key={item.uuid}>
                                        <td className="border border-line px-4 py-2">
                                            {item.trckPrcIdtifier}
                                        </td>
                                        <td className="border border-line px-4 py-2 break-all">
                                            {item.uuid}
                                        </td>
                                        <td className="border border-line px-4 py-2 text-center">
                                            <button
                                                onClick={() =>
                                                    handleClickCancelButton(
                                                        item.uuid
                                                    )
                                                }
                                                className="bg-[var(--color-danger)] hover:bg-[var(--color-danger-hover)] text-white px-3 py-1 rounded-control"
                                            >
                                                개별 취소
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="flex justify-end mt-4">
                    <button
                        onClick={onClose}
                        className="bg-main hover:bg-main-hover text-white px-4 py-2 rounded-control"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    )
}
