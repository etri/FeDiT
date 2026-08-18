(() => {
let modelsSelected = null;
let modelListFilters = {
    q: '',
    project: '',
    status: '',
    framework: '',
    task: '',
};
let modelVersionSelectedByName = {};

const STATUS_STYLE = {
    none: { color: '#495057', bg: '#e9ecef', label: '미지정' },
    candidate: { color: '#075985', bg: '#e8f4ff', label: '후보' },
    staging: { color: '#78350f', bg: '#fef3c7', label: '검증' },
    best: { color: '#166534', bg: '#dcfce7', label: '최적' },
    production: { color: '#fff', bg: '#28a745', label: '운영' },
    archived: { color: '#fff', bg: '#6c757d', label: '보관' },
    deprecated: { color: '#b91c1c', bg: '#fee2e2', label: '폐기 예정' },
};

const STATUS_OPTIONS = [
    ['none', '미지정'],
    ['candidate', '후보'],
    ['staging', '검증'],
    ['best', '최적'],
    ['production', '운영'],
    ['archived', '보관'],
    ['deprecated', '폐기 예정'],
];

function _statusBadge(s) {
    const st = STATUS_STYLE[s] || STATUS_STYLE.none;
    return `<span style="padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600; color:${st.color}; background:${st.bg};">${st.label}</span>`;
}

function _statusLabel(s) {
    return (STATUS_STYLE[s] || STATUS_STYLE.none).label;
}

function _fmtTs(ts) {
    if (!ts) return '-';
    return new Date(+ts).toLocaleString('ko-KR', { hour12: false });
}

function _fmtDeploymentTs(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("ko-KR", { hour12: false });
}

function _deploymentEventLabel(type) {
    return ({
        deploy: "운영 배포",
        rollback: "롤백",
        undeploy: "운영 중단",
    })[type] || type || "-";
}

function _deploymentVersionLabel(e) {
    const current = e.model_version ? `v${e.model_version}` : "-";
    if (e.event_type === "rollback" && e.previous_version) {
        return `v${e.previous_version} → ${current}`;
    }
    if (e.previous_version && e.previous_version !== e.model_version) {
        return `v${e.previous_version} → ${current}`;
    }
    return current;
}

function _renderDeploymentHistory(events) {
    const rows = (events || []).slice(0, 12);
    const body = rows.map(e => {
        const outcome = e.outcome === "failed" ? "failed" : "success";
        const detail = e.error || e.reason || e.isvc_url || e.isvc_name || "";
        const target = e.target_namespace || e.namespace || "-";
        return `
            <tr>
                <td>${esc(_fmtDeploymentTs(e.created_at))}</td>
                <td><span class="deploy-event deploy-event-${esc(e.event_type || "unknown")}">${esc(_deploymentEventLabel(e.event_type))}</span></td>
                <td><span class="deploy-outcome deploy-outcome-${outcome}">${outcome === "success" ? "성공" : "실패"}</span></td>
                <td class="deploy-version">${esc(_deploymentVersionLabel(e))}</td>
                <td title="${esc(target)}">${esc(target)}</td>
                <td title="${esc(e.actor || "-")}">${esc(e.actor || "-")}</td>
                <td class="deploy-detail" title="${esc(detail || "-")}">${esc(detail || "-")}</td>
            </tr>
        `;
    }).join("");
    return `
        <div class="deployment-history">
            <div class="deployment-history-head">
                <div>
                    <div class="deployment-history-title">운영 배포 이력</div>
                    <div class="deployment-history-sub">최근 ${rows.length}건</div>
                </div>
            </div>
            ${rows.length ? `
                <div class="deployment-history-table-wrap">
                    <table class="deployment-history-table">
                        <thead>
                            <tr>
                                <th>시간</th>
                                <th>작업</th>
                                <th>결과</th>
                                <th>버전</th>
                                <th>Namespace</th>
                                <th>작업자</th>
                                <th>상세</th>
                            </tr>
                        </thead>
                        <tbody>${body}</tbody>
                    </table>
                </div>
            ` : `<div class="deployment-history-empty">아직 운영 배포 이력이 없습니다</div>`}
        </div>
    `;
}

function _fmtBytes(n) {
    if (n >= 1024**3) return (n / 1024**3).toFixed(2) + ' GiB';
    if (n >= 1024**2) return (n / 1024**2).toFixed(1) + ' MiB';
    if (n >= 1024) return (n / 1024).toFixed(1) + ' KiB';
    return n + ' B';
}

function _versionNumber(v) {
    return Number(v?.version ?? v) || 0;
}

function _metricNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function _fmtMetricValue(value) {
    const n = _metricNumber(value);
    if (n === null) return '-';
    const abs = Math.abs(n);
    if (abs === 0) return '0';
    if (abs >= 1000000) return n.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
    if (abs >= 1000) return n.toLocaleString('ko-KR', { maximumFractionDigits: 3 });
    if (abs >= 1) return n.toLocaleString('ko-KR', { maximumFractionDigits: 4 });
    return n.toPrecision(4);
}

function _versionMetricLine(v, limit = 2) {
    const entries = Object.entries(v?.metrics || {}).filter(([, value]) => _metricNumber(value) !== null);
    if (!entries.length) return '-';
    return entries
        .sort(([a], [b]) => _metricOrder(a) - _metricOrder(b) || a.localeCompare(b))
        .slice(0, limit)
        .map(([key, value]) => `${key.toUpperCase()} ${_fmtMetricValue(value)}`)
        .join(' · ');
}

function _compactUrl(value) {
    if (!value) return '-';
    return String(value).replace(/^https?:\/\//, '');
}

function _metricDirection(key) {
    const k = String(key || '').toLowerCase();
    if (/(loss|error|rmse|mse|mae|mape|msle|deviance|logloss|log_loss|wer|cer)/.test(k)) return 'lower';
    return 'higher';
}

function _metricOrder(key) {
    const k = String(key || '').toLowerCase();
    const preferred = ['rmse', 'mae', 'mse', 'r2', 'accuracy', 'acc', 'f1', 'auc', 'roc_auc', 'loss'];
    const idx = preferred.findIndex(p => k === p || k.includes(p));
    return idx >= 0 ? idx : 100 + k.charCodeAt(0);
}

function _metricKeys(versions) {
    const keys = new Set();
    (versions || []).forEach(v => {
        Object.entries(v.metrics || {}).forEach(([k, value]) => {
            if (_metricNumber(value) !== null) keys.add(k);
        });
    });
    return [...keys].sort((a, b) => _metricOrder(a) - _metricOrder(b) || a.localeCompare(b));
}

function _bestMetricValue(versions, key) {
    const vals = (versions || []).map(v => _metricNumber(v.metrics?.[key])).filter(v => v !== null);
    if (!vals.length) return null;
    return _metricDirection(key) === 'lower' ? Math.min(...vals) : Math.max(...vals);
}

function _renderVersionComparison(versions) {
    const rows = [...(versions || [])].sort((a, b) => _versionNumber(b) - _versionNumber(a));
    const metricKeys = _metricKeys(rows).slice(0, 8);
    if (!rows.length || !metricKeys.length) return '';
    const latestVersion = Math.max(...rows.map(_versionNumber));
    const bestByMetric = Object.fromEntries(metricKeys.map(k => [k, _bestMetricValue(rows, k)]));
    const metricHeaders = metricKeys.map(k => {
        const arrow = _metricDirection(k) === 'lower' ? '↓' : '↑';
        return `<th title="${esc(k)}">${esc(k)} <span class="metric-dir">${arrow}</span></th>`;
    }).join('');
    const body = rows.map(v => {
        const status = v.status || v.lifecycle_status || 'none';
        const isProduction = status === 'production';
        const isLatest = _versionNumber(v) === latestVersion;
        const metricCells = metricKeys.length ? metricKeys.map(k => {
            const val = _metricNumber(v.metrics?.[k]);
            const best = bestByMetric[k];
            const isBest = val !== null && best !== null && Math.abs(val - best) <= Math.max(1e-12, Math.abs(best) * 1e-12);
            return `<td class="${isBest ? 'best-metric' : ''}">${_fmtMetricValue(val)}</td>`;
        }).join('') : '<td>-</td>';
        return `
            <tr class="${isProduction ? 'production-row' : ''}">
                <td>
                    <div class="compare-version-cell">
                        <span class="compare-version">v${esc(v.version)}</span>
                        ${isLatest ? '<span class="compare-chip">최신</span>' : ''}
                    </div>
                </td>
                <td>${_statusBadge(status)}</td>
                <td>${esc(_fmtTs(v.last_updated_timestamp))}</td>
                ${metricCells}
            </tr>
        `;
    }).join('');
    return `
        <div class="version-compare">
            <div class="compare-head">
                <div>
                    <div class="compare-title">버전별 성능 비교</div>
                    <div class="compare-sub">${rows.length}개 버전 · ${metricKeys.length}개 지표</div>
                </div>
            </div>
            <div class="compare-table-wrap">
                <table class="compare-table">
                    <thead>
                        <tr>
                            <th>버전</th>
                            <th>상태</th>
                            <th>업데이트</th>
                            ${metricHeaders}
                        </tr>
                    </thead>
                    <tbody>${body}</tbody>
                </table>
            </div>
        </div>
    `;
}

function _firstTag(tags, keys) {
    for (const key of keys) {
        const value = tags?.[key];
        if (value !== undefined && value !== null && String(value).trim() !== '') return String(value);
    }
    return '';
}

function _metaItem(label, value, extra = '') {
    const text = value === undefined || value === null || value === '' ? '-' : String(value);
    return `
        <div class="version-meta-item ${extra}">
            <div class="version-meta-label">${esc(label)}</div>
            <div class="version-meta-value" title="${esc(text)}">${esc(text)}</div>
        </div>
    `;
}

function _productionInferUrl(status) {
    if (!status?.url || !status?.isvc_name) return '';
    if (status.model_format === 'tensorflow') {
        return `${status.url}/v1/models/${status.isvc_name}:predict`;
    }
    return `${status.url}/v2/models/${status.isvc_name}/infer`;
}

function _renderVersionMetadata(v, { modelName, namespace, productionStatus } = {}) {
    const tags = v.tags || {};
    const repo = v.repository || {};
    const repoStatus = repo.status || 'missing';
    const repoOk = repoStatus === 'synced' && repo.exists;
    const repoLabel = repoOk ? '동기화됨' : repoStatus === 'failed' ? '실패' : repoStatus === 'synced' ? '파일 확인 필요' : '미동기화';
    const repoPath = repo.path || '';
    const createdBy = _firstTag(tags, ['created_by', 'converted_by', 'mlflow.user']);
    const framework = _firstTag(tags, ['framework']) + (_firstTag(tags, ['framework.version']) ? ` ${_firstTag(tags, ['framework.version'])}` : '');
    const task = _firstTag(tags, ['automl.task']);
    const sourceModel = tags['source.model'] ? `${tags['source.model']} v${tags['source.version'] || '?'}` : '';
    const isServed = productionStatus?.deployed && String(productionStatus.deployed_version || '') === String(v.version);
    const servingUrl = isServed ? productionStatus.url : '';
    const inferUrl = isServed ? _productionInferUrl(productionStatus) : '';
    const repoStatusClass = repoOk ? 'repo-ok' : repoStatus === 'failed' ? 'repo-failed' : 'repo-warn';
    const sections = [
        {
            title: '출처',
            items: [
                _metaItem('Run ID', v.run_id || '', 'mono-value'),
                _metaItem('AutoML Job', _firstTag(tags, ['automl.job_id', 'automl.job.id']), 'mono-value'),
                _metaItem('실험', v.experiment_name || '', 'mono-value'),
                _metaItem('생성자', createdBy),
                _metaItem('생성일시', _fmtTs(v.creation_timestamp)),
                _metaItem('업데이트', _fmtTs(v.last_updated_timestamp)),
            ],
        },
        {
            title: '데이터/프레임워크',
            items: [
                _metaItem('프레임워크', framework.trim()),
                _metaItem('작업 유형', task === 'regression' ? '회귀' : task === 'classification' ? '분류' : task),
                _metaItem('데이터셋 ID', _firstTag(tags, ['dataset.id']), 'mono-value'),
                _metaItem('Rows', _firstTag(tags, ['dataset.rows'])),
                _metaItem('타깃', _firstTag(tags, ['dataset.target']), 'mono-value'),
                _metaItem('원본 모델', sourceModel, 'mono-value'),
            ],
        },
        {
            title: '저장소',
            items: [
                _metaItem('상태', repoLabel, repoStatusClass),
                _metaItem('백엔드', repo.backend || ''),
                _metaItem('경로', repoPath, 'mono-value wide-value'),
                _metaItem('메타데이터', repo.metadata_path || '', 'mono-value wide-value'),
                _metaItem('동기화', repo.synced_at ? new Date(repo.synced_at).toLocaleString('ko-KR', { hour12: false }) : ''),
                _metaItem('소스 URI', repo.source_uri || v.source || '', 'mono-value wide-value'),
            ],
        },
    ];
    if (isServed || (v.status || v.lifecycle_status) === 'production') {
        sections.push({
            title: '운영',
            items: isServed ? [
                _metaItem('Namespace', productionStatus.namespace || namespace || '', 'mono-value'),
                _metaItem('ISVC', productionStatus.isvc_name || '', 'mono-value'),
                _metaItem('서빙 URL', servingUrl, 'mono-value wide-value'),
                _metaItem('예측 Endpoint', inferUrl, 'mono-value wide-value'),
                _metaItem('배포 시각', productionStatus.deployed_at ? new Date(productionStatus.deployed_at).toLocaleString('ko-KR', { hour12: false }) : ''),
                _metaItem('Scale-to-Zero', productionStatus.scale_to_zero ? '활성' : '비활성'),
            ] : [
                _metaItem('상태', 'Registry는 운영 상태이나 KServe 배포 정보 없음', 'wide-value repo-warn'),
                _metaItem('Namespace', namespace || '', 'mono-value'),
                _metaItem('모델명', modelName || '', 'mono-value'),
            ],
        });
    }
    return `
        <div class="version-meta-sections">
            ${sections.map(section => `
                <details class="version-meta-section" ${section.title === '운영' ? 'open' : ''}>
                    <summary class="version-meta-title">${esc(section.title)}</summary>
                    <div class="version-meta-grid">${section.items.join('')}</div>
                </details>
            `).join('')}
        </div>
    `;
}

function _renderParamDetails(params) {
    const entries = Object.entries(params || {});
    if (!entries.length) return '';
    return `
        <details class="param-details">
            <summary>하이퍼파라미터 ${entries.length}개</summary>
            <div class="param-kv-grid">
                ${entries.map(([key, value]) => `
                    <div class="param-kv">
                        <div class="param-k">${esc(key)}</div>
                        <div class="param-v" title="${esc(String(value))}">${esc(String(value))}</div>
                    </div>
                `).join('')}
            </div>
        </details>
    `;
}

function _defaultProductionTestPayload(versionInfo, productionStatus) {
    if (productionStatus?.model_format === 'tensorflow') {
        return { instances: [[0.0]] };
    }
    const schemaPayload = versionInfo?.input_schema?.serving_payload;
    if (schemaPayload?.inputs?.length) {
        const hasNamedInputs = schemaPayload.inputs.every(input => {
            const name = String(input?.name || '');
            return name && !/^input-\d+$/.test(name);
        });
        if (hasNamedInputs) return schemaPayload;
    }
    // MLflow LoggedModel signatures expose named scalar columns (for example
    // x1 and x2), while the generic input-0 fallback is rejected by MLServer's
    // sklearn flavor as an unexpected input name.  Build a V2 request with one
    // scalar input per declared feature so the one-click AutoML serving demo
    // can execute the real inference without manual JSON editing.
    const schemaColumns = (versionInfo?.input_schema?.columns || [])
        .map(column => typeof column === 'string' ? column : column?.name)
        .map(String)
        .filter(Boolean);
    if (schemaColumns.length) {
        return {
            inputs: schemaColumns.map(name => ({
                name,
                shape: [1],
                datatype: 'FP64',
                data: [0.0],
            })),
        };
    }
    return {
        inputs: [
            {
                name: 'input-0',
                shape: [1],
                datatype: 'FP64',
                data: [0.0],
            },
        ],
    };
}

function _b64Utf8(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    bytes.forEach((b) => { binary += String.fromCharCode(b); });
    return btoa(binary);
}

function _modelListPath() {
    const qs = new URLSearchParams();
    Object.entries(modelListFilters).forEach(([key, value]) => {
        if (value) qs.set(key, value);
    });
    const q = qs.toString();
    return q ? `/api/models?${q}` : '/api/models';
}

function _uniqueOptions(values, selected) {
    const set = new Set((values || []).filter(Boolean).map(String));
    if (selected) set.add(selected);
    return [...set].sort((a, b) => a.localeCompare(b));
}

function _opt(value, label, selected) {
    return `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(label)}</option>`;
}

function _taskLabel(value) {
    const map = { regression: '회귀', classification: '분류' };
    return map[value] || value;
}

function _readModelFiltersFromUI() {
    return {
        q: document.getElementById('model-filter-q')?.value.trim() || '',
        project: document.getElementById('model-filter-project')?.value || '',
        status: document.getElementById('model-filter-status')?.value || '',
        framework: document.getElementById('model-filter-framework')?.value || '',
        task: document.getElementById('model-filter-task')?.value || '',
    };
}

function _applyModelFiltersFromUI() {
    modelListFilters = _readModelFiltersFromUI();
    navigate('models');
}

async function renderModels() {
    let models = [];
    try { models = await API.get(_modelListPath()); } catch (e) { models = []; }
    if (modelsSelected && !models.some(m => m.name === modelsSelected)) {
        modelsSelected = null;
    }
    if (!modelsSelected && models.length) {
        modelsSelected = models[0].name;
    }

    const projectOptions = _uniqueOptions(models.map(m => m.project || m.owner_namespace), modelListFilters.project);
    const frameworkOptions = _uniqueOptions(models.flatMap(m => m.frameworks || []), modelListFilters.framework);
    const taskOptions = _uniqueOptions(models.flatMap(m => m.tasks || []), modelListFilters.task);
    const activeFilterCount = Object.values(modelListFilters).filter(Boolean).length;

    const getModelStatus = (m) => m.model_status || m.status || m.latest_status || m.latest_lifecycle_status || 'none';
    const getProductionVersions = (m) => (m.stage_summary?.Production || []).map(v => Number(v)).filter(Number.isFinite);

    const listItems = models.map(m => {
        const framework = m.latest_framework || (m.frameworks || [])[0] || '';
        const dataset = m.latest_dataset_id || '';
        const task = m.latest_task || '';
        const status = getModelStatus(m);
        const productionVersions = getProductionVersions(m);
        const productionVersion = productionVersions.length ? Math.max(...productionVersions) : null;
        const meta = [
            task ? _taskLabel(task) : '',
            framework || '',
            dataset ? `dataset: ${dataset}` : '',
        ].filter(Boolean).join(' · ');
        return `
        <div class="model-list-item ${modelsSelected === m.name ? 'selected' : ''}" data-name="${esc(m.name)}">
            <div class="model-list-item-main">
                <div class="model-list-name" title="${esc(m.name)}">${esc(m.name)}</div>
                <div class="model-list-badges">
                    ${productionVersion ? `<span class="model-mini-badge model-mini-badge-green">운영 v${productionVersion}</span>` : `<span class="model-mini-badge">운영 없음</span>`}
                    ${m.latest_version ? `<span class="model-mini-badge model-mini-badge-blue">최신 v${esc(m.latest_version)}</span>` : ''}
                </div>
            </div>
            ${meta ? `<div class="model-list-meta" title="${esc(meta)}">${esc(meta)}</div>` : ''}
            <div class="model-list-foot">
                <span>${_statusBadge(status)}</span>
                <span>${m.total_versions || 0}개 버전</span>
            </div>
        </div>`;
    }).join('') || '<div class="model-empty-list">등록된 모델이 없습니다</div>';

    return `
        <style>
        .automl-modal-bg { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:2000; }
        .automl-modal-bg.hidden { display:none; }
        .automl-modal { background:white; padding:20px; border-radius:8px; min-width:520px; max-width:95vw; max-height:85vh; overflow:auto; box-shadow:0 10px 30px rgba(0,0,0,0.2); }
        .automl-modal h3 { margin:0 0 12px 0; font-size:15px; }
        .model-page-head { align-items:flex-start; gap:16px; }
        .model-page-head h1 { margin:0; }
        .model-page-head { margin-bottom:14px; }
        .model-page-head p { margin:6px 0 0; color:var(--text-muted); }
        .model-upload-trigger { height:36px; padding:0 14px; font-size:13px; border-radius:7px; align-self:flex-start; }
        .model-filter-strip { display:grid; grid-template-columns:minmax(280px, 1fr) 150px 150px 150px 150px auto auto; gap:8px; align-items:center; margin-bottom:12px; padding:10px; border:1px solid var(--border); border-radius:10px; background:#fff; }
        .model-filter-field { min-width:0; }
        .model-filter-input { width:100%; height:34px; box-sizing:border-box; border:1px solid var(--border); border-radius:7px; padding:0 10px; font-size:12px; background:white; color:var(--text-primary); }
        .model-filter-input:focus { outline:none; border-color:var(--accent); box-shadow:0 0 0 2px var(--accent-bg); }
        .models-layout { display:grid; grid-template-columns:300px minmax(0, 1fr); gap:14px; align-items:stretch; }
        #model-detail-panel { min-width:0; }
        .model-list { background:white; border:1px solid var(--border); border-radius:10px; overflow:hidden; box-shadow:0 1px 3px rgba(15,23,42,.04); display:flex; flex-direction:column; height:100%; min-height:100%; }
        .model-list-head { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:14px 16px; border-bottom:1px solid #edf2f7; }
        .model-list-title { font-size:14px; font-weight:900; color:#111827; }
        .model-filter-count { font-size:11px; color:var(--text-muted); font-weight:700; }
        .model-list-body { padding:10px; display:flex; flex-direction:column; gap:9px; flex:1 1 auto; min-height:0; max-height:none; overflow:auto; }
        .model-list-item { padding:13px 14px; border:1px solid #dfe7f2; border-radius:8px; cursor:pointer; transition:background .15s, border-color .15s, box-shadow .15s; }
        .model-list-item:hover { background:#f8fafc; border-color:#bfdbfe; }
        .model-list-item.selected { background:#f8fbff; border-color:#2563eb; box-shadow:0 0 0 1px rgba(37,99,235,.25); }
        .model-list-item-main { display:flex; justify-content:space-between; gap:8px; align-items:flex-start; }
        .model-list-name { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:13px; font-weight:900; color:#111827; }
        .model-list-badges { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:4px; flex:0 0 auto; }
        .model-mini-badge { display:inline-flex; align-items:center; height:20px; padding:0 7px; border-radius:999px; background:#f1f5f9; color:#64748b; font-size:10px; font-weight:800; white-space:nowrap; }
        .model-mini-badge-green { background:#dcfce7; color:#15803d; }
        .model-mini-badge-blue { background:#dbeafe; color:#1d4ed8; }
        .model-list-meta { margin-top:8px; color:#475569; font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .model-list-foot { margin-top:9px; display:flex; align-items:center; justify-content:space-between; gap:8px; color:var(--text-muted); font-size:11px; }
        .model-empty-list { padding:24px 14px; text-align:center; color:var(--text-muted); font-size:12px; }
        .model-detail-shell { display:flex; flex-direction:column; gap:12px; }
        .model-hero { display:grid; grid-template-columns:minmax(260px, .95fr) minmax(420px, 1.25fr) auto; align-items:start; gap:18px; padding:18px 20px; border:1px solid var(--border); border-radius:10px; background:#fff; box-shadow:0 1px 3px rgba(15,23,42,.04); }
        .model-hero-title { font-size:22px; font-weight:900; color:#111827; }
        .model-hero-chips { margin-top:8px; display:flex; gap:6px; flex-wrap:wrap; }
        .model-chip { display:inline-flex; align-items:center; height:23px; padding:0 9px; border-radius:6px; background:#edf2f7; color:#334155; font-size:11px; font-weight:800; }
        .model-chip.blue { background:#dbeafe; color:#1d4ed8; }
        .model-chip.green { background:#dcfce7; color:#15803d; }
        .model-chip.amber { background:#fef3c7; color:#92400e; }
        .model-hero-actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
        .model-inline-summary { display:grid; grid-template-columns:1fr 1fr; gap:0; min-width:0; border-left:1px solid #e5e7eb; border-right:1px solid #e5e7eb; }
        .model-inline-block { min-width:0; padding:0 18px; }
        .model-inline-block + .model-inline-block { border-left:1px solid #e5e7eb; }
        .model-inline-label { font-size:13px; font-weight:900; color:#334155; margin-bottom:8px; }
        .model-inline-row { display:flex; align-items:center; gap:7px; flex-wrap:wrap; min-height:24px; }
        .model-inline-version { display:inline-flex; align-items:center; justify-content:center; min-width:42px; height:24px; box-sizing:border-box; padding:0 9px; border-radius:6px; background:#2563eb; color:#fff; font-size:14px; font-weight:900; line-height:1; }
        .model-inline-version.green { background:#16a34a; }
        .model-inline-version.empty { background:#f1f5f9; color:#64748b; }
        .model-inline-status { display:inline-flex; align-items:center; justify-content:center; min-width:50px; height:24px; box-sizing:border-box; padding:0 9px; border-radius:6px; font-size:11px; font-weight:900; white-space:nowrap; }
        .model-inline-status.ready, .model-inline-status.production { background:#dcfce7; color:#15803d; }
        .model-inline-status.pending { background:#fef3c7; color:#92400e; }
        .model-inline-status.empty { background:#f1f5f9; color:#64748b; }
        .model-inline-dot { width:6px; height:6px; border-radius:50%; background:#16a34a; display:inline-block; }
        .model-inline-meta { margin-top:8px; color:#64748b; font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .model-inline-meta.url-stack { white-space:normal; overflow:visible; }
        .model-inline-meta-label { display:block; margin-bottom:3px; color:#64748b; font-size:11px; font-weight:800; }
        .model-inline-link { color:#2563eb; font-family:var(--font-mono); display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .model-inline-link.empty { color:#94a3b8; }
        .model-detail-grid { display:grid; grid-template-columns:minmax(0, 1.15fr) minmax(0, 1.05fr) minmax(240px, .8fr); gap:12px; align-items:stretch; }
        .model-card { border:1px solid var(--border); border-radius:10px; background:#fff; overflow:hidden; box-shadow:0 1px 3px rgba(15,23,42,.04); display:flex; flex-direction:column; min-width:0; }
        .model-card-head { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:13px 16px; border-bottom:1px solid #edf2f7; }
        .model-card-title { font-size:14px; font-weight:900; color:#111827; }
        .model-card-sub { margin-top:3px; color:var(--text-muted); font-size:11px; }
        .model-card-body { padding:14px 16px; flex:1 1 auto; min-height:0; }
        .version-list { padding:12px; display:flex; flex-direction:column; gap:8px; flex:1 1 auto; min-height:0; overflow:auto; }
        .version-row { display:grid; grid-template-columns:minmax(0, 1fr) auto; gap:10px; align-items:center; padding:10px; border:1px solid #e2e8f0; border-radius:8px; background:#fff; }
        .version-row.selected { background:#f8fbff; border-color:#2563eb; box-shadow:0 0 0 1px rgba(37,99,235,.18); }
        .version-row.production-row { background:#f0fdf4; border-color:#bbf7d0; }
        .version-row-main { min-width:0; display:flex; flex-direction:column; gap:6px; }
        .version-row-top { display:flex; align-items:center; gap:6px; min-width:0; }
        .version-row-title { font-size:13px; font-weight:900; color:#111827; white-space:nowrap; }
        .version-row-meta { display:flex; align-items:center; gap:6px; min-width:0; color:var(--text-muted); font-size:11px; }
        .version-row-time { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .version-row-action { flex:0 0 auto; }
        .selected-version-layout { display:grid; gap:12px; align-content:start; align-items:start; }
        .selected-version-head { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
        .selected-version-title { font-size:18px; font-weight:900; color:#111827; }
        .selected-version-caption { margin-top:3px; font-size:11px; color:var(--text-muted); }
        .selected-status-control { display:flex; flex-direction:column; gap:4px; align-items:flex-start; color:var(--text-muted); font-size:10px; font-weight:800; }
        .selected-status-note { padding:9px 10px; border-radius:8px; border:1px solid #e2e8f0; background:#f8fafc; align-self:start; }
        .selected-status-note strong { display:block; font-size:12px; color:#111827; margin-bottom:3px; }
        .selected-status-note span { font-size:11px; color:#64748b; line-height:1.4; }
        .selected-status-note.ready { border-color:#bbf7d0; background:#f0fdf4; }
        .selected-status-note.pending { border-color:#fed7aa; background:#fff7ed; }
        .selected-status-note.empty { border-color:#e2e8f0; background:#f8fafc; }
        .selected-metrics { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:8px; align-items:start; }
        .selected-metric { min-width:0; padding:8px 9px; border:1px solid #edf2f7; border-radius:7px; background:#f8fafc; overflow:hidden; }
        .selected-metric-label { font-size:10px; color:var(--text-muted); font-weight:800; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .selected-metric-value { margin-top:4px; font-size:12px; font-weight:900; color:#111827; font-family:var(--font-mono); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .model-action-list { display:flex; flex-direction:column; gap:10px; }
        .model-action-btn { width:100%; min-height:52px; border:1px solid var(--border); border-radius:9px; background:#fff; padding:10px 12px; display:flex; align-items:center; justify-content:space-between; gap:10px; cursor:pointer; text-align:left; transition:background .15s, border-color .15s; }
        .model-action-btn:hover { background:#f8fafc; border-color:#bfdbfe; }
        .model-action-main { min-width:0; display:flex; flex-direction:column; gap:4px; }
        .model-action-title { display:block; font-size:13px; font-weight:900; color:#111827; line-height:1.2; }
        .model-action-desc { display:block; margin-top:0; font-size:11px; color:var(--text-muted); line-height:1.35; word-break:keep-all; }
        .model-action-arrow { color:#2563eb; font-weight:900; font-size:18px; align-self:center; flex:0 0 auto; }
        .model-action-btn.green { border-color:#bbf7d0; background:#f0fdf4; }
        .model-action-btn.blue { border-color:#bfdbfe; background:#eff6ff; }
        .model-action-btn.purple { border-color:#ddd6fe; background:#f5f3ff; }
        .model-action-btn.amber { border-color:#fed7aa; background:#fff7ed; }
        .model-advanced { margin-top:12px; border-top:1px solid #edf2f7; padding-top:12px; }
        .model-advanced summary { cursor:pointer; font-size:12px; font-weight:900; color:var(--text-secondary); }
        .model-advanced-actions { margin-top:10px; display:grid; gap:10px; }
        .model-advanced-group { display:grid; gap:6px; padding:9px; border:1px solid #edf2f7; border-radius:8px; background:#f8fafc; }
        .model-advanced-group-title { font-size:10px; font-weight:900; color:#64748b; letter-spacing:.02em; }
        .model-advanced-group-actions { display:flex; gap:6px; flex-wrap:wrap; }
        .version-card { border:1px solid var(--border); border-radius:8px; padding:14px; margin-bottom:10px; }
        .version-card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
        .version-title { font-weight:600; font-size:14px; }
        .metric-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(120px, 1fr)); gap:6px; font-size:11px; margin-top:6px; }
        .metric-item { background:#f8f9fa; padding:4px 8px; border-radius:4px; }
        .metric-key { color:var(--text-muted); }
        .metric-val { font-family:var(--font-mono); font-weight:600; }
        .metric-dir { color:var(--text-muted); font-weight:700; }
        .best-metric { color:#166534; background:#dcfce7; font-family:var(--font-mono); font-weight:800; }
        .deployment-history { border:1px solid var(--border); border-radius:10px; background:#fff; overflow:hidden; box-shadow:0 1px 3px rgba(15,23,42,.04); }
        .deployment-history-head { padding:13px 16px; border-bottom:1px solid #eef2f7; display:flex; justify-content:space-between; align-items:center; gap:10px; background:#fff; }
        .deployment-history-title { font-size:14px; font-weight:900; color:#111827; }
        .deployment-history-sub { margin-top:2px; font-size:11px; color:var(--text-muted); }
        .deployment-history-table-wrap { overflow:auto; }
        .deployment-history-table { width:100%; border-collapse:collapse; font-size:11px; table-layout:fixed; }
        .deployment-history-table th { text-align:left; padding:8px 10px; color:var(--text-muted); font-weight:800; border-bottom:1px solid #eef2f7; white-space:nowrap; background:#f8fafc; }
        .deployment-history-table td { padding:8px 10px; border-bottom:1px solid #f1f5f9; color:var(--text-secondary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .deployment-history-table tbody tr:last-child td { border-bottom:0; }
        .deploy-event, .deploy-outcome { display:inline-flex; align-items:center; height:20px; padding:0 7px; border-radius:4px; font-size:10px; font-weight:800; white-space:nowrap; }
        .deploy-event { background:#e0f2fe; color:#075985; }
        .deploy-event-rollback { background:#fef3c7; color:#78350f; }
        .deploy-event-undeploy { background:#f1f5f9; color:#475569; }
        .deploy-outcome-success { background:#dcfce7; color:#166534; }
        .deploy-outcome-failed { background:#fee2e2; color:#b91c1c; }
        .deploy-version { font-family:var(--font-mono); font-weight:800; color:var(--text-primary); }
        .deploy-detail { color:var(--text-muted); }
        .deployment-history-empty { padding:18px 12px; text-align:center; font-size:12px; color:var(--text-muted); }
        .version-meta-sections { display:grid; gap:8px; margin-top:10px; }
        .version-meta-section { border-top:1px solid #eef2f7; padding-top:8px; }
        .version-meta-title { cursor:pointer; list-style:none; display:flex; align-items:center; justify-content:space-between; gap:8px; font-size:11px; font-weight:800; color:var(--text-secondary); }
        .version-meta-title::-webkit-details-marker { display:none; }
        .version-meta-title::after { content:'펼치기'; font-size:10px; font-weight:700; color:var(--text-muted); }
        .version-meta-section[open] .version-meta-title { margin-bottom:8px; }
        .version-meta-section[open] .version-meta-title::after { content:'접기'; }
        .version-meta-grid { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:8px; overflow:hidden; }
        .version-meta-item { min-width:0; }
        .version-meta-label { font-size:10px; color:var(--text-muted); margin-bottom:2px; }
        .version-meta-value { font-size:11px; color:var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; }
        .version-meta-item.wide-value { grid-column:span 2; }
        .version-meta-item.wide-value .version-meta-value { white-space:normal; overflow-wrap:anywhere; word-break:break-word; line-height:1.35; max-height:2.8em; }
        .version-meta-item.mono-value .version-meta-value { font-family:var(--font-mono); }
        .version-meta-item.repo-ok .version-meta-value { color:#15803d; font-weight:800; }
        .version-meta-item.repo-warn .version-meta-value { color:#92400e; font-weight:800; }
        .version-meta-item.repo-failed .version-meta-value { color:#b91c1c; font-weight:800; }
        .param-list { font-family:var(--font-mono); font-size:10px; color:var(--text-muted); word-break:break-all; }
        .param-details { margin-top:8px; border-top:1px solid #eef2f7; padding-top:8px; }
        .param-details summary { cursor:pointer; font-size:11px; font-weight:700; color:var(--text-secondary); }
        .param-kv-grid { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:6px; margin-top:8px; }
        .param-kv { min-width:0; padding:6px 8px; border-radius:4px; background:#f8fafc; }
        .param-k { font-size:10px; color:var(--text-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .param-v { font-family:var(--font-mono); font-size:11px; color:var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .status-select { height:32px; padding:0 10px; border:1px solid var(--border); border-radius:6px; font-size:12px; background:white; }
        .version-actions { display:flex; gap:6px; flex-wrap:wrap; }
        .model-toolbar { display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end; align-items:center; }
        .model-toolbar-divider { width:1px; height:24px; background:var(--border); margin:0 2px; }
        .model-upload-modal { width:min(720px, calc(100vw - 48px)); min-width:0; max-height:calc(100vh - 64px); padding:0; overflow:hidden; display:flex; flex-direction:column; }
        .mu-header { padding:18px 20px 14px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }
        .mu-title { margin:0; font-size:16px; font-weight:700; color:var(--text-primary); }
        .mu-body { padding:18px 20px; display:grid; gap:14px; overflow:auto; min-height:0; }
        .mu-section { border:1px solid var(--border); border-radius:8px; padding:14px; background:#fff; }
        .mu-section-title { font-size:12px; font-weight:700; margin-bottom:10px; color:var(--text-secondary); }
        .mu-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .mu-field { display:flex; flex-direction:column; gap:5px; font-size:11px; color:var(--text-secondary); font-weight:600; min-width:0; }
        .mu-field-full { grid-column:1 / -1; }
        .mu-input { width:100%; box-sizing:border-box; padding:8px 10px; border:1px solid var(--border); border-radius:6px; font-size:12px; background:white; color:var(--text-primary); }
        .mu-input:focus { outline:none; border-color:var(--accent); box-shadow:0 0 0 2px var(--accent-bg); }
        .mu-file-drop { display:grid; grid-template-columns:1fr auto; gap:10px; align-items:center; padding:12px; border:1px dashed #9ec5fe; border-radius:8px; background:#f3f8ff; }
        .mu-file-name { min-height:34px; display:flex; align-items:center; padding:0 10px; border:1px solid #d7e6ff; border-radius:6px; font-size:12px; color:var(--text-muted); background:white; font-family:var(--font-mono); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .mu-format-guide { margin-top:10px; padding:9px 10px; border:1px solid #d7e6ff; border-radius:6px; background:#f8fbff; color:#315b8a; font-size:11px; line-height:1.5; }
        .mu-footer { padding:14px 20px; border-top:1px solid var(--border); background:#f8f9fa; display:flex; justify-content:flex-end; gap:8px; flex-shrink:0; }
        .prod-test-modal { width:min(860px, calc(100vw - 48px)); min-width:0; max-height:calc(100vh - 64px); display:flex; flex-direction:column; padding:0; overflow:hidden; }
        .prod-test-body { padding:16px 20px; display:grid; gap:12px; overflow:auto; min-height:0; }
        .prod-test-meta { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:8px; }
        .prod-test-meta-item { min-width:0; padding:8px 10px; background:#f8fafc; border-radius:6px; }
        .prod-test-meta-label { font-size:10px; color:var(--text-muted); margin-bottom:2px; }
        .prod-test-meta-value { font-family:var(--font-mono); font-size:11px; color:var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .prod-test-editor { width:100%; box-sizing:border-box; min-height:190px; resize:vertical; font-family:var(--font-mono); font-size:12px; line-height:1.45; border:1px solid var(--border); border-radius:6px; padding:10px; }
        .prod-test-output { min-height:120px; max-height:280px; overflow:auto; white-space:pre-wrap; word-break:break-word; font-family:var(--font-mono); font-size:11px; background:#0f172a; color:#e5e7eb; border-radius:6px; padding:10px; }
        .retrain-modal { width:min(760px, calc(100vw - 48px)); min-width:0; max-height:calc(100vh - 64px); padding:0; overflow:hidden; display:flex; flex-direction:column; }
        .retrain-body { padding:16px 20px; display:grid; gap:12px; overflow:auto; min-height:0; }
        .rt-source { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:8px; }
        .rt-source-item { min-width:0; padding:9px 10px; border:1px solid #e5e7eb; border-radius:6px; background:#f8fafc; }
        .rt-source-label { font-size:10px; color:var(--text-muted); margin-bottom:3px; }
        .rt-source-value { font-size:11px; font-weight:700; color:var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .rt-source-value.mono { font-family:var(--font-mono); font-weight:600; }
        .rt-section { border:1px solid var(--border); border-radius:8px; padding:12px; background:white; }
        .rt-section-title { font-size:12px; font-weight:800; color:var(--text-secondary); margin-bottom:10px; display:flex; justify-content:space-between; gap:8px; align-items:center; }
        .rt-required { color:#b91c1c; font-size:10px; font-weight:800; }
        .rt-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .rt-field { display:flex; flex-direction:column; gap:5px; min-width:0; font-size:11px; color:var(--text-secondary); font-weight:700; }
        .rt-field-full { grid-column:1 / -1; }
        .rt-help { font-size:10px; color:var(--text-muted); font-weight:500; line-height:1.4; }
        .rt-model-grid { display:grid; grid-template-columns:repeat(5, minmax(0, 1fr)); gap:8px; }
        .rt-model-option { cursor:pointer; display:flex; align-items:center; gap:7px; min-width:0; padding:9px 10px; border:1px solid var(--border); border-radius:6px; background:#fff; font-size:11px; font-weight:800; color:var(--text-secondary); }
        .rt-model-option.selected { border-color:var(--accent); background:var(--accent-bg); color:var(--accent); }
        .rt-model-option input { margin:0; }
        .rt-tuning-grid { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:10px; }
        .rt-advanced { border-top:1px solid #eef2f7; padding-top:10px; margin-top:10px; }
        .rt-advanced summary { cursor:pointer; font-size:11px; font-weight:800; color:var(--text-secondary); }
        .rt-warning { padding:9px 10px; border:1px solid #fde68a; border-radius:6px; background:#fffbeb; color:#78350f; font-size:11px; line-height:1.45; }
        .rt-footer { padding:14px 20px; border-top:1px solid var(--border); background:#f8f9fa; display:flex; justify-content:space-between; gap:10px; align-items:center; flex-shrink:0; }
        .rt-error { color:#dc3545; font-size:12px; min-height:18px; }
        @media (max-width: 1280px) {
            .model-detail-grid { grid-template-columns:1fr; }
        }
        @media (max-width: 1020px) {
            .models-layout { grid-template-columns:1fr; }
            .model-filter-strip { grid-template-columns:1fr 1fr; }
            .model-hero { grid-template-columns:1fr; }
            .model-inline-summary { border-left:0; border-right:0; border-top:1px solid #e5e7eb; padding-top:12px; }
        }
        @media (max-width: 760px) {
            .model-filter-strip, .model-inline-summary { grid-template-columns:1fr; }
            .model-inline-block { padding:0; }
            .model-inline-block + .model-inline-block { border-left:0; border-top:1px solid #e5e7eb; padding-top:12px; margin-top:12px; }
            .model-filter-strip .pm-btn { width:100%; }
            .version-meta-grid { grid-template-columns:1fr; }
            .version-meta-item.wide-value { grid-column:auto; }
            .param-kv-grid { grid-template-columns:1fr; }
            .prod-test-meta { grid-template-columns:1fr; }
            .rt-source { grid-template-columns:1fr 1fr; }
            .rt-grid, .rt-tuning-grid, .rt-model-grid, .selected-metrics { grid-template-columns:1fr; }
        }
        </style>

        <div class="pm-page-header model-page-head" style="display:flex; justify-content:space-between;">
            <div>
                <h1>모델 버전 관리</h1>
                <p>학습된 모델의 성능을 비교하고, 운영에 사용할 버전을 선택하거나 재학습을 진행합니다.</p>
            </div>
            <button class="pm-btn pm-btn-primary model-upload-trigger" id="model-upload-btn">새 모델 등록</button>
        </div>

        <div class="model-filter-strip">
            <label class="model-filter-field">
                <input id="model-filter-q" class="model-filter-input" value="${esc(modelListFilters.q)}" placeholder="모델명, 데이터셋, 설명 검색..." />
            </label>
            <label class="model-filter-field">
                <select id="model-filter-status" class="model-filter-input">
                    ${_opt('', '상태 전체', modelListFilters.status)}
                    ${STATUS_OPTIONS.map(([val, lbl]) => _opt(val, lbl, modelListFilters.status)).join('')}
                </select>
            </label>
            <label class="model-filter-field">
                <select id="model-filter-framework" class="model-filter-input">
                    ${_opt('', '프레임워크 전체', modelListFilters.framework)}
                    ${frameworkOptions.map(v => _opt(v, v, modelListFilters.framework)).join('')}
                </select>
            </label>
            <label class="model-filter-field">
                <select id="model-filter-task" class="model-filter-input">
                    ${_opt('', '작업 전체', modelListFilters.task)}
                    ${taskOptions.map(v => _opt(v, _taskLabel(v), modelListFilters.task)).join('')}
                </select>
            </label>
            <label class="model-filter-field">
                <select id="model-filter-project" class="model-filter-input">
                    ${_opt('', '프로젝트 전체', modelListFilters.project)}
                    ${projectOptions.map(v => _opt(v, v, modelListFilters.project)).join('')}
                </select>
            </label>
            <button class="pm-btn pm-btn-sm" id="model-filter-clear" ${activeFilterCount ? '' : 'disabled'}>초기화</button>
            <button class="pm-btn pm-btn-sm pm-btn-primary" id="model-filter-apply">검색</button>
        </div>

        <div class="models-layout">
            <div class="model-list" id="model-list">
                <div class="model-list-head">
                    <div class="model-list-title">모델 목록 (${models.length})</div>
                    ${activeFilterCount ? `<span class="model-filter-count">필터 ${activeFilterCount}</span>` : ''}
                </div>
                <div class="model-list-body">${listItems}</div>
            </div>
            <div id="model-detail-panel">
                <div style="padding:60px; text-align:center; color:var(--text-muted); background:white; border:1px solid var(--border); border-radius:10px;">
                    ${models.length ? '모델 정보를 불러오는 중...' : '등록된 모델이 없습니다.'}
                </div>
            </div>
        </div>
    `;
}

function setupModelsPage() {
    document.getElementById('model-upload-btn')?.addEventListener('click', openModelUploadModal);
    document.getElementById('model-filter-apply')?.addEventListener('click', _applyModelFiltersFromUI);
    document.getElementById('model-filter-clear')?.addEventListener('click', () => {
        modelListFilters = { q: '', project: '', status: '', framework: '', task: '' };
        navigate('models');
    });
    ['project', 'status', 'framework', 'task'].forEach(key => {
        document.getElementById(`model-filter-${key}`)?.addEventListener('change', _applyModelFiltersFromUI);
    });
    document.getElementById('model-filter-q')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') _applyModelFiltersFromUI();
    });
    document.querySelectorAll('.model-list-item').forEach(item => {
        item.addEventListener('click', async () => {
            modelsSelected = item.dataset.name;
            document.querySelectorAll('.model-list-item').forEach(i => i.classList.toggle('selected', i === item));
            await loadModelDetail(modelsSelected);
        });
    });
    if (modelsSelected) {
        loadModelDetail(modelsSelected);
    }
}

function openModelUploadModal() {
    const modal = document.createElement('div');
    modal.className = 'automl-modal-bg';
    modal.innerHTML = `
        <div class="automl-modal model-upload-modal">
            <div class="mu-header">
                <div>
                    <div class="mu-title">모델 업로드</div>
                </div>
                <button class="pm-btn pm-btn-sm" id="mu-x">닫기</button>
            </div>
            <div class="mu-body">
                <div class="mu-section">
                    <div class="mu-section-title">기본 정보</div>
                    <div class="mu-grid">
                        <label class="mu-field">모델명
                            <input id="mu-name" class="mu-input" placeholder="my-model" />
                        </label>
                        <label class="mu-field">모델 유형
                            <select id="mu-model-type" class="mu-input">
                                <option value="ml">머신러닝(ML)</option>
                                <option value="dl">딥러닝(DL)</option>
                            </select>
                        </label>
                        <label class="mu-field">프레임워크
                            <select id="mu-framework" class="mu-input"></select>
                        </label>
                    </div>
                </div>
                <div class="mu-section">
                    <div class="mu-section-title">모델 파일</div>
                    <div class="mu-file-drop">
                        <div class="mu-file-name" id="mu-file-name">선택된 파일 없음</div>
                        <label class="pm-btn pm-btn-sm" style="margin:0;">
                            파일 선택
                            <input id="mu-file" type="file" style="display:none;" />
                        </label>
                    </div>
                    <div class="mu-format-guide" id="mu-format-guide"></div>
                </div>
                <div class="mu-section">
                    <div class="mu-section-title">메타데이터</div>
                    <div class="mu-grid">
                        <label class="mu-field">데이터셋 ID
                            <input id="mu-dataset" class="mu-input" />
                        </label>
                        <label class="mu-field">타깃 컬럼
                            <input id="mu-target" class="mu-input" />
                        </label>
                        <label class="mu-field mu-field-full">메트릭 JSON
                            <textarea id="mu-metrics" rows="3" class="mu-input" style="font-family:var(--font-mono);" placeholder='{"f1":0.91,"rmse":123.4}'></textarea>
                        </label>
                        <label class="mu-field mu-field-full">설명
                            <textarea id="mu-desc" rows="2" class="mu-input"></textarea>
                        </label>
                    </div>
                </div>
            </div>
            <div class="mu-footer">
                <button class="pm-btn" id="mu-cancel">취소</button>
                <button class="pm-btn pm-btn-primary" id="mu-submit">업로드</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    modal.querySelector('#mu-cancel').onclick = close;
    modal.querySelector('#mu-x').onclick = close;
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    const typeInput = modal.querySelector('#mu-model-type');
    const frameworkInput = modal.querySelector('#mu-framework');
    const fileInput = modal.querySelector('#mu-file');
    const fileName = modal.querySelector('#mu-file-name');
    const formatGuide = modal.querySelector('#mu-format-guide');
    const frameworkOptions = {
        ml: [
            ['mlflow', 'MLflow 모델 번들'],
            ['scikit-learn', 'scikit-learn'],
            ['xgboost', 'XGBoost'],
            ['lightgbm', 'LightGBM'],
            ['onnx', 'ONNX'],
            ['custom', 'Custom MLflow 번들'],
        ],
        dl: [
            ['mlflow', 'MLflow 모델 번들'],
            ['pytorch', 'PyTorch / TorchServe'],
            ['tensorflow', 'TensorFlow SavedModel'],
            ['onnx', 'ONNX'],
            ['custom', 'Custom MLflow 번들'],
        ],
    };
    const uploadFormats = {
        mlflow: {
            accept: '.zip',
            guide: 'MLflow에서 저장한 모델 디렉터리를 ZIP으로 압축하세요. ZIP 최상위 경로에 MLmodel 파일이 필요합니다.',
        },
        'scikit-learn': {
            accept: '.joblib,.pkl,.pickle,.zip',
            guide: 'joblib/pickle 모델 파일 또는 해당 파일이 포함된 ZIP을 업로드합니다. 등록 후 KServe sklearn runtime으로 배포됩니다.',
        },
        xgboost: {
            accept: '.bst,.json,.ubj,.model,.bin,.zip',
            guide: 'Booster.save_model로 저장한 BST/JSON/UBJ 모델 또는 ZIP을 업로드합니다.',
        },
        lightgbm: {
            accept: '.bst,.txt,.model,.bin,.zip',
            guide: 'Booster.save_model로 저장한 모델 파일 또는 ZIP을 업로드합니다.',
        },
        pytorch: {
            accept: '.mar,.zip',
            guide: 'Torch Model Archiver로 생성한 .mar 파일을 업로드합니다. 단독 .pt/.pth 가중치는 handler와 모델 구조가 없어 지원하지 않습니다.',
        },
        tensorflow: {
            accept: '.zip',
            guide: 'saved_model.pb와 variables 디렉터리가 포함된 TensorFlow SavedModel 폴더를 ZIP으로 압축해 업로드합니다.',
        },
        onnx: {
            accept: '.onnx,.zip',
            guide: 'model.onnx 파일 또는 ONNX 파일이 포함된 ZIP을 업로드합니다.',
        },
        custom: {
            accept: '.zip',
            guide: 'Custom 모델은 MLflow 호환 번들 ZIP으로 등록합니다. ZIP 최상위 경로에 MLmodel 파일이 필요합니다.',
        },
    };
    const refreshUploadFormat = ({ resetFile = true } = {}) => {
        const spec = uploadFormats[frameworkInput.value] || uploadFormats.mlflow;
        fileInput.accept = spec.accept;
        formatGuide.textContent = `지원 형식: ${spec.accept} · ${spec.guide}`;
        if (resetFile) {
            fileInput.value = '';
            fileName.textContent = '선택된 파일 없음';
        }
    };
    const refreshFrameworks = () => {
        const options = frameworkOptions[typeInput.value] || frameworkOptions.ml;
        frameworkInput.innerHTML = options.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
        refreshUploadFormat();
    };
    typeInput.addEventListener('change', refreshFrameworks);
    frameworkInput.addEventListener('change', () => refreshUploadFormat());
    refreshFrameworks();
    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        modal.querySelector('#mu-file-name').textContent = file ? `${file.name} (${_fmtBytes(file.size)})` : '선택된 파일 없음';
    });
    modal.querySelector('#mu-submit').onclick = async () => {
        const btn = modal.querySelector('#mu-submit');
        const file = modal.querySelector('#mu-file').files[0];
        const modelName = modal.querySelector('#mu-name').value.trim();
        if (!modelName) return alert('모델명을 입력하세요');
        if (!file) return alert('모델 파일을 선택하세요');
        let metrics = {};
        const metricText = modal.querySelector('#mu-metrics').value.trim();
        if (metricText) {
            try {
                metrics = JSON.parse(metricText);
            } catch {
                return alert('메트릭 JSON 형식이 올바르지 않습니다');
            }
        }
        const metadata = {
            model_name: modelName,
            filename: file.name,
            model_type: modal.querySelector('#mu-model-type').value,
            framework: modal.querySelector('#mu-framework').value,
            dataset_id: modal.querySelector('#mu-dataset').value.trim(),
            dataset_target: modal.querySelector('#mu-target').value.trim(),
            description: modal.querySelector('#mu-desc').value.trim(),
            metrics,
        };
        const qs = new URLSearchParams({ model_name: modelName, filename: file.name });
        btn.disabled = true;
        btn.textContent = '업로드 중...';
        try {
            const resp = await fetch(API._withNs(`/api/models?${qs.toString()}`), {
                method: 'POST',
                headers: API._headers({
                    'Content-Type': 'application/octet-stream',
                    'x-pm-model-metadata-b64': _b64Utf8(JSON.stringify(metadata)),
                }),
                body: file,
            });
            const r = await API._json(resp);
            alert(`✅ 모델 업로드 완료\n모델: ${r.name}\n버전: v${r.version}\n저장소: ${r.repository?.path || '-'}`);
            modelsSelected = r.name;
            close();
            navigate('models');
        } catch (e) {
            alert('업로드 실패: ' + e.message);
            btn.disabled = false;
            btn.textContent = '업로드';
        }
    };
}

async function loadModelDetail(name) {
    const panel = document.getElementById('model-detail-panel');
    if (!panel) return;
    panel.innerHTML = '<div style="padding:20px; text-align:center; background:white; border:1px solid var(--border); border-radius:10px;">로딩 중...</div>';
    let data = null;
    try {
        data = await API.get(`/api/models/${encodeURIComponent(name)}`);
    } catch (e) {
        panel.innerHTML = `<div style="padding:20px; color:#dc3545; background:white; border:1px solid var(--border); border-radius:10px;">로드 실패: ${e.message}</div>`;
        return;
    }

    const versions = [...(data.versions || [])].sort((a, b) => _versionNumber(b) - _versionNumber(a));
    const firstVer = versions[0];
    const nsGuess = data.owner_namespace || (firstVer ? _guessNamespace(firstVer.experiment_name) : '');
    let productionStatus = null;
    if (nsGuess) {
        try {
            productionStatus = await API.get(`/api/models/${encodeURIComponent(name)}/production-status?namespace=${encodeURIComponent(nsGuess)}`);
        } catch (e) {}
    }

    let deploymentHistory = [];
    if (nsGuess) {
        try {
            const h = await API.get(`/api/models/${encodeURIComponent(name)}/deployment-history?namespace=${encodeURIComponent(nsGuess)}&limit=20`);
            deploymentHistory = h.events || [];
        } catch (e) {}
    }

    const latestVersion = versions.length ? Math.max(...versions.map(_versionNumber)) : null;
    const productionVersion = productionStatus?.deployed_version || versions.find(v => (v.status || v.lifecycle_status) === 'production')?.version || '';
    const storedSelected = modelVersionSelectedByName[name];
    let selectedVersion = versions.find(v => String(v.version) === String(storedSelected))
        || versions.find(v => String(v.version) === String(productionVersion))
        || versions[0]
        || null;
    if (selectedVersion) modelVersionSelectedByName[name] = String(selectedVersion.version);

    if (!selectedVersion) {
        panel.innerHTML = `
            <div class="model-detail-shell">
                <div class="model-hero">
                    <div><div class="model-hero-title">${esc(name)}</div><div class="model-hero-chips"><span class="model-chip amber">버전 없음</span></div></div>
                    <div class="model-hero-actions"><button class="pm-btn pm-btn-sm pm-btn-danger" id="delete-model-btn">삭제</button></div>
                </div>
                <div class="model-card"><div class="model-card-body" style="text-align:center; color:var(--text-muted); padding:40px;">등록된 모델 버전이 없습니다.</div></div>
            </div>`;
        document.getElementById('delete-model-btn')?.addEventListener('click', async () => {
            if (!confirm(`${name} 모델을 완전 삭제합니다. 계속할까요?`)) return;
            try {
                const r = await fetch(API.base + `/api/models/${encodeURIComponent(name)}`, { method: 'DELETE' });
                const result = await r.json();
                if (!r.ok) throw new Error(result.detail || r.status);
                modelsSelected = null;
                navigate('models');
            } catch (e) {
                alert('삭제 실패: ' + e.message);
            }
        });
        return;
    }

    const selectedVer = String(selectedVersion.version);
    const selectedStatus = selectedVersion.status || selectedVersion.lifecycle_status || 'none';
    const selectedStatusLabel = _statusLabel(selectedStatus);
    const selectedStatusTone = selectedStatus === 'production' ? 'ready' : (selectedStatus === 'none' ? 'empty' : 'pending');
    const selectedStatusHelp = selectedStatus === 'production'
        ? '현재 운영 대상으로 지정된 버전입니다. 배포 상태와 Endpoint 정보를 함께 확인하세요.'
        : selectedStatus === 'none'
            ? '아직 운영/검증 상태가 지정되지 않은 버전입니다. 상태를 변경하거나 다음 작업을 실행하세요.'
            : '검증 또는 후보 단계의 버전입니다. 성능과 메타데이터를 확인한 뒤 운영 배포를 진행하세요.';
    const selectedTags = selectedVersion.tags || {};
    const selectedFramework = [_firstTag(selectedTags, ['framework']), _firstTag(selectedTags, ['framework.version'])].filter(Boolean).join(' ');
    const selectedTask = _firstTag(selectedTags, ['automl.task']);
    const selectedDataset = _firstTag(selectedTags, ['dataset.id']);
    const selectedTarget = _firstTag(selectedTags, ['dataset.target']);
    const isSelectedServed = productionStatus?.deployed && String(productionStatus.deployed_version || '') === selectedVer;
    const latestVersionInfo = versions.find(v => _versionNumber(v) === latestVersion) || versions[0];
    const currentProdVersionInfo = versions.find(v => String(v.version) === String(productionVersion));
    const selectedMetrics = Object.entries(selectedVersion.metrics || {}).slice(0, 6);
    const versionRows = versions.map(v => {
        const ver = String(v.version);
        const status = v.status || v.lifecycle_status || 'none';
        const isSelected = ver === selectedVer;
        const isProduction = status === 'production' || String(productionVersion) === ver;
        const isLatest = _versionNumber(v) === latestVersion;
        return `
            <div class="version-row ${isSelected ? 'selected' : ''} ${isProduction ? 'production-row' : ''}">
                <div class="version-row-main">
                    <div class="version-row-top">
                        <span class="version-row-title">v${esc(ver)}</span>
                        ${isSelected ? '<span class="model-mini-badge model-mini-badge-blue">선택</span>' : ''}
                        ${isLatest ? '<span class="model-mini-badge">최신</span>' : ''}
                        ${_statusBadge(status)}
                    </div>
                    <div class="version-row-meta"><span>업데이트</span><span class="version-row-time" title="${esc(_fmtTs(v.last_updated_timestamp))}">${esc(_fmtTs(v.last_updated_timestamp))}</span></div>
                </div>
                <div class="version-row-action"><button class="pm-btn pm-btn-sm select-version-btn" data-version="${esc(ver)}">${isSelected ? '선택됨' : '선택'}</button></div>
            </div>`;
    }).join('');
    const deploymentHistoryHtml = _renderDeploymentHistory(deploymentHistory);
    const selectedMetadataHtml = _renderVersionMetadata(selectedVersion, { modelName: name, namespace: nsGuess, productionStatus });
    const paramsHtml = _renderParamDetails(selectedVersion.params || {});
    const inferUrl = productionStatus?.deployed ? _productionInferUrl(productionStatus) : '';
    const prodReadyLabel = productionStatus?.deployed
        ? (productionStatus.ready ? 'Ready' : '배포 진행 중')
        : '운영 없음';
    const prodVersionLabel = productionStatus?.deployed && productionVersion ? `v${productionVersion}` : '없음';
    const prodVersionClass = productionStatus?.deployed ? 'green' : 'empty';
    const prodUrlLabel = productionStatus?.deployed ? _compactUrl(inferUrl || productionStatus.url || '') : '-';
    const prodUrlClass = productionStatus?.deployed ? '' : 'empty';
    const latestStatus = latestVersionInfo ? (latestVersionInfo.status || latestVersionInfo.lifecycle_status || 'none') : 'none';
    const latestMetricLine = latestVersionInfo ? _versionMetricLine(latestVersionInfo) : '-';

    panel.innerHTML = `
        <div class="model-detail-shell">
            <div class="model-hero">
                <div>
                    <div class="model-hero-title">${esc(name)}</div>
                    <div class="model-hero-chips">
                        ${selectedTask ? `<span class="model-chip blue">${esc(_taskLabel(selectedTask))}</span>` : ''}
                        ${selectedFramework ? `<span class="model-chip green">${esc(selectedFramework)}</span>` : ''}
                        ${selectedTarget ? `<span class="model-chip">target: ${esc(selectedTarget)}</span>` : ''}
                        ${selectedDataset ? `<span class="model-chip amber">dataset: ${esc(selectedDataset)}</span>` : ''}
                    </div>
                </div>
                <div class="model-inline-summary">
                    <div class="model-inline-block">
                        <div class="model-inline-label">현재 운영 버전</div>
                        <div class="model-inline-row">
                            <span class="model-inline-version ${prodVersionClass}">${esc(prodVersionLabel)}</span>
                            ${productionStatus?.deployed ? `<span class="model-inline-status ready">${esc(prodReadyLabel)}</span><span class="model-inline-dot"></span>` : `<span class="model-inline-status empty">운영 없음</span>`}
                        </div>
                        <div class="model-inline-meta url-stack" title="${esc(inferUrl || '-')}"><span class="model-inline-meta-label">서빙 URL</span><span class="model-inline-link ${prodUrlClass}">${esc(prodUrlLabel)}</span></div>
                    </div>
                    <div class="model-inline-block">
                        <div class="model-inline-label">최신 버전</div>
                        <div class="model-inline-row">
                            <span class="model-inline-version">${latestVersionInfo ? `v${esc(latestVersionInfo.version)}` : '-'}</span>
                            <span class="model-inline-status ${latestStatus === 'production' ? 'production' : latestStatus === 'staging' || latestStatus === 'candidate' ? 'pending' : latestStatus === 'none' ? 'empty' : 'ready'}">${esc(_statusLabel(latestStatus))}</span>
                        </div>
                        <div class="model-inline-meta">${esc(latestMetricLine)}</div>
                    </div>
                </div>
                <div class="model-hero-actions">
                    <button class="pm-btn pm-btn-sm pm-btn-primary" id="prod-test-btn" ${productionStatus?.deployed ? '' : 'disabled'} title="운영 중인 KServe endpoint에 테스트 요청">운영 테스트 요청</button>
                    <button class="pm-btn pm-btn-sm" id="monitoring-btn">모니터링 보기</button>
                </div>
            </div>

            <div class="model-detail-grid">
                <div class="model-card">
                    <div class="model-card-head">
                        <div><div class="model-card-title">버전 선택</div><div class="model-card-sub">상세 조회할 모델 버전을 선택합니다.</div></div>
                    </div>
                    <div class="version-list">${versionRows}</div>
                </div>

                <div class="model-card">
                    <div class="model-card-head">
                        <div><div class="model-card-title">선택한 버전 상세</div><div class="model-card-sub">버전 상태와 상세 정보를 확인합니다.</div></div>
                    </div>
                    <div class="model-card-body selected-version-layout">
                        <div class="selected-version-head">
                            <div>
                                <div class="selected-version-title">v${esc(selectedVer)}</div>
                                <div class="selected-version-caption">현재 상태: ${esc(selectedStatusLabel)}</div>
                            </div>
                            <label class="selected-status-control">
                                <span>상태 변경</span>
                                <select class="status-select" data-version="${esc(selectedVer)}" data-current="${esc(selectedStatus)}">
                                    ${STATUS_OPTIONS.map(([val,lbl]) => `<option value="${val}" ${val === selectedStatus ? 'selected' : ''}>${lbl}</option>`).join('')}
                                </select>
                            </label>
                        </div>
                        <div class="selected-status-note ${selectedStatusTone}"><strong>${esc(selectedStatusLabel)}</strong><span>${esc(selectedStatusHelp)}</span></div>
                        <div class="selected-metrics">
                            ${(selectedMetrics.length ? selectedMetrics : [['metric', '-']]).slice(0, 4).map(([k, val]) => `
                                <div class="selected-metric"><div class="selected-metric-label" title="${esc(k)}">${esc(k)}</div><div class="selected-metric-value">${_fmtMetricValue(val)}</div></div>
                            `).join('')}
                        </div>
                        ${selectedMetadataHtml}
                        ${paramsHtml}
                    </div>
                </div>

                <div class="model-card">
                    <div class="model-card-head"><div><div class="model-card-title">다음 작업</div><div class="model-card-sub">선택한 v${esc(selectedVer)} 기준으로 실행합니다.</div></div></div>
                    <div class="model-card-body">
                        <div class="model-action-list">
                            <button class="model-action-btn green" id="primary-deploy-btn"><span class="model-action-main"><span class="model-action-title">운영 배포</span><span class="model-action-desc">선택한 버전을 KServe 운영 환경에 배포합니다.</span></span><span class="model-action-arrow">›</span></button>
                            <button class="model-action-btn blue retrain-btn" data-version="${esc(selectedVer)}"><span class="model-action-main"><span class="model-action-title">재학습 시작</span><span class="model-action-desc">현재 버전 설정을 기반으로 AutoML Job을 생성합니다.</span></span><span class="model-action-arrow">›</span></button>
                            <button class="model-action-btn purple" id="feedback-btn"><span class="model-action-main"><span class="model-action-title">피드백 등록</span><span class="model-action-desc">운영 예측 결과의 실제값을 입력합니다.</span></span><span class="model-action-arrow">›</span></button>
                            <button class="model-action-btn amber feedback-retrain-btn" data-version="${esc(selectedVer)}"><span class="model-action-main"><span class="model-action-title">피드백으로 재학습</span><span class="model-action-desc">누적 피드백 데이터셋으로 재학습합니다.</span></span><span class="model-action-arrow">›</span></button>
                            <button class="model-action-btn download-btn" data-version="${esc(selectedVer)}"><span class="model-action-main"><span class="model-action-title">모델 다운로드</span><span class="model-action-desc">선택한 버전 artifact를 ZIP으로 다운로드합니다.</span></span><span class="model-action-arrow">›</span></button>
                        </div>
                        <details class="model-advanced">
                            <summary>고급 관리</summary>
                            <div class="model-advanced-actions">
                                <div class="model-advanced-group">
                                    <div class="model-advanced-group-title">저장소 관리</div>
                                    <div class="model-advanced-group-actions">
                                        <button class="pm-btn pm-btn-sm" id="repo-check-btn">정합성 검사</button>
                                        <button class="pm-btn pm-btn-sm" id="repo-repair-btn">저장소 복구</button>
                                        <button class="pm-btn pm-btn-sm repo-sync-btn" data-version="${esc(selectedVer)}">저장소 동기화</button>
                                    </div>
                                </div>
                                <div class="model-advanced-group">
                                    <div class="model-advanced-group-title">운영 관리</div>
                                    <div class="model-advanced-group-actions">
                                        <button class="pm-btn pm-btn-sm" id="accuracy-btn">정확도</button>
                                        <button class="pm-btn pm-btn-sm" id="rollback-btn">롤백</button>
                                        ${productionStatus?.deployed ? `<button class="pm-btn pm-btn-sm pm-btn-danger" id="undeploy-btn" data-ns="${esc(nsGuess)}">운영 중단</button>` : ''}
                                    </div>
                                </div>
                                <div class="model-advanced-group">
                                    <div class="model-advanced-group-title">데이터 / 삭제</div>
                                    <div class="model-advanced-group-actions">
                                        <button class="pm-btn pm-btn-sm feedback-export-btn" data-version="${esc(selectedVer)}">피드백 CSV</button>
                                        <button class="pm-btn pm-btn-sm pm-btn-danger delete-version-btn" data-version="${esc(selectedVer)}" data-status="${esc(selectedStatus)}">버전 삭제</button>
                                        <button class="pm-btn pm-btn-sm pm-btn-danger" id="delete-model-btn">모델 삭제</button>
                                    </div>
                                </div>
                            </div>
                        </details>
                    </div>
                </div>
            </div>
            ${deploymentHistoryHtml}
        </div>
    `;

    panel.querySelectorAll('.select-version-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            modelVersionSelectedByName[name] = btn.dataset.version;
            await loadModelDetail(name);
        });
    });

    document.getElementById('repo-check-btn')?.addEventListener('click', async () => {
        try {
            const r = await API.get(`/api/models/${encodeURIComponent(name)}/repository-consistency`);
            const bad = (r.versions || []).filter(v => !v.ok);
            const lines = [
                r.ok ? '✅ 저장소 정합성 정상' : '⚠ 저장소 정합성 문제 감지',
                `버전: ${r.total_versions}개`,
                `문제 버전: ${r.inconsistent_versions}개`,
                ...bad.slice(0, 8).map(v => `v${v.version}: ${(v.issues || []).join(', ')}`),
            ];
            alert(lines.join('\n'));
        } catch (e) {
            alert('정합성 검사 실패: ' + e.message);
        }
    });

    document.getElementById('repo-repair-btn')?.addEventListener('click', async () => {
        if (!confirm('정합성이 깨진 모델 버전을 MLflow artifact에서 다시 복구합니다. 계속할까요?')) return;
        const btn = document.getElementById('repo-repair-btn');
        const original = btn.textContent;
        btn.disabled = true;
        btn.textContent = '복구 중...';
        try {
            const r = await API.post(`/api/models/${encodeURIComponent(name)}/repository-repair`, {});
            const after = r.after || {};
            const lines = [
                r.status === 'ok' ? '✅ 저장소 복구 완료' : '⚠ 저장소 복구 일부 실패',
                `복구 버전: ${(r.repaired || []).length}개`,
                `실패 버전: ${(r.failed || []).length}개`,
                `남은 문제 버전: ${after.inconsistent_versions ?? '-' }개`,
            ];
            alert(lines.join('\n'));
            await loadModelDetail(name);
        } catch (e) {
            alert('저장소 복구 실패: ' + e.message);
            btn.disabled = false;
            btn.textContent = original;
        }
    });

    document.getElementById('primary-deploy-btn')?.addEventListener('click', () => {
        if (selectedStatus === 'production' && isSelectedServed) {
            alert('이미 운영 배포된 버전입니다.');
            return;
        }
        const sel = panel.querySelector(`.status-select[data-version="${CSS.escape(selectedVer)}"]`);
        if (!sel) return;
        sel.value = 'production';
        sel.dispatchEvent(new Event('change'));
    });

    panel.querySelectorAll('.status-select').forEach(sel => {
        sel.addEventListener('change', async () => {
            const version = sel.dataset.version;
            const nextStatus = sel.value;
            const currentStatus = sel.dataset.current || 'none';
            // A registry entry can be Production while its KServe resource was
            // removed or failed.  In that case the primary action is a repair
            // deployment, not a no-op status change.
            const repairDeployment = nextStatus === 'production'
                && currentStatus === 'production'
                && !isSelectedServed;
            if (nextStatus === currentStatus && !repairDeployment) return;

            let payload = { status: nextStatus };
            if (nextStatus === 'production') {
                const ns = nsGuess || prompt('배포할 namespace를 입력하세요 (예: kubeflow-user-example-com):');
                if (!ns) {
                    await loadModelDetail(name);
                    return;
                }
                const opts = await _openDeployOptionsModal(name, version, ns);
                if (!opts) {
                    await loadModelDetail(name);
                    return;
                }
                payload = { status: nextStatus, target_namespace: ns, scale_to_zero: opts.scale_to_zero };
            } else if (nextStatus === 'archived' && !confirm(`v${version}을(를) 보관 상태로 변경하시겠습니까?`)) {
                await loadModelDetail(name);
                return;
            }
            try {
                const r = await API.put(`/api/models/${encodeURIComponent(name)}/versions/${version}/status`, payload);
                if (nextStatus === 'production') {
                    const stzNote = payload.scale_to_zero ? '\n유휴 시 자동 종료 활성' : '';
                    alert(`운영 배포 완료\nURL: ${r.isvc_url}${stzNote}`);
                }
                navigate('models');
            } catch (e) {
                alert('상태 변경 실패: ' + e.message);
                await loadModelDetail(name);
            }
        });
    });

    panel.querySelectorAll('.retrain-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const version = btn.dataset.version;
            const versionInfo = (data.versions || []).find(v => String(v.version) === String(version));
            openRetrainModal(name, versionInfo || { version });
        });
    });

    panel.querySelectorAll('.feedback-export-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const version = btn.dataset.version;
            const versionInfo = (data.versions || []).find(v => String(v.version) === String(version));
            exportFeedbackDataset(name, versionInfo || { version });
        });
    });

    panel.querySelectorAll('.feedback-retrain-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const version = btn.dataset.version;
            const versionInfo = (data.versions || []).find(v => String(v.version) === String(version));
            openFeedbackRetrainModal(name, versionInfo || { version });
        });
    });

    panel.querySelectorAll('.repo-sync-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const version = btn.dataset.version;
            const original = btn.textContent;
            btn.disabled = true;
            btn.textContent = '동기화 중...';
            try {
                const r = await API.post(`/api/models/${encodeURIComponent(name)}/versions/${version}/repository-sync`, {});
                if (r.status === 'warning') {
                    alert('저장소 동기화 경고: ' + (r.repository?.error || '원인을 확인할 수 없습니다'));
                }
                await loadModelDetail(name);
            } catch (e) {
                alert('저장소 동기화 실패: ' + e.message);
                btn.disabled = false;
                btn.textContent = original;
            }
        });
    });

    panel.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const version = btn.dataset.version;
            const original = btn.textContent;
            btn.disabled = true;
            btn.textContent = '준비 중...';
            try {
                const url = API.base + `/api/models/${encodeURIComponent(name)}/versions/${version}/download`;
                const r = await fetch(url, { credentials: 'include' });
                if (!r.ok) {
                    const detail = await r.text();
                    throw new Error(`${r.status}: ${detail.slice(0, 200)}`);
                }
                const blob = await r.blob();
                const cd = r.headers.get('Content-Disposition') || '';
                const m = cd.match(/filename="?([^"]+)"?/);
                const filename = m ? m[1] : `${name}-v${version}.zip`;
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(a.href);
            } catch (e) {
                alert('다운로드 실패: ' + e.message);
            } finally {
                btn.disabled = false;
                btn.textContent = original;
            }
        });
    });

    panel.querySelectorAll('.delete-version-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const version = btn.dataset.version;
            const status = btn.dataset.status || 'none';
            const isProduction = status === 'production';
            if (isProduction && !confirm(`v${version}은 운영 상태입니다.\n\n운영 중단 후 이 버전을 삭제하려면 확인이 필요합니다.\n계속할까요?`)) {
                return;
            } else if (!isProduction) {
                if (!confirm(`v${version}을(를) 삭제할까요?\n\nRegistry 버전 엔트리와 모델 저장소 경로를 삭제합니다.\nRun/Artifact는 유지됩니다.`)) return;
            }
            const original = btn.textContent;
            btn.disabled = true;
            btn.textContent = '삭제 중...';
            try {
                const path = `/api/models/${encodeURIComponent(name)}/versions/${encodeURIComponent(version)}` + (isProduction ? '?force=true' : '');
                const r = await API.del(path);
                const lines = [`삭제 완료: v${r.version || version}`, `저장소 삭제: ${(r.repository_purged || []).length}개`];
                alert(lines.join('\n'));
                await loadModelDetail(name);
            } catch (e) {
                alert('버전 삭제 실패: ' + e.message);
                btn.disabled = false;
                btn.textContent = '버전 삭제';
            }
        });
    });

    document.getElementById('monitoring-btn')?.addEventListener('click', () => loadProductionMetricsPanel(name));
    document.getElementById('accuracy-btn')?.addEventListener('click', () => loadAccuracyPanel(name));
    document.getElementById('feedback-btn')?.addEventListener('click', () => openFeedbackModal(name));

    document.getElementById('delete-model-btn')?.addEventListener('click', async () => {
        const msg = `${name} 모델을 완전 삭제합니다.\n\n함께 제거되는 항목:\n` +
            `• 모든 버전 + Registry 엔트리\n` +
            `• 운영 서빙(ISVC) + 모델 PVC\n` +
            `• AutoML 서빙으로 만든 ISVC + PVC\n` +
            `• MLflow Run 기록 + Artifact 파일 (디스크 영구 삭제)\n\n` +
            `복구 불가. 계속할까요?`;
        if (!confirm(msg)) return;
        try {
            const r = await fetch(API.base + `/api/models/${encodeURIComponent(name)}`, { method: 'DELETE' });
            const data = await r.json();
            if (r.ok && data.status === 'ok') {
                alert(`삭제 완료: ${data.deleted}\n버전 ${data.versions_deleted}개 삭제`);
                modelsSelected = null;
                navigate('models');
            } else {
                alert('삭제 실패: ' + (data.detail || r.status));
            }
        } catch (e) {
            alert('삭제 실패: ' + e.message);
        }
    });

    document.getElementById('rollback-btn')?.addEventListener('click', async () => {
        if (!confirm('현재 운영 버전을 보관 처리하고, 가장 최근의 이전 운영 버전(보관)을 KServe에 즉시 재배포합니다. 계속할까요?')) return;
        try {
            const r = await API.post(`/api/models/${encodeURIComponent(name)}/rollback`, { target_namespace: nsGuess || null });
            const lines = [
                `✅ 롤백 및 재배포 완료`,
                r.rolled_back_from ? `기존 운영 버전: v${r.rolled_back_from}` : '',
                `새 운영 버전: v${r.new_production}`,
                r.isvc_url ? `URL: ${r.isvc_url}` : '',
                r.pvc_name ? `PVC: ${r.pvc_name}` : '',
                r.repository?.path ? `저장소: ${r.repository.path}` : '',
            ].filter(Boolean);
            alert(lines.join('\n'));
            await loadModelDetail(name);
        } catch (e) {
            alert('롤백 실패: ' + e.message);
        }
    });

    document.getElementById('prod-test-btn')?.addEventListener('click', () => {
        if (!productionStatus?.deployed) {
            alert('운영 배포된 모델이 없습니다.');
            return;
        }
        const deployedVersion = String(productionStatus?.deployed_version || '');
        const versionInfo = (data.versions || []).find(v => String(v.version) === deployedVersion) || null;
        openProductionTestModal(name, nsGuess, productionStatus, versionInfo);
    });

    document.getElementById('undeploy-btn')?.addEventListener('click', async (ev) => {
        if (!confirm('운영 중단: KServe InferenceService와 PVC를 제거하고 모든 Production 버전을 보관(Archived)으로 변경합니다. 계속할까요?')) return;
        const btn = ev.target;
        btn.disabled = true; btn.textContent = '중단 중...';
        try {
            await API.post(`/api/models/${encodeURIComponent(name)}/undeploy`, {});
            await loadModelDetail(name);
        } catch (e) {
            alert('운영 중단 실패: ' + e.message);
            btn.disabled = false; btn.textContent = '운영 중단';
        }
    });
}

function openProductionTestModal(name, namespace, productionStatus, versionInfo) {
    const status = productionStatus || {};
    const inferUrl = _productionInferUrl(status) || '-';
    const schemaCols = versionInfo?.input_schema?.columns || [];
    const payloadText = JSON.stringify(_defaultProductionTestPayload(versionInfo, status), null, 2);
    const modal = document.createElement('div');
    modal.className = 'automl-modal-bg';
    modal.innerHTML = `
        <div class="automl-modal prod-test-modal">
            <div class="mu-header">
                <div>
                    <div class="mu-title">운영 테스트 요청</div>
                </div>
                <button class="pm-btn pm-btn-sm" id="pt-close">닫기</button>
            </div>
            <div class="prod-test-body">
                <div class="prod-test-meta">
                    <div class="prod-test-meta-item">
                        <div class="prod-test-meta-label">Namespace</div>
                        <div class="prod-test-meta-value" title="${esc(namespace || '-')}">${esc(namespace || '-')}</div>
                    </div>
                    <div class="prod-test-meta-item">
                        <div class="prod-test-meta-label">Version</div>
                        <div class="prod-test-meta-value">v${esc(status.deployed_version || '-')}</div>
                    </div>
                    <div class="prod-test-meta-item">
                        <div class="prod-test-meta-label">ISVC</div>
                        <div class="prod-test-meta-value" title="${esc(status.isvc_name || '-')}">${esc(status.isvc_name || '-')}</div>
                    </div>
                    <div class="prod-test-meta-item">
                        <div class="prod-test-meta-label">Endpoint</div>
                        <div class="prod-test-meta-value" title="${esc(inferUrl)}">${esc(inferUrl)}</div>
                    </div>
                </div>
                <label class="mu-field">Payload JSON
                    <textarea id="pt-payload" class="prod-test-editor" spellcheck="false">${esc(payloadText)}</textarea>
                </label>
                ${schemaCols.length ? `
                    <div style="font-size:11px; color:var(--text-muted);">
                        입력 스키마: ${schemaCols.map(c => `<code>${esc(c.name)}</code>`).join(' · ')}
                    </div>
                ` : ''}
                <label class="mu-field" style="max-width:180px;">Timeout seconds
                    <input id="pt-timeout" class="mu-input" type="number" min="1" max="180" step="1" value="${status.scale_to_zero ? '90' : '60'}" />
                </label>
                <pre id="pt-output" class="prod-test-output">대기 중</pre>
            </div>
            <div class="mu-footer">
                <button class="pm-btn" id="pt-cancel">취소</button>
                <button class="pm-btn pm-btn-primary" id="pt-submit">전송</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    const cleanup = () => modal.remove();
    modal.querySelector('#pt-close').onclick = cleanup;
    modal.querySelector('#pt-cancel').onclick = cleanup;
    modal.addEventListener('click', (e) => { if (e.target === modal) cleanup(); });
    modal.querySelector('#pt-submit').onclick = async () => {
        const submit = modal.querySelector('#pt-submit');
        const output = modal.querySelector('#pt-output');
        let payload = null;
        try {
            payload = JSON.parse(modal.querySelector('#pt-payload').value);
        } catch (e) {
            output.textContent = `JSON 파싱 실패: ${e.message}`;
            return;
        }
        submit.disabled = true;
        submit.textContent = '요청 중...';
        output.textContent = '요청 중';
        try {
            const timeout = Number(modal.querySelector('#pt-timeout').value) || 60;
            const r = await API.post(`/api/models/${encodeURIComponent(name)}/production-test`, {
                target_namespace: namespace || null,
                payload,
                timeout_seconds: timeout,
            });
            const body = r.response !== null && r.response !== undefined
                ? JSON.stringify(r.response, null, 2)
                : (r.response_text || '');
            const predictionLog = r.prediction_log || {};
            output.textContent = [
                `${r.ok ? 'OK' : 'ERROR'} · HTTP ${r.status_code} · ${r.elapsed_ms}ms · v${r.deployed_version || '-'}`,
                predictionLog.prediction_id ? `Prediction ID ${predictionLog.prediction_id}` : '',
                predictionLog.y_pred !== undefined && predictionLog.y_pred !== null ? `예측값 ${predictionLog.y_pred}` : '',
                r.prediction_log_error ? `예측 로그 저장 실패 ${r.prediction_log_error}` : '',
                `URL ${r.request_url}`,
                '',
                body || '(empty response)',
            ].filter(line => line !== '').join('\n');
        } catch (e) {
            output.textContent = `요청 실패: ${e.message}`;
        } finally {
            submit.disabled = false;
            submit.textContent = '전송';
        }
    };
}

function _fmtMs(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '-';
    return `${Math.round(n).toLocaleString('ko-KR')}ms`;
}

function _fmtPct(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '-';
    return `${(n * 100).toFixed(1)}%`;
}

function _metricCard(label, value, sub = '', tone = 'blue') {
    const colors = {
        blue: ['#e8f4ff', '#0066cc'],
        green: ['#dcfce7', '#166534'],
        amber: ['#fef3c7', '#92400e'],
        red: ['#fee2e2', '#b91c1c'],
        gray: ['#f1f5f9', '#475569'],
    }[tone] || ['#f1f5f9', '#475569'];
    return `
        <div style="background:${colors[0]}; padding:10px 12px; border-radius:6px; min-width:0;">
            <div style="font-size:10px; color:${colors[1]}; text-transform:uppercase; font-weight:800;">${esc(label)}</div>
            <div style="font-size:18px; font-weight:800; color:var(--text-primary); margin-top:3px;">${esc(value)}</div>
            ${sub ? `<div style="font-size:10px; color:var(--text-muted); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${esc(sub)}">${esc(sub)}</div>` : ''}
        </div>
    `;
}

async function loadProductionMetricsPanel(name) {
    const modal = document.createElement('div');
    modal.className = 'automl-modal-bg';
    modal.innerHTML = `
        <div class="automl-modal" style="width:min(960px, calc(100vw - 48px)); min-width:0; max-height:calc(100vh - 64px); overflow:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; gap:12px;">
                <h3 style="margin:0;">운영 모니터링: ${esc(name)}</h3>
                <button class="pm-btn" id="mon-close">닫기</button>
            </div>
            <div id="mon-body">로딩 중...</div>
        </div>
    `;
    document.body.appendChild(modal);
    const cleanup = () => modal.remove();
    modal.querySelector('#mon-close').onclick = cleanup;
    modal.addEventListener('click', (e) => { if (e.target === modal) cleanup(); });

    const body = modal.querySelector('#mon-body');
    let data = null;
    try {
        data = await API.get(`/api/models/${encodeURIComponent(name)}/production-metrics?hours=72&bucket_minutes=60&limit=20`);
    } catch (e) {
        body.innerHTML = `<div style="padding:14px; color:#dc3545;">로드 실패: ${esc(e.message)}</div>`;
        return;
    }

    const overall = data.overall || {};
    if (!overall.request_count) {
        body.innerHTML = `
            <div style="padding:14px; background:#f8f9fa; border:1px solid var(--border); border-radius:8px; font-size:12px; color:var(--text-muted);">
                아직 운영 요청 로그가 없습니다. 운영 테스트 요청을 보내면 요청 수, 성공률, 지연시간이 여기에 표시됩니다.
            </div>`;
        return;
    }

    const cards = [
        _metricCard('Requests', String(overall.request_count || 0), `최근 ${data.hours}시간`, 'blue'),
        _metricCard('Success Rate', _fmtPct(overall.success_rate), `${overall.success_count || 0} 성공 / ${overall.error_count || 0} 실패`, overall.error_count ? 'amber' : 'green'),
        _metricCard('P95 Latency', _fmtMs(overall.p95_latency_ms), `평균 ${_fmtMs(overall.avg_latency_ms)}`, 'blue'),
        _metricCard('Max Latency', _fmtMs(overall.max_latency_ms), `P50 ${_fmtMs(overall.p50_latency_ms)}`, 'gray'),
        _metricCard('Errors', String(overall.error_count || 0), Object.entries(overall.status_codes || {}).map(([k, v]) => `${k}:${v}`).join(' · '), overall.error_count ? 'red' : 'green'),
    ].join('');

    const buckets = data.buckets || [];
    const maxReq = Math.max(...buckets.map(b => b.request_count || 0), 1);
    const bars = buckets.map(b => {
        const reqH = Math.max(4, Math.round(((b.request_count || 0) / maxReq) * 120));
        const okPct = Number.isFinite(Number(b.success_rate)) ? Math.round(b.success_rate * 100) : 0;
        const time = new Date(b.bucket).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit' });
        const bg = (b.error_count || 0) ? '#f59e0b' : '#0066cc';
        return `<div style="flex:1; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; min-width:34px;">
            <div style="font-size:9px; color:var(--text-muted);">${b.request_count || 0}</div>
            <div style="width:70%; height:${reqH}px; background:${bg}; border-radius:3px 3px 0 0;" title="${esc(time)} · 요청 ${b.request_count || 0} · 성공률 ${okPct}% · p95 ${_fmtMs(b.p95_latency_ms)}"></div>
            <div style="font-size:9px; color:var(--text-muted); margin-top:3px; transform:rotate(-30deg); transform-origin:top left; white-space:nowrap;">${esc(time)}</div>
        </div>`;
    }).join('');

    const versionRows = (overall.versions || []).map(v => `
        <tr>
            <td>v${esc(v.version || '-')}</td>
            <td>${esc(v.request_count || 0)}</td>
            <td>${esc(_fmtPct(v.success_rate))}</td>
            <td>${esc(v.error_count || 0)}</td>
        </tr>
    `).join('');
    const latestRows = (data.latest || []).map(p => `
        <tr>
            <td title="${esc(p.prediction_id || '-')}">${esc(p.prediction_id || '-')}</td>
            <td>v${esc(p.model_version || '-')}</td>
            <td>${p.ok ? '<span style="color:#166534; font-weight:800;">OK</span>' : '<span style="color:#b91c1c; font-weight:800;">FAIL</span>'}</td>
            <td>${esc(p.status_code ?? '-')}</td>
            <td>${esc(_fmtMs(p.elapsed_ms))}</td>
            <td>${p.has_feedback ? '있음' : '-'}</td>
            <td title="${esc(p.created_at || '-')}">${esc(p.created_at ? new Date(p.created_at).toLocaleString('ko-KR', { hour12: false }) : '-')}</td>
        </tr>
    `).join('');

    body.innerHTML = `
        <div style="font-size:12px; color:var(--text-muted); margin-bottom:10px;">최근 ${data.hours}시간 · ${data.bucket_minutes}분 단위 · Namespace ${esc(data.namespace || '-')}</div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:8px; margin-bottom:16px;">${cards}</div>
        <div style="display:flex; gap:4px; align-items:flex-end; height:170px; border-bottom:1px solid #dee2e6; overflow-x:auto; padding:0 6px; margin-bottom:18px;">${bars}</div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:12px; align-items:start;">
            <div style="border:1px solid var(--border); border-radius:8px; overflow:hidden;">
                <div style="padding:9px 11px; background:#f8fafc; border-bottom:1px solid var(--border); font-size:12px; font-weight:800;">버전별 요청</div>
                <table style="width:100%; border-collapse:collapse; font-size:11px;">
                    <thead><tr><th style="text-align:left; padding:7px 9px;">버전</th><th style="text-align:left; padding:7px 9px;">요청</th><th style="text-align:left; padding:7px 9px;">성공률</th><th style="text-align:left; padding:7px 9px;">오류</th></tr></thead>
                    <tbody>${versionRows || '<tr><td colspan="4" style="padding:12px; color:var(--text-muted);">버전 정보 없음</td></tr>'}</tbody>
                </table>
            </div>
            <div style="border:1px solid var(--border); border-radius:8px; overflow:hidden; min-width:0;">
                <div style="padding:9px 11px; background:#f8fafc; border-bottom:1px solid var(--border); font-size:12px; font-weight:800;">최근 요청</div>
                <div style="overflow:auto;">
                    <table style="width:100%; border-collapse:collapse; font-size:11px; min-width:620px;">
                        <thead><tr><th style="text-align:left; padding:7px 9px;">Prediction ID</th><th style="text-align:left; padding:7px 9px;">버전</th><th style="text-align:left; padding:7px 9px;">결과</th><th style="text-align:left; padding:7px 9px;">HTTP</th><th style="text-align:left; padding:7px 9px;">Latency</th><th style="text-align:left; padding:7px 9px;">피드백</th><th style="text-align:left; padding:7px 9px;">시간</th></tr></thead>
                        <tbody>${latestRows}</tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

async function loadAccuracyPanel(name) {
    // 모달로 열기
    const modal = document.createElement('div');
    modal.className = 'automl-modal-bg';
    modal.innerHTML = `
        <div class="automl-modal" style="min-width:720px; max-width:95vw;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h3 style="margin:0;">정확도: ${esc(name)}</h3>
                <button class="pm-btn" id="acc-close">닫기</button>
            </div>
            <div id="acc-body">로딩 중...</div>
        </div>
    `;
    document.body.appendChild(modal);
    const cleanup = () => modal.remove();
    modal.querySelector('#acc-close').onclick = cleanup;
    modal.addEventListener('click', (e) => { if (e.target === modal) cleanup(); });

    const body = modal.querySelector('#acc-body');
    let data = null;
    try {
        data = await API.get(`/api/models/${encodeURIComponent(name)}/accuracy-history?hours=72&bucket_minutes=60`);
    } catch (e) {
        body.innerHTML = `<div style="padding:14px; color:#dc3545;">로드 실패: ${esc(e.message)}</div>`;
        return;
    }

    if (!data.buckets.length) {
        body.innerHTML = `
            <div style="padding:14px; background:#f8f9fa; border:1px solid var(--border); border-radius:8px; font-size:12px; color:var(--text-muted);">
                아직 피드백 데이터가 없습니다. "피드백" 버튼으로 실제 값과 예측값을 제출하면 시간대별 성능 변화가 여기에 표시됩니다.
            </div>`;
        return;
    }

    const task = data.task;
    const primary = task === 'regression' ? 'rmse' : 'accuracy';
    const buckets = data.buckets;
    const vals = buckets.map(b => b[primary]).filter(v => v !== undefined);
    const maxV = Math.max(...vals);
    const minV = Math.min(...vals);
    const range = (maxV - minV) || 1;
    const CHART_H = 160;

    const bars = buckets.map(b => {
        const v = b[primary];
        if (v === undefined) return '';
        const norm = task === 'regression' ? 1 - (v - minV) / range : (v - minV) / range;
        const h = Math.max(6, Math.round(norm * (CHART_H - 40)));
        const time = new Date(b.bucket).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit' });
        return `<div style="flex:1; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; min-width:34px;">
            <div style="font-size:9px; color:var(--text-muted);">${v.toFixed(3)}</div>
            <div style="width:70%; height:${h}px; background:#0066cc; border-radius:3px 3px 0 0;" title="${time}: ${primary}=${v.toFixed(4)} (n=${b.n})"></div>
            <div style="font-size:9px; color:var(--text-muted); margin-top:3px; transform:rotate(-30deg); transform-origin:top left; white-space:nowrap;">${time}</div>
        </div>`;
    }).join('');

    const overall = data.overall;
    const ovPairs = Object.entries(overall).filter(([k]) => !['n'].includes(k)).map(([k, v]) => `
        <div style="background:#e8f4ff; padding:8px 12px; border-radius:6px;">
            <div style="font-size:10px; color:#0066cc; text-transform:uppercase;">${k}</div>
            <div style="font-size:15px; font-weight:700; font-family:var(--font-mono);">${typeof v === 'number' ? v.toFixed(4) : v}</div>
        </div>
    `).join('');

    body.innerHTML = `
        <div style="font-size:12px; color:var(--text-muted); margin-bottom:10px;">최근 72시간 · 1시간 단위 · 총 ${overall.n}건 · 유형: ${task === 'regression' ? '회귀' : '분류'}</div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(110px, 1fr)); gap:8px; margin-bottom:16px;">${ovPairs}</div>
        <div style="display:flex; gap:4px; align-items:flex-end; height:${CHART_H + 40}px; border-bottom:1px solid #dee2e6; overflow-x:auto; padding:0 6px;">${bars}</div>
        <div style="font-size:11px; color:var(--text-muted); margin-top:20px;">● ${primary} (${task === 'regression' ? '낮을수록 좋음' : '높을수록 좋음'}, 막대 높이는 범위 기준 정규화)</div>
    `;
}

function openFeedbackModal(name) {
    const modal = document.createElement('div');
    modal.className = 'automl-modal-bg';
    let recentPredictions = [];
    modal.innerHTML = `
        <div class="automl-modal" style="min-width:520px; max-height:calc(100vh - 48px); overflow-y:auto;">
            <h3>피드백</h3>
            <p style="font-size:12px; color:var(--text-muted);">운영 중인 모델의 실제 결과 값을 업로드합니다. 시간별 정확도에 반영됩니다.</p>
            <label style="font-size:12px; color:var(--text-secondary); margin:10px 0 4px 0; display:block;">작업 유형</label>
            <select id="fb-task" style="width:100%; padding:8px 12px; border:1px solid var(--border); border-radius:6px; font-size:13px;">
                <option value="regression">회귀</option>
                <option value="classification">분류</option>
            </select>
            <label style="font-size:12px; color:var(--text-secondary); margin:10px 0 4px 0; display:block;">최근 예측 결과</label>
            <select id="fb-pred-select" style="width:100%; padding:8px 12px; border:1px solid var(--border); border-radius:6px; font-size:13px;">
                <option value="">불러오는 중...</option>
            </select>
            <div id="fb-pred-hint" style="font-size:11px; color:var(--text-muted); margin-top:5px;">운영 테스트 요청 결과가 있으면 여기에서 선택할 수 있습니다.</div>
            <label style="font-size:12px; color:var(--text-secondary); margin:10px 0 4px 0; display:block;">선택한 예측의 실제값</label>
            <input id="fb-true" style="width:100%; padding:8px 12px; border:1px solid var(--border); border-radius:6px; font-size:13px; box-sizing:border-box;" placeholder="예: 136000" />
            <label style="font-size:12px; color:var(--text-secondary); margin:10px 0 4px 0; display:block;">
                직접 입력 CSV (한 줄에 "실제값,예측값" 형식)
            </label>
            <textarea id="fb-data" rows="8" style="width:100%; padding:10px; border:1px solid var(--border); border-radius:6px; font-family:var(--font-mono); font-size:12px; background:#ffffff; color:#1f2937; box-sizing:border-box;" placeholder="4.5,4.23
3.9,3.87
2.1,2.34"></textarea>
            <div style="margin-top:12px; padding:10px; border:1px solid #dbe4ef; border-radius:6px; background:#f8fafc;">
                <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start; margin-bottom:8px;">
                    <div>
                        <div style="font-size:12px; font-weight:700; color:#1f2937;">CSV 파일 일괄 업로드</div>
                        <div style="font-size:11px; color:var(--text-muted); margin-top:3px;">권장 형식: <span style="font-family:var(--font-mono);">prediction_id,y_true</span> · 선택: <span style="font-family:var(--font-mono);">y_pred,model_version,task</span></div>
                    </div>
                    <button class="pm-btn pm-btn-sm" id="fb-csv-submit" type="button">CSV 업로드</button>
                </div>
                <input id="fb-csv-file" type="file" accept=".csv,text/csv" style="width:100%; font-size:12px;" />
                <pre style="margin:8px 0 0 0; padding:8px; border-radius:4px; background:#ffffff; border:1px solid #e5e7eb; color:#475569; font-size:11px; overflow:auto;">prediction_id,y_true
pred-abc123,42.5
pred-def456,39.1</pre>
                <div id="fb-csv-hint" style="font-size:11px; color:var(--text-muted); margin-top:6px;">운영 테스트 요청으로 생성된 Prediction ID와 실제값을 매칭합니다. 이미 피드백이 있는 Prediction ID는 건너뜁니다.</div>
            </div>
            <div style="margin-top:12px; padding:10px; border:1px solid #dbe4ef; border-radius:6px; background:#ffffff;">
                <div style="display:flex; justify-content:space-between; gap:10px; align-items:center; margin-bottom:8px;">
                    <div>
                        <div style="font-size:12px; font-weight:700; color:#1f2937;">최근 피드백</div>
                        <div style="font-size:11px; color:var(--text-muted); margin-top:3px;">잘못 올린 실제값/예측값은 여기에서 삭제합니다.</div>
                    </div>
                    <div style="display:flex; gap:6px; flex-shrink:0;">
                        <button class="pm-btn pm-btn-sm" id="fb-refresh-list" type="button">새로고침</button>
                        <button class="pm-btn pm-btn-sm pm-btn-danger" id="fb-clear-all" type="button">전체 삭제</button>
                    </div>
                </div>
                <div id="fb-list" style="max-height:220px; overflow:auto; display:flex; flex-direction:column; gap:6px;">불러오는 중...</div>
                <div id="fb-related-automl" style="margin-top:10px;"></div>
            </div>
            <label style="font-size:12px; color:var(--text-secondary); margin:8px 0 4px 0; display:block;">모델 버전 (선택)</label>
            <input id="fb-version" style="width:100%; padding:8px 12px; border:1px solid var(--border); border-radius:6px; font-size:13px; box-sizing:border-box;" placeholder="예: 3" />
            <div id="fb-err" style="color:#dc3545; font-size:12px; margin-top:8px; min-height:18px;"></div>
            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:14px;">
                <button class="pm-btn" id="fb-cancel">취소</button>
                <button class="pm-btn pm-btn-primary" id="fb-submit">업로드</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    const cleanup = () => modal.remove();
    modal.querySelector('#fb-cancel').onclick = cleanup;
    const feedbackListEl = modal.querySelector('#fb-list');
    const relatedAutomlEl = modal.querySelector('#fb-related-automl');
    const formatFeedbackValue = (value) => {
        if (value === null || value === undefined || value === '') return '-';
        const n = Number(value);
        return Number.isFinite(n) ? n.toLocaleString('ko-KR', { maximumFractionDigits: 6 }) : String(value);
    };
    const renderRelatedAutoml = (jobs) => {
        const related = (jobs || []).filter(j => j.feedback_dataset_stale || j.stale_reason);
        if (!related.length) {
            relatedAutomlEl.innerHTML = '';
            return;
        }
        const deletable = related.filter(j => j.can_delete);
        relatedAutomlEl.innerHTML = `
            <div style="border:1px solid #fde68a; background:#fffbeb; border-radius:6px; padding:10px;">
                <div style="display:flex; justify-content:space-between; gap:10px; align-items:center; margin-bottom:8px;">
                    <div>
                        <div style="font-size:12px; font-weight:800; color:#92400e;">피드백 변경 영향 AutoML</div>
                        <div style="font-size:11px; color:#92400e; margin-top:3px;">삭제된 피드백을 사용한 재학습 Job입니다. 종료된 Job만 삭제할 수 있습니다.</div>
                    </div>
                    <button class="pm-btn pm-btn-sm pm-btn-danger" id="fb-delete-related-automl" type="button" ${deletable.length ? '' : 'disabled'}>선택 삭제</button>
                </div>
                <div style="display:flex; flex-direction:column; gap:6px;">
                    ${related.map((job) => {
                        const checked = job.can_delete ? 'checked' : '';
                        const disabled = job.can_delete ? '' : 'disabled';
                        const statusText = job.can_delete ? '삭제 가능' : '실행 중/대기 중';
                        return `
                            <label style="display:flex; gap:8px; align-items:flex-start; padding:7px 8px; border:1px solid #fcd34d; border-radius:5px; background:#ffffff; font-size:11px; color:#475569;">
                                <input class="fb-related-job-check" type="checkbox" value="${esc(job.job_id)}" ${checked} ${disabled} style="margin-top:2px;" />
                                <span style="min-width:0;">
                                    <b style="font-size:12px; color:#1f2937;">${esc(job.experiment_name || job.job_id)}</b>
                                    <span style="color:#92400e;"> · ${esc(job.status || '-')} · ${statusText}</span>
                                    <span style="display:block; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">export ${esc(job.feedback_export_id || '-')} · Job ${esc(job.job_id)}</span>
                                </span>
                            </label>`;
                    }).join('')}
                </div>
            </div>`;
    };
    const deleteSelectedRelatedAutoml = async () => {
        const selected = [...relatedAutomlEl.querySelectorAll('.fb-related-job-check:checked')].map(input => input.value);
        if (!selected.length) {
            modal.querySelector('#fb-err').textContent = '삭제할 AutoML Job을 선택하세요';
            return;
        }
        const msg = `선택한 AutoML Job ${selected.length}개를 완전 삭제합니다.\n\nMLflow Experiment/Run, Artifact, 예측매니저 Job 기록도 함께 삭제됩니다. 계속할까요?`;
        if (!confirm(msg)) return;
        const btn = relatedAutomlEl.querySelector('#fb-delete-related-automl');
        btn.disabled = true;
        try {
            const r = await API.post(`/api/models/${encodeURIComponent(name)}/feedback/related-automl/delete`, { job_ids: selected });
            await renderFeedbackList();
            alert(`관련 AutoML 삭제 완료: ${r.deleted || 0}건`);
        } catch (e) {
            modal.querySelector('#fb-err').textContent = e.message;
            btn.disabled = false;
        }
    };
    const renderFeedbackList = async () => {
        feedbackListEl.innerHTML = '<div style="padding:10px; font-size:12px; color:var(--text-muted); text-align:center;">불러오는 중...</div>';
        try {
            const data = await API.get(`/api/models/${encodeURIComponent(name)}/feedback?limit=50`);
            renderRelatedAutoml(data.related_automl_jobs || []);
            const rows = data.feedback || [];
            if (!rows.length) {
                feedbackListEl.innerHTML = '<div style="padding:12px; border:1px dashed #dbe4ef; border-radius:6px; font-size:12px; color:var(--text-muted); text-align:center;">등록된 피드백이 없습니다.</div>';
                return;
            }
            feedbackListEl.innerHTML = rows.map((row) => {
                const when = row.submitted_at ? new Date(row.submitted_at).toLocaleString('ko-KR', { hour12: false }) : '-';
                const prediction = row.prediction_id || '직접 입력';
                const version = row.model_version ? `v${esc(row.model_version)}` : '버전 없음';
                const task = row.task === 'classification' ? '분류' : '회귀';
                return `
                    <div style="display:flex; justify-content:space-between; gap:10px; align-items:center; padding:8px 10px; border:1px solid #e5e7eb; border-radius:6px; background:#f8fafc;">
                        <div style="min-width:0;">
                            <div style="font-size:12px; font-weight:700; color:#1f2937; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(prediction)}</div>
                            <div style="font-size:11px; color:var(--text-muted); margin-top:3px;">실제 ${esc(formatFeedbackValue(row.y_true))} · 예측 ${esc(formatFeedbackValue(row.y_pred))} · ${version} · ${task}</div>
                            <div style="font-size:10px; color:var(--text-muted); margin-top:2px;">${esc(when)} · ${esc(row.submitted_by || '-')}</div>
                        </div>
                        <button class="pm-btn pm-btn-sm pm-btn-danger fb-delete-one" type="button" data-feedback-id="${esc(row.id)}">삭제</button>
                    </div>`;
            }).join('');
        } catch (e) {
            relatedAutomlEl.innerHTML = '';
            feedbackListEl.innerHTML = `<div style="padding:10px; font-size:12px; color:var(--danger);">${esc(e.message)}</div>`;
        }
    };
    relatedAutomlEl.addEventListener('click', (ev) => {
        const btn = ev.target instanceof Element ? ev.target.closest('#fb-delete-related-automl') : null;
        if (btn) deleteSelectedRelatedAutoml();
    });
    modal.querySelector('#fb-refresh-list').onclick = renderFeedbackList;
    modal.querySelector('#fb-clear-all').onclick = async () => {
        const btn = modal.querySelector('#fb-clear-all');
        if (!confirm('이 모델의 피드백을 모두 삭제할까요?')) return;
        btn.disabled = true;
        try {
            const r = await API.del(`/api/models/${encodeURIComponent(name)}/feedback`);
            await renderFeedbackList();
            loadAccuracyPanel(name);
            const relatedCount = (r.related_automl_jobs || []).length;
            const suffix = relatedCount ? `\n관련 AutoML Job ${relatedCount}개가 피드백 변경 상태로 표시되었습니다.` : '';
            alert(`삭제 완료: ${r.deleted || 0}건${suffix}`);
        } catch (e) {
            modal.querySelector('#fb-err').textContent = e.message;
        } finally {
            btn.disabled = false;
        }
    };
    feedbackListEl.addEventListener('click', async (ev) => {
        const btn = ev.target instanceof Element ? ev.target.closest('.fb-delete-one') : null;
        if (!btn) return;
        const feedbackId = btn.dataset.feedbackId;
        if (!feedbackId || !confirm('이 피드백을 삭제할까요?')) return;
        btn.disabled = true;
        try {
            const r = await API.del(`/api/models/${encodeURIComponent(name)}/feedback/${encodeURIComponent(feedbackId)}`);
            await renderFeedbackList();
            loadAccuracyPanel(name);
            if ((r.related_automl_jobs || []).length) {
                modal.querySelector('#fb-err').textContent = `관련 AutoML Job ${(r.related_automl_jobs || []).length}개가 피드백 변경 상태로 표시되었습니다.`;
            }
        } catch (e) {
            modal.querySelector('#fb-err').textContent = e.message;
            btn.disabled = false;
        }
    });
    renderFeedbackList();
    const predSelect = modal.querySelector('#fb-pred-select');
    const predHint = modal.querySelector('#fb-pred-hint');
    API.get(`/api/models/${encodeURIComponent(name)}/predictions?limit=20`).then((data) => {
        recentPredictions = (data.predictions || []).filter(p => p.y_pred !== null && p.y_pred !== undefined);
        if (!recentPredictions.length) {
            predSelect.innerHTML = '<option value="">최근 예측 결과 없음</option>';
            predHint.textContent = '운영 테스트 요청을 먼저 보내면 예측값을 자동으로 연결할 수 있습니다.';
            return;
        }
        predSelect.innerHTML = [
            '<option value="">직접 입력 사용</option>',
            ...recentPredictions.map((p) => {
                const when = p.created_at ? new Date(p.created_at).toLocaleString('ko-KR', { hour12: false }) : '-';
                const fb = p.has_feedback ? ' · 피드백 있음' : '';
                return `<option value="${esc(p.prediction_id)}">${esc(p.prediction_id)} · v${esc(p.model_version || '-')} · y_pred=${esc(p.y_pred)} · ${esc(when)}${fb}</option>`;
            }),
        ].join('');
        predHint.textContent = '예측 결과를 선택하면 실제값만 입력해도 피드백으로 저장됩니다.';
    }).catch((e) => {
        predSelect.innerHTML = '<option value="">최근 예측 로드 실패</option>';
        predHint.textContent = e.message;
    });
    modal.querySelector('#fb-csv-file').addEventListener('change', (ev) => {
        const file = ev.target.files?.[0];
        modal.querySelector('#fb-csv-hint').textContent = file
            ? `${file.name} · ${_fmtBytes(file.size)} 선택됨`
            : '운영 테스트 요청으로 생성된 Prediction ID와 실제값을 매칭합니다. 이미 피드백이 있는 Prediction ID는 건너뜁니다.';
    });
    modal.querySelector('#fb-csv-submit').onclick = async () => {
        const file = modal.querySelector('#fb-csv-file').files?.[0];
        const errEl = modal.querySelector('#fb-err');
        errEl.textContent = '';
        if (!file) {
            errEl.textContent = '업로드할 CSV 파일을 선택하세요';
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            errEl.textContent = 'CSV 파일은 10MB 이하만 업로드할 수 있습니다';
            return;
        }
        const task = modal.querySelector('#fb-task').value;
        const btn = modal.querySelector('#fb-csv-submit');
        btn.disabled = true; btn.textContent = '업로드 중...';
        try {
            const text = await file.text();
            if (!text.trim()) {
                throw new Error('CSV 파일이 비어 있습니다');
            }
            const resp = await fetch(
                API._withNs(`/api/models/${encodeURIComponent(name)}/feedback-csv?task=${encodeURIComponent(task)}&skip_existing=true`),
                {
                    method: 'POST',
                    headers: API._headers({ 'Content-Type': 'text/csv; charset=utf-8' }),
                    body: text,
                },
            );
            const r = await API._json(resp);
            cleanup();
            const skipped = r.skipped ? `\n건너뜀: ${r.skipped}건` : '';
            const errors = r.error_count ? `\n오류: ${r.error_count}건` : '';
            alert(`✅ CSV 피드백 업로드 완료\n\n저장: ${r.inserted}건${skipped}${errors}`);
            loadAccuracyPanel(name);
        } catch (e) {
            errEl.textContent = e.message;
            btn.disabled = false; btn.textContent = 'CSV 업로드';
        }
    };
    modal.querySelector('#fb-submit').onclick = async () => {
        const task = modal.querySelector('#fb-task').value;
        const raw = modal.querySelector('#fb-data').value.trim();
        const version = modal.querySelector('#fb-version').value.trim();
        const predictionId = predSelect.value;
        const selectedPrediction = recentPredictions.find(p => p.prediction_id === predictionId);
        const errEl = modal.querySelector('#fb-err');
        errEl.textContent = '';
        const entries = [];
        if (selectedPrediction) {
            const yt = parseFloat(modal.querySelector('#fb-true').value.trim());
            if (isNaN(yt)) {
                errEl.textContent = '선택한 예측 결과의 실제값을 입력하세요';
                return;
            }
            entries.push({
                task,
                y_true: yt,
                y_pred: Number(selectedPrediction.y_pred),
                model_version: selectedPrediction.model_version || version || null,
                prediction_id: selectedPrediction.prediction_id,
            });
        } else {
            if (!raw) { errEl.textContent = '데이터를 입력하거나 최근 예측 결과를 선택하세요'; return; }
            for (const line of raw.split('\n')) {
                const parts = line.split(',').map(s => s.trim());
                if (parts.length < 2) continue;
                const yt = parseFloat(parts[0]);
                const yp = parseFloat(parts[1]);
                if (isNaN(yt) || isNaN(yp)) continue;
                entries.push({ task, y_true: yt, y_pred: yp, model_version: version || null });
            }
        }
        if (!entries.length) { errEl.textContent = '유효한 데이터 없음'; return; }
        const btn = modal.querySelector('#fb-submit');
        btn.disabled = true; btn.textContent = '업로드 중...';
        try {
            const r = await API.post(`/api/models/${encodeURIComponent(name)}/feedback`, { entries });
            cleanup();
            alert(`✅ ${r.inserted}건 업로드 완료`);
            loadAccuracyPanel(name);
        } catch (e) {
            errEl.textContent = e.message;
            btn.disabled = false; btn.textContent = '업로드';
        }
    };
}


