(() => {
let _dcState = {
    overview: null,
    twins: [],
    connectors: [],
    records: [],
    modalConnector: null,
    restOutputModal: null,
    restOutput: {
        configured: false,
        connector_id: '',
        enabled: false,
        success_count: 0,
        failure_count: 0,
        last_status_code: null,
        last_sent_at: '',
        last_error: '',
    },
    selectedTwinId: '',
    selectedConnectorId: '',
    selectedAttributeNames: [],
    selectedRecordIds: [],
    twinSearch: '',
    twinSearchComposing: false,
    realtimeStatus: {
        active: false,
        status: 'stopped',
        connector_id: '',
        interval_seconds: 3,
        selected_attributes: [],
        collect_count: 0,
        last_collected_at: '',
        last_error: '',
    },
    realtimeSource: null,
    realtimeStreamConnectorId: '',
    realtimeStreamConnected: false,
    realtimeStatusTimer: null,
};

const DC_TYPES = [
    { type: 'mqtt', label: 'MQTT', icon: 'MQ', defaultPort: 1883, endpoint: 'mqtt://broker.local', topic: 'factory/line-1/telemetry', method: '' },
    { type: 'rest', label: 'REST API', icon: 'API', defaultPort: 8080, endpoint: 'https://api.example.com/devices/data', topic: '/devices/{id}/data', method: 'POST' },
    { type: 'kafka', label: 'Kafka', icon: 'KF', defaultPort: 9092, endpoint: 'kafka-broker.local', topic: 'twin.telemetry', method: '' },
    { type: 'redis', label: 'Redis Stream', icon: 'RS', defaultPort: 6379, endpoint: 'redis.local', topic: 'streams:twin', method: '' },
    { type: 'custom', label: 'Custom YAML', icon: 'YML', defaultPort: null, endpoint: '', topic: '', method: '' },
];

function _dcTypeMeta(type) {
    return DC_TYPES.find(item => item.type === type) || DC_TYPES[0];
}

function _dcConnectorGuide(type) {
    const guides = {
        rest: 'REST API는 Base URL, Path, Method를 입력합니다. 예: Base URL http://10.0.0.10:8080, Path /api/v1/data, Method GET',
        mqtt: 'MQTT는 Broker 주소와 Topic을 입력합니다. 예: mqtt://broker.local:1883, Topic factory/line-1/telemetry',
        kafka: 'Kafka는 Broker 주소와 Topic을 입력합니다. 예: kafka-broker.local:9092, Topic twin.telemetry',
        redis: 'Redis Stream은 Redis 주소와 Stream key를 입력합니다. 예: redis.local:6379, Stream streams:twin',
        custom: 'YAML은 인증, 파서, 재시도, 변환 규칙처럼 화면 입력으로 부족한 고급 설정을 작성할 때 사용합니다.',
    };
    return guides[type] || '선택한 수집 방식에 맞는 연결 정보를 입력합니다.';
}

function _dcDefaultDraft(type = 'mqtt') {
    const meta = _dcTypeMeta(type);
    const suffix = String(Date.now()).slice(-4);
    return {
        name: `${meta.label} 커넥터 ${suffix}`,
        connector_type: meta.type,
        twin_id: _dcState.twins[0]?.id || '',
        endpoint_url: meta.endpoint,
        port: meta.defaultPort,
        topic: meta.topic,
        method: meta.method,
        yaml_config: type === 'custom'
            ? 'connector:\n  type: custom\n  parser: json\n  retry: 3\n'
            : '',
        status: 'draft',
        metadata: {},
    };
}

function _dcFmtDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
}

function _dcStatusClass(status) {
    const value = String(status || '').toLowerCase();
    if (['online', 'ready'].includes(value)) return 'ok';
    if (['warning', 'draft'].includes(value)) return 'warn';
    if (['error', 'offline'].includes(value)) return 'bad';
    return 'muted';
}

function _dcStatusLabel(status) {
    return ({
        online: 'Online',
        offline: 'Offline',
        warning: 'Warning',
        unknown: 'Unknown',
        draft: 'Draft',
        ready: 'Ready',
        error: 'Error',
    })[status] || status || '-';
}

function _dcToast(message, type = 'ok') {
    const el = document.getElementById('dc-toast');
    if (!el) {
        alert(message);
        return;
    }
    el.className = `dc-toast ${type}`;
    el.textContent = message;
    el.style.display = 'block';
    clearTimeout(_dcToast._timer);
    _dcToast._timer = setTimeout(() => {
        el.style.display = 'none';
    }, 3600);
}

function _dcConnectorEndpoint(connector) {
    if (!connector) return '-';
    const endpoint = connector.endpoint_url || '-';
    return connector.port ? `${endpoint}:${connector.port}` : endpoint;
}

function _dcConnectorChannel(connector) {
    if (!connector) return '-';
    if (connector.topic) return connector.topic;
    if (connector.method) return connector.method;
    if (connector.yaml_config) return 'YAML config';
    return '-';
}


function _dcValuePreview(value) {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'object') {
        if (Object.prototype.hasOwnProperty.call(value, 'value')) return _dcValuePreview(value.value);
        try {
            return JSON.stringify(value).slice(0, 64);
        } catch {
            return String(value).slice(0, 64);
        }
    }
    return String(value).slice(0, 64);
}

function _dcAttributeType(value) {
    if (value && typeof value === 'object') {
        if (value.type) return value.type;
        if (Object.prototype.hasOwnProperty.call(value, 'value')) return typeof value.value;
    }
    return typeof value;
}

function _dcNormalizeAttribute(raw, fallbackName = 'payload') {
    if (!raw) return null;
    if (typeof raw === 'string') {
        return { name: raw, label: raw, type: 'field', sample: '-', source: 'metadata' };
    }
    const name = raw.name || raw.id || raw.key || raw.attribute || raw.property || fallbackName;
    if (!name) return null;
    return {
        name: String(name),
        label: String(raw.label || raw.title || raw.displayName || name),
        type: String(raw.type || raw.dataType || raw.valueType || raw.unit || 'field'),
        sample: _dcValuePreview(raw.sample ?? raw.value ?? raw.latestValue),
        source: raw.source || 'metadata',
        url: raw.url || raw.source_url || raw.endpoint || '',
        path: raw.path || raw.topic || '',
    };
}

function _dcPayloadAttributes(twin, records = _dcState.records, connectorId = '') {
    const attrs = [];
    const skip = new Set(['@context', 'id', 'type']);
    const related = (records || []).filter(record => {
        const twinMatches = record.twin_id === twin.id || record.device_id === twin.id;
        const connectorMatches = !connectorId || record.connector_id === connectorId;
        return twinMatches && connectorMatches;
    });
    related.slice(0, 8).forEach(record => {
        const payload = record.payload || {};
        Object.entries(payload).forEach(([key, value]) => {
            if (skip.has(key)) return;
            if (value && typeof value === 'object' && value.type && !['Property', 'Relationship', 'GeoProperty'].includes(value.type)) return;
            attrs.push({
                name: key,
                label: key,
                type: _dcAttributeType(value),
                sample: _dcValuePreview(value),
                observed_at: value && typeof value === 'object' ? value.observedAt || '' : '',
                source: 'payload',
                url: record.meta?.source_url || '',
            });
        });
    });
    return attrs;
}

function _dcPreviewAttributes(connector) {
    const preview = connector?.metadata?.preview;
    if (!preview || !Array.isArray(preview.attributes)) return [];
    return preview.attributes
        .map((raw, index) => {
            const attr = _dcNormalizeAttribute(raw, `field-${index + 1}`);
            return attr ? { ...attr, source: 'preview', connector_id: connector.id } : null;
        })
        .filter(Boolean);
}

function _dcTwinAttributes(twin, records = _dcState.records, connectors = _dcState.connectors) {
    const connector = _dcSelectedRestConnector(twin, connectors);
    if (!connector) return [];
    const byName = new Map();
    const add = (attr) => {
        if (!attr?.name) return;
        const key = String(attr.name);
        const prev = byName.get(key) || {};
        byName.set(key, { ...prev, ...attr, name: key, label: attr.label || prev.label || key });
    };
    _dcPreviewAttributes(connector).forEach(add);
    _dcPayloadAttributes(twin, records, connector.id).forEach(add);
    return Array.from(byName.values()).sort((a, b) => {
        const aScore = a.source === 'payload' ? 0 : 1;
        const bScore = b.source === 'payload' ? 0 : 1;
        return aScore - bScore || String(a.label).localeCompare(String(b.label));
    });
}

