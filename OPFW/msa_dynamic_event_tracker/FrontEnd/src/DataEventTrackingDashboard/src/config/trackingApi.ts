type Target = {
    baseUrl: string
    contextPath: string
}

const TARGET: Target = { baseUrl: '', contextPath: '/dataeventtrackingservice' }

const API_PREFIX = '/fdt/detrck/rcv'

export const TRACKING_BASE_URL =
    import.meta.env.VITE_DATA_TRACKING_URL ?? TARGET.baseUrl

export function trackingApi(path: string): string {
    return `${TRACKING_BASE_URL}${TARGET.contextPath}${API_PREFIX}${path}`
}

export function trackingCommandApi(path: string): string {
    return `${TRACKING_BASE_URL}${TARGET.contextPath}/api/tracking${path}`
}