function _inferRetrainModel(tags, params) {
    const explicit = String(tags?.['automl.model'] || '').toLowerCase();
    if (['rf', 'xgb', 'lgbm', 'mlp', 'tabnet'].includes(explicit)) return explicit;
    const framework = String(tags?.framework || '').toLowerCase();
    if (framework.includes('xgboost')) return 'xgb';
    if (framework.includes('lightgbm')) return 'lgbm';
    if (framework.includes('tabnet')) return 'tabnet';
    if (params?.hidden_layer_sizes || params?.activation) return 'mlp';
    return 'rf';
}

function _safeRetrainJobName(value) {
    return String(value || '')
        .replace(/[^A-Za-z0-9._-]+/g, '-')
        .replace(/^[._-]+|[._-]+$/g, '')
        .slice(0, 80) || 'retrain-job';
}

async function _downloadFeedbackDatasetFile(downloadPath, fallbackName) {
    if (!downloadPath) return;
    const url = downloadPath.startsWith('http') ? downloadPath : `${API.base}${downloadPath}`;
    const r = await fetch(url, { credentials: 'include' });
    if (!r.ok) {
        const detail = await r.text();
        throw new Error(`${r.status}: ${detail.slice(0, 200)}`);
    }
    const blob = await r.blob();
    const cd = r.headers.get('Content-Disposition') || '';
    const m = cd.match(/filename="?([^";]+)"?/);
    const filename = m ? m[1] : fallbackName;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
}