function _dcSplitRestUrl(url, path = '') {
    const fallback = { endpoint: url || 'https://api.example.com', port: null, topic: path || '/', method: 'GET' };
    if (!url || !/^https?:\/\//.test(url)) return fallback;
    try {
        const parsed = new URL(url);
        return {
            endpoint: `${parsed.protocol}//${parsed.hostname}`,
            port: parsed.port ? Number(parsed.port) : null,
            topic: path || `${parsed.pathname || '/'}${parsed.search || ''}`,
            method: 'GET',
        };
    } catch {
        return fallback;
    }
}

function _dcConnectorDraftForTwin(twin) {
    const sourceUrl = twin?.metadata?.ngsi_url || '';
    const split = _dcSplitRestUrl(sourceUrl, '');
    return {
        ..._dcDefaultDraft('rest'),
        name: `${twin?.name || '트윈'} REST 수집`,
        connector_type: 'rest',
        twin_id: twin?.id || '',
        endpoint_url: sourceUrl ? split.endpoint : '',
        port: sourceUrl ? split.port : null,
        topic: sourceUrl ? split.topic : '',
        method: 'GET',
        status: 'draft',
        metadata: {
            source_mode: 'twin',
            twin_id: twin?.id || '',
            twin_name: twin?.name || '',
            source_url: sourceUrl,
        },
    };
}
function _dcAttributeChips(twin, attrs, limit = 8) {
    const items = (attrs || []).slice(0, limit);
    if (!items.length) return '<span class="dc-attr-empty">데이터 속성 없음</span>';
    return items.map(attr => `
        <span class="dc-attr-chip" title="${esc(_dcValuePreview(attr.sample))}">
            <b>${esc(attr.label || attr.name)}</b><small>${esc(attr.type || '-')}</small>
        </span>`).join('');
}

async function _dcSelectTwin(twinId) {
    if (!_dcState.twins.some(item => item.id === twinId)) return;
    if (_dcState.selectedTwinId !== twinId) {
        _dcState.selectedAttributeNames = [];
        _dcState.selectedRecordIds = [];
        _dcState.selectedConnectorId = '';
        _dcCloseRealtimeStream();
        _dcState.realtimeStatus = _dcInactiveRealtimeStatus();
        _dcState.restOutput = _dcInactiveRestOutput();
    }
    _dcState.selectedTwinId = twinId;
    const twin = _dcState.twins.find(item => item.id === twinId);
    const firstRest = _dcTwinConnectors(twin).find(connector => connector.connector_type === 'rest');
    if (!_dcState.selectedConnectorId) _dcState.selectedConnectorId = firstRest?.id || '';
    _dcRenderAll();
    try {
        await _dcSyncRealtimeState();
        _dcRenderStats();
        _dcRenderTwins();
        _dcRenderRecords();
    } catch (error) {
        _dcToast(error.message, 'bad');
    }
}

function _dcIsAttributeSelected(name) {
    return _dcState.selectedAttributeNames.includes(name);
}

function _dcToggleAttribute(name) {
    if (!name) return;
    if (_dcState.realtimeStatus?.active) {
        _dcToast('실시간 수집을 중지한 뒤 수집 항목을 변경하세요.', 'warn');
        return;
    }
    _dcState.selectedAttributeNames = _dcIsAttributeSelected(name)
        ? _dcState.selectedAttributeNames.filter(item => item !== name)
        : [..._dcState.selectedAttributeNames, name];
    _dcUpdateAttributeSelectionUi();
}

function _dcSetAllAttributes(checked) {
    if (_dcState.realtimeStatus?.active) {
        _dcToast('실시간 수집을 중지한 뒤 수집 항목을 변경하세요.', 'warn');
        return;
    }
    const twin = _dcSelectedTwin();
    if (!twin) return;
    const attrs = _dcTwinAttributes(twin);
    _dcState.selectedAttributeNames = checked ? attrs.map(attr => attr.name) : [];
    _dcUpdateAttributeSelectionUi();
}

function _dcClearSelectedAttributes() {
    if (_dcState.realtimeStatus?.active) {
        _dcToast('실시간 수집을 중지한 뒤 수집 항목을 변경하세요.', 'warn');
        return;
    }
    _dcState.selectedAttributeNames = [];
    _dcUpdateAttributeSelectionUi();
}

function _dcSelectedAttributes(twin) {
    if (!twin) return [];
    const attrs = _dcTwinAttributes(twin);
    const selected = attrs.filter(attr => _dcState.selectedAttributeNames.includes(attr.name));
    return selected.length ? selected : [];
}

function _dcSelectedAttributeText(selectedAttrs) {
    return selectedAttrs.map(attr => attr.label || attr.name).join(', ') || '아직 선택한 항목이 없습니다.';
}

function _dcUpdateAttributeSelectionUi() {
    const twin = _dcSelectedTwin();
    const attrs = twin ? _dcTwinAttributes(twin) : [];
    const selectedAttrs = _dcSelectedAttributes(twin);
    const selectedSet = new Set(selectedAttrs.map(attr => attr.name));
    document.querySelectorAll('.dc-attribute-row').forEach(row => {
        const selected = selectedSet.has(row.dataset.attrName);
        row.classList.toggle('selected', selected);
        const mark = row.querySelector('.dc-attr-check');
        if (mark) mark.textContent = selected ? '✓' : '';
    });
    const selectAll = document.getElementById('dc-select-all-attrs');
    if (selectAll) {
        selectAll.checked = attrs.length > 0 && selectedAttrs.length === attrs.length;
        selectAll.indeterminate = selectedAttrs.length > 0 && selectedAttrs.length < attrs.length;
    }
    const count = document.getElementById('dc-selected-attr-count');
    if (count) {
        count.className = `dc-badge ${selectedAttrs.length ? 'ok' : 'muted'}`;
        count.textContent = `선택 항목 ${selectedAttrs.length}개`;
    }
    const list = document.getElementById('dc-selected-attr-list');
    if (list) list.textContent = _dcSelectedAttributeText(selectedAttrs);
    const clearButton = document.getElementById('dc-clear-selected-attrs');
    if (clearButton) clearButton.disabled = selectedAttrs.length === 0;
    const collectButton = document.getElementById('dc-selected-collect');
    if (collectButton && !_dcState.realtimeStatus?.active) {
        collectButton.disabled = !(_dcSelectedRestConnector(twin) && selectedAttrs.length);
    }
    _dcRenderStats();
    _dcRenderRecords();
}

function _dcSelectedTwin() {
    return _dcState.twins.find(item => item.id === _dcState.selectedTwinId) || _dcState.twins[0] || null;
}

function _dcTwinConnectors(twin) {
    if (!twin) return [];
    return _dcState.connectors.filter(connector => connector.twin_id === twin.id);
}

function _dcTwinRecords(twin, connectorId = '') {
    if (!twin) return [];
    return _dcState.records.filter(record => {
        const twinMatches = record.twin_id === twin.id || record.device_id === twin.id;
        const connectorMatches = !connectorId || record.connector_id === connectorId;
        return twinMatches && connectorMatches;
    });
}

function _dcCurrentRecords() {
    const twin = _dcSelectedTwin();
    if (!twin) return [];
    const connector = _dcSelectedRestConnector(twin);
    return connector ? _dcTwinRecords(twin, connector.id) : [];
}

function _dcSelectedRecordIds(records = null) {
    const visibleIds = new Set((records || _dcCurrentRecords()).map(record => record.id));
    return _dcState.selectedRecordIds.filter(id => visibleIds.has(id));
}

function _dcSetSelectedRecordIds(ids) {
    const seen = new Set();
    _dcState.selectedRecordIds = (ids || []).filter(id => {
        const value = String(id || '').trim();
        if (!value || seen.has(value)) return false;
        seen.add(value);
        return true;
    });
}

function _dcToggleRecordSelection(recordId, checked) {
    const current = new Set(_dcSelectedRecordIds());
    if (checked) current.add(recordId);
    else current.delete(recordId);
    _dcSetSelectedRecordIds([...current]);
    _dcRenderRecords();
}

function _dcSetAllVisibleRecords(checked) {
    const rows = _dcCurrentRecords().slice(0, 8);
    _dcSetSelectedRecordIds(checked ? rows.map(record => record.id) : []);
    _dcRenderRecords();
}

function _dcSelectedRestConnector(twin, connectors = _dcState.connectors) {
    if (!twin) return null;
    const linked = (connectors || []).filter(
        connector => connector.twin_id === twin.id && connector.connector_type === 'rest',
    );
    return linked.find(connector => connector.id === _dcState.selectedConnectorId) || linked[0] || null;
}

function _dcInactiveRealtimeStatus(connectorId = '') {
    return {
        active: false,
        status: 'stopped',
        connector_id: connectorId,
        interval_seconds: 3,
        selected_attributes: [],
        collect_count: 0,
        last_collected_at: '',
        last_error: '',
    };
}

function _dcInactiveRestOutput(connectorId = '') {
    return {
        configured: false,
        connector_id: connectorId,
        enabled: false,
        target_url: '',
        method: 'POST',
        has_headers: false,
        selected_fields: [],
        flatten_ngsi_values: true,
        include_timestamp: true,
        field_mapping: {},
        static_fields: {},
        envelope_key: '',
        timeout_seconds: 10,
        success_count: 0,
        failure_count: 0,
        last_status_code: null,
        last_sent_at: '',
        last_error: '',
    };
}

function _dcCloseRealtimeStream() {
    if (_dcState.realtimeSource) {
        _dcState.realtimeSource.close();
    }
    _dcState.realtimeSource = null;
    _dcState.realtimeStreamConnectorId = '';
    _dcState.realtimeStreamConnected = false;
}

function _dcStopRealtimeStatusPolling() {
    if (_dcState.realtimeStatusTimer) {
        clearInterval(_dcState.realtimeStatusTimer);
    }
    _dcState.realtimeStatusTimer = null;
}

function _dcRealtimeStatusContent(realtime, realtimeActive) {
    if (!realtimeActive) {
        return '<span class="dc-live-dot"></span><b>실시간 수집 대기</b><span>시작하거나 외부 장비가 전송한 새 레코드는 아래 표에 바로 표시됩니다.</span>';
    }
    if (realtime.last_error) {
        return `<span class="dc-live-dot"></span><b>연결 오류 · 재시도 중</b><span>${esc(realtime.interval_seconds)}초 간격 · 성공 ${esc(realtime.collect_count || 0)}건</span><em title="${esc(realtime.last_error)}">${esc(realtime.last_error)}</em>`;
    }
    return `<span class="dc-live-dot"></span><b>실시간 수집 중</b><span>${esc(realtime.interval_seconds)}초 간격 · 현재 세션 ${esc(realtime.collect_count || 0)}건</span>`;
}

function _dcRefreshRealtimeStatusView() {
    const element = document.getElementById('dc-realtime-state');
    if (!element) return;
    const twin = _dcSelectedTwin();
    const connector = _dcSelectedRestConnector(twin);
    const realtime = _dcState.realtimeStatus || _dcInactiveRealtimeStatus(connector?.id || '');
    const realtimeActive = Boolean(
        realtime.active
        && connector
        && realtime.connector_id === connector.id
    );
    element.classList.toggle('active', realtimeActive && !realtime.last_error);
    element.classList.toggle('error', realtimeActive && Boolean(realtime.last_error));
    element.innerHTML = _dcRealtimeStatusContent(realtime, realtimeActive);
}

function _dcRestOutputStatusContent(output, connector) {
    if (!connector) {
        return '<b>수집 커넥터 필요</b><span>REST 수집 커넥터를 먼저 연결하세요.</span>';
    }
    if (!output?.configured) {
        return '<b>설정 안 됨</b><span>가공 규칙과 외부 REST API 주소를 설정하세요.</span>';
    }
    if (!output.enabled) {
        return `<b>전송 중지</b><span>성공 ${esc(output.success_count || 0)}건 · 실패 ${esc(output.failure_count || 0)}건</span>`;
    }
    if (output.last_error) {
        return `<b class="bad">전송 오류</b><span title="${esc(output.last_error)}">성공 ${esc(output.success_count || 0)}건 · 실패 ${esc(output.failure_count || 0)}건 · ${esc(output.last_error)}</span>`;
    }
    return `<b class="ok">자동 전송 중</b><span>성공 ${esc(output.success_count || 0)}건 · 실패 ${esc(output.failure_count || 0)}건${output.last_status_code ? ` · HTTP ${esc(output.last_status_code)}` : ''}</span>`;
}

function _dcRefreshRestOutputStatusView() {
    const element = document.getElementById('dc-rest-output-status');
    if (!element) return;
    const connector = _dcSelectedRestConnector(_dcSelectedTwin());
    element.innerHTML = _dcRestOutputStatusContent(_dcState.restOutput, connector);
}

async function _dcSyncRestOutputStatus(connectorId) {
    if (!connectorId) {
        _dcState.restOutput = _dcInactiveRestOutput();
        _dcRefreshRestOutputStatusView();
        return;
    }
    const output = await API.get(`/api/data-collection/connectors/${encodeURIComponent(connectorId)}/rest-output`);
    _dcState.restOutput = output;
    _dcRefreshRestOutputStatusView();
}

function _dcStartRealtimeStatusPolling(connectorId) {
    _dcStopRealtimeStatusPolling();
    if (!connectorId) return;
    _dcState.realtimeStatusTimer = setInterval(async () => {
        const twin = _dcSelectedTwin();
        const connector = _dcSelectedRestConnector(twin);
        if (!connector || connector.id !== connectorId) {
            _dcStopRealtimeStatusPolling();
            return;
        }
        try {
            const [status, restOutput] = await Promise.all([
                API.get(`/api/data-collection/connectors/${encodeURIComponent(connectorId)}/realtime/status`),
                API.get(`/api/data-collection/connectors/${encodeURIComponent(connectorId)}/rest-output`),
            ]);
            _dcState.realtimeStatus = status;
            _dcState.restOutput = restOutput;
            _dcRefreshRealtimeStatusView();
            _dcRefreshRestOutputStatusView();
            if (!status.active) _dcStopRealtimeStatusPolling();
        } catch {
            // SSE reconnect state communicates transient application access failures.
        }
    }, 2000);
}

function _dcApplyRealtimeRecord(record) {
    if (!record?.id) return;
    _dcState.records = [
        record,
        ..._dcState.records.filter(item => item.id !== record.id),
    ].slice(0, 80);
    const twin = _dcState.twins.find(item => item.id === record.twin_id || item.id === record.device_id);
    if (twin) {
        twin.status = 'online';
        twin.last_seen_at = record.timestamp || record.created_at || new Date().toISOString();
        twin.record_count = Number(twin.record_count || 0) + 1;
    }
    if (_dcState.realtimeStatus?.active) {
        if (record.connector_id === _dcState.realtimeStatus.connector_id) {
            _dcState.realtimeStatus.collect_count = Number(_dcState.realtimeStatus.collect_count || 0) + 1;
            _dcState.realtimeStatus.last_collected_at = record.timestamp || record.created_at || '';
            _dcState.realtimeStatus.last_error = '';
        }
    }
    _dcRenderStats();
    _dcRenderTwins();
    _dcRenderRecords();
    if (record.connector_id) {
        window.setTimeout(() => {
            _dcSyncRestOutputStatus(record.connector_id).catch(() => {});
        }, 500);
    }
}

function _dcOpenRealtimeStream(connectorId, twinId) {
    if (!connectorId && !twinId) return;
    const streamKey = twinId ? `twin:${twinId}` : connectorId;
    if (
        _dcState.realtimeSource
        && _dcState.realtimeStreamConnectorId === streamKey
    ) return;
    _dcCloseRealtimeStream();
    const params = new URLSearchParams();
    if (twinId) params.set('twin_id', twinId);
    else if (connectorId) params.set('connector_id', connectorId);
    const source = new EventSource(API._withNs(`/api/data-collection/records/stream?${params.toString()}`));
    _dcState.realtimeSource = source;
    _dcState.realtimeStreamConnectorId = streamKey;
    source.onopen = () => {
        _dcState.realtimeStreamConnected = true;
        document.getElementById('dc-realtime-state')?.classList.remove('reconnecting');
    };
    source.onmessage = (event) => {
        let message;
        try {
            message = JSON.parse(event.data);
        } catch {
            return;
        }
        if (message.type === 'ready') {
            _dcState.realtimeStreamConnected = true;
            const records = Array.isArray(message.records) ? message.records : [];
            if (records.length) {
                const merged = new Map();
                [...records, ..._dcState.records].forEach(record => {
                    if (record?.id && !merged.has(record.id)) merged.set(record.id, record);
                });
                _dcState.records = [...merged.values()]
                    .sort((a, b) => String(b.created_at || b.timestamp || '').localeCompare(String(a.created_at || a.timestamp || '')))
                    .slice(0, 80);
                _dcRenderStats();
                _dcRenderTwins();
                _dcRenderRecords();
            }
            return;
        }
        if (message.type === 'record') _dcApplyRealtimeRecord(message.record);
    };
    source.onerror = () => {
        _dcState.realtimeStreamConnected = false;
        document.getElementById('dc-realtime-state')?.classList.add('reconnecting');
    };
}

async function _dcSyncRealtimeState() {
    const twin = _dcSelectedTwin();
    const connector = _dcSelectedRestConnector(twin);
    if (!connector) {
        _dcCloseRealtimeStream();
        _dcStopRealtimeStatusPolling();
        _dcState.realtimeStatus = _dcInactiveRealtimeStatus();
        _dcState.restOutput = _dcInactiveRestOutput();
        if (twin) _dcOpenRealtimeStream('', twin.id);
        return;
    }
    const [status, restOutput] = await Promise.all([
        API.get(`/api/data-collection/connectors/${encodeURIComponent(connector.id)}/realtime/status`),
        API.get(`/api/data-collection/connectors/${encodeURIComponent(connector.id)}/rest-output`),
    ]);
    _dcState.realtimeStatus = status;
    _dcState.restOutput = restOutput;
    if (status.active) {
        const restored = (status.selected_attributes || []).filter(Boolean);
        if (restored.length) _dcState.selectedAttributeNames = restored;
        _dcOpenRealtimeStream(connector.id, twin?.id || '');
        _dcStartRealtimeStatusPolling(connector.id);
    } else {
        _dcStopRealtimeStatusPolling();
        _dcOpenRealtimeStream('', twin?.id || '');
    }
}

function _dcNextStepInfo() {
    const twin = _dcSelectedTwin();
    const selectedAttrs = _dcSelectedAttributes(twin);
    const records = twin ? _dcCurrentRecords() : [];
    const restConnector = twin ? _dcSelectedRestConnector(twin) : null;
    if (!twin) {
        return { label: '트윈 선택', desc: '분석 대상 디지털 트윈을 먼저 선택하세요.', action: '', actionLabel: '', tone: 'info' };
    }
    if (!restConnector) {
        return { label: '수집 커넥터 연결', desc: '트윈의 실제 데이터 소스를 먼저 연결하세요.', action: 'dc-connect-source', actionLabel: '커넥터 연결', tone: 'warning' };
    }
    if (!_dcTwinAttributes(twin).length) {
        return { label: '샘플 데이터 조회', desc: '실제 응답을 확인해 선택 가능한 데이터 항목을 불러오세요.', action: 'dc-preview-source', actionLabel: '샘플 데이터 조회', tone: 'warning' };
    }
    if (!selectedAttrs.length) {
        return { label: '데이터 항목 선택', desc: '검증된 응답에서 분석에 사용할 센서값 또는 상태값을 선택하세요.', action: '', actionLabel: '', tone: 'info' };
    }
    if (!records.length) {
        return { label: '수집 실행', desc: `${restConnector.name}에서 데이터를 바로 수집해 결과를 확인하세요.`, action: 'dc-next-collect-now', actionLabel: '수집 실행', tone: 'warning' };
    }
    return { label: '데이터셋 저장 가능', desc: '수집 결과를 연구용 데이터셋으로 저장할 수 있습니다.', action: 'dc-next-export-dataset', actionLabel: '데이터셋으로 저장', tone: 'success' };
}

function _dcRenderNextStep() {
    const el = document.getElementById('dc-next-step');
    if (!el) return;
    const info = _dcNextStepInfo();
    const toneClass = { info: 'info', warning: 'warning', success: 'success' }[info.tone] || 'info';
    el.className = `dc-next-step ${toneClass}`;
    el.innerHTML = `
        <div class="dc-next-body">
            <span class="dc-next-icon">${info.tone === 'success' ? 'OK' : info.tone === 'warning' ? '!' : 'STEP'}</span>
            <span class="dc-next-copy">
                <b>다음 단계 · ${esc(info.label)}</b>
                <small>${esc(info.desc)}</small>
            </span>
        </div>
        ${info.action ? `<button type="button" class="pm-btn pm-btn-sm dc-next-action" id="${esc(info.action)}">${esc(info.actionLabel)}</button>` : ''}`;
}

async function _dcTestConnectorById(connectorId) {
    const connector = _dcState.connectors.find(item => item.id === connectorId);
    if (!connector) return;
    _dcState.modalConnector = connector;
    await _dcTestConnector();
}

async function _dcSelectSourceConnector(connectorId) {
    if (_dcState.realtimeStatus?.active
        && _dcState.realtimeStatus.connector_id !== connectorId) {
        _dcToast('실시간 수집을 중지한 뒤 다른 커넥터를 선택하세요.', 'warn');
        _dcRenderTwins();
        return;
    }
    _dcState.selectedConnectorId = connectorId;
    _dcState.selectedAttributeNames = [];
    _dcState.selectedRecordIds = [];
    await _dcSyncRealtimeState();
    _dcRenderAll();
}

async function _dcPreviewSelectedConnector() {
    const twin = _dcSelectedTwin();
    const connector = _dcSelectedRestConnector(twin);
    if (!connector) throw new Error('먼저 REST 수집 커넥터를 연결하세요.');
    const result = await API.post(
        `/api/data-collection/connectors/${encodeURIComponent(connector.id)}/preview`,
        {},
    );
    const available = new Set((result.attributes || []).map(attr => attr.name).filter(Boolean));
    _dcState.selectedAttributeNames = _dcState.selectedAttributeNames.filter(name => available.has(name));
    _dcState.selectedConnectorId = connector.id;
    await _dcLoad();
    _dcRenderAll();
    _dcToast(`샘플 응답에서 데이터 항목 ${available.size}개를 확인했습니다.`);
}

async function _dcLoad() {
    const [overview, records] = await Promise.all([
        API.get('/api/data-collection/overview'),
        API.get('/api/data-collection/records?limit=80'),
    ]);
    _dcState.overview = overview;
    _dcState.twins = overview.twins || [];
    _dcState.connectors = overview.connectors || [];
    _dcState.records = records.records || [];
    const liveRecordIds = new Set(_dcState.records.map(record => record.id));
    _dcState.selectedRecordIds = _dcState.selectedRecordIds.filter(id => liveRecordIds.has(id));
    if (_dcState.selectedTwinId && !_dcState.twins.some(item => item.id === _dcState.selectedTwinId)) {
        _dcState.selectedTwinId = '';
    }
    if (!_dcState.selectedTwinId && _dcState.twins.length) {
        _dcState.selectedTwinId = _dcState.twins[0].id;
    }
    const selectedTwin = _dcState.twins.find(item => item.id === _dcState.selectedTwinId) || null;
    const linkedRestConnectors = selectedTwin
        ? _dcState.connectors.filter(
            connector => connector.twin_id === selectedTwin.id && connector.connector_type === 'rest',
        )
        : [];
    if (!_dcState.selectedConnectorId
        || !linkedRestConnectors.some(connector => connector.id === _dcState.selectedConnectorId)) {
        _dcState.selectedConnectorId = linkedRestConnectors[0]?.id || '';
    }
    if (_dcState.modalConnector?.id) {
        _dcState.modalConnector = _dcState.connectors.find(item => item.id === _dcState.modalConnector.id) || null;
    }
}

function _dcRenderStats() {
    const el = document.getElementById('dc-stats');
    if (!el) return;
    const twin = _dcSelectedTwin();
    const selectedAttrs = _dcSelectedAttributes(twin);
    const records = twin ? _dcCurrentRecords() : [];
    const lastRecord = records[0] || null;
    const selectedNames = selectedAttrs.map(attr => attr.label || attr.name).join(', ');
    const saveState = records.length ? '데이터셋 미저장' : '수집 필요';
    const saveSub = records.length ? '저장 후 분석 가능' : '수집 결과 필요';
    const cards = [
        {
            label: '선택한 트윈',
            value: twin ? twin.name : '트윈 미선택',
            sub: twin ? '분석 대상 선택됨' : '목록에서 선택',
            icon: 'DT',
            tone: twin ? 'accent' : 'muted',
        },
        {
            label: '선택 항목',
            value: `${selectedAttrs.length}개 항목`,
            sub: selectedNames || '분석할 항목 선택',
            icon: 'SEL',
            tone: selectedAttrs.length ? 'accent' : 'muted',
        },
        {
            label: '최근 수집',
            value: lastRecord ? _dcFmtDate(lastRecord.timestamp || lastRecord.created_at) : '수집 없음',
            sub: lastRecord ? `${records.length}건 수집 · ${lastRecord.type || 'sensor'}` : '수집 실행 필요',
            icon: 'IN',
            tone: lastRecord ? 'success' : 'muted',
        },
        {
            label: '저장 상태',
            value: saveState,
            sub: saveSub,
            icon: 'DS',
            tone: records.length ? 'warning' : 'muted',
        },
    ];
    el.innerHTML = cards.map(card => `
        <div class="dc-prep-stat ${esc(card.tone)}">
            <span class="dc-prep-stat-icon">${esc(card.icon)}</span>
            <span class="dc-prep-stat-body">
                <small>${esc(card.label)}</small>
                <b title="${esc(card.value)}">${esc(card.value)}</b>
                <em title="${esc(card.sub)}">${esc(card.sub)}</em>
            </span>
        </div>`).join('');
}

function _dcRenderTypePalette() {
    const el = document.getElementById('dc-type-palette');
    if (!el) return;
    el.innerHTML = DC_TYPES.map(meta => `
        <button type="button" class="dc-type-block" data-dc-new-type="${esc(meta.type)}">
            <span class="dc-type-icon">${esc(meta.icon)}</span>
            <span>
                <b>${esc(meta.label)}</b>
                <small>${meta.type === 'custom' ? 'YAML 설정' : `port ${esc(meta.defaultPort || '-')}`}</small>
            </span>
        </button>`).join('');
}

function _dcConnectorStatusText(status) {
    const value = String(status || '').toLowerCase();
    if (['ready', 'online'].includes(value)) return '연결됨';
    if (['draft', 'unknown', ''].includes(value)) return '초안';
    if (['error', 'offline'].includes(value)) return '오류';
    return _dcStatusLabel(status);
}

function _dcConnectorCard(connector) {
    const meta = _dcTypeMeta(connector.connector_type);
    return `
        <div class="dc-connector-card" data-connector-id="${esc(connector.id)}">
            <button type="button" class="dc-connector-edit" data-dc-connector-edit="${esc(connector.id)}" title="${esc(connector.name)} 설정">
                <span class="dc-connector-icon">${esc(meta.icon)}</span>
                <span class="dc-connector-main">
                    <b>${esc(connector.name)}</b>
                    <small>${esc(connector.twin_name || '트윈 미연결')} · ${esc(_dcConnectorChannel(connector))}</small>
                </span>
                <span class="dc-type-pill type-${esc(connector.connector_type || 'custom')}">${esc(meta.label.replace(' API', ''))}</span>
            </button>
            <div class="dc-connector-nifi-actions">
                <span>독립 NiFi Flow</span>
                <button type="button" class="pm-btn pm-btn-sm" data-dc-nifi-spec="${esc(connector.id)}">Spec 생성</button>
                <button type="button" class="pm-btn pm-btn-sm" data-dc-nifi-apply="${esc(connector.id)}">NiFi 적용</button>
            </div>
        </div>`;
}

function _dcRenderConnectors() {
    const el = document.getElementById('dc-connectors');
    if (!el) return;
    if (!_dcState.connectors.length) {
        el.innerHTML = '<div class="dc-empty dc-advanced-empty">등록된 커넥터가 없습니다.</div>';
        return;
    }
    el.innerHTML = _dcState.connectors.map(_dcConnectorCard).join('');
}

function _dcAdvancedPanelMarkup() {
    const connectorRows = _dcState.connectors.length
        ? _dcState.connectors.map(_dcConnectorCard).join('')
        : '<div class="dc-empty dc-advanced-empty">등록된 커넥터가 없습니다.</div>';
    return `
        <aside class="dc-advanced-panel">
            <div class="dc-advanced-head">
                <div>
                    <h2>수집 커넥터 / NiFi 고급 설정</h2>
                    <p>커넥터마다 독립 NiFi Flow Spec과 Process Group을 생성·적용합니다.</p>
                </div>
            </div>
            <div class="dc-advanced-body">
                <div class="dc-advanced-section-head">
                    <b>커넥터 목록</b>
                    <button type="button" class="pm-btn pm-btn-sm" id="dc-new-connector">+ 새 커넥터</button>
                </div>
                <div id="dc-connectors" class="dc-connector-list">${connectorRows}</div>
            </div>
        </aside>`;
}

function _dcOpenConnectorModal(connector) {
    _dcState.restOutputModal = null;
    _dcState.modalConnector = { ...(connector || _dcDefaultDraft('mqtt')) };
    _dcRenderConnectorModal();
}

function _dcCloseConnectorModal() {
    _dcState.modalConnector = null;
    _dcState.restOutputModal = null;
    _dcRenderConnectorModal();
}

function _dcRenderConnectorModal() {
    const modal = document.getElementById('dc-modal');
    const body = document.getElementById('dc-modal-body');
    if (!modal || !body) return;
    if (_dcState.restOutputModal) {
        _dcRenderRestOutputModal(modal, body);
        return;
    }
    const connector = _dcState.modalConnector;
    if (!connector) {
        modal.hidden = true;
        body.innerHTML = '';
        return;
    }

    const meta = _dcTypeMeta(connector.connector_type);
    const isExisting = !!connector.id;
    const twinOptions = [
        '<option value="">트윈 미연결</option>',
        ..._dcState.twins.map(twin => `<option value="${esc(twin.id)}" ${twin.id === connector.twin_id ? 'selected' : ''}>${esc(twin.name)}</option>`),
    ].join('');

    modal.hidden = false;
    body.innerHTML = `
        <div class="dc-modal-card" role="dialog" aria-modal="true" aria-label="커넥터 설정">
            <div class="dc-modal-head">
                <div class="dc-form-type"><span>${esc(meta.icon)}</span><b>${esc(isExisting ? '커넥터 설정' : '새 커넥터')}</b></div>
                <div class="dc-modal-head-actions">
                    ${isExisting ? `<span class="dc-badge ${esc(_dcStatusClass(connector.status))}">${esc(_dcStatusLabel(connector.status))}</span>` : '<span class="dc-badge warn">Draft</span>'}
                    <button type="button" class="dc-modal-x" id="dc-modal-close" aria-label="닫기">×</button>
                </div>
            </div>
            <form id="dc-connector-form" class="dc-form dc-modal-form">
                <div class="dc-connector-guide">${esc(_dcConnectorGuide(connector.connector_type))}</div>
                ${connector.metadata?.source_mode === 'twin' ? `
                    <div class="dc-source-note">
                        <b>연결 대상 트윈</b>
                        <span>${esc(connector.metadata.twin_name || connector.twin_name || '-')} · ${esc(connector.metadata.source_url || '수집 주소를 입력하세요.')}</span>
                    </div>` : ''}
                <label>이름<input id="dc-c-name" class="pm-input" value="${esc(connector.name || '')}" /></label>
                <div class="dc-form-grid">
                    <label>유형
                        <select id="dc-c-type" class="pm-input">
                            ${DC_TYPES.map(item => `<option value="${esc(item.type)}" ${item.type === connector.connector_type ? 'selected' : ''}>${esc(item.label)}</option>`).join('')}
                        </select>
                    </label>
                    <label>연결 트윈
                        <select id="dc-c-twin" class="pm-input">${twinOptions}</select>
                    </label>
                </div>
                <div class="dc-form-grid wide-left">
                    <label>URL / Host<input id="dc-c-endpoint" class="pm-input pm-input-mono" value="${esc(connector.endpoint_url || '')}" placeholder="mqtt://broker.local" /></label>
                    <label>Port<input id="dc-c-port" class="pm-input pm-input-mono" value="${esc(connector.port || '')}" placeholder="1883" /></label>
                </div>
                <div class="dc-form-grid">
                    <label>Topic / Path<input id="dc-c-topic" class="pm-input pm-input-mono" value="${esc(connector.topic || '')}" placeholder="factory/line-1/telemetry" /></label>
                    <label>Method<input id="dc-c-method" class="pm-input pm-input-mono" value="${esc(connector.method || '')}" placeholder="POST" /></label>
                </div>
                <label>Custom YAML
                    <textarea id="dc-c-yaml" class="pm-input pm-input-mono dc-yaml" spellcheck="false" placeholder="복잡한 인증, 파서, 재시도 정책 등을 YAML로 보관">${esc(connector.yaml_config || '')}</textarea>
                </label>
                ${isExisting ? `
                    <div class="dc-form-foot">
                        <span>Last check ${esc(_dcFmtDate(connector.last_checked_at))}</span>
                        <span>Last data ${esc(_dcFmtDate(connector.last_message_at))}</span>
                    </div>` : ''}
                <div class="dc-form-actions dc-modal-actions">
                    <button type="submit" class="pm-btn pm-btn-primary">${isExisting ? '저장' : '커넥터 생성'}</button>
                    ${isExisting ? '<button type="button" class="pm-btn pm-btn-success" id="dc-test-connector">형식 확인</button>' : ''}
                    ${isExisting ? '<button type="button" class="pm-btn" id="dc-edge-agent">전송 예시</button>' : ''}
                    ${isExisting ? '<button type="button" class="pm-btn pm-btn-danger" id="dc-delete-connector">삭제</button>' : ''}
                    <button type="button" class="pm-btn pm-btn-ghost" id="dc-modal-cancel">닫기</button>
                </div>
            </form>
        </div>`;
}

function _dcJsonText(value) {
    try {
        return JSON.stringify(value ?? {}, null, 2);
    } catch {
        return String(value ?? '');
    }
}

function _dcParseJsonObjectInput(id, label, nullable = false) {
    const text = document.getElementById(id)?.value.trim() || '';
    if (!text) return nullable ? null : {};
    let value;
    try {
        value = JSON.parse(text);
    } catch {
        throw new Error(`${label}은 JSON 객체 형식으로 입력하세요.`);
    }
    if (!value || Array.isArray(value) || typeof value !== 'object') {
        throw new Error(`${label}은 JSON 객체 형식이어야 합니다.`);
    }
    return value;
}

function _dcRestOutputFormPayload() {
    const selectedFields = (document.getElementById('dc-ro-fields')?.value || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
    const headers = _dcParseJsonObjectInput('dc-ro-headers', '요청 헤더', true);
    return {
        enabled: Boolean(document.getElementById('dc-ro-enabled')?.checked),
        target_url: document.getElementById('dc-ro-url')?.value.trim() || '',
        method: document.getElementById('dc-ro-method')?.value || 'POST',
        headers,
        clear_headers: Boolean(document.getElementById('dc-ro-clear-headers')?.checked),
        selected_fields: selectedFields,
        flatten_ngsi_values: document.getElementById('dc-ro-flatten')?.value !== 'false',
        include_timestamp: document.getElementById('dc-ro-timestamp')?.value !== 'false',
        field_mapping: _dcParseJsonObjectInput('dc-ro-mapping', '필드명 변경'),
        static_fields: _dcParseJsonObjectInput('dc-ro-static', '고정값 추가'),
        envelope_key: document.getElementById('dc-ro-envelope')?.value.trim() || '',
        timeout_seconds: Number(document.getElementById('dc-ro-timeout')?.value || 10),
    };
}

function _dcRestOutputLogRows(logs) {
    if (!logs?.length) {
        return '<tr><td colspan="5" class="dc-table-empty">아직 전송 이력이 없습니다.</td></tr>';
    }
    return logs.slice(0, 10).map(log => `
        <tr>
            <td>${esc(_dcFmtDate(log.created_at))}</td>
            <td><span class="dc-badge ${log.status === 'success' ? 'ok' : 'bad'}">${log.status === 'success' ? '성공' : '실패'}</span></td>
            <td class="pm-table-mono">${esc(log.status_code || '-')}</td>
            <td class="pm-table-mono" title="${esc(log.record_id || '')}">${esc((log.record_id || '-').slice(0, 24))}</td>
            <td title="${esc(log.error || log.response_preview || '')}">${esc((log.error || log.response_preview || '-').slice(0, 80))}</td>
        </tr>`).join('');
}

function _dcRenderRestOutputModal(modal, body) {
    const state = _dcState.restOutputModal;
    if (!state) return;
    const config = state.config || _dcInactiveRestOutput(state.connector?.id || '');
    const selectedFields = config.selected_fields?.length
        ? config.selected_fields
        : _dcSelectedAttributes(_dcSelectedTwin()).map(attr => attr.name).filter(Boolean);
    modal.hidden = false;
    body.innerHTML = `
        <div class="dc-modal-card wide" role="dialog" aria-modal="true" aria-label="실시간 REST 전송 설정">
            <div class="dc-modal-head">
                <div class="dc-form-type"><span>TX</span><b>실시간 REST 전송 설정</b></div>
                <div class="dc-modal-head-actions">
                    <span class="dc-badge ${config.enabled ? (config.last_error ? 'bad' : 'ok') : 'muted'}">${config.enabled ? (config.last_error ? '전송 오류' : '자동 전송') : '중지'}</span>
                    <button type="button" class="dc-modal-x" id="dc-modal-close" aria-label="닫기">×</button>
                </div>
            </div>
            <form id="dc-rest-output-form" class="dc-form dc-modal-form">
                <div class="dc-connector-guide">새 수집 레코드를 저장한 뒤 선택 필드와 가공 규칙을 적용하여 외부 REST API로 자동 전송합니다. 원본 수집 데이터는 변경하지 않습니다.</div>
                <label class="dc-rest-enable">
                    <input id="dc-ro-enabled" type="checkbox" ${config.enabled ? 'checked' : ''} />
                    <span><b>실시간 자동 전송 사용</b><small>활성화하면 이 커넥터로 들어오는 새 레코드마다 전송합니다.</small></span>
                </label>
                <div class="dc-form-grid wide-left">
                    <label>전송 URL<input id="dc-ro-url" class="pm-input pm-input-mono" value="${esc(config.target_url || '')}" placeholder="https://receiver.example.com/api/data" /></label>
                    <label>Method
                        <select id="dc-ro-method" class="pm-input">
                            ${['POST', 'PUT', 'PATCH'].map(method => `<option value="${method}" ${method === (config.method || 'POST') ? 'selected' : ''}>${method}</option>`).join('')}
                        </select>
                    </label>
                </div>
                <label>전송할 필드
                    <input id="dc-ro-fields" class="pm-input pm-input-mono" value="${esc(selectedFields.join(', '))}" placeholder="temperature, pressure, vibration" />
                    <span class="dc-field-help">쉼표로 구분합니다. 비워두면 수집 payload의 전체 필드를 전송합니다.</span>
                </label>
                <div class="dc-form-grid">
                    <label>NGSI-LD 값 가공
                        <select id="dc-ro-flatten" class="pm-input">
                            <option value="true" ${config.flatten_ngsi_values !== false ? 'selected' : ''}>Property의 value만 사용</option>
                            <option value="false" ${config.flatten_ngsi_values === false ? 'selected' : ''}>원본 객체 유지</option>
                        </select>
                    </label>
                    <label>수집 시각
                        <select id="dc-ro-timestamp" class="pm-input">
                            <option value="true" ${config.include_timestamp !== false ? 'selected' : ''}>timestamp 필드 추가</option>
                            <option value="false" ${config.include_timestamp === false ? 'selected' : ''}>추가하지 않음</option>
                        </select>
                    </label>
                </div>
                <div class="dc-form-grid">
                    <label>필드명 변경 JSON
                        <textarea id="dc-ro-mapping" class="pm-input pm-input-mono dc-rest-json" spellcheck="false" placeholder='{"temperature":"temp_c"}'>${esc(_dcJsonText(config.field_mapping || {}))}</textarea>
                    </label>
                    <label>고정값 추가 JSON
                        <textarea id="dc-ro-static" class="pm-input pm-input-mono dc-rest-json" spellcheck="false" placeholder='{"site":"lab-a"}'>${esc(_dcJsonText(config.static_fields || {}))}</textarea>
                    </label>
                </div>
                <div class="dc-form-grid">
                    <label>최상위 묶음 키<input id="dc-ro-envelope" class="pm-input pm-input-mono" value="${esc(config.envelope_key || '')}" placeholder="data (선택)" /></label>
                    <label>Timeout (초)<input id="dc-ro-timeout" class="pm-input pm-input-mono" type="number" min="1" max="30" step="1" value="${esc(config.timeout_seconds || 10)}" /></label>
                </div>
                <label>요청 헤더 JSON
                    <textarea id="dc-ro-headers" class="pm-input pm-input-mono dc-rest-json" spellcheck="false" placeholder='{"Authorization":"Bearer ..."}'></textarea>
                    <span class="dc-field-help">${config.has_headers ? '저장된 헤더가 있습니다. 비워두면 기존 값을 유지합니다.' : '인증이 필요한 경우에만 입력하세요. 저장 후 값은 화면에 다시 표시하지 않습니다.'}</span>
                </label>
                ${config.has_headers ? `
                    <label class="dc-inline-check"><input id="dc-ro-clear-headers" type="checkbox" /><span>저장된 요청 헤더 삭제</span></label>` : ''}
                <div class="dc-rest-output-summary">
                    <span><small>성공</small><b>${esc(config.success_count || 0)}건</b></span>
                    <span><small>실패</small><b>${esc(config.failure_count || 0)}건</b></span>
                    <span><small>최근 HTTP</small><b>${esc(config.last_status_code || '-')}</b></span>
                    <span><small>최근 전송</small><b>${esc(_dcFmtDate(config.last_sent_at))}</b></span>
                </div>
                ${config.last_error ? `<div class="dc-rest-output-error">${esc(config.last_error)}</div>` : ''}
                ${state.testResult ? `
                    <div class="dc-detail-section">
                        <div class="dc-detail-title">전송 테스트 결과 · HTTP ${esc(state.testResult.status_code || '-')}</div>
                        <pre class="dc-json">${esc(_dcJsonText(state.testResult.request_payload || {}))}</pre>
                    </div>` : ''}
                <div class="dc-detail-section">
                    <div class="dc-detail-title">최근 전송 이력</div>
                    <div class="dc-records-wrap compact">
                        <table class="pm-table dc-rest-log-table">
                            <thead><tr><th>전송 시각</th><th>상태</th><th>HTTP</th><th>레코드</th><th>응답 / 오류</th></tr></thead>
                            <tbody>${_dcRestOutputLogRows(state.logs || [])}</tbody>
                        </table>
                    </div>
                </div>
                <div class="dc-form-actions dc-modal-actions">
                    <button type="submit" class="pm-btn pm-btn-primary">설정 저장</button>
                    <button type="button" class="pm-btn pm-btn-success" id="dc-rest-output-test">전송 테스트</button>
                    ${config.configured ? '<button type="button" class="pm-btn pm-btn-danger" id="dc-rest-output-delete">설정 삭제</button>' : ''}
                    <button type="button" class="pm-btn pm-btn-ghost" id="dc-modal-cancel">닫기</button>
                </div>
            </form>
        </div>`;
}

async function _dcOpenRestOutputModal() {
    const connector = _dcSelectedRestConnector(_dcSelectedTwin());
    if (!connector) {
        _dcToast('실시간 REST 전송을 설정할 수집 커넥터가 없습니다.', 'warn');
        return;
    }
    const [config, logResult] = await Promise.all([
        API.get(`/api/data-collection/connectors/${encodeURIComponent(connector.id)}/rest-output`),
        API.get(`/api/data-collection/connectors/${encodeURIComponent(connector.id)}/rest-output/logs?limit=20`),
    ]);
    _dcState.modalConnector = null;
    _dcState.restOutputModal = {
        connector,
        config,
        logs: logResult.logs || [],
        testResult: null,
    };
    _dcRenderConnectorModal();
}

async function _dcSaveRestOutput() {
    const state = _dcState.restOutputModal;
    if (!state?.connector?.id) return;
    const config = await API.put(
        `/api/data-collection/connectors/${encodeURIComponent(state.connector.id)}/rest-output`,
        _dcRestOutputFormPayload(),
    );
    state.config = config;
    _dcState.restOutput = config;
    _dcRenderConnectorModal();
    _dcRefreshRestOutputStatusView();
    _dcToast(config.enabled ? '실시간 REST 자동 전송을 시작했습니다.' : 'REST 전송 설정을 저장했습니다.');
}

async function _dcTestRestOutput() {
    const state = _dcState.restOutputModal;
    if (!state?.connector?.id) return;
    const result = await API.post(
        `/api/data-collection/connectors/${encodeURIComponent(state.connector.id)}/rest-output/test`,
        { ..._dcRestOutputFormPayload(), sample_payload: {} },
    );
    state.testResult = result;
    _dcRenderConnectorModal();
    _dcToast(`REST 전송 테스트 성공 · HTTP ${result.status_code}`);
}

async function _dcDeleteRestOutput() {
    const state = _dcState.restOutputModal;
    if (!state?.connector?.id) return;
    if (!confirm('실시간 REST 전송 설정과 전송 이력을 삭제할까요? 수집 레코드는 유지됩니다.')) return;
    await API.del(`/api/data-collection/connectors/${encodeURIComponent(state.connector.id)}/rest-output`);
    _dcState.restOutput = _dcInactiveRestOutput(state.connector.id);
    _dcCloseConnectorModal();
    _dcRenderRecords();
    _dcToast('REST 전송 설정과 이력을 삭제했습니다.', 'warn');
}

function _dcOpenInfoModal(titleHtml, badgeHtml, bodyHtml, wide = false) {
    _dcState.modalConnector = null;
    _dcState.restOutputModal = null;
    const modal = document.getElementById('dc-modal');
    const body = document.getElementById('dc-modal-body');
    if (!modal || !body) return;
    modal.hidden = false;
    body.innerHTML = `
        <div class="dc-modal-card ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="상세 정보">
            <div class="dc-modal-head">
                ${titleHtml}
                <div class="dc-modal-head-actions">
                    ${badgeHtml || ''}
                    <button type="button" class="dc-modal-x" id="dc-modal-close" aria-label="닫기">×</button>
                </div>
            </div>
            ${bodyHtml}
            <div class="dc-form-actions dc-modal-actions">
                <button type="button" class="pm-btn pm-btn-ghost" id="dc-modal-cancel">닫기</button>
            </div>
        </div>`;
}

function _dcConnectorDetail(connector) {
    const meta = _dcTypeMeta(connector.connector_type);
    return `
        <div class="dc-detail-card">
            <div class="dc-detail-card-head">
                <span class="dc-connector-icon">${esc(meta.icon)}</span>
                <div>
                    <b>${esc(connector.name)}</b>
                    <small>${esc(meta.label)} · ${esc(_dcStatusLabel(connector.status))}</small>
                </div>
            </div>
            <div class="dc-detail-lines">
                <span><b>입력 소스</b>${esc(_dcConnectorEndpoint(connector))}</span>
                <span><b>채널</b>${esc(_dcConnectorChannel(connector))}</span>
                <span><b>최근 데이터</b>${esc(_dcFmtDate(connector.last_message_at))}</span>
                <span><b>레코드</b>${esc(connector.record_count || 0)}</span>
            </div>
        </div>`;
}

function _dcRecordDetailRow(record) {
    return `
        <tr class="dc-record-row" data-record-id="${esc(record.id)}" title="더블클릭해서 메타데이터 상세 보기">
            <td class="pm-table-mono">${esc(_dcFmtDate(record.timestamp))}</td>
            <td class="pm-table-mono">${esc(record.device_id)}</td>
            <td>${esc(record.connector_name || record.connector_id || '-')}</td>
            <td>${esc(record.type || '-')}</td>
            <td class="pm-table-mono">${esc(JSON.stringify(record.payload || {}).slice(0, 80))}</td>
        </tr>`;
}

async function _dcOpenTwinDetail(twinId) {
    const data = await API.get(`/api/data-collection/twins/${encodeURIComponent(twinId)}/detail?limit=30`);
    const twin = data.twin;
    const connectors = data.connectors || [];
    const records = data.records || [];
    const attrs = _dcTwinAttributes(twin, records, connectors);
    const title = `
        <div class="dc-form-type"><span>DT</span><b>${esc(twin.name)}</b></div>`;
    const body = `
        <div class="dc-detail-grid">
            <div class="dc-kv"><small>연결 커넥터</small><b>${esc(twin.connector_count || connectors.length || 0)}</b></div>
            <div class="dc-kv"><small>수집 레코드</small><b>${esc(twin.record_count || records.length || 0)}</b></div>
            <div class="dc-kv"><small>최근 수집</small><b>${esc(_dcFmtDate(twin.last_seen_at || twin.last_record_at))}</b></div>
        </div>
        <div class="dc-detail-section">
            <div class="dc-detail-title">데이터 속성</div>
            <div class="dc-attr-list detail">
                ${_dcAttributeChips(twin, attrs, 16)}
            </div>
        </div>
        <div class="dc-detail-section">
            <div class="dc-detail-title">데이터 입출력</div>
            <div class="dc-detail-list">
                ${connectors.length ? connectors.map(_dcConnectorDetail).join('') : '<div class="dc-empty">연결된 커넥터가 없습니다.</div>'}
            </div>
        </div>
        <div class="dc-detail-section">
            <div class="dc-detail-title">최근 수집 레코드</div>
            ${records.length ? `
                <div class="dc-records-wrap compact">
                    <table class="pm-table dc-record-table">
                        <thead><tr><th>Time</th><th>Device</th><th>Connector</th><th>Type</th><th>Payload</th></tr></thead>
                        <tbody>${records.map(_dcRecordDetailRow).join('')}</tbody>
                    </table>
                </div>` : '<div class="dc-empty">아직 이 트윈에 연결된 수집 레코드가 없습니다.</div>'}
        </div>
        <div class="dc-detail-section">
            <div class="dc-detail-title">메타데이터</div>
            <pre class="dc-json">${esc(_dcJsonText(twin.metadata || {}))}</pre>
        </div>`;
    _dcOpenInfoModal(title, '', body, records.length > 0);
}

async function _dcOpenRecordDetail(recordId) {
    const record = await API.get(`/api/data-collection/records/${encodeURIComponent(recordId)}`);
    const title = `
        <div class="dc-form-type"><span>REC</span><b>수집 레코드 상세</b></div>`;
    const body = `
        <div class="dc-detail-grid two">
            <div class="dc-kv"><small>Record ID</small><b>${esc(record.id)}</b></div>
            <div class="dc-kv"><small>Device ID</small><b>${esc(record.device_id || '-')}</b></div>
            <div class="dc-kv"><small>Dataset ID</small><b>${esc(record.dataset_id || '-')}</b></div>
            <div class="dc-kv"><small>Type</small><b>${esc(record.type || '-')}</b></div>
            <div class="dc-kv"><small>Twin</small><b>${esc(record.twin_name || record.twin_id || '-')}</b></div>
            <div class="dc-kv"><small>Connector</small><b>${esc(record.connector_name || record.connector_id || '-')}</b></div>
            <div class="dc-kv"><small>Timestamp</small><b>${esc(_dcFmtDate(record.timestamp))}</b></div>
            <div class="dc-kv"><small>File Path</small><b>${esc(record.file_path || '-')}</b></div>
        </div>
        <div class="dc-detail-section">
            <div class="dc-detail-title">Payload / Raw</div>
            <pre class="dc-json">${esc(_dcJsonText(record.payload || {}))}</pre>
        </div>
        <div class="dc-detail-section">
            <div class="dc-detail-title">Meta JSON</div>
            <pre class="dc-json">${esc(_dcJsonText(record.meta || {}))}</pre>
        </div>`;
    _dcOpenInfoModal(title, '', body, true);
}

function _dcDownloadRecords(format) {
    const fmt = format === 'json' ? 'json' : 'csv';
    const twin = _dcSelectedTwin();
    const selectedAttributes = _dcSelectedAttributes(twin).map(attr => attr.name).filter(Boolean);
    const selectedRecordIds = _dcSelectedRecordIds();
    if (!selectedAttributes.length) {
        _dcToast('내보낼 데이터 항목을 선택하세요.', 'warn');
        return;
    }
    if (!selectedRecordIds.length) {
        _dcToast('내보낼 수집 레코드를 선택하세요.', 'warn');
        return;
    }
    const params = new URLSearchParams({ format: fmt, limit: String(selectedRecordIds.length) });
    selectedRecordIds.forEach(recordId => params.append('record_ids', recordId));
    selectedAttributes.forEach(attribute => params.append('selected_attributes', attribute));
    window.open(API._withNs(`/api/data-collection/records/export?${params.toString()}`), '_blank', 'noopener');
}


function _dcOpenDatasetExportModal() {
    const records = _dcCurrentRecords();
    const selectedIds = _dcSelectedRecordIds(records);
    const selectedAttributes = _dcSelectedAttributes(_dcSelectedTwin());
    if (!records.length) {
        _dcToast('데이터셋으로 등록할 수집 레코드가 없습니다.', 'warn');
        return;
    }
    if (!selectedIds.length) {
        _dcToast('데이터셋으로 저장할 수집 레코드를 선택하세요.', 'warn');
        return;
    }
    if (!selectedAttributes.length) {
        _dcToast('데이터셋으로 저장할 데이터 항목을 선택하세요.', 'warn');
        return;
    }
    _dcState.modalConnector = null;
    _dcState.restOutputModal = null;
    const modal = document.getElementById('dc-modal');
    const body = document.getElementById('dc-modal-body');
    if (!modal || !body) return;
    const dateToken = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    modal.hidden = false;
    body.innerHTML = `
        <div class="dc-modal-card" role="dialog" aria-modal="true" aria-label="선택 레코드 데이터셋 등록">
            <div class="dc-modal-head">
                <div class="dc-form-type"><span>CSV</span><b>선택 레코드 데이터셋 등록</b></div>
                <div class="dc-modal-head-actions">
                    <span class="dc-badge ok">선택 ${esc(selectedIds.length)}건</span>
                    <span class="dc-badge ok">항목 ${esc(selectedAttributes.length)}개</span>
                    <button type="button" class="dc-modal-x" id="dc-modal-close" aria-label="닫기">×</button>
                </div>
            </div>
            <form id="dc-export-form" class="dc-form dc-modal-form">
                <label>데이터셋 이름<input id="dc-export-name" class="pm-input" value="collection-records-${dateToken}" /></label>
                <label>설명<input id="dc-export-desc" class="pm-input" value="선택한 데이터 수집 레코드에서 생성한 데이터셋" /></label>
                <div class="dc-form-grid">
                    <label>CSV 파일명<input id="dc-export-file" class="pm-input pm-input-mono" value="collection-records-${dateToken}.csv" /></label>
                    <label>선택 레코드 수<input class="pm-input pm-input-mono" value="${esc(selectedIds.length)}건" disabled /></label>
                </div>
                <label>버전 메모<input id="dc-export-notes" class="pm-input" value="선택 수집 레코드 CSV export" /></label>
                <div class="dc-form-help">CSV 컬럼: timestamp, ${selectedAttributes.map(attr => esc(attr.name)).join(', ')}</div>
                <div class="dc-form-help">수집 데이터는 원본 버전으로 저장됩니다. 저장 후 데이터셋 카탈로그에서 학습 유형과 target 컬럼을 선택하고 전처리하세요.</div>
                <div class="dc-form-actions dc-modal-actions">
                    <button type="submit" class="pm-btn pm-btn-primary">등록</button>
                    <button type="button" class="pm-btn pm-btn-ghost" id="dc-modal-cancel">닫기</button>
                </div>
            </form>
        </div>`;
}

async function _dcSubmitDatasetExport() {
    const name = document.getElementById('dc-export-name')?.value.trim() || '';
    const fileName = document.getElementById('dc-export-file')?.value.trim() || 'collection-records.csv';
    const recordIds = _dcSelectedRecordIds();
    const selectedAttributes = _dcSelectedAttributes(_dcSelectedTwin()).map(attr => attr.name).filter(Boolean);
    if (!name) throw new Error('데이터셋 이름을 입력하세요.');
    if (!recordIds.length) throw new Error('데이터셋으로 저장할 수집 레코드를 선택하세요.');
    if (!selectedAttributes.length) throw new Error('데이터셋으로 저장할 데이터 항목을 선택하세요.');
    const result = await API.post('/api/data-collection/records/dataset-version', {
        dataset_name: name,
        description: document.getElementById('dc-export-desc')?.value.trim() || '',
        record_ids: recordIds,
        selected_attributes: selectedAttributes,
        limit: recordIds.length,
        file_name: fileName,
        pipeline_ready: false,
        publish: false,
        notes: document.getElementById('dc-export-notes')?.value.trim() || '',
    });
    _dcSetSelectedRecordIds([]);
    _dcCloseConnectorModal();
    await _dcLoad();
    _dcRenderAll();
    const versionLabel = result?.version?.version ? `v${result.version.version}` : '새 버전';
    _dcToast(`${result.record_count || 0}건을 ${result.dataset?.name || name} ${versionLabel} 원본으로 등록했습니다. 카탈로그에서 전처리하세요.`);
}

function _dcSourceStepMarkup(twin, connector) {
    const restConnectors = _dcTwinConnectors(twin).filter(item => item.connector_type === 'rest');
    if (!connector) {
        return `
            <section class="dc-step-card dc-source-step">
                <div class="dc-step-head compact">
                    <span class="dc-step-no">2</span>
                    <div>
                        <h2>수집 커넥터 연결</h2>
                        <p>트윈의 실제 데이터 소스를 먼저 연결합니다.</p>
                    </div>
                    <span class="dc-badge warn">연결 필요</span>
                </div>
                <div class="dc-source-gate empty">
                    <span>연결된 REST 수집 커넥터가 없습니다.</span>
                    <button type="button" class="pm-btn pm-btn-primary" id="dc-connect-source">커넥터 연결</button>
                </div>
            </section>`;
    }
    const preview = connector.metadata?.preview || {};
    const previewCount = Array.isArray(preview.attributes) ? preview.attributes.length : 0;
    const collectedCount = new Set(
        _dcPayloadAttributes(twin, _dcState.records, connector.id).map(attr => attr.name),
    ).size;
    const verifiedCount = _dcTwinAttributes(twin).length;
    const statusText = previewCount
        ? `샘플 확인 완료 · ${previewCount}개 항목`
        : collectedCount
            ? `수집 이력 확인 · ${collectedCount}개 항목`
            : '샘플 조회 필요';
    const statusClass = verifiedCount ? 'ok' : 'warn';
    return `
        <section class="dc-step-card dc-source-step">
            <div class="dc-step-head compact">
                <span class="dc-step-no">2</span>
                <div>
                    <h2>수집 커넥터 연결</h2>
                    <p>연결 상태를 확인하고 실제 응답에서 데이터 항목을 불러옵니다.</p>
                </div>
                <span class="dc-badge ${statusClass}">${esc(statusText)}</span>
            </div>
            <div class="dc-source-gate">
                <label>
                    <span>사용할 REST 커넥터</span>
                    <select id="dc-source-connector" class="pm-input">
                        ${restConnectors.map(item => `<option value="${esc(item.id)}" ${item.id === connector.id ? 'selected' : ''}>${esc(item.name)}</option>`).join('')}
                    </select>
                </label>
                <span class="dc-source-endpoint">
                    <small>연결 주소</small>
                    <b title="${esc(`${_dcConnectorEndpoint(connector)}${connector.topic || ''}`)}">${esc(`${_dcConnectorEndpoint(connector)}${connector.topic || ''}`)}</b>
                    <em>${esc(_dcConnectorStatusText(connector.status))}${preview.previewed_at ? ` · 최근 확인 ${esc(_dcFmtDate(preview.previewed_at))}` : ''}</em>
                </span>
                <span class="dc-source-buttons">
                    <button type="button" class="pm-btn pm-btn-sm" id="dc-edit-source">연결 설정</button>
                    <button type="button" class="pm-btn pm-btn-primary pm-btn-sm" id="dc-preview-source">샘플 데이터 조회</button>
                </span>
            </div>
        </section>`;
}

function _dcAttributeSourceLabel(source) {
    return ({ payload: '실제 수집', preview: '샘플 응답' })[source] || source || '-';
}

function _dcAttributeSourceClass(source) {
    return ({ payload: 'payload', preview: 'metadata' })[source] || 'fallback';
}

function _dcAttributeSourceHint(source) {
    return ({
        payload: '선택한 커넥터에서 실제 수집된 payload의 최상위 필드',
        preview: '커넥터 샘플 응답에서 확인된 최상위 필드',
    })[source] || '속성 출처';
}

function _dcAttributeRule(twin) {
    const attrs = _dcTwinAttributes(twin);
    const counts = attrs.reduce((acc, attr) => {
        const key = attr.source || 'fallback';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
    return `
        <div class="dc-attribute-rule">
            <div>
                <b>속성 분리 기준</b>
                <span>데이터가 수집되면 payload의 최상위 필드명이 속성으로 표시됩니다. NGSI-LD의 id, type, @context 같은 공통 필드는 제외합니다.</span>
            </div>
            <div class="dc-attribute-rule-tags">
                ${counts.payload ? `<span class="dc-attr-source payload">실제 수집 ${esc(counts.payload)}</span>` : ''}
                ${counts.preview ? `<span class="dc-attr-source metadata">샘플 응답 ${esc(counts.preview)}</span>` : ''}
            </div>
        </div>`;
}

function _dcAttributeRows(twin) {
    const attrs = _dcTwinAttributes(twin);
    if (!attrs.length) {
        return '<div class="dc-empty">먼저 연결된 커넥터에서 샘플 데이터를 조회하세요.</div>';
    }
    return attrs.map(attr => {
        const selected = _dcIsAttributeSelected(attr.name);
        return `
            <button type="button" class="dc-attribute-row ${selected ? 'selected' : ''}" data-attr-name="${esc(attr.name)}">
                <span class="dc-attr-check">${selected ? '✓' : ''}</span>
                <span class="dc-attribute-main">
                    <b>${esc(attr.label || attr.name)}</b>
                    <small class="dc-attribute-type">${esc(attr.type || '-')}</small>
                    <small class="dc-attribute-hint">${esc(_dcAttributeSourceHint(attr.source))}</small>
                </span>
                <span class="dc-attribute-meta">
                    <span class="dc-attr-source ${esc(_dcAttributeSourceClass(attr.source))}">${esc(_dcAttributeSourceLabel(attr.source))}</span>
                    <span class="dc-attribute-sample" title="${esc(_dcValuePreview(attr.sample))}">${esc(_dcValuePreview(attr.sample))}</span>
                </span>
            </button>`;
    }).join('');
}

function _dcTwinListItem(twin) {
    const selected = twin.id === _dcState.selectedTwinId;
    const attrCount = _dcTwinAttributes(twin).length;
    return `
        <button type="button" class="dc-twin-list-item ${selected ? 'selected' : ''}" data-twin-id="${esc(twin.id)}">
            <span class="dc-twin-list-main">
                <b>${esc(twin.name)}</b>
                <small>${esc(twin.description || '설명 없음')}</small>
            </span>
            <span class="dc-twin-list-side">
                <small>${esc(attrCount)} attrs · ${esc(twin.record_count || 0)} records</small>
            </span>
        </button>`;
}

function _dcRenderTwins() {
    const list = document.getElementById('dc-twins');
    if (!list) return;
    const twin = _dcSelectedTwin();
    const selectedAttrs = _dcSelectedAttributes(twin);
    const restConnector = twin ? _dcSelectedRestConnector(twin) : null;
    const realtime = _dcState.realtimeStatus || _dcInactiveRealtimeStatus(restConnector?.id || '');
    const realtimeActive = Boolean(
        realtime.active
        && restConnector
        && realtime.connector_id === restConnector.id
    );
    const query = (_dcState.twinSearch || '').trim().toLowerCase();
    const twins = query
        ? _dcState.twins.filter(item => `${item.name || ''} ${item.description || ''} ${item.status || ''}`.toLowerCase().includes(query))
        : _dcState.twins;
    const twinList = twins.length
        ? twins.map(_dcTwinListItem).join('')
        : '<div class="dc-empty">조건에 맞는 디지털 트윈이 없습니다.</div>';
    const selectedText = _dcSelectedAttributeText(selectedAttrs);
    const allAttrs = twin ? _dcTwinAttributes(twin) : [];
    const allSelected = allAttrs.length > 0 && selectedAttrs.length === allAttrs.length;
    const detail = twin ? `
        ${_dcSourceStepMarkup(twin, restConnector)}
        <section class="dc-step-card dc-attribute-step">
            <div class="dc-step-head">
                <span class="dc-step-no">3</span>
                <div>
                    <h2>수집할 데이터 항목 선택</h2>
                    <p>샘플 응답에서 확인된 센서값이나 상태값을 선택하세요.</p>
                </div>
                <span class="dc-step-tools">
                    <label class="dc-select-all-wrap">
                        <input type="checkbox" id="dc-select-all-attrs" ${allSelected ? 'checked' : ''} ${allAttrs.length ? '' : 'disabled'} />
                        <span>전체 선택</span>
                    </label>
                    <span id="dc-selected-attr-count" class="dc-badge ${selectedAttrs.length ? 'ok' : 'muted'}">선택 항목 ${esc(selectedAttrs.length)}개</span>
                    <button type="button" class="pm-btn pm-btn-sm dc-clear-selected" id="dc-clear-selected-attrs" ${selectedAttrs.length ? '' : 'disabled'}>선택 초기화</button>
                </span>
            </div>
            ${allAttrs.length ? `
                ${_dcAttributeRule(twin)}
                <div class="dc-attribute-list dc-prep-attributes">${_dcAttributeRows(twin)}</div>
                <div class="dc-selected-strip">
                    <b>선택 항목</b>
                    <span id="dc-selected-attr-list">${esc(selectedText)}</span>
                </div>
                <div class="dc-source-actions dc-prep-actions">
                    <label class="dc-live-interval">
                        <span>수집 간격</span>
                        <select id="dc-realtime-interval" class="pm-select" ${realtimeActive ? 'disabled' : ''}>
                            ${[1, 3, 5, 10, 30].map(seconds => `<option value="${seconds}" ${Number(realtime.interval_seconds || 3) === seconds ? 'selected' : ''}>${seconds}초</option>`).join('')}
                        </select>
                    </label>
                    <button type="button" class="pm-btn ${realtimeActive ? 'pm-btn-danger' : 'pm-btn-success'}" id="dc-selected-collect" ${realtimeActive || (restConnector && selectedAttrs.length) ? '' : 'disabled'}>${realtimeActive ? '실시간 수집 중지' : '실시간 수집 시작'}</button>
                </div>
                <div id="dc-realtime-state" class="dc-realtime-state ${realtimeActive && realtime.last_error ? 'error' : realtimeActive ? 'active' : ''}">
                    ${_dcRealtimeStatusContent(realtime, realtimeActive)}
                </div>` : `
                <div class="dc-empty dc-step-empty">
                    ${restConnector ? '2단계에서 `샘플 데이터 조회`를 눌러 실제 데이터 항목을 확인하세요.' : '2단계에서 트윈의 수집 커넥터를 먼저 연결하세요.'}
                </div>`}
            <div class="dc-attribute-footer">
                <details class="dc-manage-details">
                    <summary>트윈 관리 기능</summary>
                    <div class="dc-manage-actions">
                        <button type="button" class="pm-btn pm-btn-sm" id="dc-selected-twin-detail">트윈 상세</button>
                        <button type="button" class="pm-btn pm-btn-sm pm-btn-danger" id="dc-selected-twin-delete">트윈 삭제</button>
                    </div>
                </details>
                <div class="dc-source-hint">${restConnector ? `선택된 수집 소스: ${esc(restConnector.name)}` : 'MQTT/Kafka/NiFi 수집 경로는 오른쪽 고급 설정에서 관리합니다.'}</div>
            </div>
        </section>` : `
        <section class="dc-step-card dc-source-step">
            <div class="dc-step-head">
                <span class="dc-step-no">2</span>
                <div><h2>수집 커넥터 연결</h2><p>분석 대상 트윈을 선택한 뒤 연결합니다.</p></div>
            </div>
            <div class="dc-empty dc-step-empty">왼쪽에서 분석 대상 트윈을 선택하세요.</div>
        </section>
        <section class="dc-step-card dc-attribute-step">
            <div class="dc-step-head">
                <span class="dc-step-no">3</span>
                <div><h2>수집할 데이터 항목 선택</h2><p>샘플 데이터 조회 후 항목이 표시됩니다.</p></div>
            </div>
            <div class="dc-empty dc-step-empty">수집 커넥터 연결이 먼저 필요합니다.</div>
        </section>`;
    list.innerHTML = `
        <div class="dc-prep-layout">
            <aside class="dc-step-card dc-twin-select-step">
                <div class="dc-step-head">
                    <span class="dc-step-no">1</span>
                    <div>
                        <h2>분석 대상 트윈 선택</h2>
                        <p>데이터를 준비할 디지털 트윈을 선택합니다.</p>
                    </div>
                </div>
                <label class="dc-search-box">
                    <input id="dc-twin-search" class="pm-input" value="${esc(_dcState.twinSearch || '')}" placeholder="트윈 이름, 장비명, 위치 검색" />
                    <span>Search</span>
                </label>
                <div class="dc-twin-list">${twinList}</div>
                <details class="dc-manage-details">
                    <summary>트윈 직접 등록</summary>
                    <div class="dc-twin-create compact">
                        <input id="dc-new-twin-name" class="pm-input" placeholder="트윈 이름" />
                        <input id="dc-new-twin-desc" class="pm-input" placeholder="설명 또는 위치" />
                        <button id="dc-create-twin" class="pm-btn pm-btn-primary" type="button">등록</button>
                    </div>
                </details>
            </aside>
            <div class="dc-main-column">${detail}</div>
            <div class="dc-advanced-column">${_dcAdvancedPanelMarkup()}</div>
        </div>`;
}

function _dcRecordMainValues(record, selectedAttrs) {
    const payload = record.payload || {};
    const attrs = selectedAttrs.length
        ? selectedAttrs
        : Object.keys(payload).filter(key => !['id', 'type', '@context'].includes(key)).slice(0, 3).map(name => ({ name, label: name }));
    if (!attrs.length) return '-';
    return attrs.slice(0, 4).map(attr => {
        const value = payload[attr.name];
        return `${attr.label || attr.name}: ${_dcValuePreview(value)}`;
    }).join(' · ');
}

function _dcRenderRecords() {
    const el = document.getElementById('dc-records');
    if (!el) return;
    const twin = _dcSelectedTwin();
    const selectedAttrs = _dcSelectedAttributes(twin);
    const records = twin ? _dcCurrentRecords() : [];
    const rows = records.slice(0, 8);
    const selectedIds = _dcSelectedRecordIds(records);
    const selectedVisible = new Set(_dcSelectedRecordIds(rows));
    const allVisibleSelected = rows.length > 0 && rows.every(record => selectedVisible.has(record.id));
    const someVisibleSelected = rows.some(record => selectedVisible.has(record.id));
    const missingCount = selectedAttrs.length
        ? rows.reduce((sum, record) => sum + selectedAttrs.filter(attr => !(attr.name in (record.payload || {}))).length, 0)
        : 0;
    const status = rows.length ? (missingCount ? '확인 필요' : '정상') : '대기';
    const statusClass = rows.length ? (missingCount ? 'warn' : 'ok') : 'muted';
    const restConnector = twin ? _dcSelectedRestConnector(twin) : null;
    const saveDisabled = selectedIds.length ? '' : 'disabled';
    const saveLabel = selectedIds.length ? `${selectedIds.length}건 데이터셋으로 저장` : '데이터셋으로 저장';
    el.innerHTML = `
        <div class="dc-result-layout">
            <section class="dc-step-card dc-result-step">
                <div class="dc-step-head">
                    <span class="dc-step-no">4</span>
                    <div>
                        <h2>수집 결과 확인</h2>
                        <p>데이터셋으로 저장할 수집 레코드를 선택합니다.</p>
                    </div>
                    <span class="dc-badge ${selectedIds.length ? 'ok' : 'muted'} dc-record-selected-badge">선택 ${esc(selectedIds.length)}건</span>
                </div>
                <div class="dc-result-summary">
                    <span><small>최근 수집 시간</small><b>${esc(rows[0] ? _dcFmtDate(rows[0].timestamp || rows[0].created_at) : '수집 없음')}</b></span>
                    <span><small>수집 항목</small><b>${esc(selectedAttrs.length || '-')}개</b></span>
                    <span><small>레코드 수</small><b>${esc(records.length)}건</b></span>
                    <span><small>결측 항목</small><b>${esc(missingCount)}건</b></span>
                    <span><small>상태</small><b class="dc-status-text ${_dcState.realtimeStatus?.active ? 'ok' : esc(statusClass)}">${_dcState.realtimeStatus?.active ? '실시간 수집 중' : esc(status)}</b></span>
                </div>
                ${rows.length ? `
                    <div class="dc-records-wrap">
                        <table class="pm-table dc-record-table dc-prep-record-table">
                            <thead>
                                <tr>
                                    <th class="dc-record-select-col"><input id="dc-select-all-records" type="checkbox" ${allVisibleSelected ? 'checked' : ''} ${someVisibleSelected && !allVisibleSelected ? 'data-indeterminate="true"' : ''} /></th>
                                    <th>수집 시각</th><th>트윈</th><th>주요값</th><th>상태</th><th>상세</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.map(record => {
                                    const checked = selectedVisible.has(record.id) ? 'checked' : '';
                                    return `
                                    <tr class="dc-record-row ${checked ? 'selected' : ''}" data-record-id="${esc(record.id)}">
                                        <td class="dc-record-select-col"><input class="dc-record-select" type="checkbox" data-record-id="${esc(record.id)}" ${checked} aria-label="수집 레코드 선택" /></td>
                                        <td class="pm-table-mono">${esc(_dcFmtDate(record.timestamp || record.created_at))}</td>
                                        <td>${esc(record.twin_name || record.twin_id || record.device_id || '-')}</td>
                                        <td class="pm-table-mono" title="${esc(JSON.stringify(record.payload || {}))}">${esc(_dcRecordMainValues(record, selectedAttrs))}</td>
                                        <td><span class="dc-dot ok"></span>정상</td>
                                        <td class="dc-row-actions"><button type="button" class="pm-btn pm-btn-sm dc-record-detail" data-record-id="${esc(record.id)}">상세 보기</button></td>
                                    </tr>`;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>` : '<div class="dc-empty">아직 수집된 레코드가 없습니다. 수집 설정 후 `실시간 수집 시작`을 눌러 확인하세요.</div>'}
            </section>
            <aside class="dc-step-card dc-save-card">
                <div class="dc-step-head compact">
                    <span class="dc-step-no">5</span>
                    <div>
                        <h2>데이터셋 저장</h2>
                        <p>선택한 수집 데이터를 연구용 데이터셋으로 저장합니다.</p>
                    </div>
                </div>
                <button id="dc-export-dataset" class="pm-btn pm-btn-primary dc-save-main" type="button" ${saveDisabled}>${esc(saveLabel)}</button>
                <div class="dc-export-menu">
                    <button id="dc-export-menu-toggle" class="pm-btn dc-export-menu-toggle" type="button" ${records.length ? '' : 'disabled'}>
                        <span>데이터 내보내기</span>
                        <span class="dc-export-caret">⌄</span>
                    </button>
                    <div class="dc-export-menu-list" hidden>
                        <button id="dc-download-csv" type="button">CSV 다운로드</button>
                        <button id="dc-download-json" type="button">JSON 다운로드</button>
                    </div>
                </div>
                <div class="dc-rest-output-block">
                    <div class="dc-rest-output-head">
                        <b>실시간 REST 전송</b>
                        <button id="dc-rest-output-open" class="pm-btn pm-btn-sm" type="button" ${restConnector ? '' : 'disabled'}>전송 설정</button>
                    </div>
                    <div id="dc-rest-output-status" class="dc-rest-output-status">
                        ${_dcRestOutputStatusContent(_dcState.restOutput, restConnector)}
                    </div>
                </div>
                <div class="dc-save-hint">표에서 저장할 레코드를 체크한 뒤 데이터셋으로 저장하세요.</div>
            </aside>
        </div>`;
    const selectAll = document.getElementById('dc-select-all-records');
    if (selectAll && selectAll.dataset.indeterminate === 'true') selectAll.indeterminate = true;
}

function _dcRenderAll() {
    _dcRenderStats();
    _dcRenderTwins();
    _dcRenderTypePalette();
    _dcRenderConnectors();
    _dcRenderRecords();
    _dcRenderConnectorModal();
}

function _dcConnectorPayload() {
    const portText = document.getElementById('dc-c-port')?.value.trim() || '';
    let port = null;
    if (portText) {
        port = Number(portText);
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
            throw new Error('Port는 1~65535 사이의 정수여야 합니다.');
        }
    }
    const name = document.getElementById('dc-c-name')?.value.trim() || '';
    if (!name) throw new Error('커넥터 이름을 입력하세요.');
    return {
        name,
        connector_type: document.getElementById('dc-c-type')?.value || 'mqtt',
        twin_id: document.getElementById('dc-c-twin')?.value || '',
        endpoint_url: document.getElementById('dc-c-endpoint')?.value.trim() || '',
        port,
        topic: document.getElementById('dc-c-topic')?.value.trim() || '',
        method: document.getElementById('dc-c-method')?.value.trim() || '',
        yaml_config: document.getElementById('dc-c-yaml')?.value || '',
        metadata: _dcState.modalConnector?.metadata || {},
    };
}

async function _dcSaveConnector() {
    const payload = _dcConnectorPayload();
    const active = _dcState.modalConnector;
    const saved = active?.id
        ? await API.put(`/api/data-collection/connectors/${encodeURIComponent(active.id)}`, payload)
        : await API.post('/api/data-collection/connectors', payload);
    if (saved.connector_type === 'rest' && saved.twin_id) {
        _dcState.selectedTwinId = saved.twin_id;
        _dcState.selectedConnectorId = saved.id;
        _dcState.selectedAttributeNames = [];
    }
    _dcState.modalConnector = null;
    await _dcLoad();
    _dcRenderAll();
    _dcToast(active?.id ? '커넥터를 저장했습니다.' : '커넥터를 생성했습니다.');
    return saved;
}

async function _dcDeleteConnector() {
    const active = _dcState.modalConnector;
    if (!active?.id) return;
    if (!confirm('이 커넥터를 삭제할까요? 수집 레코드는 유지됩니다.')) return;
    await API.del(`/api/data-collection/connectors/${encodeURIComponent(active.id)}`);
    _dcState.modalConnector = null;
    await _dcLoad();
    _dcRenderAll();
    _dcToast('커넥터를 삭제했습니다.', 'warn');
}

async function _dcTestConnector() {
    const active = _dcState.modalConnector;
    if (!active?.id) return;
    const result = await API.post(`/api/data-collection/connectors/${encodeURIComponent(active.id)}/test`, {});
    await _dcLoad();
    _dcState.modalConnector = _dcState.connectors.find(item => item.id === active.id) || result.connector || active;
    _dcRenderAll();
    _dcToast((result.messages || []).join(' / '), result.valid ? 'ok' : 'bad');
}

async function _dcCreateTwin() {
    const name = document.getElementById('dc-new-twin-name')?.value.trim() || '';
    const description = document.getElementById('dc-new-twin-desc')?.value.trim() || '';
    if (!name) throw new Error('트윈 이름을 입력하세요.');
    await API.post('/api/data-collection/twins', { name, description, status: 'offline', metadata: {} });
    document.getElementById('dc-new-twin-name').value = '';
    document.getElementById('dc-new-twin-desc').value = '';
    await _dcLoad();
    _dcRenderAll();
    _dcToast('디지털 트윈을 등록했습니다.');
}

async function _dcDeleteTwin(twinId) {
    if (!confirm('이 트윈을 삭제할까요? 연결된 커넥터는 트윈 미연결 상태가 되고, 기존 수집 레코드는 유지됩니다.')) return;
    await API.del(`/api/data-collection/twins/${encodeURIComponent(twinId)}`);
    await _dcLoad();
    _dcRenderAll();
    _dcToast('디지털 트윈을 삭제했습니다.', 'warn');
}

async function _dcToggleRealtimeCollection(twinId) {
    const twin = _dcState.twins.find(item => item.id === twinId);
    if (!twin) return;
    const connector = _dcSelectedRestConnector(twin);
    if (!connector) {
        throw new Error('실시간 수집은 REST API 커넥터를 트윈에 연결한 뒤 사용할 수 있습니다.');
    }
    const active = _dcState.realtimeStatus?.active
        && _dcState.realtimeStatus.connector_id === connector.id;
    if (active) {
        _dcState.realtimeStatus = await API.post(
            `/api/data-collection/connectors/${encodeURIComponent(connector.id)}/realtime/stop`,
            {},
        );
        _dcCloseRealtimeStream();
        _dcStopRealtimeStatusPolling();
        _dcOpenRealtimeStream('', twin.id);
        _dcRenderStats();
        _dcRenderTwins();
        _dcRenderRecords();
        _dcToast('실시간 수집을 중지했습니다.', 'warn');
        return;
    }
    const selectedAttrs = _dcSelectedAttributes(twin);
    if (!selectedAttrs.length) {
        throw new Error('실시간으로 수집할 데이터 항목을 먼저 선택하세요. 선택한 항목만 수집 레코드에 저장됩니다.');
    }
    const selectedNames = selectedAttrs.map(attr => attr.name).filter(Boolean);
    const intervalSeconds = Number(document.getElementById('dc-realtime-interval')?.value || 3);
    const result = await API.post(`/api/data-collection/connectors/${encodeURIComponent(connector.id)}/realtime/start`, {
        selected_attributes: selectedNames,
        interval_seconds: intervalSeconds,
    });
    _dcState.realtimeStatus = result;
    _dcState.selectedAttributeNames = selectedNames;
    _dcOpenRealtimeStream(connector.id, twin.id);
    _dcStartRealtimeStatusPolling(connector.id);
    _dcRenderStats();
    _dcRenderTwins();
    _dcRenderRecords();
    _dcToast(`선택한 항목 ${selectedNames.length}개를 ${intervalSeconds}초 간격으로 실시간 수집합니다.`);
}


async function _dcSyncNifiFlow(connectorId) {
    const connector = _dcState.connectors.find(item => item.id === connectorId);
    if (!connector) {
        _dcToast('NiFi flow로 변환할 커넥터를 찾을 수 없습니다.', 'warn');
        return;
    }
    const result = await API.post('/api/data-collection/nifi/sync', {
        connector_id: connector.id,
        include_draft: true,
        auto_start: false,
    });
    const spec = result.spec || {};
    const statusClass = result.status === 'ready_to_apply' ? 'ok' : 'warn';
    const title = '<div class="dc-form-type"><span>NF</span><b>커넥터 NiFi Spec 생성</b></div>';
    const badge = `<span class="dc-badge ${esc(statusClass)}">${esc(result.status || '-')}</span>`;
    const body = `
        <div class="dc-detail-grid two">
            <div class="dc-kv"><small>대상 커넥터</small><b>${esc(result.connector_name || connector.name)}</b></div>
            <div class="dc-kv"><small>NiFi</small><b>${esc(spec.nifi?.ready ? 'Ready' : 'Pending')}</b></div>
            <div class="dc-kv"><small>독립 Process Group</small><b>${esc(spec.name || '-')}</b></div>
            <div class="dc-kv"><small>생성 시간</small><b>${esc(_dcFmtDate(result.created_at || spec.generated_at))}</b></div>
        </div>
        ${result.last_error ? `<div class="dc-empty">${esc(result.last_error)}</div>` : ''}
        <div class="dc-detail-section">
            <div class="dc-detail-title">Flow Spec</div>
            <pre class="dc-json">${esc(_dcJsonText(spec))}</pre>
        </div>`;
    _dcOpenInfoModal(title, badge, body, true);
    _dcToast(`${connector.name}의 독립 NiFi Spec을 생성했습니다.`);
}


async function _dcApplyNifiFlow(connectorId) {
    const connector = _dcState.connectors.find(item => item.id === connectorId);
    if (!connector) {
        _dcToast('NiFi에 적용할 커넥터를 찾을 수 없습니다.', 'warn');
        return;
    }
    const result = await API.post('/api/data-collection/nifi/apply', {
        connector_id: connector.id,
        include_draft: true,
        auto_start: false,
        dry_run: false,
    });
    const title = '<div class="dc-form-type"><span>NF</span><b>커넥터 NiFi Flow 적용</b></div>';
    const badge = `<span class="dc-badge ok">${esc(result.status || 'applied')}</span>`;
    const body = `
        <div class="dc-detail-grid two">
            <div class="dc-kv"><small>대상 커넥터</small><b>${esc(result.connector_name || connector.name)}</b></div>
            <div class="dc-kv"><small>Process Group</small><b>${esc(result.process_group || '-')}</b></div>
            <div class="dc-kv"><small>NiFi API</small><b>${esc(result.nifi_api || '-')}</b></div>
            <div class="dc-kv"><small>Flow Spec</small><b>${esc(result.flow_spec_id || '-')}</b></div>
        </div>
        <div class="dc-detail-section">
            <div class="dc-detail-title">적용 결과</div>
            <pre class="dc-json">${esc(_dcJsonText(result))}</pre>
        </div>`;
    _dcOpenInfoModal(title, badge, body, true);
    _dcToast(`${connector.name}의 독립 NiFi Flow 적용을 요청했습니다.`);
}

async function _dcOpenEdgeAgent() {
    const connector = _dcState.modalConnector;
    if (!connector?.id) return;
    const spec = await API.get(`/api/data-collection/connectors/${encodeURIComponent(connector.id)}/edge-agent`);
    const title = '<div class="dc-form-type"><span>TX</span><b>수집 연동 가이드</b></div>';
    const body = `
        <div class="dc-detail-grid two">
            <div class="dc-kv"><small>Device ID</small><b>${esc(spec.config?.device_id || '-')}</b></div>
            <div class="dc-kv"><small>Connector</small><b>${esc(spec.config?.connector_id || '-')}</b></div>
        </div>
        <div class="dc-detail-section">
            <div class="dc-detail-title">전송 설정</div>
            <pre class="dc-json">${esc(_dcJsonText(spec.config || {}))}</pre>
        </div>
        <div class="dc-detail-section">
            <div class="dc-detail-title">Python 전송 예시</div>
            <pre class="dc-json">${esc(spec.python || '')}</pre>
        </div>
        <div class="dc-detail-section">
            <div class="dc-detail-title">curl 전송 예시</div>
            <pre class="dc-json">${esc(spec.curl || '')}</pre>
        </div>`;
    _dcOpenInfoModal(title, '', body, true);
}

async function _dcDeleteRecord(recordId) {
    if (!confirm('이 수집 레코드를 삭제할까요?')) return;
    await API.del(`/api/data-collection/records/${encodeURIComponent(recordId)}`);
    await _dcLoad();
    _dcRenderAll();
    _dcToast('수집 레코드를 삭제했습니다.', 'warn');
}

function _dcBindEvents() {
    document.getElementById('dc-refresh')?.addEventListener('click', async () => {
        await _dcLoad();
        await _dcSyncRealtimeState();
        _dcRenderAll();
        _dcToast('새로고침 완료');
    });
    document.getElementById('dc-type-palette')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-dc-new-type]');
        if (!btn) return;
        _dcOpenConnectorModal(_dcDefaultDraft(btn.dataset.dcNewType));
    });
    document.getElementById('dc-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'dc-modal' || e.target.id === 'dc-modal-body' || e.target.closest('#dc-modal-close, #dc-modal-cancel')) return _dcCloseConnectorModal();
        if (e.target.closest('#dc-rest-output-test')) return _dcTestRestOutput().catch(err => _dcToast(err.message, 'bad'));
        if (e.target.closest('#dc-rest-output-delete')) return _dcDeleteRestOutput().catch(err => _dcToast(err.message, 'bad'));
        if (e.target.closest('#dc-test-connector')) return _dcTestConnector().catch(err => _dcToast(err.message, 'bad'));
        if (e.target.closest('#dc-edge-agent')) return _dcOpenEdgeAgent().catch(err => _dcToast(err.message, 'bad'));
        if (e.target.closest('#dc-delete-connector')) return _dcDeleteConnector().catch(err => _dcToast(err.message, 'bad'));
    });
    document.getElementById('dc-modal')?.addEventListener('submit', (e) => {
        if (e.target.id === 'dc-rest-output-form') {
            e.preventDefault();
            _dcSaveRestOutput().catch(err => _dcToast(err.message, 'bad'));
            return;
        }
        if (e.target.id === 'dc-export-form') {
            e.preventDefault();
            _dcSubmitDatasetExport().catch(err => _dcToast(err.message, 'bad'));
            return;
        }
        if (e.target.id !== 'dc-connector-form') return;
        e.preventDefault();
        _dcSaveConnector().catch(err => _dcToast(err.message, 'bad'));
    });
    document.getElementById('dc-modal')?.addEventListener('change', (e) => {
        if (e.target.id !== 'dc-c-type' || _dcState.modalConnector?.id) return;
        const currentName = document.getElementById('dc-c-name')?.value || '';
        const currentTwin = document.getElementById('dc-c-twin')?.value || '';
        _dcState.modalConnector = {
            ..._dcDefaultDraft(e.target.value),
            name: currentName || _dcDefaultDraft(e.target.value).name,
            twin_id: currentTwin,
        };
        _dcRenderConnectorModal();
    });
    document.getElementById('dc-twins')?.addEventListener('click', (e) => {
        const create = e.target.closest('#dc-create-twin');
        if (create) return _dcCreateTwin().catch(err => _dcToast(err.message, 'bad'));
        if (e.target.closest('#dc-connect-source')) {
            const twin = _dcSelectedTwin();
            if (twin) return _dcOpenConnectorModal(_dcConnectorDraftForTwin(twin));
        }
        if (e.target.closest('#dc-edit-source')) {
            const connector = _dcSelectedRestConnector(_dcSelectedTwin());
            if (connector) return _dcOpenConnectorModal(connector);
        }
        if (e.target.closest('#dc-preview-source')) {
            return _dcPreviewSelectedConnector().catch(err => _dcToast(err.message, 'bad'));
        }
        if (e.target.closest('#dc-new-connector')) {
            const twin = _dcSelectedTwin();
            return _dcOpenConnectorModal(twin ? _dcConnectorDraftForTwin(twin) : _dcDefaultDraft('rest'));
        }
        const nifiSpecButton = e.target.closest('[data-dc-nifi-spec]');
        if (nifiSpecButton) {
            return _dcSyncNifiFlow(nifiSpecButton.dataset.dcNifiSpec).catch(err => _dcToast(err.message, 'bad'));
        }
        const nifiApplyButton = e.target.closest('[data-dc-nifi-apply]');
        if (nifiApplyButton) {
            return _dcApplyNifiFlow(nifiApplyButton.dataset.dcNifiApply).catch(err => _dcToast(err.message, 'bad'));
        }
        const connectorEdit = e.target.closest('[data-dc-connector-edit]');
        if (connectorEdit) {
            const connector = _dcState.connectors.find(item => item.id === connectorEdit.dataset.dcConnectorEdit);
            if (connector) return _dcOpenConnectorModal(connector);
        }
        const twinItem = e.target.closest('.dc-twin-list-item');
        if (twinItem) return _dcSelectTwin(twinItem.dataset.twinId);
        const attrRow = e.target.closest('.dc-attribute-row');
        if (attrRow) return _dcToggleAttribute(attrRow.dataset.attrName);
        if (e.target.closest('#dc-clear-selected-attrs')) return _dcClearSelectedAttributes();
        if (e.target.closest('#dc-selected-twin-detail')) {
            const twin = _dcSelectedTwin();
            if (twin) return _dcOpenTwinDetail(twin.id).catch(err => _dcToast(err.message, 'bad'));
        }
        if (e.target.closest('#dc-selected-collect')) {
            const twin = _dcSelectedTwin();
            if (twin) return _dcToggleRealtimeCollection(twin.id).catch(err => _dcToast(err.message, 'bad'));
        }
        if (e.target.closest('#dc-selected-twin-delete')) {
            const twin = _dcSelectedTwin();
            if (twin) return _dcDeleteTwin(twin.id).catch(err => _dcToast(err.message, 'bad'));
        }
    });
    document.getElementById('dc-twins')?.addEventListener('change', (e) => {
        if (e.target.id === 'dc-source-connector') {
            _dcSelectSourceConnector(e.target.value).catch(err => _dcToast(err.message, 'bad'));
            return;
        }
        if (e.target.id === 'dc-select-all-attrs') _dcSetAllAttributes(e.target.checked);
    });
    document.getElementById('dc-twins')?.addEventListener('compositionstart', (e) => {
        if (e.target.id !== 'dc-twin-search') return;
        _dcState.twinSearchComposing = true;
    });
    document.getElementById('dc-twins')?.addEventListener('compositionend', (e) => {
        if (e.target.id !== 'dc-twin-search') return;
        _dcState.twinSearchComposing = false;
        _dcState.twinSearch = e.target.value || '';
        _dcRenderTwins();
        const input = document.getElementById('dc-twin-search');
        if (input) {
            const value = input.value || '';
            input.focus();
            input.setSelectionRange(value.length, value.length);
        }
    });
    document.getElementById('dc-twins')?.addEventListener('input', (e) => {
        if (e.target.id !== 'dc-twin-search') return;
        const value = e.target.value || '';
        _dcState.twinSearch = value;
        if (e.isComposing || _dcState.twinSearchComposing) return;
        _dcRenderTwins();
        const input = document.getElementById('dc-twin-search');
        if (input) {
            input.focus();
            input.setSelectionRange(value.length, value.length);
        }
    });
    document.getElementById('dc-download-csv')?.addEventListener('click', () => _dcDownloadRecords('csv'));
    document.getElementById('dc-download-json')?.addEventListener('click', () => _dcDownloadRecords('json'));
    document.getElementById('dc-export-dataset')?.addEventListener('click', () => _dcOpenDatasetExportModal());
    document.getElementById('dc-records')?.addEventListener('change', (e) => {
        if (e.target.id === 'dc-select-all-records') {
            _dcSetAllVisibleRecords(e.target.checked);
            return;
        }
        if (e.target.classList?.contains('dc-record-select')) {
            _dcToggleRecordSelection(e.target.dataset.recordId, e.target.checked);
        }
    });
    document.getElementById('dc-records')?.addEventListener('click', (e) => {
        if (e.target.closest('#dc-rest-output-open')) {
            return _dcOpenRestOutputModal().catch(err => _dcToast(err.message, 'bad'));
        }
        const exportToggle = e.target.closest('#dc-export-menu-toggle');
        if (exportToggle) {
            const menu = exportToggle.closest('.dc-export-menu');
            const list = menu?.querySelector('.dc-export-menu-list');
            if (menu && list) {
                const open = !menu.classList.contains('open');
                menu.classList.toggle('open', open);
                list.hidden = !open;
            }
            return;
        }
        if (!e.target.closest('.dc-export-menu')) {
            const menu = document.querySelector('.dc-export-menu.open');
            if (menu) {
                menu.classList.remove('open');
                const list = menu.querySelector('.dc-export-menu-list');
                if (list) list.hidden = true;
            }
        }
        if (e.target.closest('.dc-record-select-col')) return;
        if (e.target.closest('#dc-export-dataset')) return _dcOpenDatasetExportModal();
        if (e.target.closest('#dc-download-csv')) return _dcDownloadRecords('csv');
        if (e.target.closest('#dc-download-json')) return _dcDownloadRecords('json');
        const detail = e.target.closest('.dc-record-detail');
        if (detail) return _dcOpenRecordDetail(detail.dataset.recordId).catch(err => _dcToast(err.message, 'bad'));
        const del = e.target.closest('.dc-delete-record');
        if (del) return _dcDeleteRecord(del.dataset.recordId).catch(err => _dcToast(err.message, 'bad'));
    });
    document.getElementById('dc-records')?.addEventListener('dblclick', (e) => {
        if (e.target.closest('button,input,label')) return;
        const row = e.target.closest('.dc-record-row');
        if (row) return _dcOpenRecordDetail(row.dataset.recordId).catch(err => _dcToast(err.message, 'bad'));
    });
    document.getElementById('dc-modal')?.addEventListener('dblclick', (e) => {
        if (e.target.closest('button,input,label')) return;
        const row = e.target.closest('.dc-record-row');
        if (row) return _dcOpenRecordDetail(row.dataset.recordId).catch(err => _dcToast(err.message, 'bad'));
    });
}

async function renderDataCollection() {
    return `
    <style>
        .dc-header { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:18px; }
        .dc-toast { display:none; position:fixed; right:24px; bottom:24px; z-index:700; padding:10px 14px; border-radius:8px; font-size:12px; font-weight:600; background:var(--success-bg); color:var(--success); border:1px solid rgba(13,144,79,0.2); box-shadow:var(--shadow-lg); max-width:520px; }
        .dc-toast.warn { background:var(--warning-bg); color:var(--warning); border-color:rgba(227,116,0,0.2); }
        .dc-toast.bad { background:var(--danger-bg); color:var(--danger); border-color:rgba(217,48,37,0.2); }
        .dc-stat-grid { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:10px; margin-bottom:14px; }
        .dc-stat { background:#fff; border:1px solid var(--border); border-left:4px solid #9aa0a6; border-radius:8px; padding:14px 16px; box-shadow:var(--shadow); min-width:0; }
        .dc-stat.accent { border-left-color:var(--accent); }
        .dc-stat.success { border-left-color:var(--success); }
        .dc-stat.warning { border-left-color:var(--warning); }
        .dc-stat-value { font-size:22px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .dc-stat-label { font-size:12px; color:var(--text-muted); margin-top:2px; }
        .dc-stat-sub { font-size:11px; color:var(--text-muted); margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .dc-guide { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:8px; margin-bottom:14px; }
        .dc-guide-item { border:1px solid var(--border); border-radius:8px; background:#fff; padding:10px 12px; min-height:72px; }
        .dc-guide-item b { display:block; font-size:12px; margin-bottom:4px; }
        .dc-guide-item span { display:block; font-size:11px; line-height:1.45; color:var(--text-secondary); }
        .dc-panel { background:#fff; border:1px solid var(--border); border-radius:8px; padding:16px; box-shadow:var(--shadow); min-width:0; }
        .dc-panel + .dc-panel { margin-top:14px; }
        .dc-panel-head { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:12px; }
        .dc-panel-actions { display:flex; align-items:center; justify-content:flex-end; gap:6px; flex-wrap:wrap; }
        .dc-panel-title { font-size:15px; font-weight:700; }
        .dc-panel-desc { color:var(--text-secondary); font-size:12px; margin-top:2px; }
        .dc-type-row { display:grid; grid-template-columns:repeat(5, minmax(0, 1fr)); gap:8px; margin-bottom:12px; }
        .dc-type-block { min-height:70px; border:1.5px solid var(--border); border-radius:8px; background:#fbfcfe; display:flex; align-items:center; gap:10px; padding:10px; text-align:left; cursor:pointer; transition:all .15s; }
        .dc-type-block:hover { border-color:var(--accent); background:var(--accent-bg); }
        .dc-type-icon, .dc-form-type span { width:38px; height:38px; border-radius:8px; background:#eef2f7; color:#334155; display:inline-flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; font-family:var(--font-mono); flex-shrink:0; }
        .dc-type-block b { display:block; font-size:12px; }
        .dc-type-block small { display:block; color:var(--text-muted); font-size:10px; margin-top:2px; }
        .dc-connector-list { flex:1 1 auto; min-height:0; display:flex; flex-direction:column; border-top:1px solid #eef0f3; margin-top:6px; overflow:auto; }
        .dc-connector-card { width:100%; border-bottom:1px solid #eef0f3; background:#fff; padding:7px 0 8px; }
        .dc-connector-edit { width:100%; min-height:34px; border:0; background:transparent; display:grid; grid-template-columns:22px minmax(0, 1fr) auto; gap:8px; align-items:center; text-align:left; padding:2px 0; cursor:pointer; transition:background .15s; }
        .dc-connector-edit:hover { background:#f8fbff; }
        .dc-connector-nifi-actions { display:flex; align-items:center; justify-content:flex-end; gap:5px; padding:5px 0 0 30px; }
        .dc-connector-nifi-actions > span { margin-right:auto; color:var(--text-muted); font-size:10px; }
        .dc-connector-nifi-actions .pm-btn { min-height:26px; padding:4px 8px; font-size:10px; }
        .dc-connector-icon { width:18px; height:18px; border-radius:6px; background:#eef2f7; color:#334155; display:inline-flex; align-items:center; justify-content:center; font-size:8px; font-weight:800; font-family:var(--font-mono); flex-shrink:0; }
        .dc-connector-main { min-width:0; }
        .dc-connector-main b, .dc-connector-main small { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dc-connector-main b { font-size:12px; }
        .dc-connector-main small { color:var(--text-muted); font-size:10px; margin-top:2px; }
        .dc-type-pill { min-width:42px; justify-content:center; border:1px solid #d9e2ef; border-radius:7px; padding:2px 6px; font-size:10px; font-weight:800; line-height:1.2; text-align:center; white-space:nowrap; }
        .dc-type-pill.type-rest { color:#0d904f; background:#f0faf2; border-color:#b4dcbc; }
        .dc-type-pill.type-mqtt { color:#5f3dc4; background:#f2efff; border-color:#d5ccff; }
        .dc-type-pill.type-kafka { color:#e37400; background:#fff8ed; border-color:#ffd9a8; }
        .dc-type-pill.type-redis { color:#d93025; background:#fff1f0; border-color:#ffc8c3; }
        .dc-type-pill.type-custom { color:#5f6368; background:#f8f9fa; border-color:#d9e2ef; }
        .dc-badge { display:inline-flex; align-items:center; justify-content:center; border-radius:999px; padding:3px 9px; font-size:10px; font-weight:700; white-space:nowrap; }
        .dc-badge.ok { color:var(--success); background:var(--success-bg); }
        .dc-badge.warn { color:var(--warning); background:var(--warning-bg); }
        .dc-badge.bad { color:var(--danger); background:var(--danger-bg); }
        .dc-badge.muted { color:var(--text-secondary); background:#f1f3f4; }
        .dc-form-head, .dc-modal-head { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:12px; }
        .dc-form-type { display:flex; align-items:center; gap:10px; font-size:14px; }
        .dc-form { display:flex; flex-direction:column; gap:10px; }
        .dc-form label { display:flex; flex-direction:column; gap:5px; font-size:11px; font-weight:700; color:var(--text-secondary); }
        .dc-form-grid { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:8px; }
        .dc-form-grid.wide-left { grid-template-columns:minmax(0, 1fr) 110px; }
        .dc-yaml { min-height:130px; resize:vertical; line-height:1.45; }
        .dc-form-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:2px; }
        .dc-form-foot { display:flex; justify-content:space-between; gap:8px; color:var(--text-muted); font-size:11px; border-top:1px solid var(--border); padding-top:10px; }
        .dc-empty { border:1px dashed var(--border); background:#fafbfc; color:var(--text-secondary); border-radius:8px; padding:18px; min-height:54px; display:flex; align-items:center; justify-content:center; text-align:center; font-size:12px; }
        .dc-detail-list > .dc-empty { grid-column:1 / -1; }
        .dc-twin-create { display:grid; grid-template-columns:minmax(140px, 0.8fr) minmax(160px, 1fr) auto; gap:8px; margin-bottom:12px; }
        .dc-twin-create.compact { grid-template-columns:minmax(0, 1fr); }
        .dc-twin-browser { display:grid; grid-template-columns:minmax(300px, 0.9fr) minmax(420px, 1.6fr); gap:12px; align-items:stretch; }
        .dc-twin-browser-list, .dc-twin-browser-detail { border:1px solid var(--border); border-radius:8px; background:#fbfcfe; padding:12px; min-width:0; }
        .dc-browser-head { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:10px; }
        .dc-browser-head b, .dc-browser-head small { display:block; }
        .dc-browser-head b { font-size:13px; }
        .dc-browser-head small { color:var(--text-muted); font-size:11px; margin-top:2px; }
        .dc-twin-list { display:flex; flex-direction:column; gap:8px; max-height:520px; overflow:auto; }
        .dc-twin-list-item { width:100%; border:1px solid var(--border); border-radius:8px; background:#fff; padding:11px; display:grid; grid-template-columns:minmax(0,1fr) auto; gap:10px; text-align:left; cursor:pointer; transition:all .15s; }
        .dc-twin-list-item:hover, .dc-twin-list-item.selected { border-color:var(--accent); background:#f7fbff; box-shadow:0 0 0 2px rgba(26,115,232,0.08); }
        .dc-twin-list-main, .dc-twin-list-side { min-width:0; }
        .dc-twin-list-main b, .dc-twin-list-main small, .dc-twin-list-side small { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dc-twin-list-main b { font-size:12px; }
        .dc-twin-list-main small, .dc-twin-list-side small { color:var(--text-muted); font-size:10px; margin-top:4px; }
        .dc-twin-list-side { display:flex; flex-direction:column; align-items:flex-end; gap:4px; }
        .dc-selected-twin-head { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; margin-bottom:12px; }
        .dc-selected-eyebrow { color:var(--accent); font-size:10px; font-weight:800; margin-bottom:4px; }
        .dc-selected-twin-head h3 { margin:0; font-size:18px; }
        .dc-selected-twin-head p { margin:4px 0 0; color:var(--text-secondary); font-size:12px; }
        .dc-selected-summary { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:8px; margin-bottom:12px; }
        .dc-selected-summary span { border:1px solid #e8edf4; border-radius:8px; background:#fff; padding:9px; min-width:0; }
        .dc-selected-summary b, .dc-selected-summary small { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dc-selected-summary b { font-size:12px; font-family:var(--font-mono); }
        .dc-selected-summary small { color:var(--text-muted); font-size:10px; margin-top:2px; }
        .dc-attribute-head { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin:12px 0 8px; }
        .dc-attribute-head b, .dc-attribute-head small { display:block; }
        .dc-attribute-head b { font-size:13px; }
        .dc-attribute-head small { color:var(--text-secondary); font-size:11px; margin-top:3px; }
        .dc-attribute-rule { border:1px solid #d9e7ff; border-radius:8px; background:#f7fbff; padding:10px 12px; margin:8px 0 10px; display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }
        .dc-attribute-rule > div:first-child { min-width:0; }
        .dc-attribute-rule b, .dc-attribute-rule span { display:block; }
        .dc-attribute-rule b { font-size:12px; margin-bottom:3px; }
        .dc-attribute-rule > div:first-child span { color:var(--text-secondary); font-size:11px; line-height:1.45; }
        .dc-attribute-rule-tags { display:flex; gap:6px; flex-wrap:nowrap; justify-content:flex-end; align-items:center; flex:0 0 auto; white-space:nowrap; }
        .dc-attribute-list { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:8px; max-height:360px; overflow:auto; }
        .dc-attribute-row { border:1px solid var(--border); border-radius:8px; background:#fff; padding:10px; display:grid; grid-template-columns:28px minmax(0,1fr) minmax(116px,0.55fr); gap:8px; align-items:center; text-align:left; cursor:pointer; transition:all .15s; }
        .dc-attribute-row:hover, .dc-attribute-row.selected { border-color:var(--accent); background:#f7fbff; }
        .dc-attr-check { width:22px; height:22px; border:1px solid #c8d2e0; border-radius:6px; display:flex; align-items:center; justify-content:center; color:#fff; background:#fff; font-size:12px; font-weight:800; }
        .dc-attribute-row.selected .dc-attr-check { background:var(--accent); border-color:var(--accent); }
        .dc-attribute-main, .dc-attribute-meta, .dc-attribute-sample { min-width:0; }
        .dc-attribute-main b, .dc-attribute-main small, .dc-attribute-sample { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dc-attribute-main b { font-size:12px; }
        .dc-attribute-main small { color:var(--text-muted); font-size:10px; margin-top:2px; }
        .dc-attribute-main .dc-attribute-type { color:var(--text-secondary); font-weight:700; }
        .dc-attribute-main .dc-attribute-hint { white-space:normal; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
        .dc-attribute-meta { display:flex; flex-direction:column; align-items:flex-end; gap:4px; }
        .dc-attr-source { display:inline-flex; align-items:center; justify-content:center; max-width:100%; border-radius:999px; padding:2px 7px; font-size:10px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .dc-attr-source.payload { color:#0d904f; background:#e8f5ee; }
        .dc-attr-source.metadata { color:#1a73e8; background:#eaf2ff; }
        .dc-attr-source.connector { color:#8a4b00; background:#fff4e5; }
        .dc-attr-source.fallback { color:#5f6368; background:#f1f3f4; }
        .dc-attribute-sample { color:var(--text-secondary); font-size:10px; font-family:var(--font-mono); text-align:right; max-width:100%; }
        .dc-source-actions { display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap; margin-top:12px; border-top:1px solid var(--border); padding-top:12px; }
        .dc-live-interval { display:inline-flex; align-items:center; gap:7px; color:var(--text-secondary); font-size:11px; font-weight:700; }
        .dc-live-interval .pm-select { width:76px; min-height:36px; padding:0 8px; }
        .dc-realtime-state { margin-top:10px; min-height:34px; border:1px solid #e7ebf0; border-radius:8px; background:#fafbfc; padding:8px 10px; display:flex; align-items:center; gap:7px; color:var(--text-secondary); font-size:11px; overflow:hidden; }
        .dc-realtime-state b { color:var(--text); white-space:nowrap; }
        .dc-realtime-state span:not(.dc-live-dot), .dc-realtime-state em { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dc-realtime-state em { margin-left:auto; color:var(--danger); font-style:normal; }
        .dc-realtime-state.active { border-color:#bde8cf; background:#f3fbf6; color:#256b45; }
        .dc-realtime-state.error { border-color:#ffc7c7; background:#fff5f5; color:var(--danger); }
        .dc-realtime-state.reconnecting { border-color:#ffd9a8; background:#fff8ed; color:var(--warning); }
        .dc-live-dot { width:8px; height:8px; flex:0 0 8px; border-radius:999px; background:#9aa0a6; }
        .dc-realtime-state.active .dc-live-dot { background:var(--success); box-shadow:0 0 0 4px rgba(13,144,79,0.12); animation:dc-live-pulse 1.5s ease-in-out infinite; }
        .dc-realtime-state.error .dc-live-dot { background:var(--danger); box-shadow:0 0 0 4px rgba(220,38,38,0.10); animation:none; }
        .dc-realtime-state.reconnecting .dc-live-dot { background:var(--warning); animation:none; }
        @keyframes dc-live-pulse {
            0%, 100% { opacity:1; transform:scale(1); }
            50% { opacity:.45; transform:scale(.75); }
        }
        .dc-source-hint { color:var(--text-muted); font-size:11px; line-height:1.45; min-width:0; }
        .dc-attribute-footer { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-top:10px; }
        .dc-attribute-footer .dc-manage-details { flex:0 0 auto; margin-top:0; }
        .dc-attribute-footer .dc-source-hint { flex:1 1 auto; text-align:right; }
        .dc-attr-title { display:flex; align-items:center; justify-content:space-between; gap:8px; font-size:11px; font-weight:800; color:var(--text-secondary); margin-bottom:7px; }
        .dc-attr-title small { color:var(--text-muted); font-size:10px; font-weight:600; }
        .dc-attr-list { display:flex; flex-wrap:wrap; gap:6px; align-items:flex-start; }
        .dc-attr-list.detail { border:1px solid var(--border); border-radius:8px; background:#fbfcfe; padding:10px; }
        .dc-attr-chip { max-width:180px; min-height:42px; border:1px solid #d9e2ef; border-radius:8px; background:#fff; color:var(--text); padding:7px 9px; display:flex; flex-direction:column; align-items:flex-start; justify-content:center; gap:2px; cursor:default; text-align:left; }
        .dc-attr-chip b, .dc-attr-chip small { display:block; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dc-attr-chip b { font-size:11px; }
        .dc-attr-chip small { font-size:10px; color:var(--text-muted); }
        .dc-attr-empty { color:var(--text-muted); font-size:11px; border:1px dashed var(--border); border-radius:8px; padding:8px 10px; }
        .dc-source-note { border:1px solid #cfe0ff; border-left:4px solid var(--accent); border-radius:8px; background:#f7fbff; padding:10px 12px; color:var(--text-secondary); }
        .dc-source-note b, .dc-source-note span { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dc-source-note b { color:var(--text); font-size:12px; margin-bottom:3px; }
        .dc-source-note span { font-size:11px; }
        .dc-prep-hero { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:18px; }
        .dc-prep-hero h1 { margin:0; font-size:30px; line-height:1.2; color:#111827; letter-spacing:0; }
        .dc-prep-hero p { margin:10px 0 0; color:var(--text-secondary); font-size:14px; line-height:1.6; max-width:560px; }
        .dc-hero-actions { display:flex; gap:8px; align-items:center; }
        .dc-prep-stats { grid-template-columns:repeat(4, minmax(0, 1fr)); gap:16px; margin-bottom:20px; }
        .dc-prep-stat { min-width:0; border:1px solid var(--border); border-radius:8px; background:#fff; padding:16px 18px; display:grid; grid-template-columns:44px minmax(0, 1fr); gap:14px; align-items:center; box-shadow:var(--shadow); }
        .dc-prep-stat-icon { width:44px; height:44px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-family:var(--font-mono); font-size:12px; font-weight:900; background:#edf4ff; color:var(--accent); }
        .dc-prep-stat.success .dc-prep-stat-icon { color:var(--success); background:#e8f5ee; }
        .dc-prep-stat.warning .dc-prep-stat-icon { color:var(--warning); background:#fff4e5; }
        .dc-prep-stat.muted .dc-prep-stat-icon { color:#5f6368; background:#f1f3f4; }
        .dc-prep-stat-body { min-width:0; }
        .dc-prep-stat-body small, .dc-prep-stat-body b, .dc-prep-stat-body em { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dc-prep-stat-body small { color:var(--text-secondary); font-size:11px; margin-bottom:5px; }
        .dc-prep-stat-body b { color:#111827; font-size:17px; }
        .dc-prep-stat-body em { margin-top:5px; color:var(--text-muted); font-size:12px; font-style:normal; }
        .dc-prep-layout { --dc-workspace-height:680px; display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:16px; align-items:stretch; margin-bottom:14px; }
        .dc-twin-select-step { grid-column:1; height:var(--dc-workspace-height); }
        .dc-main-column { grid-column:2 / span 2; min-width:0; display:flex; flex-direction:column; gap:16px; height:var(--dc-workspace-height); }
        .dc-advanced-column { grid-column:4; min-width:0; height:var(--dc-workspace-height); }
        .dc-source-step { flex:0 0 auto; }
        .dc-main-column .dc-attribute-step { flex:1 1 auto; min-height:0; height:auto; }
        .dc-advanced-panel { height:100%; }
        .dc-step-card { border:1px solid var(--border); border-radius:8px; background:#fff; box-shadow:var(--shadow); padding:16px; min-width:0; box-sizing:border-box; display:flex; flex-direction:column; overflow:hidden; }
        .dc-step-head { display:grid; grid-template-columns:24px minmax(0,1fr) auto; align-items:flex-start; gap:12px; margin-bottom:14px; min-height:64px; padding-bottom:12px; border-bottom:1px solid #eef0f3; box-sizing:border-box; }
        .dc-step-head.compact { margin-bottom:14px; }
        .dc-step-head h2 { margin:0; font-size:15px; letter-spacing:0; line-height:1.35; }
        .dc-step-head p { margin:4px 0 0; color:var(--text-secondary); font-size:12px; line-height:1.45; }
        .dc-step-head .dc-badge { align-self:flex-start; white-space:nowrap; }
        .dc-step-tools { display:flex; align-items:center; justify-content:flex-end; gap:8px; flex-wrap:wrap; min-height:30px; }
        .dc-step-tools .dc-badge { height:26px; box-sizing:border-box; align-self:center; }
        .dc-select-all-wrap { height:28px; display:inline-flex; align-items:center; gap:6px; color:var(--text-secondary); font-size:12px; font-weight:800; white-space:nowrap; cursor:pointer; line-height:1; }
        .dc-select-all-wrap input { width:14px; height:14px; margin:0; flex-shrink:0; }
        .dc-clear-selected { height:28px; min-height:28px; padding:0 10px; display:inline-flex; align-items:center; justify-content:center; line-height:1; }
        .dc-step-empty { flex:1; display:flex; align-items:center; justify-content:center; min-height:220px; }
        .dc-step-no { width:24px; height:24px; border-radius:999px; background:var(--accent); color:#fff; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; font-size:12px; font-weight:900; }
        .dc-source-gate { display:grid; grid-template-columns:minmax(150px, .8fr) minmax(0, 1.4fr) auto; align-items:end; gap:12px; min-width:0; }
        .dc-source-gate.empty { grid-template-columns:minmax(0,1fr) auto; align-items:center; border:1px dashed var(--border); border-radius:8px; background:#fbfcfe; padding:12px; color:var(--text-secondary); font-size:12px; }
        .dc-source-gate label, .dc-source-gate label > span { display:block; min-width:0; }
        .dc-source-gate label > span, .dc-source-endpoint small { margin-bottom:5px; color:var(--text-muted); font-size:10px; font-weight:700; }
        .dc-source-endpoint { display:block; min-width:0; border-left:1px solid #eef0f3; padding-left:12px; }
        .dc-source-endpoint small, .dc-source-endpoint b, .dc-source-endpoint em { display:block; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dc-source-endpoint b { color:var(--text); font-family:var(--font-mono); font-size:11px; }
        .dc-source-endpoint em { margin-top:5px; color:var(--text-muted); font-size:10px; font-style:normal; }
        .dc-source-buttons { display:flex; align-items:center; justify-content:flex-end; gap:7px; white-space:nowrap; }
        .dc-search-box { display:block; position:relative; margin-bottom:12px; }
        .dc-search-box input { padding-right:62px; }
        .dc-search-box span { position:absolute; right:12px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:10px; font-weight:800; pointer-events:none; }
        .dc-twin-select-step .dc-twin-list { flex:1 1 auto; min-height:0; max-height:none; overflow:auto; }
        .dc-prep-attributes { grid-template-columns:repeat(3, minmax(180px, 1fr)); flex:1 1 auto; min-height:0; max-height:none; overflow-y:auto; padding-right:4px; }
        .dc-prep-attributes .dc-attribute-row { min-height:116px; grid-template-columns:28px minmax(0, 1fr); align-items:start; padding:12px; }
        .dc-prep-attributes .dc-attribute-meta { grid-column:2; align-items:flex-start; margin-top:2px; }
        .dc-selected-strip { border-top:1px solid var(--border); padding:14px 2px 0; margin-top:12px; display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
        .dc-selected-strip b { font-size:13px; }
        .dc-selected-strip span { color:var(--accent); font-weight:700; font-size:13px; }
        .dc-prep-actions { justify-content:flex-end; }
        .dc-manage-details { margin-top:10px; color:var(--text-secondary); }
        .dc-manage-details > summary { cursor:pointer; font-size:12px; font-weight:700; color:var(--text-secondary); }
        .dc-manage-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; }
        .dc-result-layout { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:16px; align-items:stretch; }
        .dc-result-step { grid-column:1 / span 3; }
        .dc-save-card { grid-column:4; }
        .dc-result-summary { display:grid; grid-template-columns:repeat(5, minmax(0, 1fr)); gap:10px; margin-bottom:16px; border:1px solid #eef0f3; border-radius:8px; padding:12px; background:#fbfcfe; }
        .dc-result-summary span { min-width:0; border-right:1px solid #e6ebf2; padding-right:8px; }
        .dc-result-summary span:last-child { border-right:0; }
        .dc-result-summary small, .dc-result-summary b { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dc-result-summary small { color:var(--text-muted); font-size:10px; margin-bottom:5px; }
        .dc-result-summary b { font-size:13px; }
        .dc-status-text.ok { color:var(--success); }
        .dc-status-text.warn { color:var(--warning); }
        .dc-status-text.muted { color:var(--text-muted); }
        .dc-dot { width:8px; height:8px; border-radius:999px; display:inline-block; margin-right:6px; vertical-align:middle; background:#9aa0a6; }
        .dc-dot.ok { background:var(--success); }
        .dc-save-card { position:sticky; top:14px; align-self:stretch; text-align:center; }
        .dc-save-card .dc-step-head { text-align:center; justify-content:center; }
        .dc-save-card .dc-step-head > div { text-align:left; }
        .dc-save-main { width:100%; min-height:46px; margin-bottom:10px; justify-content:center; }
        .dc-export-menu { position:relative; margin-bottom:10px; }
        .dc-export-menu-toggle { width:100%; min-height:40px; position:relative; display:inline-flex; align-items:center; justify-content:center; gap:10px; color:var(--accent); border:1px solid #bfd3f8; background:#f7fbff; font-weight:800; box-shadow:inset 0 0 0 1px rgba(26,115,232,0.04); }
        .dc-export-menu-toggle:hover { background:#eef4ff; border-color:var(--accent); }
        .dc-export-caret { position:absolute; right:14px; font-size:14px; line-height:1; }
        .dc-export-menu.open .dc-export-caret { transform:rotate(180deg); }
        .dc-export-menu-list { position:absolute; top:calc(100% + 6px); left:0; right:0; transform:none; z-index:20; width:100%; min-width:0; border:1px solid var(--border); border-radius:8px; background:#fff; box-shadow:0 10px 28px rgba(15,23,42,0.18); padding:8px; }
        .dc-export-menu-list[hidden] { display:none; }
        .dc-export-menu-list button { width:100%; min-height:34px; border:0; border-radius:6px; background:#fff; color:var(--text); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; cursor:pointer; }
        .dc-export-menu-list button:hover { background:#f7fbff; color:var(--accent); }
        .dc-rest-output-block { width:100%; margin:4px 0 10px; padding:12px; border:1px solid var(--border); border-radius:8px; background:#fbfcfe; box-sizing:border-box; text-align:left; }
        .dc-rest-output-head { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:9px; }
        .dc-rest-output-head b { font-size:12px; }
        .dc-rest-output-status { min-width:0; }
        .dc-rest-output-status b, .dc-rest-output-status span { display:block; }
        .dc-rest-output-status b { margin-bottom:4px; color:var(--text-secondary); font-size:12px; }
        .dc-rest-output-status b.ok { color:var(--success); }
        .dc-rest-output-status b.bad { color:var(--danger); }
        .dc-rest-output-status span { color:var(--text-muted); font-size:10px; line-height:1.45; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dc-save-hint { margin-top:auto; border:1px solid #eef0f3; border-radius:8px; background:#fbfcfe; color:var(--text-secondary); font-size:12px; line-height:1.5; text-align:center; padding:12px; }
        .dc-advanced-panel { border:1px solid var(--border); border-radius:8px; background:#fff; box-shadow:var(--shadow); overflow:hidden; display:flex; flex-direction:column; }
        .dc-advanced-head { flex:0 0 auto; min-height:64px; padding:14px 16px 12px; display:flex; align-items:flex-start; gap:10px; box-sizing:border-box; border-bottom:1px solid #eef0f3; }
        .dc-advanced-head h2 { margin:0; font-size:15px; line-height:1.35; letter-spacing:0; }
        .dc-advanced-head p { margin:4px 0 0; color:var(--text-secondary); font-size:12px; line-height:1.45; }
        .dc-advanced-body { padding:12px 16px 14px; flex:1 1 auto; min-height:0; display:flex; flex-direction:column; overflow:hidden; }
        .dc-advanced-section-head { flex:0 0 auto; display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px; }
        .dc-advanced-section-head b { font-size:12px; }
        .dc-advanced-action-row { flex:0 0 auto; border-top:1px solid #eef0f3; padding:12px 0 0; margin-top:12px; display:grid; grid-template-columns:minmax(0,1fr) auto; gap:10px; align-items:center; }
        .dc-advanced-action-row b, .dc-advanced-action-row small { display:block; }
        .dc-advanced-action-row b { font-size:12px; margin-bottom:4px; }
        .dc-advanced-action-row small { color:var(--text-secondary); font-size:10px; line-height:1.45; }
        .dc-advanced-empty { min-height:52px; padding:12px; font-size:11px; }
        .dc-connector-guide { border:1px solid #cfe0ff; border-radius:8px; background:#f7fbff; color:#174ea6; font-size:12px; font-weight:700; line-height:1.5; padding:10px 12px; }
        .dc-rest-enable { display:flex !important; align-items:flex-start; gap:10px; border:1px solid var(--border); border-radius:8px; background:#fbfcfe; padding:12px; cursor:pointer; }
        .dc-rest-enable input { width:16px; height:16px; margin:2px 0 0; accent-color:var(--accent); flex-shrink:0; }
        .dc-rest-enable span, .dc-rest-enable b, .dc-rest-enable small { display:block; }
        .dc-rest-enable b { margin-bottom:3px; color:var(--text); font-size:12px; }
        .dc-rest-enable small, .dc-field-help { color:var(--text-muted); font-size:10px; line-height:1.45; }
        .dc-rest-json { min-height:86px; resize:vertical; }
        .dc-inline-check { display:inline-flex !important; align-items:center; gap:7px; width:max-content; color:var(--text-secondary); font-size:11px; cursor:pointer; }
        .dc-inline-check input { width:14px; height:14px; margin:0; accent-color:var(--danger); }
        .dc-rest-output-summary { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:8px; }
        .dc-rest-output-summary span { min-width:0; border:1px solid var(--border); border-radius:8px; background:#fbfcfe; padding:10px; }
        .dc-rest-output-summary small, .dc-rest-output-summary b { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dc-rest-output-summary small { margin-bottom:4px; color:var(--text-muted); font-size:10px; }
        .dc-rest-output-summary b { font-size:12px; }
        .dc-rest-output-error { border:1px solid #f8c7c7; border-radius:8px; background:#fff5f5; color:var(--danger); padding:10px 12px; font-size:11px; line-height:1.45; }
        .dc-rest-log-table { min-width:720px; }
        .dc-rest-log-table td:last-child { max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dc-table-empty { padding:22px !important; text-align:center; color:var(--text-muted); }
        .dc-records-wrap { overflow:auto; max-height:360px; border-radius:8px; }
        .dc-records-wrap.compact { max-height:260px; }
        .dc-record-table td { vertical-align:top; }
        .dc-record-select-col { width:38px; text-align:center; }
        .dc-record-select-col input { width:16px; height:16px; cursor:pointer; accent-color:var(--accent); }
        .dc-record-row.selected { background:#f7fbff; }
        .dc-record-selected-badge { margin-left:auto; }
        .dc-record-row { cursor:pointer; }
        .dc-record-row:hover { background:#f8fbff; }
        .dc-row-actions { display:flex; gap:6px; justify-content:flex-end; white-space:nowrap; }
        .dc-detail-grid { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:8px; margin-bottom:14px; }
        .dc-detail-grid.two { grid-template-columns:repeat(2, minmax(0, 1fr)); }
        .dc-kv { border:1px solid var(--border); border-radius:8px; background:#fbfcfe; padding:10px; min-width:0; }
        .dc-kv small, .dc-kv b { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dc-kv small { color:var(--text-muted); font-size:10px; margin-bottom:4px; }
        .dc-kv b { font-size:12px; }
        .dc-detail-section { margin-top:14px; }
        .dc-detail-title { font-size:12px; font-weight:800; margin-bottom:8px; color:var(--text-secondary); }
        .dc-detail-list { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:8px; }
        .dc-detail-card { border:1px solid var(--border); border-radius:8px; background:#fff; padding:12px; min-width:0; }
        .dc-detail-card-head { display:flex; align-items:center; gap:10px; margin-bottom:10px; min-width:0; }
        .dc-detail-card-head b, .dc-detail-card-head small { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dc-detail-card-head small { color:var(--text-muted); font-size:11px; margin-top:2px; }
        .dc-detail-lines { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:7px; }
        .dc-detail-lines span { border-top:1px solid #eef0f3; padding-top:7px; min-width:0; color:var(--text-secondary); font-size:11px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dc-detail-lines b { display:block; color:var(--text-muted); font-size:10px; margin-bottom:2px; }
        .dc-json { margin:0; max-height:260px; overflow:auto; border:1px solid var(--border); border-radius:8px; background:#0f172a; color:#dbeafe; padding:12px; font-family:var(--font-mono); font-size:11px; line-height:1.5; white-space:pre-wrap; word-break:break-word; }
        .dc-modal { position:fixed; inset:0; z-index:650; display:flex; align-items:center; justify-content:center; padding:24px; background:rgba(15,23,42,0.38); overflow:auto; box-sizing:border-box; }
        .dc-modal[hidden] { display:none; }
        #dc-modal-body { width:100%; min-height:100%; display:flex; align-items:center; justify-content:center; box-sizing:border-box; }
        .dc-modal-card { width:100%; max-width:760px; max-height:calc(100vh - 48px); overflow:auto; background:#fff; border:1px solid var(--border); border-radius:8px; box-shadow:0 16px 48px rgba(15,23,42,0.24); padding:16px; box-sizing:border-box; margin:0 auto; }
        .dc-modal-card.wide { max-width:960px; }
        .dc-modal-head-actions { display:flex; align-items:center; gap:8px; }
        .dc-modal-x { width:30px; height:30px; border:1px solid var(--border); border-radius:8px; background:#fff; color:var(--text-secondary); cursor:pointer; font-size:18px; line-height:1; }
        .dc-modal-x:hover { background:var(--bg); color:var(--text); }
        .dc-modal-actions { justify-content:flex-end; border-top:1px solid var(--border); padding-top:12px; }
        @media (max-width: 1180px) {
            .dc-stat-grid, .dc-guide, .dc-prep-stats { grid-template-columns:repeat(2, minmax(0, 1fr)); }
            .dc-prep-layout, .dc-result-layout { grid-template-columns:1fr; }
            .dc-prep-layout { --dc-workspace-height:auto; align-items:stretch; }
            .dc-twin-select-step, .dc-main-column, .dc-advanced-column, .dc-result-step, .dc-save-card { grid-column:auto; height:auto; }
            .dc-source-step, .dc-attribute-step, .dc-advanced-panel { height:auto; }
            .dc-prep-attributes { grid-template-columns:repeat(2, minmax(0, 1fr)); max-height:none; }
            .dc-result-summary { grid-template-columns:repeat(2, minmax(0, 1fr)); }
            .dc-save-card { position:static; }
            .dc-type-row { grid-template-columns:repeat(3, minmax(0, 1fr)); }
            .dc-twin-browser { grid-template-columns:1fr; }
            .dc-attribute-list { grid-template-columns:1fr; }
        }
        @media (max-width: 720px) {
            .dc-header, .dc-panel-head, .dc-modal-head { flex-direction:column; align-items:stretch; }
            .dc-panel-actions { justify-content:flex-start; }
            .dc-stat-grid, .dc-guide, .dc-prep-stats, .dc-type-row, .dc-connector-list, .dc-twin-browser, .dc-twin-create, .dc-selected-summary, .dc-attribute-list, .dc-prep-attributes, .dc-form-grid, .dc-form-grid.wide-left, .dc-detail-grid, .dc-detail-grid.two, .dc-detail-list, .dc-detail-lines, .dc-result-summary, .dc-rest-output-summary { grid-template-columns:1fr; }
            .dc-attribute-rule { flex-direction:column; }
            .dc-source-gate, .dc-source-gate.empty { grid-template-columns:1fr; align-items:stretch; }
            .dc-source-endpoint { border-left:0; border-top:1px solid #eef0f3; padding:10px 0 0; }
            .dc-source-buttons { justify-content:flex-start; flex-wrap:wrap; }
            .dc-attribute-rule-tags { justify-content:flex-start; min-width:0; }
            .dc-attribute-row { grid-template-columns:28px minmax(0,1fr); }
            .dc-attribute-meta { grid-column:2; align-items:flex-start; }
            .dc-prep-hero { flex-direction:column; }
            .dc-prep-hero h1 { font-size:24px; }
            .dc-result-summary span { border-right:0; border-bottom:1px solid #e6ebf2; padding-bottom:8px; }
            .dc-result-summary span:last-child { border-bottom:0; }
            .dc-attribute-footer { flex-direction:column; align-items:stretch; }
            .dc-attribute-footer .dc-manage-details { flex:auto; }
            .dc-step-head { grid-template-columns:24px minmax(0,1fr); }
            .dc-step-tools { grid-column:2; justify-content:flex-start; }
            .dc-realtime-state { align-items:flex-start; flex-wrap:wrap; }
            .dc-realtime-state em { margin-left:0; width:100%; }
            .dc-modal { padding:12px; align-items:stretch; }
            #dc-modal-body { align-items:flex-start; }
        }
    </style>

    <div class="dc-prep-hero">
        <div>
            <h1>트윈 데이터 준비</h1>
            <p>디지털 트윈에서 분석에 필요한 데이터 항목을 선택하고, 수집 결과를 연구용 데이터셋으로 저장합니다.</p>
        </div>
        <div class="dc-hero-actions">
            <button id="dc-refresh" class="pm-btn pm-btn-ghost" type="button">새로고침</button>
        </div>
    </div>

    <div id="dc-toast" class="dc-toast"></div>
    <div id="dc-modal" class="dc-modal" hidden><div id="dc-modal-body"></div></div>
    <div id="dc-stats" class="dc-stat-grid dc-prep-stats"></div>
    <div id="dc-twins"><div class="dc-empty">로딩 중...</div></div>
    <div id="dc-records"><div class="dc-empty">로딩 중...</div></div>`;
}

function setupDataCollectionPage() {
    _dcBindEvents();
    _dcLoad()
        .then(() => _dcSyncRealtimeState())
        .then(() => _dcRenderAll())
        .catch((e) => {
            const stats = document.getElementById('dc-stats');
            if (stats) stats.innerHTML = `<div class="dc-empty">${esc(e.message)}</div>`;
            _dcToast(e.message, 'bad');
        });
}

function cleanupDataCollectionPage() {
    _dcCloseRealtimeStream();
    _dcStopRealtimeStatusPolling();
}

window.renderDataCollection = renderDataCollection;
window.setupDataCollectionPage = setupDataCollectionPage;
window.cleanupDataCollectionPage = cleanupDataCollectionPage;
})();
