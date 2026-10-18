import React from 'react'

type Props = {
    valueProperties: { [key: string]: { type: string } }
    isOpen: boolean
    onClose: () => void
    onSelect: (selectedField: string) => void
}

const NumberFieldSelectorModal: React.FC<Props> = ({
    valueProperties,
    isOpen,
    onClose,
    onSelect,
}) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/10 backdrop-brightness-90 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[90vw] max-w-[900px] max-h-[80vh] overflow-y-auto shadow-lg">
                <h2 className="text-xl font-bold mb-4">숫자 필드 선택</h2>

                <table className="text-sm border border-gray-300 w-full table-auto">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border px-4 py-2 text-left">
                                필드 이름
                            </th>
                            <th className="border px-4 py-2 text-left">타입</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(valueProperties).map(([key, value]) => {
                            const isNumber = value?.type === 'number'
                            return (
                                <tr
                                    key={key}
                                    onClick={() => {
                                        if (isNumber) {
                                            onSelect(key)
                                            onClose()
                                        }
                                    }}
                                    className={`border cursor-pointer transition ${
                                        isNumber
                                            ? 'hover:bg-blue-100'
                                            : 'text-gray-400 cursor-not-allowed bg-gray-50'
                                    }`}
                                >
                                    <td className="border px-4 py-2">{key}</td>
                                    <td className="border px-4 py-2">
                                        {value.type}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                <div className="flex justify-end mt-4">
                    <button
                        onClick={onClose}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    )
}

export default NumberFieldSelectorModal