function _feedbackCatalogLine(catalog) {
    if (!catalog || !catalog.dataset_id) return '';
    let suffix = '';
    if (catalog.duplicate_skipped) suffix = ' (기존 버전 재사용)';
    else if (catalog.reused_dataset) suffix = ' (기존 데이터셋에 버전 추가)';
    else suffix = ' (신규 등록)';
    return `카탈로그: ${catalog.dataset_name || catalog.dataset_id} ${catalog.version_label || ''}${suffix}`;
}

async function exportFeedbackDataset(name, versionInfo) {
    const version = String(versionInfo?.version || '');
    const tags = versionInfo?.tags || {};
    const targetColumn = tags['dataset.target'] || 'target';
    if (!confirm(`v${version}의 Prediction ID 피드백을 재학습용 CSV로 생성할까요?`)) return;
    try {
        const r = await API.post(`/api/models/${encodeURIComponent(name)}/versions/${encodeURIComponent(version)}/feedback-dataset`, {
            target_column: targetColumn,
            include_all_versions: false,
            min_rows: 1,
        });
        const ds = r.feedback_dataset || {};
        const catalog = ds.catalog_dataset || {};
        await _downloadFeedbackDatasetFile(ds.download_path, ds.file_name || `${name}-feedback-v${version}.csv`);
        alert([
            ds.reused_export ? '피드백 CSV 기존 파일 재사용' : '피드백 CSV 생성 완료',
            `행 수: ${ds.row_count ?? '-'}`,
            `Target: ${ds.target_column || targetColumn}`,
            `Export ID: ${ds.export_id || '-'}`,
            _feedbackCatalogLine(catalog),
            catalog.error ? `카탈로그 등록 참고: ${catalog.error}` : '',
        ].filter(Boolean).join('\n'));
    } catch (e) {
        alert('피드백 CSV 생성 실패: ' + e.message);
    }
}

