import DefineTrackingInterface from './DefineTrackingInterface.tsx'
import DefineTrackingRequest from './DefineTrackingRequest.tsx'
import DataTrackingForm from './DataTrackingForm.tsx'

export default function DataTrackingMain() {
    return (
        <div className="content">
            <div className="h-full w-full px-[19px] py-[20px]">
                <p className="mb-[32px] text-[18px] font-bold">
                    동적 데이터 / 이벤트 트레킹 프로세스
                </p>
                <DefineTrackingInterface />
                <DefineTrackingRequest />
                <DataTrackingForm />
            </div>
        </div>
    )
}
