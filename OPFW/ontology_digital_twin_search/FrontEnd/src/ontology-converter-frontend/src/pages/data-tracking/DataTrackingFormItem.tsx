import { useEffect, useState } from 'react'
import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'
import NumberFieldSelectorModal from './NumberFieldSelectorModal'

interface Props {
    id: number
    formData: {
        trackingType: string
        federatedTwinId: string
        federatedDigitalObjectId: string
        digitalTwinsId: string
        digitalObjId: string
        trckTopic: string
        digitalObjectPath: string
        objectValueType: string
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
    onRemove: (id: number) => void
}

export default function DataTrackingFormItem({
    id,
    formData,
    onChange,
    onRemove,
}: Props) {
    const token =
        '{metaToken}'

    const [isFolded, setIsFolded] = useState<boolean>(true)
    const [isModalOpen, setIsModalOpen] = useState(false)

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

    const [numberValueProperties, setNumberValueProperties] = useState({})
    const [isNumberModalOpen, setIsNumberModalOpen] = useState(false)

    type KeywordPair = { keyword: string; memberId: string }
    const [selectedFDO, setSelectedFDO] = useState<{
        id: string
        name: string
        description: string
        keywordPairs: KeywordPair[]
    } | null>(null)

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
            url = `http://{fedtApiIp}:{fedtApiPort}/fedit/v1/federated-twins`
        } else if (targetField === 'federatedDigitalObjectId') {
            if (!formData.federatedTwinId) {
                alert('먼저 Federated Twin ID를 선택하세요.')
                return
            }
            url = `http://{fedtApiIp}:{fedtApiPort}/fedit/v1/federated-twins/${formData.federatedTwinId}/federated-digital-objects`
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
            if (!formData.digitalObjId) {
                alert('먼저 Digital Object ID를 선택하세요.')
                return
            }
            url = `http://{fedtApiIp}:{fedtApiPort}/fedit/v1/federated-twins/${formData.federatedTwinId}/federated-digital-objects/${formData.federatedDigitalObjectId}/data`
        }

