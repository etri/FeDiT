type StatusMeta = {
    label: string
    badge: string
    active: boolean
}

export const REQ_STATUS_META: Record<string, StatusMeta> = {
    CS01: { label: '실행준비', badge: 'bg-blue-100 text-blue-700', active: true },
    CS02: { label: '실행중', badge: 'bg-green-100 text-green-700', active: true },
    CS03: { label: '완료', badge: 'bg-gray-100 text-gray-600', active: false },
    CS66: { label: '강제종료', badge: 'bg-red-100 text-red-700', active: false },
    CS99: { label: '오류', badge: 'bg-red-100 text-red-700', active: false },
}

export const PROC_STATUS_META: Record<string, StatusMeta> = {
    TRS00: { label: '등록', badge: 'bg-blue-100 text-blue-700', active: true },
    TRS01: { label: '실행준비', badge: 'bg-blue-100 text-blue-700', active: true },
    TRS05: { label: '실행대기', badge: 'bg-amber-100 text-amber-700', active: true },
    TRS10: { label: '실행중', badge: 'bg-green-100 text-green-700', active: true },
    TRS20: { label: '완료', badge: 'bg-gray-100 text-gray-600', active: false },
    TRS44: { label: '타임아웃', badge: 'bg-amber-100 text-amber-700', active: false },
    TRS66: { label: '강제종료', badge: 'bg-red-100 text-red-700', active: false },
    TRS99: { label: '에러', badge: 'bg-red-100 text-red-700', active: false },
}

const FALLBACK: StatusMeta = {
    label: '',
    badge: 'bg-gray-100 text-gray-600',
    active: false,
}

export function getReqStatusMeta(code?: string | null): StatusMeta {
    if (!code) return FALLBACK
    return REQ_STATUS_META[code] ?? { ...FALLBACK, label: '' }
}

export function getProcStatusMeta(code?: string | null): StatusMeta {
    if (!code) return FALLBACK
    return PROC_STATUS_META[code] ?? { ...FALLBACK, label: '' }
}

export function isReqStatusActive(code?: string | null): boolean {
    return !!code && (REQ_STATUS_META[code]?.active ?? false)
}
