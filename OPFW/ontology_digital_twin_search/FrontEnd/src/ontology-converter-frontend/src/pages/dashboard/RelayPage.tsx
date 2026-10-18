import { useParams } from 'react-router'

export default function RelayPage() {
    const { role } = useParams()

    const B_DASHBOARD_URL = `http://localhost:3000/grafana/d/1189ac9f-f629-46fa-9ca4-d17754e3db59/node-resource-detail?var-role=${role}&kiosk`
    return (
        <div className="h-full w-full">
            <iframe
                title="Dashboard B"
                src={B_DASHBOARD_URL}
                frameBorder="0"
                className="w-full h-full"
            />
        </div>
    )
}
