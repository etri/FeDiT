export default function DefineTrackingInterface() {
    return (
        <div className="mt-[48px]">
            <p className="mb-[12px] text-[14px] font-bold text-main">
                인터페이스 정의 (Tracking Command)
            </p>
            <div className="overflow-hidden rounded-card border border-line">
                <table className="w-full bg-white">
                    <thead>
                        <tr className="bg-[var(--sky)]">
                            <th className="border-b border-line px-4 py-3 text-left font-semibold">
                                구분
                            </th>
                            <th className="border-b border-line px-4 py-3 text-left font-semibold">
                                Description
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="odd:bg-white even:bg-subtle">
                            <td className="border-b border-line px-4 py-2">
                                용도
                            </td>
                            <td className="border-b border-line px-4 py-2">
                                3세부 서비스 운영 (시각화 Process) 모듈은
                                트래킹(데이터/이벤트) 받고자 하는 정보를 요청 시
                                트래킹 명령을 구성하여 트래킹 모듈에 요청 전송
                            </td>
                        </tr>
                        <tr className="odd:bg-white even:bg-subtle">
                            <td className="border-b border-line px-4 py-2">
                                프로토콜
                            </td>
                            <td className="border-b border-line px-4 py-2">
                                HTTP Protocol 사용
                            </td>
                        </tr>
                        <tr className="odd:bg-white even:bg-subtle">
                            <td className="border-b border-line px-4 py-2">
                                URL
                            </td>
                            <td className="border-b border-line px-4 py-2">
                                http://serviceIP:8002/fdt/detrck/rcv/tracking-commands
                            </td>
                        </tr>
                        <tr className="odd:bg-white even:bg-subtle">
                            <td className="border-b border-line px-4 py-2">
                                Method
                            </td>
                            <td className="border-b border-line px-4 py-2">
                                POST
                            </td>
                        </tr>
                        <tr className="odd:bg-white even:bg-subtle">
                            <td className="px-4 py-2">Content-Type</td>
                            <td className="px-4 py-2">application/json</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}
