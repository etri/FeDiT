import DataTrackingFormItem from './DataTrackingFormItem.tsx'
import TrackingResultModal from '../data-tracking-list/DataTrackingResultModal.tsx'
import { useState } from 'react'
import { trackingCommandApi } from '../../config/trackingApi'

const EMPTY_ITEM_FIELDS = {
    trckPrcIdtifier: '',
    federatedTwinId: '',
    federatedDigitalObjectId: '',
    digitalObjId: '',
    trckTopic: '',
    digitalObjectPath: '',
    objectValueType: '',
    contextUrl: '',
    entityId: '',
    ngsiType: '',
    timeproperty: '',
    valueExtract: '',
    evntDelay: '',
    bufferSize: '',
    ctrlStatement: '',
    evntOccrCnt: '',
    evntEndDt: '',
    evntEndDtSelect: '',
    evntCheck: '',
    trackingProcess: '',
    dataFilterType: '',
    evntConditionType: 'CP',
    objectValueTypeSource: '',
    warnings: [] as string[],
    targetGroupId: 0,
}

let idSeq = 0
const nextItemId = () => Date.now() * 1000 + idSeq++

const createEmptyItem = () => ({ id: nextItemId(), ...EMPTY_ITEM_FIELDS })

interface ConfirmedProcess {
    trackingProcessIdentifier?: string
    trackTopic?: string
    objectValueType?: string
    objectValueTypeSource?: string
    federatedTwinId?: string
    federatedDigitalObjectId?: string
    warnings?: string[]
}

