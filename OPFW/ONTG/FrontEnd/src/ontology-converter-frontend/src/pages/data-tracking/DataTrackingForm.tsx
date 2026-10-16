import DataTrackingFormItem from './DataTrackingFormItem.tsx'
import TrackingResultModal from './DataTrackingResultModal.tsx'
import { useState } from 'react'

const VITE_DATA_TRACKING_URL =
    import.meta.env.VITE_DATA_TRACKING_URL || 'http://{serverIp}'

export default function DataTrackingForm() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [sentData, setSentData] = useState<any>(null)
    const [responseData, setResponseData] = useState<any>(null)

    const [formDataList, setFormDataList] = useState([
        {
            id: Date.now(),
            trackingType: '',
            federatedTwinId: '',
            federatedDigitalObjectId: '',
            digitalTwinsId: '',
            digitalObjId: '',
            trckTopic: '',
            digitalObjectPath: '',
            objectValueType: '',
            evntDelay: '',
            bufferSize: '',
            ctrlStatement: '',
            evntOccrCnt: '',
            evntEndDt: '',
            evntEndDtSelect: '',
            evntCheck: '',
            trackingProcess: '',
            dataFilterType: '',
            evntConditionType: '',
        },
    ])

    const [reqIdentifier, setReqIdentifier] = useState('')
    const [callBackURL, setCallBackURL] = useState('')

    const handleChange = (id: number, field: string, value: string) => {
        setFormDataList((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            )
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!reqIdentifier.trim() || !callBackURL.trim()) {
            alert('Request Identifier와 Callback URL을 모두 입력해주세요.')
            return
        }

        function isItemValid(
            item: any,
            trackingProcess: 'DTP' | 'ETP'
        ): { isValid: boolean; invalidFields: string[] } {
            const invalidFields: string[] = []

            if (trackingProcess === 'DTP') {
                if (!item.trackingType?.trim())
                    invalidFields.push('trckPrcIdtifier')
                if (!item.trackingProcess?.trim()) invalidFields.push('trckTp')
                if (!item.federatedTwinId?.trim())
                    invalidFields.push('federatedTwinId')
                if (!item.federatedDigitalObjectId?.trim())
                    invalidFields.push('federateDigitalObjectId')
                if (!item.digitalObjId?.trim())
                    invalidFields.push('digitalObjectId')
                if (!item.trckTopic?.trim()) invalidFields.push('trckTopic')
                if (!item.digitalObjectPath?.trim())
                    invalidFields.push('trckValInfo.digitalObjectPath')
                if (!item.objectValueType?.trim())
                    invalidFields.push('trckValInfo.objValType')
                if (!item.evntDelay?.trim()) invalidFields.push('evntDelay')
                if (!item.bufferSize?.trim()) invalidFields.push('bufferSize')
                if (!item.dataFilterType?.trim()) invalidFields.push('dtFltTp')
            } else if (trackingProcess === 'ETP') {
                if (!item.evntDelay?.trim()) invalidFields.push('evntDelay')
                if (!item.trackingType?.trim())
                    invalidFields.push('trckPrcIdtifier')
                if (!item.trackingProcess?.trim()) invalidFields.push('trckTp')
                if (!item.evntConditionType?.trim())
                    invalidFields.push('evntConditionType')
                if (!item.ctrlStatement?.trim())
                    invalidFields.push('ctrlStatement')
                if (!item.evntEndDt?.trim()) invalidFields.push('evntEndDt')
                if (!item.evntEndDtSelect?.trim())
                    invalidFields.push('evntEndDtSelect')
            } else {
                invalidFields.push('trackingProcess')
            }

            return { isValid: invalidFields.length === 0, invalidFields }
        }

        const invalidItems: { index: number; fields: string[] }[] = []

        formDataList.forEach((item, index) => {
            const { isValid, invalidFields } = isItemValid(
                item,
                item.trackingProcess as 'DTP' | 'ETP'
            )
            if (!isValid) {
                invalidItems.push({ index, fields: invalidFields })
            }
        })

        if (invalidItems.length > 0) {
            let message = '다음 항목들이 비어 있습니다:\n'
            invalidItems.forEach(({ index, fields }) => {
                message += `- 항목 ${index + 1}: ${fields.join(', ')}\n`
            })
            alert(message)
            return
        }

        const payload = {
            reqIdentifier,
            callBackURL,
            trckProcInfo: formDataList.map((item) => ({
                trckTp: item.trackingProcess,
                trckPrcIdtifier: item.trackingType,
                federatedTwinId: item.federatedTwinId,
                federatedDigitalObjectId: item.federatedDigitalObjectId,
                digitalObjId: item.digitalObjId,
                trckTopic: item.trckTopic,
                trckValInfo: JSON.stringify({
                    digitalObjectPath: item.digitalObjectPath,
                    objValType: item.objectValueType,
                }),
                evntDelay: parseInt(item.evntDelay),
                bufferSize: parseInt(item.bufferSize),
                dtFltTp: item.dataFilterType,
                evntCondition: JSON.stringify({
                    checkable: item.evntCheck === 'true',
                }),
                evntOccrCnt: parseInt(item.evntOccrCnt),
                evntEndDt: JSON.stringify({
                    INTERVAL: item.evntEndDtSelect,
                    VALUE: parseInt(item.evntEndDt),
                }),
            })),
        }

        setSentData(payload)

        try {
            const res = await fetch(
                `${VITE_DATA_TRACKING_URL}/dataeventtrackingservice/fdt/detrck/rcv/tracking-commands`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }
            )

            if (!res.ok) throw new Error('전송 실패')
            const result = await res.json()

            setResponseData(result)
            setIsModalOpen(true)
        } catch (err) {
            alert('전송 중 오류 발생:' + err)
        }
    }

    const handleAddProcess = () => {
        setFormDataList((prev) => [
            ...prev,
            {
                id: Date.now(),
                trackingType: '',
                federatedTwinId: '',
                federatedDigitalObjectId: '',
                digitalTwinsId: '',
                digitalObjId: '',
                trckTopic: '',
                digitalObjectPath: '',
                objectValueType: '',
                evntDelay: '',
                bufferSize: '',
                ctrlStatement: '',
                evntOccrCnt: '',
                evntEndDt: '',
                evntEndDtSelect: '',
                evntCheck: '',
                trackingProcess: '',
                dataFilterType: '',
                evntConditionType: '',
                unit: '',
                upperLimit: '',
                lowerLimit: '',
                pattern: '',
                threshold: '',
            },
        ])
    }

    const handleRemoveProcess = (id: number) => {
        setFormDataList((prev) => prev.filter((item) => item.id !== id))
    }

    return (
        <>
            <form
                onSubmit={handleSubmit}
                action="#"
                className="mb-4 flex w-full flex-col gap-[16px] rounded border bg-gray-100 px-6 py-8"
            >
                <div className="flex">
                    <div className="w-[340px]">
                        <p className="font-bold text-sm">Request Identifier</p>
                        <p className="mt-1 text-sm text-gray-600">
                            트래킹 명령 요청 식별자
                        </p>
                    </div>
                    <div className="flex-grow">
                        <input
                            name="reqIdentifier"
                            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm placeholder-gray-400"
                            placeholder="RQ-987"
                            value={reqIdentifier}
                            onChange={(e) => setReqIdentifier(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex">
                    <div className="w-[340px]">
                        <p className="font-bold text-sm">Callback URL</p>
                        <p className="mt-1 text-sm text-gray-600">
                            트래킹 이벤트 수신을 위한 응답 받을 URL
                        </p>
                    </div>
                    <div className="flex-grow">
                        <input
                            name="callBackURL"
                            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm placeholder-gray-400"
                            placeholder="https://your-callback-url.com"
                            value={callBackURL}
                            onChange={(e) => setCallBackURL(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <h3 className="text-[16px] font-bold">
                        트래킹 프로세스 정보 (Tracking Process Information)
                    </h3>
                    <button
                        type="button"
                        className="bg-blue-400 text-white px-4 py-2 rounded-md hover:bg-blue-500 transition"
                        onClick={handleAddProcess}
                    >
                        Add Process
                    </button>
                </div>

                {formDataList.map((item) => (
                    <DataTrackingFormItem
                        key={item.id}
                        id={item.id}
                        formData={item}
                        onChange={handleChange}
                        onRemove={handleRemoveProcess}
                    />
                ))}

                <div className="flex w-full flex-col items-end">
                    <p className="text-red-500 text-sm">Form contains errors</p>
                    <button
                        type="submit"
                        className="bg-blue-400 text-white px-4 py-2 rounded-md mt-2 hover:bg-blue-500 transition"
                    >
                        Submit
                    </button>
                </div>
            </form>

            <TrackingResultModal
                isOpen={isModalOpen}
                sentData={sentData}
                responseData={responseData}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    )
}
