import { useEffect, useState } from 'react'
import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'
import NDXProSelector from '../ndxpro-test/NDXProSelector.tsx'
import type {
    NgsiTuple,
    TuplePreview,
} from '../ndxpro-test/NDXProSelector.tsx'

const DTMETA_BASE_URL = ''

interface SchemaProperty {
    type?: string
    title?: string
}
interface FederatedDigitalTwinObject {
    dtoid?: string
    digitalTwinObjectData?: {
        schemaInformation?: {
            properties?: Record<string, SchemaProperty>
        }
    }
}
interface DigitalTwinSearchRow {
    federatedDigitalTwinObjects?: FederatedDigitalTwinObject[]
}

const SHOW_DIGITAL_OBJ_ID = false

const SHOW_TRACK_TOPIC = false

interface Props {
    id: number
    processIdentifier: string
    formData: {
        trckPrcIdtifier: string
        federatedTwinId: string
        federatedDigitalObjectId: string
        digitalObjId: string
        trckTopic: string
        digitalObjectPath: string
        objectValueType: string
        contextUrl: string
        entityId: string
        ngsiType: string
        timeproperty: string
        valueExtract: string
        objectValueTypeSource: string
        warnings: string[]
        evntDelay: string
        bufferSize: string
        ctrlStatement: string
        evntOccrCnt: string
        evntEndDt: string
        evntEndDtSelect: string
        evntCheck: string
        trackingProcess: string
        dataFilterType: string
        evntConditionType: string
    }
    onChange: (id: number, field: string, value: string) => void
    onApplyTargets: (
        id: number,
        targets: NgsiTuple[],
        preview: TuplePreview
    ) => void
    onRemove: (id: number) => void
}

