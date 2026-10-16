import { type ChangeEvent, type RefObject, useRef, useState } from 'react'
import { useDigitalTwins } from './hooks/useDigitalTwins'
import OntologyRankComponent from './components/OntologyRankComponent'

export default function OntologyList() {
    const [inputValue, setInputValue] = useState(
        '한라산 어리목 코스 주변에 교통 상황 알려줘',
    )
    const [search, setSearch] = useState('')
    const { data, isLoading, isError } = useDigitalTwins(search)
    const recommendCombinationRef = useRef<HTMLDivElement>(null)
    const recommendTwinsRef = useRef<HTMLDivElement>(null)

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value)
    }

    const handleSubmit = () => {
        setSearch(inputValue)
    }

    const scrollToSection = (ref: RefObject<HTMLDivElement | null>) => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    return (
        <div className="h-screen overflow-y-auto p-4">
            <div className="mb-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        className="flex-1 border px-4 py-3 rounded-lg w-2/3"
                        placeholder="질문을 입력하세요."
                    />
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                        전송
                    </button>
                </div>
            </div>

            <div className="flex gap-4 mx-auto">
                <div className="flex-1 w-2/3">
                    {isLoading ? (
                        <div>Loading...</div>
                    ) : isError ? (
                        <div>Error loading data.</div>
                    ) : (
                        <div className="space-y-4">
                            {data?.recommendCombination &&
                                data.recommendCombination.length > 0 && (
                                    <div ref={recommendCombinationRef}>
                                        <OntologyRankComponent
                                            title="RecommendCombination"
                                            item={data.recommendCombination}
                                        />
                                    </div>
                                )}
                            {data?.recommendTwins &&
                                data.recommendTwins.length > 0 && (
                                    <div ref={recommendTwinsRef}>
                                        <OntologyRankComponent
                                            title="RecommendTwin"
                                            item={data.recommendTwins}
                                        />
                                    </div>
                                )}
                        </div>
                    )}
                </div>

                {!isLoading && !isError && data && (
                    <div className="sticky top-4 h-fit w-52 border rounded-lg p-4 bg-white shadow-md">
                        <h3 className="text-sm font-semibold mb-3 text-gray-700">
                            결과
                        </h3>
                        <nav className="space-y-2">
                            {data?.recommendCombination &&
                                data.recommendCombination.length > 0 && (
                                    <button
                                        onClick={() =>
                                            scrollToSection(
                                                recommendCombinationRef,
                                            )
                                        }
                                        className="w-full text-left text-sm px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                                    >
                                        RecommendCombination
                                    </button>
                                )}
                            {data?.recommendTwins &&
                                data.recommendTwins.length > 0 && (
                                    <button
                                        onClick={() =>
                                            scrollToSection(recommendTwinsRef)
                                        }
                                        className="w-full text-left text-sm px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                                    >
                                        RecommendTwin
                                    </button>
                                )}
                        </nav>
                    </div>
                )}
            </div>
        </div>
    )
}