export default function DataTrackingForm() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [sentData, setSentData] = useState<any>(null)
    const [responseData, setResponseData] = useState<any>(null)

    const [formDataList, setFormDataList] = useState([createEmptyItem()])

    const [reqIdentifier, setReqIdentifier] = useState('')
    const [callBackURL, setCallBackURL] = useState('')

    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleChange = (id: number, field: string, value: string) => {
        setFormDataList((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item

                if (
                    field === 'trackingProcess' &&
                    value !== item.trackingProcess
                ) {
                    return {
                        ...item,
                        ...EMPTY_ITEM_FIELDS,
                        trackingProcess: value,
                    }
                }

                return { ...item, [field]: value }
            })
        )
    }

    const toProcessIdentifier = (index: number, trackingProcess?: string) =>
        `${trackingProcess === 'ETP' ? 'ET' : 'DT'}-${String(
            index + 1
        ).padStart(2, '0')}`

    const resolveProcessIdentifier = (
        item: { trckPrcIdtifier?: string; trackingProcess?: string },
        index: number
    ) =>
        item.trckPrcIdtifier?.trim() ||
        toProcessIdentifier(index, item.trackingProcess)

    const buildPayload = () => ({
        reqIdentifier: reqIdentifier.trim(),
        callBackURL: callBackURL.trim(),
        processes: formDataList.map((item, index) => {
            const eventOccurCount = parseInt(item.evntOccrCnt)

            const endDateValue = parseInt(item.evntEndDt)
            const eventEndDate =
                item.evntEndDtSelect?.trim() && !isNaN(endDateValue)
                    ? JSON.stringify({
                          INTERVAL: item.evntEndDtSelect,
                          VALUE: endDateValue,
                      })
                    : ''

            return {
                trackingProcessIdentifier: resolveProcessIdentifier(
                    item,
                    index
                ),
                trackingType: item.trackingProcess,

                contextUrl: item.contextUrl,
                entityId: item.entityId,
                type: item.ngsiType,
                timeproperty: item.timeproperty,
                valueExtract: item.valueExtract,

                eventDelay: parseInt(item.evntDelay),
                bufferSize: parseInt(item.bufferSize),
                dataFilterType: item.dataFilterType,
                eventConditionCheckable: item.evntCheck === 'true',
                controlStatement: item.ctrlStatement,
                eventOccurCount: isNaN(eventOccurCount) ? 100 : eventOccurCount,
                eventEndDate,
            }
        }),
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (isSubmitting) return

        if (!reqIdentifier.trim() || !callBackURL.trim()) {
            alert('Request Identifier와 Callback URL을 모두 입력해주세요.')
            return
        }

        function isItemValid(
            item: any,
            trackingProcess: 'DTP' | 'ETP'
        ): { isValid: boolean; invalidFields: string[] } {
            const invalidFields: string[] = []

            if (!item.trackingProcess?.trim())
                invalidFields.push('Tracking Type')

            if (trackingProcess === 'DTP') {
                const tupleFilled =
                    !!item.contextUrl?.trim() &&
                    !!item.entityId?.trim() &&
                    !!item.ngsiType?.trim() &&
                    !!item.timeproperty?.trim() &&
                    !!item.valueExtract?.trim()
                if (!tupleFilled) invalidFields.push('NGSI-LD 대상')

                if (!item.evntDelay?.trim())
                    invalidFields.push('Event Delay (ms)')
                if (!item.bufferSize?.trim()) invalidFields.push('Buffer Size')
                if (!item.dataFilterType?.trim())
                    invalidFields.push('Data Filter Type')
            } else if (trackingProcess === 'ETP') {
                if (!item.evntDelay?.trim())
                    invalidFields.push('Event Delay (ms)')
                else if (!(parseInt(item.evntDelay) > 0))
                    invalidFields.push('Event Delay (ms) — 0보다 커야 함')
                if (!item.bufferSize?.trim()) invalidFields.push('Buffer Size')
                if (!item.evntConditionType?.trim())
                    invalidFields.push('Event Condition Type')
                if (!item.ctrlStatement?.trim())
                    invalidFields.push('Control Statement')
                if (!item.evntEndDt?.trim())
                    invalidFields.push('Event End Date')
                if (!item.evntEndDtSelect?.trim())
                    invalidFields.push('Event End Date (단위)')
            } else {
                invalidFields.push('Tracking Type')
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
            console.group(
                '%c[전송 차단 · 필수값 누락]',
                'color:#e7000b;font-weight:bold'
            )
            console.log('invalidItems', invalidItems)
            console.log('현재 payload', buildPayload())
            console.groupEnd()
            alert(message)
            return
        }

        const duplicateIds = formDataList
            .map((item) => item.trckPrcIdtifier.trim())
            .filter((id) => id !== '')
            .filter((id, index, arr) => arr.indexOf(id) !== index)

        if (duplicateIds.length > 0) {
            alert(
                `Tracking Process Identifier가 중복되었습니다.\n\n${[
                    ...new Set(duplicateIds),
                ].join('\n')}`
            )
            return
        }

        const missingType = formDataList.filter(
            (i) => !i.trackingProcess?.trim()
        )
        if (missingType.length > 0) {
            alert('트래킹 타입(DTP/ETP)을 선택하지 않은 프로세스가 있습니다.')
            return
        }

        const payload = buildPayload()

        console.group('%c[트래킹 명령 전송]', 'color:#0288b5;font-weight:bold')
        console.log('POST', trackingCommandApi('/commands'))
        console.log('payload', payload)
        console.log('JSON\n' + JSON.stringify(payload, null, 2))
        console.groupEnd()

        setSentData(payload)

        setIsSubmitting(true)
        try {
            const res = await fetch(trackingCommandApi('/commands'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const errBody = await res.json().catch(() => null)
                throw new Error(
                    `전송 실패 (${res.status})` +
                        (errBody?.error ? ` - ${errBody.error}` : '')
                )
            }
            const result = await res.json()

            console.group(
                '%c[트래킹 명령 응답]',
                'color:#0288b5;font-weight:bold'
            )
            console.log('status', res.status)
            console.log('result', result)
            console.groupEnd()

            setResponseData(result)

            const confirmed: ConfirmedProcess[] = Array.isArray(
                result?.processes
            )
                ? result.processes
                : []
            if (confirmed.length > 0) {
                setFormDataList((prev) =>
                    prev.map((item, index) => {
                        const c = confirmed[index]
                        if (!c) return item
                        return {
                            ...item,
                            trckPrcIdtifier:
                                c.trackingProcessIdentifier ??
                                item.trckPrcIdtifier,
                            federatedTwinId: c.federatedTwinId ?? '',
                            federatedDigitalObjectId:
                                c.federatedDigitalObjectId ?? '',
                            trckTopic: c.trackTopic ?? '',
                            objectValueType: c.objectValueType ?? '',
                            objectValueTypeSource:
                                c.objectValueTypeSource ?? '',
                            warnings: c.warnings ?? [],
                        }
                    })
                )
            }
            setIsModalOpen(true)
        } catch (err) {
            alert('전송 중 오류 발생:' + err)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAddProcess = () => {
        setFormDataList((prev) => [...prev, createEmptyItem()])
    }

    const handleApplyTargets = (
        id: number,
        targets: {
            contextUrl: string
            entityId: string
            type: string
            timeproperty: string
            valueExtract: string
        }[],
        preview: {
            federatedTwinId: string | null
            federatedDigitalObjectId: string | null
            trackTopic: string
            objectValueType: string
            objectValueTypeSource: string
        }
    ) => {
        if (targets.length === 0) return
        setFormDataList((prev) => {
            const base = prev.find((item) => item.id === id)
            if (!base) return prev

            const cleaned = prev.filter(
                (item) =>
                    item.id === base.id ||
                    !base.targetGroupId ||
                    item.targetGroupId !== base.targetGroupId
            )
            const index = cleaned.findIndex((item) => item.id === base.id)
            const targetGroupId = base.id

            const filled = targets.map((t, i) => ({
                ...base,
                ...(i === 0 ? {} : EMPTY_ITEM_FIELDS),
                trackingProcess: base.trackingProcess,
                targetGroupId,
                id: i === 0 ? base.id : nextItemId(),
                trckPrcIdtifier: i === 0 ? base.trckPrcIdtifier : '',
                warnings: [] as string[],
                contextUrl: t.contextUrl,
                entityId: t.entityId,
                ngsiType: t.type,
                timeproperty: t.timeproperty,
                valueExtract: t.valueExtract,
                federatedTwinId: preview.federatedTwinId ?? '',
                federatedDigitalObjectId:
                    preview.federatedDigitalObjectId ?? '',
                trckTopic: preview.trackTopic,
                objectValueType: preview.objectValueType,
                objectValueTypeSource: preview.objectValueTypeSource,
                digitalObjectPath: t.valueExtract,
            }))
            return [
                ...cleaned.slice(0, index),
                ...filled,
                ...cleaned.slice(index + 1),
            ]
        })
    }

    const handleRemoveProcess = (id: number) => {
        setFormDataList((prev) => {
            if (prev.length <= 1) {
                return prev.map((item) =>
                    item.id === id
                        ? { ...item, ...EMPTY_ITEM_FIELDS, trackingProcess: '' }
                        : item
                )
            }
            return prev.filter((item) => item.id !== id)
        })
    }

    return (
        <>
            <form
                onSubmit={handleSubmit}
                action="#"
                className="mb-4 flex w-full flex-col gap-[16px] rounded-card border border-line bg-subtle px-6 py-8"
            >
                <div className="flex">
                    <div className="w-[340px]">
                        <p className="font-bold text-sm">Request Identifier</p>
                        <p className="mt-1 text-sm text-muted">
                            트래킹 명령 요청 식별자
                        </p>
                    </div>
                    <div className="flex-grow">
                        <input
                            name="reqIdentifier"
                            className="w-full rounded-control border border-line bg-white px-4 py-2 text-sm placeholder-gray-400"
                            placeholder="RQ-987"
                            value={reqIdentifier}
                            onChange={(e) => setReqIdentifier(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex">
                    <div className="w-[340px]">
                        <p className="font-bold text-sm">Callback URL</p>
                        <p className="mt-1 text-sm text-muted">
                            트래킹 이벤트 수신을 위한 응답 받을 URL
                        </p>
                    </div>
                    <div className="flex-grow">
                        <input
                            name="callBackURL"
                            className="w-full rounded-control border border-line bg-white px-4 py-2 text-sm placeholder-gray-400"
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
                        className="bg-main text-white px-4 py-2 rounded-control hover:bg-main-hover transition-colors duration-100"
                        onClick={handleAddProcess}
                    >
                        Add Process
                    </button>
                </div>

                {formDataList.map((item, index) => (
                    <DataTrackingFormItem
                        key={item.id}
                        id={item.id}
                        processIdentifier={toProcessIdentifier(
                            index,
                            item.trackingProcess
                        )}
                        formData={item}
                        onChange={handleChange}
                        onApplyTargets={handleApplyTargets}
                        onRemove={handleRemoveProcess}
                    />
                ))}

                <div className="flex w-full flex-col items-end">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-main text-white px-4 py-2 rounded-control mt-2 hover:bg-main-hover transition-colors duration-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSubmitting ? '전송 중...' : 'Submit'}
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