function openFeedbackRetrainModal(name, versionInfo) {
    const version = String(versionInfo?.version || '');
    const tags = versionInfo?.tags || {};
    const params = versionInfo?.params || {};
    const modelId = _inferRetrainModel(tags, params);
    const task = ['regression', 'classification'].includes(String(tags['automl.task'] || '').toLowerCase())
        ? String(tags['automl.task']).toLowerCase()
        : 'regression';
    const metric = String(tags['automl.metric'] || 'auto').toLowerCase();
    const targetColumn = tags['dataset.target'] || 'target';
    const ts = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
    const defaultJobName = _safeRetrainJobName(`feedback-retrain-${name}-v${version}-${ts}`);
    const modelOptions = [
        ['rf', 'Random Forest'],
        ['xgb', 'XGBoost'],
        ['lgbm', 'LightGBM'],
        ['mlp', 'MLP'],
        ['tabnet', 'TabNet'],
    ];
    const selectedModels = new Set([modelId]);
    const modal = document.createElement('div');
    modal.className = 'automl-modal-bg';
    modal.innerHTML = `
        <div class="automl-modal retrain-modal">
            <div class="mu-header">
                <div>
                    <h3 class="mu-title">피드백 재학습 Job 생성</h3>
                    <div style="font-size:12px; color:var(--text-muted); margin-top:4px;"><b>${esc(name)}</b> v${esc(version)} · Prediction ID 피드백 기반</div>
                </div>
                <button class="pm-btn pm-btn-sm" id="frt-cancel-top" title="닫기">닫기</button>
            </div>
            <div class="retrain-body">
                <div class="rt-section">
                    <div class="rt-section-title">피드백 데이터</div>
                    <div class="rt-grid">
                        <label class="rt-field">타깃 컬럼
                            <input id="frt-target" class="mu-input" value="${esc(targetColumn)}" placeholder="target" />
                        </label>
                        <label class="rt-field">작업 유형
                            <select id="frt-task" class="mu-input">
                                <option value="regression" ${task === 'regression' ? 'selected' : ''}>회귀</option>
                                <option value="classification" ${task === 'classification' ? 'selected' : ''}>분류</option>
                            </select>
                        </label>
                        <label class="rt-field">최소 행 수
                            <input id="frt-min-rows" class="mu-input" type="number" min="1" max="1000000" value="1" />
                        </label>
                        <label class="rt-field" style="justify-content:flex-end; padding-bottom:8px;">
                            <span style="display:flex; align-items:center; gap:7px; font-size:12px; color:var(--text-secondary);">
                                <input id="frt-all-versions" type="checkbox" style="margin:0;" /> 모든 버전 포함
                            </span>
                        </label>
                    </div>
                    <div class="rt-warning" style="margin-top:10px;">Prediction ID가 연결된 피드백만 학습 데이터로 사용됩니다.</div>
                </div>
                <div class="rt-section">
                    <div class="rt-section-title">AutoML 탐색 설정</div>
                    <label class="rt-field rt-field-full" style="margin-bottom:10px;">모델 후보
                        <div class="rt-model-grid" id="frt-model-grid">
                            ${modelOptions.map(([id, label]) => `
                                <label class="rt-model-option ${selectedModels.has(id) ? 'selected' : ''}">
                                    <input type="checkbox" name="frt-model" value="${id}" ${selectedModels.has(id) ? 'checked' : ''} />
                                    <span title="${esc(label)}">${esc(id)}</span>
                                </label>
                            `).join('')}
                        </div>
                    </label>
                    <div class="rt-tuning-grid">
                        <label class="rt-field">탐색 횟수
                            <input id="frt-trials" class="mu-input" type="number" min="1" max="200" value="10" />
                        </label>
                        <label class="rt-field">제한 시간(분)
                            <input id="frt-timeout" class="mu-input" type="number" min="1" max="720" value="60" />
                        </label>
                        <label class="rt-field">Top-N 저장
                            <input id="frt-topn" class="mu-input" type="number" min="1" max="10" value="3" />
                        </label>
                    </div>
                    <details class="rt-advanced">
                        <summary>고급 설정</summary>
                        <div class="rt-grid" style="margin-top:10px;">
                            <label class="rt-field">Job 이름
                                <input id="frt-job-name" class="mu-input" value="${esc(defaultJobName)}" />
                            </label>
                            <label class="rt-field">평가 지표
                                <select id="frt-metric" class="mu-input">
                                    ${['auto','mse','rmse','mae','r2','accuracy','f1','precision','recall','roc_auc'].map(m => `<option value="${m}" ${m === metric ? 'selected' : ''}>${m}</option>`).join('')}
                                </select>
                            </label>
                            <label class="rt-field">Trial CPU
                                <input id="frt-cpu" class="mu-input" type="number" min="0.1" max="16" step="0.1" value="1" />
                            </label>
                            <label class="rt-field">Trial GPU
                                <input id="frt-gpu" class="mu-input" type="number" min="0" max="4" step="0.25" value="0" />
                            </label>
                            <label class="rt-field rt-field-full">Trial Memory(GB)
                                <input id="frt-memory" class="mu-input" type="number" min="0.5" max="128" step="0.5" value="2" />
                            </label>
                        </div>
                    </details>
                </div>
            </div>
            <div class="rt-footer">
                <div id="frt-err" class="rt-error"></div>
                <div style="display:flex; gap:8px; justify-content:flex-end; flex-shrink:0;">
                    <button class="pm-btn" id="frt-cancel">취소</button>
                    <button class="pm-btn pm-btn-primary" id="frt-submit">피드백으로 재학습 시작</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    const cleanup = () => modal.remove();
    modal.querySelector('#frt-cancel').onclick = cleanup;
    modal.querySelector('#frt-cancel-top').onclick = cleanup;
    modal.addEventListener('click', (e) => { if (e.target === modal) cleanup(); });
    modal.querySelectorAll('input[name="frt-model"]').forEach(input => {
        input.addEventListener('change', () => {
            input.closest('.rt-model-option')?.classList.toggle('selected', input.checked);
        });
    });
    modal.querySelector('#frt-submit').onclick = async () => {
        const errEl = modal.querySelector('#frt-err');
        errEl.textContent = '';
        const models = [...modal.querySelectorAll('input[name="frt-model"]:checked')].map(input => input.value);
        const payload = {
            job_name: modal.querySelector('#frt-job-name').value.trim(),
            target_column: modal.querySelector('#frt-target').value.trim() || 'target',
            task: modal.querySelector('#frt-task').value,
            models,
            metric: modal.querySelector('#frt-metric').value,
            num_trials: Number(modal.querySelector('#frt-trials').value) || 10,
            timeout_minutes: Number(modal.querySelector('#frt-timeout').value) || 60,
            top_n: Number(modal.querySelector('#frt-topn').value) || 3,
            cpu_per_trial: Number(modal.querySelector('#frt-cpu').value) || 1,
            gpu_per_trial: Number(modal.querySelector('#frt-gpu').value) || 0,
            memory_per_trial_gb: Number(modal.querySelector('#frt-memory').value) || 2,
            include_all_versions: modal.querySelector('#frt-all-versions').checked,
            min_rows: Number(modal.querySelector('#frt-min-rows').value) || 1,
        };
        if (!payload.target_column) { errEl.textContent = '타깃 컬럼을 입력하세요'; return; }
        if (!models.length) { errEl.textContent = '모델 후보를 최소 1개 선택하세요'; return; }
        const btn = modal.querySelector('#frt-submit');
        btn.disabled = true; btn.textContent = '생성 중...';
        try {
            const r = await API.post(`/api/models/${encodeURIComponent(name)}/versions/${encodeURIComponent(version)}/retrain-from-feedback`, payload);
            cleanup();
            const job = r.job || {};
            const ds = r.feedback_dataset || {};
            const catalog = ds.catalog_dataset || {};
            const lines = [
                ds.reused_export ? '✅ 피드백 재학습 Job 생성 완료 (기존 피드백 CSV 재사용)' : '✅ 피드백 재학습 Job 생성 완료',
                `Job ID: ${job.job_id || '-'}`,
                `학습 행 수: ${ds.row_count ?? '-'}`,
                _feedbackCatalogLine(catalog),
                catalog.error ? `카탈로그 등록 참고: ${catalog.error}` : '',
                ds.skipped_no_features ? `feature 없음 제외: ${ds.skipped_no_features}건` : '',
                `Experiment: ${job.experiment_name || '-'}`,
            ].filter(Boolean);
            alert(lines.join('\n'));
            if (confirm('AutoML 화면으로 이동할까요?')) navigate('automl');
        } catch (e) {
            errEl.textContent = e.message;
            btn.disabled = false; btn.textContent = '피드백으로 재학습 시작';
        }
    };
}

function openRetrainModal(name, versionInfo) {
    const version = String(versionInfo?.version || '');
    const tags = versionInfo?.tags || {};
    const params = versionInfo?.params || {};
    const modelId = _inferRetrainModel(tags, params);
    const task = ['regression', 'classification'].includes(String(tags['automl.task'] || '').toLowerCase())
        ? String(tags['automl.task']).toLowerCase()
        : 'regression';
    const metric = String(tags['automl.metric'] || 'auto').toLowerCase();
    const ts = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
    const defaultJobName = _safeRetrainJobName(`retrain-${name}-v${version}-${ts}`);
    const datasetPath = tags['dataset.path'] || '';
    const targetColumn = tags['dataset.target'] || '';
    const datasetLabel = tags['dataset.id'] || (datasetPath ? _truncate(String(datasetPath), 34) : '직접 입력 필요');
    const frameworkLabel = [tags.framework, tags['framework.version']].filter(Boolean).join(' ') || '-';
    const modelOptions = [
        ['rf', 'Random Forest'],
        ['xgb', 'XGBoost'],
        ['lgbm', 'LightGBM'],
        ['mlp', 'MLP'],
        ['tabnet', 'TabNet'],
    ];
    const selectedModels = new Set([modelId]);
    const sourceWarning = (!datasetPath || !targetColumn)
        ? `<div class="rt-warning">이 버전에 데이터셋 경로 또는 타깃 컬럼 메타데이터가 부족합니다. 재학습을 만들기 전에 학습 CSV 경로와 타깃 컬럼을 직접 확인해 주세요.</div>`
        : '';
    const modal = document.createElement('div');
    modal.className = 'automl-modal-bg';
    modal.innerHTML = `
        <div class="automl-modal retrain-modal">
            <div class="mu-header">
                <div>
                    <h3 class="mu-title">재학습 Job 생성</h3>
                    <div style="font-size:12px; color:var(--text-muted); margin-top:4px;"><b>${esc(name)}</b> v${esc(version)} 설정을 기반으로 새 AutoML Job을 만듭니다.</div>
                </div>
                <button class="pm-btn pm-btn-sm" id="rt-cancel-top" title="닫기">닫기</button>
            </div>
            <div class="retrain-body">
                <div class="rt-source">
                    <div class="rt-source-item">
                        <div class="rt-source-label">원본 버전</div>
                        <div class="rt-source-value">v${esc(version)}</div>
                    </div>
                    <div class="rt-source-item">
                        <div class="rt-source-label">데이터셋</div>
                        <div class="rt-source-value mono" title="${esc(datasetPath || datasetLabel)}">${esc(datasetLabel)}</div>
                    </div>
                    <div class="rt-source-item">
                        <div class="rt-source-label">타깃</div>
                        <div class="rt-source-value mono">${esc(targetColumn || '-')}</div>
                    </div>
                    <div class="rt-source-item">
                        <div class="rt-source-label">프레임워크</div>
                        <div class="rt-source-value">${esc(frameworkLabel)}</div>
                    </div>
                </div>
                ${sourceWarning}
                <div class="rt-section">
                    <div class="rt-section-title">학습 데이터 <span class="rt-required">필수</span></div>
                    <div class="rt-grid">
                        <label class="rt-field rt-field-full">데이터셋 경로
                            <input id="rt-dataset" class="mu-input" value="${esc(datasetPath)}" placeholder="/home/jovyan/data/train.csv 또는 http(s) URL" />
                            <span class="rt-help">컨테이너 안에서 접근 가능한 CSV 경로 또는 URL이어야 합니다.</span>
                        </label>
                        <label class="rt-field">타깃 컬럼
                            <input id="rt-target" class="mu-input" value="${esc(targetColumn)}" placeholder="예: median_house_value" />
                        </label>
                        <label class="rt-field">작업 유형
                            <select id="rt-task" class="mu-input">
                                <option value="regression" ${task === 'regression' ? 'selected' : ''}>회귀</option>
                                <option value="classification" ${task === 'classification' ? 'selected' : ''}>분류</option>
                            </select>
                        </label>
                    </div>
                </div>
                <div class="rt-section">
                    <div class="rt-section-title">AutoML 탐색 설정</div>
                    <label class="rt-field rt-field-full" style="margin-bottom:10px;">모델 후보
                        <div class="rt-model-grid" id="rt-model-grid">
                            ${modelOptions.map(([id, label]) => `
                                <label class="rt-model-option ${selectedModels.has(id) ? 'selected' : ''}">
                                    <input type="checkbox" name="rt-model" value="${id}" ${selectedModels.has(id) ? 'checked' : ''} />
                                    <span title="${esc(label)}">${esc(id)}</span>
                                </label>
                            `).join('')}
                        </div>
                        <span class="rt-help">기존 버전에서 추정한 모델을 먼저 선택했습니다. 여러 개를 고르면 Ray Tune이 모델별 trial을 나눠 탐색합니다.</span>
                    </label>
                    <div class="rt-tuning-grid">
                        <label class="rt-field">탐색 횟수
                            <input id="rt-trials" class="mu-input" type="number" min="1" max="200" value="10" />
                        </label>
                        <label class="rt-field">제한 시간(분)
                            <input id="rt-timeout" class="mu-input" type="number" min="1" max="720" value="60" />
                        </label>
                        <label class="rt-field">Top-N 저장
                            <input id="rt-topn" class="mu-input" type="number" min="1" max="10" value="3" />
                        </label>
                    </div>
                    <details class="rt-advanced">
                        <summary>고급 설정</summary>
                        <div class="rt-grid" style="margin-top:10px;">
                            <label class="rt-field">Job 이름
                                <input id="rt-job-name" class="mu-input" value="${esc(defaultJobName)}" />
                            </label>
                            <label class="rt-field">평가 지표
                                <select id="rt-metric" class="mu-input">
                                    ${['auto','mse','rmse','mae','r2','accuracy','f1','precision','recall','roc_auc'].map(m => `<option value="${m}" ${m === metric ? 'selected' : ''}>${m}</option>`).join('')}
                                </select>
                            </label>
                            <label class="rt-field">Trial CPU
                                <input id="rt-cpu" class="mu-input" type="number" min="0.1" max="16" step="0.1" value="1" />
                            </label>
                            <label class="rt-field">Trial GPU
                                <input id="rt-gpu" class="mu-input" type="number" min="0" max="4" step="0.25" value="0" />
                            </label>
                            <label class="rt-field rt-field-full">Trial Memory(GB)
                                <input id="rt-memory" class="mu-input" type="number" min="0.5" max="128" step="0.5" value="2" />
                            </label>
                        </div>
                    </details>
                </div>
            </div>
            <div class="rt-footer">
                <div id="rt-err" class="rt-error"></div>
                <div style="display:flex; gap:8px; justify-content:flex-end; flex-shrink:0;">
                    <button class="pm-btn" id="rt-cancel">취소</button>
                    <button class="pm-btn pm-btn-primary" id="rt-submit">기본값으로 재학습 시작</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    const cleanup = () => modal.remove();
    modal.querySelector('#rt-cancel').onclick = cleanup;
    modal.querySelector('#rt-cancel-top').onclick = cleanup;
    modal.addEventListener('click', (e) => { if (e.target === modal) cleanup(); });
    modal.querySelectorAll('input[name="rt-model"]').forEach(input => {
        input.addEventListener('change', () => {
            input.closest('.rt-model-option')?.classList.toggle('selected', input.checked);
        });
    });
    modal.querySelector('#rt-submit').onclick = async () => {
        const errEl = modal.querySelector('#rt-err');
        errEl.textContent = '';
        const models = [...modal.querySelectorAll('input[name="rt-model"]:checked')].map(input => input.value);
        const payload = {
            job_name: modal.querySelector('#rt-job-name').value.trim(),
            dataset_path: modal.querySelector('#rt-dataset').value.trim(),
            target_column: modal.querySelector('#rt-target').value.trim(),
            task: modal.querySelector('#rt-task').value,
            models,
            metric: modal.querySelector('#rt-metric').value,
            num_trials: Number(modal.querySelector('#rt-trials').value) || 10,
            timeout_minutes: Number(modal.querySelector('#rt-timeout').value) || 60,
            top_n: Number(modal.querySelector('#rt-topn').value) || 3,
            cpu_per_trial: Number(modal.querySelector('#rt-cpu').value) || 1,
            gpu_per_trial: Number(modal.querySelector('#rt-gpu').value) || 0,
            memory_per_trial_gb: Number(modal.querySelector('#rt-memory').value) || 2,
        };
        if (!payload.dataset_path) { errEl.textContent = '데이터셋 경로를 입력하세요'; return; }
        if (!payload.target_column) { errEl.textContent = '타깃 컬럼을 입력하세요'; return; }
        if (!models.length) { errEl.textContent = '모델 후보를 최소 1개 선택하세요'; return; }
        const btn = modal.querySelector('#rt-submit');
        btn.disabled = true; btn.textContent = '생성 중...';
        try {
            const r = await API.post(`/api/models/${encodeURIComponent(name)}/versions/${encodeURIComponent(version)}/retrain`, payload);
            cleanup();
            const job = r.job || {};
            const lines = [
                '✅ 재학습 Job 생성 완료',
                `Job ID: ${job.job_id || '-'}`,
                `Experiment: ${job.experiment_name || '-'}`,
                `완료 후 AutoML 결과를 '${r.register_suggestion || name}' 모델명으로 등록하면 새 버전이 됩니다.`,
            ];
            alert(lines.join('\n'));
            if (confirm('AutoML 화면으로 이동할까요?')) navigate('automl');
        } catch (e) {
            errEl.textContent = e.message;
            btn.disabled = false; btn.textContent = '기본값으로 재학습 시작';
        }
    };
}

