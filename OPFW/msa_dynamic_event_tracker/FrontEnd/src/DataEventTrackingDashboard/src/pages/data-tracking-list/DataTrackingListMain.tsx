import DataTrackingList from './DataTrackingList'

export default function DataTrackingListMain() {
    return (
        <div className="content dt-scope">
            <div className="h-full w-full px-[19px] py-[20px]">
                <p className="mb-[32px] text-[18px] font-bold text-main">
                    동적 데이터 / 이벤트 트레킹 프로세스 리스트
                </p>
                <DataTrackingList />
            </div>
        </div>
    )
}