export default function DataTrackingFormItem({
    id,
    processIdentifier,
    formData,
    onChange,
    onApplyTargets,
    onRemove,
}: Props) {
    const token =
        '{metaToken}'

    const [isFolded, setIsFolded] = useState<boolean>(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isNgsiOpen, setIsNgsiOpen] = useState(false)

    interface DigitalTwinItem {
        id: string
        name: string
        description: string
        keywords?: string[]
        keywordMapping?: { keyword: string; memberId: string }[]
        fieldType?: string
    }

    const [digitalTwinIdList, setDigitalTwinIdList] = useState<
        DigitalTwinItem[]
    >([])
    const [modalTargetField, setModalTargetField] = useState<string>('')

    const [currentPage, setCurrentPage] = useState(1)
    const rowsPerPage = 5
    const totalPages = Math.ceil(digitalTwinIdList.length / rowsPerPage)

    type KeywordPair = { keyword: string; memberId: string }
    const [selectedFDO, setSelectedFDO] = useState<{
        id: string
        name: string
        description: string
        keywordPairs: KeywordPair[]
    } | null>(null)

    useEffect(() => {
        setSelectedFDO(null)
    }, [formData.trackingProcess])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsModalOpen(false)
            }
        }

        if (isModalOpen) {
            window.addEventListener('keydown', handleKeyDown)
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [isModalOpen])

    const openLookupModal = async (targetField: string) => {
        let url = ''
        let params = {}
        let resultList: any[] = []

        if (targetField === 'federatedTwinId') {
            url = `/fedit/v1/federated-twins`
        } else if (targetField === 'federatedDigitalObjectId') {
            if (!formData.federatedTwinId) {
                alert('먼저 Federated Twin ID를 선택하세요.')
                return
            }
            url = `/fedit/v1/federated-twins/${formData.federatedTwinId}/federated-digital-objects`
            params = { federatedTwinId: formData.federatedTwinId }
        } else if (targetField === 'digitalObjId') {
            if (!selectedFDO || !selectedFDO.keywordPairs?.length) {
                alert(
                    '먼저 Federated Digital Object ID 목록에서 항목을 선택하세요.'
                )
                return
            }
            const pairs = selectedFDO.keywordPairs.map((p) => ({
                id: p.memberId,
                name: p.keyword,
                description: '-',
            }))
            setCurrentPage(1)
            setDigitalTwinIdList(pairs)
            setModalTargetField('digitalObjId')
            setIsModalOpen(true)
            return
        } else if (targetField === 'digitalObjectPath') {
            if (!formData.federatedTwinId) {
                alert('먼저 Federated Twin ID를 선택하세요.')
                return
            }
            url = `${DTMETA_BASE_URL}/meta/digitalTwins/search`
            params = {
                dTw_attr_dtid: formData.federatedTwinId,
                objectRefFormat: 'object',
                pageListSize: 10,
                arrayDataLimit: 10,
                dTw_objs_attr: 'federatedDigitalTwinObjects',
            }
        }

        try {
            let response
            if (targetField === 'digitalObjectPath') {
                try {
                    const config: AxiosRequestConfig = {
                        headers: { Authorization: `Bearer ${token}` },
                        params,
                    }
                    const response = await axios.get(url, config)

                    const rows = response.data?.responseData
                    if (!Array.isArray(rows) || rows.length === 0) {
                        alert('데이터가 없습니다.')
                        return
                    }

                    const fdoList: FederatedDigitalTwinObject[] = (
                        rows as DigitalTwinSearchRow[]
                    ).flatMap((row) => row?.federatedDigitalTwinObjects ?? [])
                    if (fdoList.length === 0) {
                        alert('연합 디지털객체 정보가 없습니다.')
                        return
                    }

                    const selectedFdoId = formData.federatedDigitalObjectId
                    const matchedFdo =
                        fdoList.find(
                            (obj) =>
                                obj?.dtoid &&
                                (obj.dtoid === selectedFdoId ||
                                    `F-${obj.dtoid}` === selectedFdoId)
                        ) ?? fdoList[0]

                    const properties =
                        matchedFdo?.digitalTwinObjectData?.schemaInformation
                            ?.properties
                    if (!properties || typeof properties !== 'object') {
                        alert('스키마 정보(properties)를 찾을 수 없습니다.')
                        return
                    }

                    const list: DigitalTwinItem[] = Object.entries(
                        properties as Record<string, SchemaProperty>
                    ).map(([field, meta]) => ({
                        id: field,
                        name: field,
                        description: meta?.title ?? '-',
                        fieldType: meta?.type ?? '-',
                    }))

                    if (list.length === 0) {
                        alert('스키마에 정의된 속성이 없습니다.')
                        return
                    }

                    setCurrentPage(1)
                    setDigitalTwinIdList(list)
                    setModalTargetField('digitalObjectPath')
                    setIsModalOpen(true)
                    return
                } catch (err) {
                    console.error('디지털 오브젝트 경로 조회 실패:', err)
                    alert('경로 조회 중 오류 발생')
                    return
                }
            } else {
                response = await axios.get(url, { params })
            }

            const data: any[] = Array.isArray(response.data)
                ? response.data
                : []

            const mappedData = data.map((item: any) => {
                if (targetField === 'federatedTwinId') {
                    return {
                        id: item.federated_digital_twin_id,
                        name: item.federated_digital_twin_name,
                        description: item.description ?? '-',
                    }
                } else if (targetField === 'federatedDigitalObjectId') {
                    resultList = data.map((item: any) => {
                        const keywords = Array.isArray(item.keywords)
                            ? item.keywords
                            : []
                        const memberIds = Array.isArray(
                            item.member_digital_twin_object_ids
                        )
                            ? item.member_digital_twin_object_ids
                            : []

                        const keywordMapping: {
                            keyword: string
                            memberId: string
                        }[] = memberIds.map(
                            (memberId: string, idx: number) => ({
                                keyword: keywords[idx] ?? '',
                                memberId,
                            })
                        )

                        return {
                            id: item.federated_digital_object_id,
                            name: item.federated_digital_object_name,
                            description: item.description ?? '-',
                            keywordMapping,
                        }
                    })
                } else if (targetField === 'digitalObjId') {
                    return {
                        id: item.digital_twin_id,
                        name: item.digital_object_name ?? '-',
                        description: item.description ?? '-',
                        keywords: item.keywords ?? [],
                    }
                }

                return { id: '', name: '', description: '' }
            })

            setCurrentPage(1)

            if (targetField === 'federatedDigitalObjectId') {
                setDigitalTwinIdList(resultList)
            } else {
                setDigitalTwinIdList(mappedData)
            }

            setModalTargetField(targetField)
            setIsModalOpen(true)
        } catch (error) {
            console.error('리스트 불러오기 실패:', error)
            alert('API 요청 중 오류가 발생했습니다.')
        }
    }

    const handleNgsiConfirm = (
        tuples: NgsiTuple[],
        preview: TuplePreview
    ) => {
        onApplyTargets(id, tuples, preview)
        setIsNgsiOpen(false)
    }

    const handleSelectItem = (value: string) => {
        if (modalTargetField === 'digitalObjectPath') {
            const path = `list..${value}`
            onChange(id, 'digitalObjectPath', path)

            setIsModalOpen(false)
            return
        }

        if (modalTargetField === 'federatedTwinId') {
            clearDownstream('federatedTwinId')
        } else if (modalTargetField === 'federatedDigitalObjectId') {
            clearDownstream('federatedDigitalObjectId')
        } else if (modalTargetField === 'digitalObjId') {
            clearDownstream('digitalObjId')
        }

        onChange(id, modalTargetField, value)
        if (modalTargetField === 'federatedDigitalObjectId') {
            onChange(id, 'trckTopic', `FDO_${value}`)
        }
        setIsModalOpen(false)
    }

    const clearDownstream = (field: string) => {
        switch (field) {
            case 'federatedTwinId':
                onChange(id, 'federatedDigitalObjectId', '')
                onChange(id, 'digitalObjId', '')
                onChange(id, 'digitalObjectPath', '')
                onChange(id, 'trckTopic', '')
                setSelectedFDO(null)
                break
            case 'federatedDigitalObjectId':
                onChange(id, 'digitalObjId', '')
                onChange(id, 'digitalObjectPath', '')
                setSelectedFDO(null)
                break
            case 'digitalObjId':
                onChange(id, 'digitalObjectPath', '')
                onChange(id, 'objectValueType', '')
                break
            case 'digitalObjectPath':
                onChange(id, 'objectValueType', '')
                break
            default:
                break
        }
    }

    const getModalSizeClass = () => {
        if (
            modalTargetField === 'digitalObjectPath' ||
            modalTargetField == 'digitalObjId'
        ) {
            return 'w-[640px] max-w-[90vw] max-h-[60vh]'
        } else if (modalTargetField === 'federatedTwinId') {
            return 'w-[50vw] max-w-5xl max-h-[81vh]'
        }

        return 'w-[90vw] max-w-5xl max-h-[81vh]'
    }

    return (
        <div className="flex flex-col gap-[12px] rounded-card border border-line bg-white px-[16px] py-[16px]">
            <div className="flex items-center gap-2">
                <span className="rounded-control bg-main-soft px-2 py-0.5 text-sm font-bold text-main">
                    {formData.trckPrcIdtifier?.trim() || processIdentifier}
                </span>
                <span className="text-xs text-muted">
                    조건식에서 이 프로세스를 가리킬 때 쓰는 이름입니다.
                </span>
            </div>

            <div className="flex justify-between">
                <div className="flex gap-[24px]">
                    <div>
                        <p className="font-bold">Tracking Type</p>
                        <p className="text-[var(--gray)]">
                            트래킹 프로세스 타입
                        </p>
                        <select
                            name="trackingProcess"
                            className="w-[300px] rounded-control border border-solid border-[var(--lightblue)] bg-white px-4 py-2"
                            value={formData.trackingProcess}
                            onChange={(e) =>
                                onChange(id, 'trackingProcess', e.target.value)
                            }
                        >
                            <option value="" disabled hidden>
                                Tracking Process 선택
                            </option>
                            <option value="DTP">
                                DTP (Data Tracking Process)
                            </option>
                            <option value="ETP">
                                ETP (Event Tracking Process)
                            </option>
                        </select>
                    </div>
                    <div>
                        <div className="flex w-full justify-between">
                            <p className="font-bold">
                                Tracking Process Identifier
                            </p>
                            <p className="font-normal text-muted">필수</p>
                        </div>
                        <p className="text-[var(--gray)]">
                            조건식에서 이 프로세스를 가리킬 이름입니다. 비우면
                            {' '}
                            {processIdentifier} 로 저장됩니다.
                        </p>
                        <input
                            name="trckPrcIdtifier"
                            placeholder={processIdentifier}
                            className="w-[300px] rounded-control border border-solid border-[var(--color-danger)] bg-white px-4 py-2"
                            value={formData.trckPrcIdtifier}
                            onChange={(e) =>
                                onChange(id, 'trckPrcIdtifier', e.target.value)
                            }
                        />
                    </div>
                </div>
                <div className="flex items-center gap-[12px]">
                    {isFolded ? (
                        <button
                            type="button"
                            className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-full bg-white text-white"
                            onClick={() => setIsFolded(!isFolded)}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="20"
                                width="20"
                                fill="#000000"
                            >
                                <path d="M10 13.438 4.625 8.042l1.437-1.438L10 10.542l3.938-3.938 1.437 1.438Z"></path>
                            </svg>
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-full bg-white text-white"
                            onClick={() => setIsFolded(!isFolded)}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="20"
                                width="20"
                                fill="#000000"
                            >
                                <path d="m6.062 13.375-1.437-1.458L10 6.542l5.375 5.375-1.437 1.458L10 9.438Z"></path>
                            </svg>
                        </button>
                    )}

                    <button
                        type="button"
                        className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-white"
                        onClick={() => onRemove(id)}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="20"
                            width="20"
                            fill="#000000"
                        >
                            <path d="m6.062 15.375-1.437-1.437L8.562 10 4.625 6.062l1.437-1.437L10 8.562l3.938-3.937 1.437 1.437L11.438 10l3.937 3.938-1.437 1.437L10 11.438Z"></path>
                        </svg>
                    </button>
                </div>
            </div>

            {formData.warnings?.length > 0 && (
                <ul className="mb-2 space-y-1">
                    {formData.warnings.map((w, i) => (
                        <li
                            key={`${i}-${w}`}
                            className="rounded-control border border-[var(--color-warn)] px-4 py-2 text-sm text-gray-700"
                        >
                            {w}
                        </li>
                    ))}
                </ul>
            )}

            {!isFolded && formData.trackingProcess === 'DTP' && (
                <>
                    <div className="flex gap-[24px]">
                        <div className="w-[300px]">
                            <div className="flex w-full justify-between">
                                <p className="font-bold">NGSI-LD 대상</p>
                                <p className="font-normal text-[var(--color-danger)]">
                                    *필수
                                </p>
                            </div>
                            <p className="text-[var(--gray)]">
                                컨텍스트 · 모델 · 엔티티 · 속성을 골라 트래킹
                                대상을 지정합니다
                            </p>
                        </div>
                        <div className="flex-grow">
                            <button
                                type="button"
                                className="rounded-control bg-main px-4 py-2 text-white hover:bg-main-hover"
                                onClick={() => setIsNgsiOpen(true)}
                            >
                                {formData.valueExtract
                                    ? '대상 다시 선택'
                                    : 'NGSI-LD 대상 선택'}
                            </button>

                            {formData.valueExtract ? (
                                <div className="mt-3 rounded-card border border-line bg-white px-4 py-3">
                                    <p className="mb-2 text-sm font-bold text-gray-800">
                                        전송 값
                                    </p>
                                    <dl className="grid grid-cols-[110px_1fr] gap-y-1 text-sm">
                                        <dt className="text-muted">
                                            contextUrl
                                        </dt>
                                        <dd className="break-all font-mono text-xs">
                                            {formData.contextUrl}
                                        </dd>
                                        <dt className="text-muted">entityId</dt>
                                        <dd className="break-all font-mono text-xs">
                                            {formData.entityId}
                                        </dd>
                                        <dt className="text-muted">type</dt>
                                        <dd className="font-mono text-xs">
                                            {formData.ngsiType}
                                        </dd>
                                        <dt className="text-muted">
                                            timeproperty
                                        </dt>
                                        <dd className="break-all font-mono text-xs">
                                            {formData.timeproperty}
                                        </dd>
                                        <dt className="text-muted">
                                            valueExtract
                                        </dt>
                                        <dd className="break-all font-mono text-xs font-medium text-main">
                                            {formData.valueExtract}
                                        </dd>
                                    </dl>

                                    <p className="mb-2 mt-3 text-sm font-bold text-gray-800">
                                        저장 시 자동 입력
                                        <span className="ml-2 text-xs font-normal text-muted">
                                            전송하지 않음 · 백엔드가 확정
                                        </span>
                                    </p>
                                    <dl className="grid grid-cols-[110px_1fr] gap-y-1 text-sm">
                                        <dt className="text-muted">Twin ID</dt>
                                        <dd className="break-all">
                                            {formData.federatedTwinId || '없음'}
                                        </dd>
                                        <dt className="text-muted">
                                            Object ID
                                        </dt>
                                        <dd className="break-all">
                                            {formData.federatedDigitalObjectId ||
                                                '없음'}
                                        </dd>
                                        <dt className="text-muted">
                                            Value Type
                                        </dt>
                                        <dd>
                                            {formData.objectValueType || '-'}
                                            {formData.objectValueTypeSource && (
                                                <span className="ml-2 text-xs text-muted">
                                                    {formData.objectValueTypeSource}
                                                </span>
                                            )}
                                        </dd>
                                        <dt className="text-muted">
                                            digitalObjectPath
                                        </dt>
                                        <dd className="break-all font-mono text-xs">
                                            {formData.valueExtract}
                                        </dd>
                                    </dl>
                                </div>
                            ) : (
                                <p className="mt-2 text-sm text-muted">
                                    아직 선택하지 않았습니다.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-[24px]">
                        <div className="w-[300px]">
                            <div className="flex w-full justify-between">
                                <p className="font-bold">Federated Twin ID</p>
                                <p className="font-normal text-muted">자동</p>
                            </div>
                            <p className="text-[var(--gray)]">
                                연합 디지털트윈 식별자
                            </p>
                        </div>
                        <div className="flex-grow">
                            <div className="flex gap-2">
                                <input
                                    name="federatedTwinId"
                                    placeholder="대상 선택 시 채워집니다"
                                    readOnly
                                    className="w-full rounded-control border border-line bg-subtle px-4 py-2 text-muted"
                                    value={formData.federatedTwinId}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-[24px]">
                        <div className="w-[300px]">
                            <div className="flex w-full justify-between">
                                <p className="font-bold">
                                    Federated Digital Object ID
                                </p>
                                <p className="font-normal text-[var(--color-danger)]">
                                    *필수
                                </p>
                            </div>
                            <p className="text-[var(--gray)]">
                                연합 디지털트윈 디지털객체 ID
                            </p>
                        </div>
                        <div className="flex-grow">
                            <div className="flex gap-2">
                                <input
                                    name="federatedDigitalObjectId"
                                    placeholder="대상 선택 시 채워집니다"
                                    readOnly
                                    className="w-full rounded-control border border-line bg-subtle px-4 py-2 text-muted"
                                    value={formData.federatedDigitalObjectId}
                                />
                            </div>
                        </div>
                    </div>

                    {SHOW_DIGITAL_OBJ_ID && (
                        <div className="flex gap-[24px]">
                            <div className="w-[300px]">
                                <div className="flex w-full justify-between">
                                    <p className="font-bold">
                                        Digital Object ID
                                    </p>
                                </div>
                                <p className="text-[var(--gray)]">
                                    트래킹 요청할 디지털객체 ID
                                </p>
                            </div>
                            <div className="flex-grow">
                                <div className="flex gap-2">
                                    <input
                                        name="digitalObjId"
                                        placeholder="KR-109941-0004"
                                        className="w-full rounded-control border border-solid border-[var(--color-danger)] bg-white px-4 py-2"
                                        value={formData.digitalObjId}
                                        onChange={(e) =>
                                            onChange(
                                                id,
                                                'digitalObjId',
                                                e.target.value
                                            )
                                        }
                                    />
                                    <button
                                        type="button"
                                        className="whitespace-nowrap rounded-control bg-main px-4 py-2 text-white hover:bg-main-hover"
                                        onClick={() =>
                                            openLookupModal('digitalObjId')
                                        }
                                    >
                                        조회
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {SHOW_TRACK_TOPIC && (
                        <div className="flex gap-[24px]">
                            <div className="w-[300px]">
                                <div className="flex w-full justify-between">
                                    <p className="font-bold">Track Topic</p>
                                    <p className="font-normal text-muted">
                                        자동
                                    </p>
                                </div>
                                <p className="text-[var(--gray)]">
                                    트래킹 프로세스 별 인터페이스 할 Topic
                                </p>
                            </div>
                            <div className="flex-grow">
                                <input
                                    name="trckTopic"
                                    placeholder="FDO_F-KR-104111-0011"
                                    readOnly
                                    className="w-full rounded-control border border-line bg-subtle px-4 py-2 text-muted"
                                    value={formData.trckTopic}
                                />
                            </div>
                        </div>
                    )}
                    <div className="flex gap-[24px]">
                        <div className="w-[300px]">
                            <div className="flex w-full justify-between">
                                <p className="font-bold">Tracking Value Info</p>
                                <p className="font-normal text-muted">자동</p>
                            </div>
                            <p className="text-[var(--gray)]">
                                {' '}
                                위 NGSI-LD 대상 선택으로 채워집니다. Object Value
                                Type 만 필요 시 변경하세요.
                            </p>
                        </div>
                        <div className="flex-grow">
                            <div className="flex w-full flex-col gap-[12px] rounded-control border border-solid border-[var(--lightblue)] bg-subtle px-4 py-[24px]">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="w-[30%]">
                                        <p className="font-bold">
                                            Digital Object Path
                                        </p>
                                        <p className="mt-1 text-[var(--gray)]">
                                            메타정보 중 단일트윈 하부 구조
                                            정보를 설정
                                        </p>
                                    </div>

                                    <div className="w-[70%]">
                                        <input
                                            type="text"
                                            name="digitalObjectPath"
                                            placeholder="대상 선택 시 채워집니다"
                                            readOnly
                                            className="w-full rounded-control border border-line bg-subtle px-4 py-2 text-muted"
                                            value={formData.valueExtract}
                                        />

                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    <div className="w-[30%]">
                                        <p className="font-bold">
                                            Object Value Type
                                        </p>
                                        <p className="mt-1 text-[var(--gray)]">
                                            처리되는 데이터 타입 정의
                                        </p>
                                    </div>
                                    <div className="w-[70%]">
                                        <select
                                            name="objectValueType"
                                            className="w-full rounded-control border border-solid border-[var(--color-danger)] bg-white px-4 py-2"
                                            value={formData.objectValueType}
                                            onChange={(e) =>
                                                onChange(
                                                    id,
                                                    'objectValueType',
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="">
                                                Select an Object Type
                                            </option>
                                            <option value="Boolean">
                                                Boolean
                                            </option>
                                            <option value="Integer">
                                                Integer
                                            </option>
                                            <option value="Float">Float</option>
                                            <option value="Double">
                                                Double
                                            </option>
                                            <option value="Long">Long</option>
                                            <option value="String">
                                                String
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-[24px]">
                        <div className="w-[300px]">
                            <div className="flex w-full justify-between">
                                <p className="font-bold">Event Delay (ms)</p>
                                <p className="font-normal text-[var(--color-danger)]">
                                    *필수
                                </p>
                            </div>
                            <p className="text-[var(--gray)]">
                                Tracking 발생 주기
                            </p>
                        </div>
                        <div className="flex-grow">
                            <input
                                type="number"
                                name="evntDelay"
                                placeholder="30000"
                                className="w-full rounded-control border border-solid border-[var(--color-danger)] bg-white px-4 py-2"
                                value={formData.evntDelay}
                                onChange={(e) => {
                                    onChange(id, 'evntDelay', e.target.value)
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex gap-[24px]">
                        <div className="w-[300px]">
                            <div className="flex w-full justify-between">
                                <p className="font-bold">Buffer Size</p>
                                <p className="font-normal text-[var(--color-danger)]">
                                    *필수
                                </p>
                            </div>
                            <p className="text-[var(--gray)]">
                                1차 필터에 적용할 버퍼의 사이즈
                            </p>
                        </div>
                        <div className="flex-grow">
                            <input
                                type="number"
                                name="bufferSize"
                                placeholder="100"
                                className="w-full rounded-control border border-solid border-[var(--color-danger)] bg-white px-4 py-2"
                                value={formData.bufferSize}
                                onChange={(e) => {
                                    onChange(id, 'bufferSize', e.target.value)
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex gap-[24px]">
                        <div className="w-[300px]">
                            <div className="flex w-full justify-between">
                                <p className="font-bold">Data Filter Type</p>
                                <p className="font-normal text-[var(--color-danger)]">
                                    *필수
                                </p>
                            </div>
                            <p className="text-[var(--gray)]">
                                데이터 필터 타입
                            </p>
                        </div>
                        <div className="flex-grow">
                            <select
                                name="dataFilterType"
                                value={formData.dataFilterType}
                                onChange={(e) =>
                                    onChange(
                                        id,
                                        'dataFilterType',
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-control border border-solid border-[var(--color-danger)] bg-white px-4 py-2"
                            >
                                <option value="">
                                    Select a data filter type
                                </option>
                                <option value="DF01">DF01 (min)</option>
                                <option value="DF02">DF02 (max)</option>
                                <option value="DF03">DF03 (average)</option>
                                <option value="DF04">DF04 (sum)</option>
                                <option value="DF05">DF05 (stdevp)</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-[24px]">
                        <div className="w-[300px]">
                            <div className="flex w-full justify-between">
                                <p className="font-bold">Event Condition</p>
                            </div>
                            <p className="text-[var(--gray)]">
                                이벤트 발생 조건
                            </p>
                        </div>

                        <div className="flex-grow">
                            <div className="flex w-full flex-col gap-[12px] rounded-control border border-solid border-[var(--lightblue)] bg-subtle px-4 py-[24px]">

                                <div className="flex items-center justify-between">
                                    <div className="w-full">
                                        <p className="font-bold">
                                            Event Condition Checkable
                                        </p>
                                        <p className="mt-1 text-[var(--gray)]">
                                            발생조건 체크 및 발생 데이터 전송
                                            여부
                                        </p>
                                    </div>

                                    <div className="relative flex w-full items-center">
                                        <div className="inline-flex items-center">
                                            <label className="relative flex cursor-pointer items-center">
                                                <input
                                                    type="checkbox"
                                                    className="peer h-[24px] w-[24px] cursor-pointer appearance-none rounded-control border border-solid border-[var(--lightblue)] bg-white transition-all checked:border-[var(--lightblue)]"
                                                    id="check"
                                                    checked={
                                                        formData.evntCheck ===
                                                        'true'
                                                    }
                                                    onChange={(e) => {
                                                        onChange(
                                                            id,
                                                            'evntCheck',
                                                            e.target.checked
                                                                ? 'true'
                                                                : 'false'
                                                        )
                                                    }}
                                                />
                                                <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform text-[var(--blue)] opacity-0 peer-checked:opacity-100">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-[18px] w-[18px]"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                        stroke="currentColor"
                                                        strokeWidth="1"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                            clipRule="evenodd"
                                                        ></path>
                                                    </svg>
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="w-full">
                                        <p className="font-bold">
                                            Control Statement
                                        </p>
                                        <p className="mt-1 text-[var(--gray)]">
                                            결과 값이 치환할 변수 위치
                                        </p>
                                    </div>
                                    <input
                                        name="ctrlStatement"
                                        placeholder={`((#{${formData.trckPrcIdtifier?.trim() || processIdentifier}} > 1))`}
                                        className="w-full rounded-control border border-solid border-[var(--color-danger)] bg-white px-4 py-2"
                                        value={formData.ctrlStatement}
                                        onChange={(e) => {
                                            onChange(
                                                id,
                                                'ctrlStatement',
                                                e.target.value
                                            )
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-[24px]">
                        <div className="w-[300px]">
                            <div className="flex w-full justify-between">
                                <p className="font-bold">Event Occur Count</p>
                            </div>
                            <p className="text-[var(--gray)]">
                                -1일 경우 미 적용, default: 100
                            </p>
                        </div>
                        <div className="flex-grow">
                            <input
                                type="number"
                                name="evntOccrCnt"
                                className="w-full rounded-control border border-solid border-[var(--lightblue)] bg-white px-4 py-2"
                                placeholder="-1"
                                value={formData.evntOccrCnt}
                                onChange={(e) => {
                                    onChange(id, 'evntOccrCnt', e.target.value)
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex gap-[24px]">
                        <div className="w-[300px]">
                            <div className="flex w-full justify-between">
                                <p className="font-bold">Event End Date</p>
                            </div>
                            <p className="text-[var(--gray)]">
                                트래킹 이벤트 트래킹 시작 후 종료일(DATE) 까지
                                이벤트 전송
                            </p>
                        </div>
                        <div className="flex-grow">
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    name="evntEndDt"
                                    className="w-full rounded-control border border-solid border-[var(--lightblue)] bg-white px-4 py-2"
                                    placeholder="3"
                                    value={formData.evntEndDt}
                                    onChange={(e) =>
                                        onChange(
                                            id,
                                            'evntEndDt',
                                            e.target.value
                                        )
                                    }
                                />
                                <select
                                    name="evntEndDtSelect"
                                    value={formData.evntEndDtSelect}
                                    onChange={(e) =>
                                        onChange(
                                            id,
                                            'evntEndDtSelect',
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-control border border-solid border-[var(--lightblue)] bg-white px-4 py-2"
                                >
                                    <option value="">Select Interval</option>
                                    <option value="SECONDS">SECONDS</option>
                                    <option value="MINUTES">MINUTES</option>
                                    <option value="HOURS">HOURS</option>
                                    <option value="DAYS">DAYS</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </>
            )}
            {!isFolded && formData.trackingProcess === 'ETP' && (
                <>
                    <div className="flex gap-[24px]">
                        <div className="w-[300px]">
                            <div className="flex w-full justify-between">
                                <p className="font-bold">Event Delay (ms)</p>
                                <p className="font-normal text-[var(--color-danger)]">
                                    *필수
                                </p>
                            </div>
                            <p className="text-[var(--gray)]">
                                Tracking 발생 주기
                            </p>
                        </div>
                        <div className="flex-grow">
                            <input
                                type="number"
                                name="evntDelay"
                                placeholder="30000"
                                className="w-full rounded-control border border-solid border-[var(--color-danger)] bg-white px-4 py-2"
                                value={formData.evntDelay}
                                onChange={(e) => {
                                    onChange(id, 'evntDelay', e.target.value)
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex gap-[24px]">
                        <div className="w-[300px]">
                            <div className="flex w-full justify-between">
                                <p className="font-bold">Buffer Size</p>
                                <p className="font-normal text-[var(--color-danger)]">
                                    *필수
                                </p>
                            </div>
                            <p className="text-[var(--gray)]">
                                1차 필터에 적용할 버퍼의 사이즈
                            </p>
                        </div>
                        <div className="flex-grow">
                            <input
                                type="number"
                                name="bufferSize"
                                placeholder="100"
                                className="w-full rounded-control border border-solid border-[var(--color-danger)] bg-white px-4 py-2"
                                value={formData.bufferSize}
                                onChange={(e) => {
                                    onChange(id, 'bufferSize', e.target.value)
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex gap-[24px]">
                        <div className="w-[300px]">
                            <div className="flex w-full justify-between">
                                <p className="font-bold">Event Condition</p>
                            </div>
                            <p className="text-[var(--gray)]">
                                이벤트 발생 조건
                            </p>
                        </div>
                        <div className="flex-grow">
                            <div className="flex w-full flex-col gap-[12px] rounded-control border border-solid border-[var(--lightblue)] bg-subtle px-4 py-[24px]">
                                <div className="flex items-center justify-between">
                                    <div className="w-full">
                                        <p className="font-bold">
                                            Event Condition Checkable
                                        </p>
                                        <p className="mt-1 text-[var(--gray)]">
                                            발생조건 체크 및 발생 데이터 전송
                                            여부
                                        </p>
                                    </div>

                                    <div className="relative flex w-full items-center">
                                        <div className="inline-flex items-center">
                                            <label className="relative flex cursor-pointer items-center">
                                                <input
                                                    type="checkbox"
                                                    className="peer h-[24px] w-[24px] cursor-pointer appearance-none rounded-control border border-solid border-[var(--lightblue)] bg-white transition-all checked:border-[var(--lightblue)]"
                                                    id="check"
                                                    checked={
                                                        formData.evntCheck ===
                                                        'true'
                                                    }
                                                    onChange={(e) => {
                                                        onChange(
                                                            id,
                                                            'evntCheck',
                                                            e.target.checked
                                                                ? 'true'
                                                                : 'false'
                                                        )
                                                    }}
                                                />
                                                <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform text-[var(--blue)] opacity-0 peer-checked:opacity-100">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-[18px] w-[18px]"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                        stroke="currentColor"
                                                        strokeWidth="1"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                            clipRule="evenodd"
                                                        ></path>
                                                    </svg>
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="w-full">
                                        <p className="font-bold">
                                            Control Statement
                                        </p>
                                        <p className="mt-1 text-[var(--gray)]">
                                            결과 값이 치환할 변수 위치
                                        </p>
                                    </div>
                                    <input
                                        name="ctrlStatement"
                                        placeholder="((#{DT-13} &gt; 1 &amp;&amp; #{DT-13} &lt; 10) || (#{DT-23} &gt; 90))"
                                        className="w-full rounded-control border border-solid border-[var(--color-danger)] bg-white px-4 py-2"
                                        value={formData.ctrlStatement}
                                        onChange={(e) => {
                                            onChange(
                                                id,
                                                'ctrlStatement',
                                                e.target.value
                                            )
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-[24px]">
                        <div className="w-[300px]">
                            <div className="flex w-full justify-between">
                                <p className="font-bold">Event Occur Count</p>
                            </div>
                            <p className="text-[var(--gray)]">
                                -1일 경우 미 적용, default: 100
                            </p>
                        </div>
                        <div className="flex-grow">
                            <input
                                type="number"
                                name="evntOccrCnt"
                                className="w-full rounded-control border border-solid border-[var(--lightblue)] bg-white px-4 py-2"
                                placeholder="-1"
                                value={formData.evntOccrCnt}
                                onChange={(e) => {
                                    onChange(id, 'evntOccrCnt', e.target.value)
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex gap-[24px]">
                        <div className="w-[300px]">
                            <div className="flex w-full justify-between">
                                <p className="font-bold">Event End Date</p>
                                <p className="font-normal text-[var(--color-danger)]">
                                    *필수
                                </p>
                            </div>
                            <p className="text-[var(--gray)]">
                                트래킹 이벤트 트래킹 시작 후 종료일(DATE) 까지
                                이벤트 전송
                            </p>
                        </div>
                        <div className="flex-grow">
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    name="evntEndDt"
                                    className="w-full rounded-control border border-solid border-[var(--color-danger)] border-[var(--lightblue)] bg-white px-4 py-2"
                                    placeholder="3"
                                    value={formData.evntEndDt}
                                    onChange={(e) =>
                                        onChange(
                                            id,
                                            'evntEndDt',
                                            e.target.value
                                        )
                                    }
                                />
                                <select
                                    name="evntEndDtSelect"
                                    value={formData.evntEndDtSelect}
                                    onChange={(e) =>
                                        onChange(
                                            id,
                                            'evntEndDtSelect',
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-control border border-solid border-[var(--color-danger)] border-[var(--lightblue)] bg-white px-4 py-2"
                                >
                                    <option value="">Select Interval</option>
                                    <option value="SECONDS">SECONDS</option>
                                    <option value="MINUTES">MINUTES</option>
                                    <option value="HOURS">HOURS</option>
                                    <option value="DAYS">DAYS</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </>
            )}
            {isNgsiOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/20 p-6 backdrop-brightness-90">
                    <div className="w-full max-w-[1400px] rounded-card bg-white p-6 shadow-lg">
                        <NDXProSelector
                            onConfirm={handleNgsiConfirm}
                            onCancel={() => setIsNgsiOpen(false)}
                            bufferSize={parseInt(formData.bufferSize)}
                        />
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-brightness-90 flex items-center justify-center z-50">
                    <div
                        className={`bg-white rounded-card ${getModalSizeClass()} shadow-lg flex flex-col`}
                    >
                        <div className="p-6">
                            {modalTargetField === 'federatedTwinId' && (
                                <h2 className="text-xl font-bold text-gray-800">
                                    Select Federated Twin ID
                                </h2>
                            )}
                            {modalTargetField ===
                                'federatedDigitalObjectId' && (
                                <h2 className="text-xl font-bold text-gray-800">
                                    Select Federated Digital Object ID
                                </h2>
                            )}
                            {modalTargetField === 'digitalObjId' && (
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">
                                        Select Digital Object by Keyword
                                    </h2>
                                    <div className="mt-2 inline-flex items-center gap-2 text-sm text-muted">
                                        <span>Federated Digital Object:</span>
                                        <span className="rounded-control bg-subtle px-2 py-1 font-medium text-gray-800">
                                            {selectedFDO?.id || '-'}
                                        </span>
                                        {selectedFDO?.name && (
                                            <span className="text-muted">
                                                ({selectedFDO.name})
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-2 inline-flex flex-wrap items-center gap-2 text-sm text-muted">
                                        <span>Keyword:</span>
                                        {[
                                            ...new Set(
                                                (
                                                    selectedFDO?.keywordPairs ??
                                                    []
                                                )
                                                    .map((p) => p.keyword)
                                                    .filter(Boolean)
                                            ),
                                        ].length > 0 ? (
                                            [
                                                ...new Set(
                                                    (
                                                        selectedFDO?.keywordPairs ??
                                                        []
                                                    )
                                                        .map((p) => p.keyword)
                                                        .filter(Boolean)
                                                ),
                                            ].map((kw) => (
                                                <span
                                                    key={kw}
                                                    className="rounded-control bg-subtle px-2 py-1 font-medium text-gray-800"
                                                >
                                                    {kw}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="rounded-control bg-subtle px-2 py-1 font-medium text-gray-800">
                                                -
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                            {modalTargetField === 'digitalObjectPath' && (
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">
                                        Select Required Field
                                    </h2>
                                    <div className="mt-2 inline-flex items-center gap-2 text-sm text-muted">
                                        <span>Digital Object:</span>
                                        <span className="rounded-control bg-subtle px-2 py-1 font-medium text-gray-800">
                                            {formData.digitalObjId || '-'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-6 flex-1 overflow-y-auto">
                            <table className="w-full text-sm text-left text-gray-700">
                                <thead className="text-xs text-muted uppercase bg-subtle">
                                    {modalTargetField === 'digitalObjId' ? (
                                        <tr>
                                            <th className="px-6 py-3">
                                                Member Digital Object ID
                                            </th>
                                        </tr>
                                    ) : modalTargetField ===
                                      'federatedDigitalObjectId' ? (
                                        <tr>
                                            <th className="px-6 py-3">ID</th>
                                            <th className="px-6 py-3">Name</th>
                                            <th className="px-6 py-3">
                                                Description
                                            </th>
                                            <th className="px-6 py-3">
                                                Keyword
                                            </th>
                                        </tr>
                                    ) : modalTargetField ===
                                      'digitalObjectPath' ? (
                                        <tr>
                                            <th className="px-6 py-3">
                                                Required Field
                                            </th>
                                            <th className="px-6 py-3">Type</th>
                                        </tr>
                                    ) : (
                                        <tr>
                                            <th className="px-6 py-3">ID</th>
                                            <th className="px-6 py-3">Name</th>
                                            <th className="px-6 py-3">
                                                Description
                                            </th>
                                        </tr>
                                    )}
                                </thead>

                                <tbody>
                                    {(modalTargetField === 'digitalObjectPath'
                                        ? digitalTwinIdList
                                        : digitalTwinIdList.slice(
                                              (currentPage - 1) * rowsPerPage,
                                              currentPage * rowsPerPage
                                          )
                                    ).map((item, index) => (
                                        <tr
                                            key={index}
                                            className="cursor-pointer hover:bg-subtle border-b"
                                            onClick={() => {
                                                handleSelectItem(item.id)
                                                if (
                                                    modalTargetField ===
                                                    'federatedDigitalObjectId'
                                                ) {
                                                    setSelectedFDO({
                                                        id: item.id,
                                                        name: item.name,
                                                        description:
                                                            item.description ??
                                                            '-',
                                                        keywordPairs:
                                                            item.keywordMapping ??
                                                            [],
                                                    })
                                                    onChange(
                                                        id,
                                                        'digitalObjId',
                                                        item.keywordMapping?.[0]
                                                            ?.memberId ??
                                                            item.id
                                                    )
                                                }
                                                setIsModalOpen(false)
                                            }}
                                        >
                                            {modalTargetField ===
                                            'digitalObjId' ? (
                                                <td className="px-6 py-3">
                                                    {item.id}
                                                </td>
                                            ) : modalTargetField ===
                                              'federatedDigitalObjectId' ? (
                                                <>
                                                    <td className="px-6 py-3">
                                                        {item.id}
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        {item.name}
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        {item.description}
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        {Array.isArray(
                                                            item.keywordMapping
                                                        ) &&
                                                        item.keywordMapping
                                                            .length > 0 ? (
                                                            <ul className="list-disc pl-4">
                                                                {item.keywordMapping.map(
                                                                    (
                                                                        pair,
                                                                        i
                                                                    ) => (
                                                                        <li
                                                                            key={
                                                                                i
                                                                            }
                                                                        >
                                                                            {
                                                                                pair.keyword
                                                                            }
                                                                        </li>
                                                                    )
                                                                )}
                                                            </ul>
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </td>
                                                </>
                                            ) : modalTargetField ===
                                              'digitalObjectPath' ? (
                                                <>
                                                    <td className="px-6 py-3">
                                                        {item.name}
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        {item.fieldType || '-'}
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-3">
                                                        {item.id}
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        {item.name}
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        {item.description}
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-6">
                            {modalTargetField !== 'digitalObjectPath' && (
                                <div className="flex items-center justify-center mb-4 gap-2">
                                    <button
                                        onClick={() =>
                                            setCurrentPage((prev) =>
                                                Math.max(prev - 1, 1)
                                            )
                                        }
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 rounded-control bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                                    >
                                        &lt;
                                    </button>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            type="button"
                                            key={i}
                                            onClick={() =>
                                                setCurrentPage(i + 1)
                                            }
                                            className={`px-3 py-1 rounded-control ${
                                                currentPage === i + 1
                                                    ? 'bg-main text-white'
                                                    : 'bg-gray-200 hover:bg-gray-300'
                                            }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentPage((prev) =>
                                                Math.min(prev + 1, totalPages)
                                            )
                                        }
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 rounded-control bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                                    >
                                        &gt;
                                    </button>
                                </div>
                            )}
                            <div className="flex justify-end">
                                <button
                                    className="bg-main hover:bg-main-hover text-white px-4 py-2 rounded-control"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