function _renderMetaChips(tags) {
    if (!tags || !Object.keys(tags).length) return '';
    const chips = [];
    const push = (label, value, color) => {
        if (value) chips.push(`<span style="display:inline-block; padding:3px 8px; border-radius:4px; font-size:10px; background:${color}; color:#1f2937; margin-right:4px; margin-top:4px;"><b>${label}:</b> ${esc(value)}</span>`);
    };
    push('프레임워크', tags['framework'] + (tags['framework.version'] ? ` ${tags['framework.version']}` : ''), '#e8f4ff');
    push('데이터셋', tags['dataset.id'], '#fff3cd');
    push('Rows', tags['dataset.rows'], '#fff3cd');
    push('타깃', tags['dataset.target'], '#fff3cd');
    push('생성자', tags['created_by'], '#f0f0f0');
    push('작업 유형', tags['automl.task'] === 'regression' ? '회귀' : tags['automl.task'] === 'classification' ? '분류' : tags['automl.task'], '#f0f0f0');
    push('Source', tags['source.model'] ? `${tags['source.model']} v${tags['source.version']||'?'}` : '', '#e8f4ff');
    if (!chips.length) return '';
    return `<div style="margin-top:8px;">${chips.join('')}</div>`;
}

function _truncate(s, n) { return s.length > n ? s.slice(0, n) + '...' : s; }

