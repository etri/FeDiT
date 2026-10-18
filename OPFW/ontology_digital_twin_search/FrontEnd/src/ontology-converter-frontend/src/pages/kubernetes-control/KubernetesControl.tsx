import { Select } from '@headlessui/react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useState } from 'react'
import { useNavigate } from 'react-router'

export default function KubernetesControl() {
    const navigate = useNavigate()

    const [selectedNamespace, setSelectedNamespace] = useState<string>('all')

    const requestGetNamespaces = async () => {
        const response = await axios.get(
            '/api/v1/kubernetes-control/namespaces',
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )

        const namespaces: string[] = response.data.data

        const updatedNamespaces = ['all', ...namespaces]

        setSelectedNamespace('all')

        return updatedNamespaces
    }

    const requestGetDeployments = async () => {
        const response = await axios.get(
            '/api/v1/kubernetes-control/deployments/' + selectedNamespace,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
        return response.data.data
    }

    const requestGetPods = async () => {
        const response = await axios.get(
            '/api/v1/kubernetes-control/pods/' + selectedNamespace,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
        return response.data.data
    }

    const { data, isFetched } = useQuery({
        queryKey: ['dashboard', 'namespaces'],
        queryFn: requestGetNamespaces,
    })

    const { data: deploymentsData, isFetched: isDeploymentsFetched } = useQuery(
        {
            queryKey: ['dashboard', 'deployments', selectedNamespace],
            queryFn: requestGetDeployments,
            enabled: !!selectedNamespace,
        }
    )

    const { data: podsData, isFetched: isPodsFetched } = useQuery({
        queryKey: ['dashboard', 'pods', selectedNamespace],
        queryFn: requestGetPods,
        enabled: !!selectedNamespace,
    })

    return (
        <div className="min-h-screen flex flex-col items-center pt-[10vh] gap-8 p-4 w-full">
            <div className="flex flex-row items-center gap-4">
                <label className="label">
                    <span className="label-text font-medium">Namespace</span>
                </label>
                <Select
                    name="namespace"
                    aria-label="select-namespace"
                    onChange={(e) => setSelectedNamespace(e.target.value)}
                    className="select select-bordered w-60"
                >
                    {isFetched &&
                        data &&
                        data.map((namespace: string) => (
                            <option key={namespace} value={namespace}>
                                {namespace}
                            </option>
                        ))}
                </Select>
            </div>
            <div className="divider">Deployment</div>
            <div className="w-full max-w-4xl">
                <table className="table w-full">
                    <thead>
                        <tr>
                            <th className={'w-36'}>Kind</th>
                            <th>Name</th>
                            <th>Namespace</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isDeploymentsFetched &&
                            deploymentsData &&
                            deploymentsData.map(
                                (deployment: any) => (
                                    <tr
                                        className="hover:bg-base-300"
                                        key={deployment.metadata.name}
                                        onClick={() => {
                                            navigate(
                                                `/control/deployment/detail?deployment=${deployment.metadata.name}&namespace=${deployment.metadata.namespace}`
                                            )
                                        }}
                                    >
                                        <th>Deployment</th>
                                        <td>{deployment.metadata.name}</td>
                                        <td>{deployment.metadata.namespace}</td>
                                    </tr>
                                )
                            )}
                    </tbody>
                </table>
            </div>
            <div className="divider">Pod</div>
            <div className="w-full max-w-4xl">
                <table className="table w-full">
                    <thead>
                        <tr>
                            <th className={'w-36'}>Kind</th>
                            <th>Name</th>
                            <th>Namespace</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isPodsFetched &&
                            podsData &&
                            podsData.map((pod: any) => (
                                <tr
                                    className="hover:bg-base-300"
                                    key={pod.metadata.name}
                                >
                                    <th>Pod</th>
                                    <td>
                                        {pod.metadata.labels?.app ??
                                            pod.metadata.name}
                                    </td>
                                    <td>{pod.metadata.namespace}</td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
