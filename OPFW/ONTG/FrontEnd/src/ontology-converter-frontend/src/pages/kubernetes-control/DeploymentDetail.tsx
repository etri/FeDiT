import { useSearchParams } from 'react-router'
import axios from 'axios'
import { useQuery } from '@tanstack/react-query'

export default function DeploymentDetail() {
    const [searchParams] = useSearchParams()
    const deployment = searchParams.get('deployment')
    const namespace = searchParams.get('namespace')

    const enabled = !!deployment && !!namespace

    const requestGetDeploymentDetail = async (
        deployment: string,
        namespace: string
    ) => {
        const response = await axios.get(
            '/api/v1/kubernetes-control/deployments/' +
                namespace +
                '/' +
                deployment,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
        console.log('Deployment Details:', response)

        return response.data.data
    }

    const { data, isLoading, error } = useQuery({
        queryKey: ['deploymentDetail', namespace, deployment],
        queryFn: () => requestGetDeploymentDetail(deployment!, namespace!),
        enabled,
    })

    if (!enabled) {
        return <div>Error: Missing deployment or namespace parameters.</div>
    }

    if (isLoading) return <div>Loading deployment details...</div>
    if (error) return <div>Error fetching deployment details.</div>

    return (
        <>
            <div>
                {data ? (
                    <div>
                        <h2>Deployment: {data.name}</h2>
                        <p>Namespace: {data.namespace}</p>
                        <p>Replicas: {data.replicas}</p>
                        <p>Available Replicas: {data.availableReplicas}</p>
                        <p>Unavailable Replicas: {data.unavailableReplicas}</p>
                        <p>Created At: {data.createdAt}</p>
                        <p>Updated At: {data.updatedAt}</p>
                    </div>
                ) : (
                    <div>No deployment details available.</div>
                )}
            </div>
        </>
    )
}
