export default function DefineTrackingRequest() {
    return (
        <div className="my-[48px]">
            <p className="mb-[12px] text-[14px] font-bold text-main">
                트래킹 요청 정의 (Tracking Command)
            </p>
            <div className="overflow-hidden rounded-card border border-line">
                <table className="w-full bg-white">
                    <thead>
                        <tr className="bg-[var(--sky)]">
                            <th className="border-b border-line px-4 py-3 text-left font-semibold">
                                Name
                            </th>
                            <th className="border-b border-line px-4 py-3 text-left font-semibold">
                                Type
                            </th>
                            <th className="border-b border-line px-4 py-3 text-left font-semibold">
                                Description
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="odd:bg-white even:bg-subtle">
                            <td className="border-b border-line px-4 py-2">
                                requestIdtifier
                            </td>
                            <td className="border-b border-line px-4 py-2">
                                String
                            </td>
                            <td className="border-b border-line px-4 py-2">
                                <ul>
                                    <li>트래킹 명령 요청 식별자</li>
                                    <li>
                                        트래킹 요청 시 단위 요청에 대한 식별자
                                    </li>
                                    <li>트래킹 이벤트 정보에 포함되어 전송</li>
                                </ul>
                            </td>
                        </tr>
                        <tr className="odd:bg-white even:bg-subtle">
                            <td className="border-b border-line px-4 py-2">
                                callBackURL
                            </td>
                            <td className="border-b border-line px-4 py-2">
                                String
                            </td>
                            <td className="border-b border-line px-4 py-2">
                                <ul>
                                    <li>
                                        트래킹 이벤트 수신을 위한 응답 받을 URL
                                    </li>
                                </ul>
                            </td>
                        </tr>
                        <tr className="odd:bg-white even:bg-subtle">
                            <td className="px-4 py-2">trckProcInfo[]</td>
                            <td className="px-4 py-2">JsonArray</td>
                            <td className="px-4 py-2">
                                <ul>
                                    <li>
                                        데이터 / 이벤트 트래킹 프로세스 정보
                                    </li>
                                    <li>
                                        트래킹 프로세스 타입, 데이터 트래킹
                                        인터페이스 정보(Topic, Group) 정보,
                                        데이터 주기, 데이터 필터 타입 등
                                    </li>
                                    <li>
                                        이벤트 발생 타입 및 이벤트 발생/종료에
                                        대한 정보 등의 요소로 구성
                                    </li>
                                </ul>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}