        try {
            let response
            if (targetField === 'digitalList') {
                const config: AxiosRequestConfig = {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }

                response = await axios.get(url, config)
            } else if (targetField === 'digitalObjectPath') {
                try {
                    const config: AxiosRequestConfig = {
                        headers: { Authorization: `Bearer ${token}` },
                        params,
                    }
                    const response = await axios.get(url, config)

                    const rows = response.data

                    if (!Array.isArray(rows) || rows.length === 0) {
                        alert('데이터가 없습니다.')
                        return
                    }

                    const firstRow = rows[0]
                    const dataNode = firstRow?.data
                    if (!dataNode || typeof dataNode !== 'object') {
                        alert('data 노드를 찾을 수 없습니다.')
                        return
                    }

                    const selectedDoId = formData.digitalObjId
                    const selectedDoNode = dataNode[selectedDoId]

                    if (!selectedDoNode) {
                        alert(
                            `선택한 디지털 오브젝트(${selectedDoId}) 데이터를 찾을 수 없습니다.`
                        )
                        return
                    }

                    let measurementField = formData.digitalObjectPath

                    if (
                        !measurementField ||
                        !selectedDoNode[measurementField]
                    ) {
                        const foundKey = Object.keys(selectedDoNode).find((k) =>
                            k.toLowerCase().endsWith('measurement')
                        )
                        measurementField = foundKey || ''
                    }

                    if (
                        !measurementField ||
                        !selectedDoNode[measurementField]
                    ) {
                        alert('Measurement 필드를 찾지 못했습니다.')
                        return
                    }

                    const measurementNode = selectedDoNode[measurementField]

                    const valueArray = measurementNode?.value
                    if (!Array.isArray(valueArray) || valueArray.length === 0) {
                        alert('Measurement value에 데이터가 없습니다.')
                        return
                    }

                    const sample = valueArray[0]
                    if (!sample || typeof sample !== 'object') {
                        alert(
                            'Measurement value의 샘플 데이터를 읽을 수 없습니다.'
                        )
                        return
                    }

                    const candidateKeys = Object.keys(sample)

                    const getTypeFromValue = (v: any): string => {
                        if (Array.isArray(v)) return 'ARRAY'
                        const t = typeof v
                        switch (t) {
                            case 'number':
                                return 'NUMBER'
                            case 'string':
                                return 'STRING'
                            case 'boolean':
                                return 'BOOLEAN'
                            case 'object':
                                return 'OBJECT'
                            default:
                                return 'UNKNOWN'
                        }
                    }

                    const list: DigitalTwinItem[] = candidateKeys.map(
                        (field) => {
                            const value = (sample as any)[field]
                            return {
                                id: field,
                                name: field,
                                description: '-',
                                fieldType: getTypeFromValue(value),
                            }
                        }
                    )

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

            let data: any[] = []

            if (targetField === 'digitalList') {
                data = Array.isArray(response.data.list)
                    ? response.data.list
                    : []
            } else if (targetField === 'digitalObjectPath') {
                setNumberValueProperties(data)
                setIsNumberModalOpen(true)
                return
            } else {
                data = Array.isArray(response.data) ? response.data : []
            }

            const mappedData = data.map((item: any) => {
                if (targetField === 'federatedTwinId') {
                    return {
                        id: item.federated_digital_twin_id,
                        name: item.federated_digital_twin_name,
                        description: item.description ?? '-',
                    }
                } else if (targetField === 'federatedDigitalObjectId') {
                    resultList = data.map((item: any) => {
                        const keywords = item.keywords ?? []
                        const memberIds =
                            item.member_digital_twin_object_ids ?? []

                        let keywordMapping: {
                            keyword: string
                            memberId: string
                        }[] = []
                        if (
                            Array.isArray(keywords) &&
                            Array.isArray(memberIds) &&
                            keywords.length === memberIds.length
                        ) {
                            keywordMapping = keywords.map((keyword, idx) => ({
                                keyword,
                                memberId: memberIds[idx],
                            }))
                        }

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
                } else if (targetField === 'digitalList') {
                    return {
                        id: item.digitalTwinId,
                        name: item.digitalTwinName,
                        description: item.description ?? '-',
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

    const handleSelectItem = (value: string) => {
        if (modalTargetField === 'digitalObjectPath') {
            let keyword = ''
            if (selectedFDO?.keywordPairs?.length) {
                const found = selectedFDO.keywordPairs.find(
                    (pair) => pair.memberId === formData.digitalObjId
                )
                keyword = found?.keyword || ''
            }

            if (!keyword) {
                alert('선택된 Digital Object의 키워드를 찾을 수 없습니다.')
                return
            }

            const base = keyword.endsWith('Measurement')
                ? keyword
                : `${keyword}Measurement`

            const path = `${base}..list..${value}`
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
        <div className="flex flex-col gap-[12px] rounded-md bg-gray-200 px-[16px] py-[8px]">
            <div className="flex justify-between">
                <div className="flex gap-[24px]">
                    <div>
                        <p className="font-bold">Tracking Type</p>
                        <p className="text-[var(--gray)]">
                            트래킹 프로세스 타입
                        </p>
                        <select
                            name="trackingProcess"
                            className="w-[300px] rounded-md border-[1.5px] border-solid border-[var(--lightblue)] bg-white px-4 py-2"
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
                        <p className="font-bold">Tracking Process Identifier</p>
                        <p className="text-[var(--gray)]">
                            {' '}
                            트래킹 프로세스 실행 시 단위 트래킹에 대한 식별자
                        </p>
                        <input
                            name="trckPrcIdtifier"
                            placeholder="DT-13"
                            className="w-[300px] rounded-md border-[1.5px] border-solid border-red-500 bg-white px-4 py-2"
                            value={formData.trackingType}
                            onChange={(e) =>
                                onChange(id, 'trackingType', e.target.value)
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

            {!isFolded && formData.trackingProcess === 'DTP' && (
                <>
                    <div className="flex gap-[24px]">
                        <div className="w-[300px]">
                            <div className="flex w-full justify-between">
                                <p className="font-bold">Federated Twin ID</p>
                                <p className="font-normal text-[#FF4545]">
                                    *필수
                                </p>
                            </div>
                            <p className="text-[var(--gray)]">
                                연합 디지털트윈 식별자
                            </p>
                        </div>
                        <div className="flex-grow">
                            <div className="flex gap-2">
                                <input
                                    name="federatedTwinId"
                                    placeholder="KR-02-K10000-20240000"
                                    className="w-full rounded-md border-[1.5px] border-solid border-red-500 bg-white px-4 py-2"
                                    value={formData.federatedTwinId}
                                    onChange={(e) => {
                                        onChange(
                                            id,
                                            'federatedTwinId',
                                            e.target.value
                                        )
                                    }}
                                />
                                <button
                                    type="button"
                                    className="whitespace-nowrap rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                                    onClick={() =>
                                        openLookupModal('federatedTwinId')
                                    }
                                >
                                    조회
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-[24px]">
                        <div className="w-[300px]">
                            <div className="flex w-full justify-between">
                                <p className="font-bold">
                                    Federated Digital Object ID
                                </p>
                                <p className="font-normal text-[#FF4545]">
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
                                    placeholder="F-KR-104111-0011"
                                    className="w-full rounded-md border-[1.5px] border-solid border-red-500 bg-white px-4 py-2"
                                    value={formData.federatedDigitalObjectId}
                                    onChange={(e) => {
                                        onChange(
                                            id,
                                            'federatedDigitalObjectId',
                                            e.target.value
                                        )
                                    }}
                                />
                                <button
                                    type="button"
                                    className="whitespace-nowrap rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                                    onClick={() =>
                                        openLookupModal(
                                            'federatedDigitalObjectId'
                                        )
                                    }
                                >
                                    조회
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-[24px]">
                        <div className="w-[300px]">
                            <div className="flex w-full justify-between">
                                <p className="font-bold">Digital Object ID</p>
                                <p className="font-normal text-[#FF4545]">
                                    *필수
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
                                    className="w-full rounded-md border-[1.5px] border-solid border-red-500 bg-white px-4 py-2"
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
                                    className="whitespace-nowrap rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                                    onClick={() =>
                                        openLookupModal('digitalObjId')
                                    }
                                >
                                    조회
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-[24px]">
                        <div className="w-[300px]">
                            <div className="flex w-full justify-between">
                                <p className="font-bold">Track Topic</p>
                                <p className="font-normal text-[#FF4545]">
                                    *필수
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
                                className="w-full rounded-md border-[1.5px] border-solid border-red-500 bg-white px-4 py-2"
                                value={formData.trckTopic}
                                onChange={(e) =>
                                    onChange(id, 'trckTopic', e.target.value)
                                }
                            />
                        </div>
                    </div>
                    <div className="flex gap-[24px]">
                        <div className="w-[300px]">
                            <div className="flex w-full justify-between">
                                <p className="font-bold">Tracking Value Info</p>
                                <p className="font-normal text-[#FF4545]">
                                    *필수
                                </p>
                            </div>
                            <p className="text-[var(--gray)]">
                                {' '}
                                트래킹 대상으로 처리할 데이터 값 (Path) 입력
                            </p>
                        </div>
                        <div className="flex-grow">
                            <div className="flex w-full flex-col gap-[12px] rounded-md border-[1.5px] border-solid border-[var(--lightblue)] bg-slate-50 px-4 py-[24px]">
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

                                    <div className="w-[70%] flex gap-2">
                                        <input
                                            type="text"
                                            name="digitalObjectPath"
                                            placeholder="weatherMeasurement..list..wind_vvv"
                                            className="flex-1 rounded-md border-[1.5px] border-solid border-red-500 bg-white px-4 py-2"
                                            value={formData.digitalObjectPath}
                                            onChange={(e) =>
                                                onChange(
                                                    id,
                                                    'digitalObjectPath',
                                                    e.target.value
                                                )
                                            }
                                        />

                                        <button
                                            type="button"
                                            className="whitespace-nowrap rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                                            onClick={() =>
                                                openLookupModal(
                                                    'digitalObjectPath'
                                                )
                                            }
                                        >
                                            조회
                                        </button>
                                        <NumberFieldSelectorModal
                                            valueProperties={
                                                numberValueProperties
                                            }
                                            isOpen={isNumberModalOpen}
                                            onClose={() =>
                                                setIsNumberModalOpen(false)
                                            }
                                            onSelect={(selectedField) => {
                                                onChange(
                                                    id,
                                                    'digitalObjectPath',
                                                    selectedField
                                                )
                                            }}
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
                                            className="w-full rounded-md border-[1.5px] border-solid border-red-500 bg-white px-4 py-2"
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
                                            <option value="BOOLEAN">
                                                BOOLEAN
                                            </option>
                                            <option value="INTEGER">
                                                INTEGER
                                            </option>
                                            <option value="FLOAT">FLOAT</option>
                                            <option value="DOUBLE">
                                                DOUBLE
                                            </option>
                                            <option value="LONG">LONG</option>
                                            <option value="STRING">
                                                STRING
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
                                <p className="font-normal text-[#FF4545]">
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
                                className="w-full rounded-md border-[1.5px] border-solid border-red-500 bg-white px-4 py-2"
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
                                <p className="font-normal text-[#FF4545]">
                                    *필수
                                </p>
                            </div>
                            <p className="text-[var(--gray)]">
                                1차 필터에 적용할 버퍼의 사이즈
                            </p>
                        </div>
                        <div className="flex-grow">
                            <input
                                type="input"
                                name="bufferSize"
                                placeholder="100"
                                className="w-full rounded-md border-[1.5px] border-solid border-red-500 bg-white px-4 py-2"
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
                                <p className="font-normal text-[#FF4545]">
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
                                className="w-full rounded-md border-[1.5px] border-solid border-red-500 bg-white px-4 py-2"
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
                            <div className="flex w-full flex-col gap-[12px] rounded-md border-[1.5px] border-solid border-[var(--lightblue)] bg-slate-50 px-4 py-[24px]">
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
                                                    className="peer h-[24px] w-[24px] cursor-pointer appearance-none rounded-md border-[1.5px] border-solid border-[var(--lightblue)] bg-white transition-all checked:border-[var(--lightblue)]"
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

                                {formData.evntCheck === 'true' && (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <div className="w-full">
                                                <p className="font-bold">
                                                    Event Condition Type
                                                </p>
                                                <p className="mt-1 text-[var(--gray)]">
                                                    이벤트 종류
                                                </p>
                                            </div>
                                            <select
                                                name="evntConditionType"
                                                value={
                                                    formData.evntConditionType
                                                }
                                                onChange={(e) =>
                                                    onChange(
                                                        id,
                                                        'evntConditionType',
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full rounded-md border-[1.5px] border-solid border-red-500 bg-white px-4 py-2"
                                            >
                                                <option value="">
                                                    Select an Event Type
                                                </option>
                                                <option value="CP">CP</option>
                                            </select>
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
                                                placeholder="((#{DT-13} > 1 && #{DT-13} < 10) || (#{DT-23} > 90))"
                                                className="w-full rounded-md border-[1.5px] border-solid border-red-500 bg-white px-4 py-2"
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
                                    </>
                                )}
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
                                className="w-full rounded-md border-[1.5px] border-solid border-[var(--lightblue)] bg-white px-4 py-2"
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
                                    className="w-full rounded-md border-[1.5px] border-solid border-[var(--lightblue)] bg-white px-4 py-2"
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
                                    className="w-full rounded-md border-[1.5px] border-solid border-[var(--lightblue)] bg-white px-4 py-2"
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
                                <p className="font-normal text-[#FF4545]">
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
                                className="w-full rounded-md border-[1.5px] border-solid border-red-500 bg-white px-4 py-2"
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
                                <p className="font-normal text-[#FF4545]">
                                    *필수
                                </p>
                            </div>
                            <p className="text-[var(--gray)]">
                                1차 필터에 적용할 버퍼의 사이즈
                            </p>
                        </div>
                        <div className="flex-grow">
                            <input
                                type="input"
                                name="bufferSize"
                                placeholder="100"
                                className="w-full rounded-md border-[1.5px] border-solid border-red-500 bg-white px-4 py-2"
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
                            <div className="flex w-full flex-col gap-[12px] rounded-md border-[1.5px] border-solid border-[var(--lightblue)] bg-slate-50 px-4 py-[24px]">
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
                                                    className="peer h-[24px] w-[24px] cursor-pointer appearance-none rounded-md border-[1.5px] border-solid border-[var(--lightblue)] bg-white transition-all checked:border-[var(--lightblue)]"
                                                    id="check"
                                                    checked={true}
                                                    disabled
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
                                            Event Condition Type
                                        </p>
                                        <p className="mt-1 text-[var(--gray)]">
                                            이벤트 종류
                                        </p>
                                    </div>
                                    <select
                                        name="evntConditionType"
                                        value={formData.evntConditionType}
                                        onChange={(e) =>
                                            onChange(
                                                id,
                                                'evntConditionType',
                                                e.target.value
                                            )
                                        }
                                        className="w-full rounded-md border-[1.5px] border-solid border-red-500 bg-white px-4 py-2"
                                    >
                                        <option value="">
                                            Select an Event Type
                                        </option>
                                        <option value="CP">CP</option>
                                    </select>
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
                                        className="w-full rounded-md border-[1.5px] border-solid border-red-500 bg-white px-4 py-2"
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
                                className="w-full rounded-md border-[1.5px] border-solid border-[var(--lightblue)] bg-white px-4 py-2"
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
                                <p className="font-normal text-[#FF4545]">
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
                                    className="w-full rounded-md border-[1.5px] border-solid border-red-500 border-[var(--lightblue)] bg-white px-4 py-2"
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
                                    className="w-full rounded-md border-[1.5px] border-solid border-red-500 border-[var(--lightblue)] bg-white px-4 py-2"
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
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-brightness-90 flex items-center justify-center z-50">
                    <div
                        className={`bg-white rounded-lg ${getModalSizeClass()} shadow-lg flex flex-col`}
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
                                    <div className="mt-2 inline-flex items-center gap-2 text-sm text-gray-600">
                                        <span>Federated Digital Object:</span>
                                        <span className="rounded-md bg-gray-100 px-2 py-1 font-medium text-gray-800">
                                            {selectedFDO?.id || '-'}
                                        </span>
                                        {selectedFDO?.name && (
                                            <span className="text-gray-500">
                                                ({selectedFDO.name})
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
                                    <div className="mt-2 inline-flex items-center gap-2 text-sm text-gray-600">
                                        <span>Digital Object:</span>
                                        <span className="rounded-md bg-gray-100 px-2 py-1 font-medium text-gray-800">
                                            {formData.digitalObjId || '-'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-6 flex-1 overflow-y-auto">
                            <table className="w-full text-sm text-left text-gray-700">
                                <thead className="text-xs text-gray-600 uppercase bg-gray-100">
                                    {modalTargetField === 'digitalObjId' ? (
                                        <tr>
                                            <th className="px-6 py-3">
                                                Keyword
                                            </th>
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
                                            className="cursor-pointer hover:bg-gray-100 border-b"
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
                                                }
                                                setIsModalOpen(false)
                                            }}
                                        >
                                            {modalTargetField ===
                                            'digitalObjId' ? (
                                                <>
                                                    <td className="px-6 py-3">
                                                        {item.name}
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        {item.id}
                                                    </td>
                                                </>
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
                                        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
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
                                            className={`px-3 py-1 rounded ${
                                                currentPage === i + 1
                                                    ? 'bg-gray-400 text-white'
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
                                        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                                    >
                                        &gt;
                                    </button>
                                </div>
                            )}
                            <div className="flex justify-end">
                                <button
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
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
