// HTML 이스케이프 유틸 — 사용자 데이터를 innerHTML에 삽입하기 전 반드시 통과시킬 것.
// 5가지 엔티티 모두 처리 (HTML body + attribute 컨텍스트 양쪽 안전).
function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const API_VALIDATION_LABELS = {
    name: '이름',
    task: '학습 유형',
    dataset_path: '데이터셋 경로',
    target_column: '타깃 컬럼',
    models: '모델 후보',
    num_trials: '시도 횟수',
    timeout_minutes: '제한 시간(분)',
    metric: '평가 지표',
    test_size: '테스트 비율',
    random_state: '랜덤 시드',
    cpu_per_trial: 'Trial당 CPU',
    gpu_per_trial: 'Trial당 GPU',
    memory_per_trial_gb: 'Trial당 메모리(GB)',
    top_n: '저장 모델 수',
};

function _apiValidationLabel(loc) {
    const parts = Array.isArray(loc) ? loc.filter(p => !['body', 'query', 'path'].includes(String(p))) : [];
    const key = parts.length ? String(parts[parts.length - 1]) : '';
    return API_VALIDATION_LABELS[key] || key || '입력값';
}

function _apiErrorNumber(item, key) {
    const ctx = item?.ctx || {};
    if (ctx[key] !== undefined && ctx[key] !== null) return ctx[key];
    const msg = String(item?.msg || '');
    const m = msg.match(/(-?\d+(?:\.\d+)?)/);
    return m ? m[1] : '';
}

function _apiFormatValidationItem(item) {
    const label = _apiValidationLabel(item?.loc);
    const type = String(item?.type || '').toLowerCase();
    const msg = String(item?.msg || '').toLowerCase();
    if (type.includes('greater_than_equal') || type.endsWith('ge') || msg.includes('greater than or equal')) {
        return `${label}: ${_apiErrorNumber(item, 'ge')} 이상으로 입력해야 합니다.`;
    }
    if (type.includes('less_than_equal') || type.endsWith('le') || msg.includes('less than or equal')) {
        return `${label}: ${_apiErrorNumber(item, 'le')} 이하로 입력해야 합니다.`;
    }
    if (type.includes('greater_than') || type.endsWith('gt') || msg.includes('greater than')) {
        return `${label}: ${_apiErrorNumber(item, 'gt')}보다 크게 입력해야 합니다.`;
    }
    if (type.includes('less_than') || type.endsWith('lt') || msg.includes('less than')) {
        return `${label}: ${_apiErrorNumber(item, 'lt')}보다 작게 입력해야 합니다.`;
    }
    if (type.includes('missing') || msg.includes('field required')) return `${label}: 필수 입력값입니다.`;
    if (type.includes('float') || type.includes('int') || msg.includes('valid number') || msg.includes('valid integer')) {
        return `${label}: 숫자로 입력해야 합니다.`;
    }
    return `${label}: 입력값이 올바르지 않습니다.`;
}

const API = {
    base: window.location.pathname.replace(/\/$/, ''),
    namespace: new URLSearchParams(window.location.search).get('ns'),

    _headers(extra, namespaceOverride) {
        const h = { ...(extra || {}) };
        const ns = namespaceOverride || this.namespace;
        if (ns) h['x-pm-namespace'] = ns;
        return h;
    },

    _withNs(path, namespaceOverride) {
        const ns = namespaceOverride || this.namespace;
        if (!ns) return this.base + path;
        const sep = path.includes('?') ? '&' : '?';
        return this.base + path + sep + 'ns=' + encodeURIComponent(ns);
    },

    async _json(resp) {
        const text = await resp.text();
        let data = {};
        if (text) {
            try {
                data = JSON.parse(text);
            } catch {
                data = { detail: text };
            }
        }
        if (!resp.ok) {
            let msg = data.detail || data.message || resp.statusText || '요청 실패';
            if (Array.isArray(msg)) {
                msg = '입력값을 확인하세요: ' + msg.map(_apiFormatValidationItem).join('; ');
            } else if (msg && typeof msg === 'object') {
                msg = JSON.stringify(msg);
            }
            throw new Error(msg);
        }
        return data;
    },

    async get(path, namespaceOverride) {
        const resp = await fetch(this._withNs(path, namespaceOverride), { headers: this._headers(null, namespaceOverride) });
        return this._json(resp);
    },

    async post(path, data, namespaceOverride) {
        const resp = await fetch(this._withNs(path, namespaceOverride), {
            method: 'POST',
            headers: this._headers({ 'Content-Type': 'application/json' }, namespaceOverride),
            body: JSON.stringify(data),
        });
        return this._json(resp);
    },

    async del(path, namespaceOverride) {
        const resp = await fetch(this._withNs(path, namespaceOverride), { method: 'DELETE', headers: this._headers(null, namespaceOverride) });
        return this._json(resp);
    },

    async patch(path, namespaceOverride) {
        const resp = await fetch(this._withNs(path, namespaceOverride), { method: 'PATCH', headers: this._headers(null, namespaceOverride) });
        return this._json(resp);
    },

    async put(path, data, namespaceOverride) {
        const resp = await fetch(this._withNs(path, namespaceOverride), {
            method: 'PUT',
            headers: this._headers({ 'Content-Type': 'application/json' }, namespaceOverride),
            body: JSON.stringify(data),
        });
        return this._json(resp);
    },

    async getRaw(path) {
        const resp = await fetch(this._withNs(path), { headers: this._headers() });
        return resp.json();
    },

    async postRaw(path, data) {
        const resp = await fetch(this._withNs(path), {
            method: 'POST',
            headers: this._headers({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(data),
        });
        return resp.json();
    },

    sse(path, onMessage) {
        // EventSource는 헤더를 지원 안 해서 쿼리 파라미터로만 전달
        const es = new EventSource(this._withNs(path));
        es.onmessage = (e) => onMessage(JSON.parse(e.data));
        es.onerror = () => es.close();
        return es;
    }
};