function _openDeployOptionsModal(name, version, ns) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'automl-modal-bg';
        modal.innerHTML = `
          <div class="automl-modal" style="min-width:480px; max-width:560px;">
            <h3 style="margin:0 0 12px 0;">운영 배포 옵션</h3>
            <div style="font-size:13px; color:var(--text-secondary); margin-bottom:14px;">
              <b>${esc(name)}</b> v${esc(version)} → <code>${esc(ns)}</code>
            </div>
            <div style="background:#fffbeb; border:1px solid #fde68a; padding:10px 12px; border-radius:6px; margin-bottom:14px; font-size:12px; color:#78350f;">
              기존 운영 버전이 있으면 자동으로 보관 처리됩니다.
            </div>
            <label style="display:flex; gap:10px; align-items:flex-start; padding:12px; border:1px solid var(--border); border-radius:6px; cursor:pointer;">
              <input type="checkbox" id="dpo-stz" style="margin-top:3px;" />
              <div>
                <div style="font-size:13px; font-weight:600; color:#111827;">유휴 시 자동 종료 (Scale-to-Zero)</div>
                <div style="font-size:11px; color:var(--text-muted); margin-top:4px; line-height:1.5;">
                  ✅ 30초 idle 시 pod 자동 종료 → CPU/메모리 회수<br>
                  ⚠ 첫 요청 시 <b>3~5초 cold start</b><br>
                  📌 추천: 데모·검증·저빈도 호출 모델<br>
                  ❌ 비추천: 실시간 응답 SLA 모델
                </div>
              </div>
            </label>
            <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:16px;">
              <button class="pm-btn" id="dpo-cancel">취소</button>
              <button class="pm-btn pm-btn-primary" id="dpo-ok">배포</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        const close = (val) => { modal.remove(); resolve(val); };
        modal.querySelector('#dpo-cancel').onclick = () => close(null);
        modal.querySelector('#dpo-ok').onclick = () => close({
            scale_to_zero: modal.querySelector('#dpo-stz').checked,
        });
        modal.addEventListener('click', (e) => { if (e.target === modal) close(null); });
    });
}
function _guessNamespace(experimentName) {
    if (!experimentName) return '';
    // automl-{ns}-{name}, pipeline-{ns}-{name}, models-{ns}-{name}
    const prefixes = ['automl-', 'pipeline-', 'models-'];
    const prefix = prefixes.find((p) => experimentName.startsWith(p));
    if (prefix) {
        const rest = experimentName.slice(prefix.length);
        const idx = rest.lastIndexOf('-');
        return idx > 0 ? rest.slice(0, idx) : rest;
    }
    return '';
}

window.renderModels = renderModels;
window.setupModelsPage = setupModelsPage;
})();
