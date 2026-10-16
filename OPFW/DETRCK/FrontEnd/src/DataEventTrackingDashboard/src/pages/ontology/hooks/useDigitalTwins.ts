import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import type { OntologyResponse } from '../types/ontologyTypes'

const fetchDigitalTwins = async (search: string): Promise<OntologyResponse> => {
    const response = await axios.get<OntologyResponse>(
        '/ngsi-api/search/recommendations/combinations?q=' + encodeURIComponent(search),
    )
    return response.data
}

export const useDigitalTwins = (search: string = '') => {
    return useQuery({
        queryKey: ['digitalTwins', search],
        queryFn: () => fetchDigitalTwins(search),
        staleTime: 1000 * 60 * 5,
        enabled: search.length > 0,
    })
}
