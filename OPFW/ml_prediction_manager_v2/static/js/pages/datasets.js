(() => {
let _datasetsState = {
    datasets: [],
    selectedId: null,
    selectedVersion: null,
    search: '',
    detail: null,
    pipeline: null,
};

function _fmtBytes(n) {
    n = Number(n || 0);
    if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(2)} GB`;
    if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(1)} MB`;
    if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${n} B`;
}

function _parseVersionNumbers(raw, fallbackVersion) {
    const text = (raw || '').trim();
    if (!text) return [Number(fallbackVersion)];
    const versions = text.split(',').map(part => part.trim()).filter(Boolean).map(part => {
        const normalized = part.replace(/^v/i, '');
        const num = Number(normalized);
        if (!Number.isInteger(num) || num < 1) {
            throw new Error('합칠 버전 번호는 2,3처럼 숫자만 입력하세요. v2,v3처럼 입력해도 자동으로 처리됩니다.');
        }
        return num;
    });
    if (!versions.length) return [Number(fallbackVersion)];
    return [...new Set(versions)];
}

function _parseSampleRows(raw) {
    const text = (raw || '').trim();
    if (!text) return null;
    const num = Number(text);
    if (!Number.isInteger(num) || num < 1) {
        throw new Error('샘플링 row 수는 비워두거나 1 이상의 정수로 입력하세요.');
    }
    return num;
}

function _kindLabel(kind) {
    return ({ raw:'원본', preprocessed:'전처리', image_standardized:'이미지 표준화', labeling_project:'라벨링 작업', labeling_export:'라벨링 완료', collection_export:'수집 데이터', nifi_output:'NiFi 출력', external_uri:'외부 URI' })[kind] || kind || '-';
}

function _typeLabel(type) {
    return ({ csv:'CSV', json:'JSON', jsonl:'JSONL', parquet:'Parquet', image:'Image' })[type] || type || '-';
}

function _taskLabel(task) {
    return ({ regression:'회귀', classification:'분류', labeling:'라벨링', unknown:'미지정' })[task] || task || '-';
}

function _statusLabel(status) {
    return ({ registered:'registered', ready:'ready', published:'published', deprecated:'deprecated', archived:'archived' })[status] || status || 'registered';
}

function _fmtDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
}

function _runStateLabel(state) {
    const value = String(state || 'CREATED').toUpperCase();
    return ({
        CREATED: 'CREATED',
        PENDING: 'PENDING',
        RUNNING: 'RUNNING',
        SUCCEEDED: 'SUCCEEDED',
        FAILED: 'FAILED',
        CANCELED: 'CANCELED',
        CANCELLING: 'CANCELLING',
        SKIPPED: 'SKIPPED',
        PAUSED: 'PAUSED',
    })[value] || value;
}

function _runStateClass(state) {
    const value = String(state || '').toUpperCase();
    if (value === 'SUCCEEDED') return 'ok';
    if (['FAILED', 'CANCELED', 'CANCELLING'].includes(value)) return 'bad';
    if (['RUNNING', 'PENDING'].includes(value)) return 'active';
    return '';
}

function _latest(ds) {
    return ds.latest_version || (ds.versions || [])[0] || null;
}


function _rowsLabel(value) {
    const n = Number(value || 0);
    if (!n) return '-';
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M rows`;
    return `${n.toLocaleString()} rows`;
}

function _versionSizeLabel(ver) {
    if (!ver) return '-';
    if (ver.row_count) return _rowsLabel(ver.row_count);
    if (ver.size_bytes) return _fmtBytes(ver.size_bytes);
    return _versionExtra(ver);
}

function _isTrainingReady(ver, ds = null) {
    if (!ver?.pipeline_ready) return false;
    const dataset = ds || _datasetsState.detail || {};
    const target = (ver.metadata || {}).target_column || dataset.target_column || '';
    if (ver.data_type === 'csv' && (!target || !['regression', 'classification'].includes(dataset.task))) {
        return false;
    }
    return true;
}

function _versionReadyLabel(ver, ds = null) {
    if (!ver) return '데이터 없음';
    if (ver.pipeline_ready && !_isTrainingReady(ver, ds)) return '학습 설정 필요';
    if (_isTrainingReady(ver, ds)) return '준비 완료';
    if (ver.source_kind === 'labeling_project') return '라벨링 진행';
    if (['raw', 'external_uri', 'collection_export', 'nifi_output'].includes(ver.source_kind)) return '전처리 필요';
    return '준비 전';
}

function _versionReadyClass(ver, ds = null) {
    const label = _versionReadyLabel(ver, ds);
    if (label === '준비 완료') return 'ok';
    if (label === '라벨링 진행') return 'warn';
    if (label === '학습 설정 필요') return 'warn';
    if (label === '전처리 필요') return 'info';
    return '';
}

function _selectedVersion(ds) {
    const versions = ds?.versions || [];
    if (!versions.length) return null;
    return versions.find(ver => String(ver.version) === String(_datasetsState.selectedVersion)) || versions[0];
}

function _latestRun(ds) {
    const rows = ds?.pipeline_runs || [];
    if (!rows.length) return null;
    return [...rows].sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))[0];
}

function _targetText(ds) {
    return ds?.target_column ? `target: ${ds.target_column}` : 'target 미지정';
}

function _datasetMetaText(ds) {
    return `${_typeLabel(ds.data_type)} · ${_taskLabel(ds.task)} · ${_targetText(ds)}`;
}

function _versionExtra(ver) {
    const meta = ver.metadata || {};
    if (meta.image_count) return `images ${meta.image_count}`;
    if (meta.label_studio?.task_count) return `tasks ${meta.label_studio.task_count}`;
    if (meta.preprocess?.row_count) return `rows ${meta.preprocess.row_count}`;
    if (meta.parquet?.column_count) return `cols ${meta.parquet.column_count}`;
    return '-';
}

function _lineageOperationLabel(operation, sourceKind) {
    const op = operation || sourceKind || 'raw';
    return ({
        raw: '원본 등록',
        external_uri: '외부 URI',
        collection_export: '수집 데이터 저장',
        nifi_output: 'NiFi 출력',
        csv_preprocess: '전처리',
        image_standardize: '이미지 표준화',
        label_studio_project_manifest: 'LS 작업 생성',
        label_studio_export: '라벨링 완료',
    })[op] || op;
}

function _versionLineage(ver) {
    const meta = ver.metadata || {};
    const lineage = meta.lineage || {};
    const parents = Array.isArray(lineage.parent_versions) ? lineage.parent_versions : [];
    const operation = _lineageOperationLabel(lineage.operation, lineage.source_kind || ver.source_kind);
    if (!parents.length) return operation;
    return `${parents.map(v => `v${v}`).join(', ')} → ${operation}`;
}

function _versionLineageTitle(ver) {
    const meta = ver.metadata || {};
    const lineage = meta.lineage || {};
    const parts = [`lineage: ${_versionLineage(ver)}`];
    if (lineage.source_uri || meta.original_source_uri) parts.push(`source_uri: ${lineage.source_uri || meta.original_source_uri}`);
    if (lineage.source_file || meta.original_file_name) parts.push(`source_file: ${lineage.source_file || meta.original_file_name}`);
    if (meta.raw_export_file) parts.push(`raw_export: ${meta.raw_export_file}`);
    if (meta.manifest_path) parts.push(`manifest: ${meta.manifest_path}`);
    return parts.join('\n');
}

function _findVersion(version) {
    const ds = _datasetsState.detail;
    return (ds?.versions || []).find(ver => String(ver.version) === String(version));
}

function _downloadVersion(version) {
    const ds = _datasetsState.detail;
    const ver = _findVersion(version);
    if (!ds || !ver) throw new Error('다운로드할 데이터셋 버전을 찾을 수 없습니다.');
    if (!ver.download_token) throw new Error('다운로드 토큰이 없습니다. 새로고침 후 다시 시도하세요.');
    const path = `/api/datasets/${encodeURIComponent(ds.id)}/versions/${encodeURIComponent(ver.version)}/download?token=${encodeURIComponent(ver.download_token)}`;
    const a = document.createElement('a');
    a.href = API._withNs(path);
    a.download = ver.file_name || `${ds.safe_name || ds.name || 'dataset'}-${ver.version_label || `v${ver.version}`}`;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
}

function _datasetCard(ds) {
    const latest = _latest(ds);
    const selected = _datasetsState.selectedId === ds.id ? 'selected' : '';
    const readyClass = _versionReadyClass(latest, ds);
    const readyLabel = _versionReadyLabel(latest, ds);
    return `
        <button class="ds-card ${selected}" data-dataset-id="${esc(ds.id)}" type="button">
            <span class="ds-card-main">
                <span class="ds-card-top">
                    <b>${esc(ds.name)}</b>
                    <span class="ds-ready ${readyClass}">${esc(readyLabel)}</span>
                </span>
                <span class="ds-card-meta">${esc(_datasetMetaText(ds))}</span>
                <span class="ds-card-sub">최신 ${latest ? esc(latest.version_label) : '-'} · ${esc(_versionSizeLabel(latest))}</span>
            </span>
        </button>`;
}

function _versionRow(ver, index, allVersions = []) {
    const ds = _datasetsState.detail || {};
    const selected = String(_datasetsState.selectedVersion || '') === String(ver.version) ? 'selected' : '';
    const canPrep = ver.data_type === 'csv';
    const canImage = ver.data_type === 'image';
    const readyClass = _versionReadyClass(ver, ds);
    const trainingReady = _isTrainingReady(ver, ds);
    const preprocessLabel = canImage ? '이미지 표준화' : '전처리';
    const preprocessClass = canImage ? 'ds-image-standard' : 'ds-prep';
    const moreDirection = index >= Math.max(0, allVersions.length - 2) ? 'drop-up' : 'drop-down';
    return `
        <tr class="ds-version-row ${selected}" data-version="${esc(ver.version)}">
            <td>
                <button class="ds-version-pick ds-select-version" data-version="${esc(ver.version)}" type="button">${esc(ver.version_label)}</button>
                ${selected ? '<span class="ds-latest-tag">선택</span>' : ''}
            </td>
            <td>${esc(_kindLabel(ver.source_kind))}</td>
            <td>${esc(_versionSizeLabel(ver))}</td>
            <td><span class="ds-status-pill ${readyClass}">${esc(_versionReadyLabel(ver, ds))}</span></td>
            <td>${trainingReady ? '<span class="ds-use-ok">사용 가능</span>' : '<span class="ds-muted">-</span>'}</td>
            <td>${esc(_fmtDate(ver.created_at))}</td>
            <td>
                <div class="ds-row-actions">
                    <button class="pm-btn pm-btn-sm ds-version-detail-btn" data-version="${esc(ver.version)}" type="button">상세</button>
                    ${trainingReady ? `<button class="pm-btn pm-btn-sm pm-btn-primary ds-pipeline" data-version="${esc(ver.version)}" type="button">학습에 사용하기</button>` : `<button class="pm-btn pm-btn-sm pm-btn-primary ds-pipeline" data-version="${esc(ver.version)}" type="button" disabled title="학습 유형과 Target 설정 후 준비 완료된 버전만 사용할 수 있습니다">학습에 사용하기</button>`}
                    <details class="ds-more-menu ${moreDirection}">
                        <summary>더보기</summary>
                        <div class="ds-more-list">
                            ${(canPrep || canImage) ? `<button class="${preprocessClass}" data-version="${esc(ver.version)}" type="button">${preprocessLabel}</button>` : ''}
                            <button class="ds-ls-project" data-version="${esc(ver.version)}" type="button">라벨링 작업 생성</button>
                            <button class="ds-labelstudio" data-version="${esc(ver.version)}" type="button">라벨링 결과 등록</button>
                            <button class="ds-download" data-version="${esc(ver.version)}" type="button">다운로드</button>
                            <button class="ds-publish" data-version="${esc(ver.version)}" type="button">준비 완료</button>
                            <button class="ds-delete-version danger" data-version="${esc(ver.version)}" type="button">해당 버전 삭제</button>
                        </div>
                    </details>
                </div>
            </td>
        </tr>`;
}

function _pipelineRunHistoryContent(runs) {
    const rows = runs || [];
    return `
        <div class="ds-section-head compact">
            <div>
                <h3>학습 실행 이력</h3>
                <p>데이터셋 버전으로 생성한 Kubeflow Pipeline 실행 상태입니다.</p>
            </div>
            <button class="pm-btn pm-btn-sm" id="ds-refresh-runs" type="button">상태 갱신</button>
        </div>
        ${rows.length ? `
            <div class="ds-table-wrap">
            <table class="ds-table ds-run-table">
                <thead><tr><th>상태</th><th>실행 이름</th><th>생성일</th><th>보기</th></tr></thead>
                <tbody>${rows.map(run => `
                    <tr>
                        <td><span class="ds-run-state ${esc(_runStateClass(run.state))}">${esc(_runStateLabel(run.state))}</span></td>
                        <td>
                            <b>${esc(run.run_name || run.run_id)}</b>
                            <div class="ds-muted">v${esc(run.dataset_version)} · ${esc(run.pipeline_name || '-')}</div>
                        </td>
                        <td>${esc(_fmtDate(run.created_at))}</td>
                        <td><button class="pm-btn pm-btn-sm ds-open-run" data-run-id="${esc(run.run_id)}" data-namespace="${esc(run.namespace || '')}" type="button">상세 보기</button></td>
                    </tr>`).join('')}</tbody>
            </table>
            </div>` : '<div class="ds-empty compact">아직 학습 실행 이력이 없습니다.</div>'}
    `;
}



function _closeDatasetMoreMenus(except = null) {
    document.querySelectorAll('.ds-more-menu[open]').forEach(menu => {
        if (menu !== except) {
            menu.open = false;
            const list = menu.querySelector('.ds-more-list');
            if (list) {
                list.style.left = '';
                list.style.top = '';
            }
        }
    });
}

function _positionDatasetMoreMenu(menu) {
    if (!menu) return;
    const summary = menu.querySelector('summary');
    const list = menu.querySelector('.ds-more-list');
    if (!summary || !list) return;
    const summaryRect = summary.getBoundingClientRect();
    const width = Math.max(170, list.offsetWidth || 170);
    const height = Math.max(1, list.offsetHeight || 190);
    const gap = 6;
    const margin = 8;
    const spaceBelow = window.innerHeight - summaryRect.bottom;
    const spaceAbove = summaryRect.top;
    const openUp = spaceBelow < height + gap + margin && spaceAbove > spaceBelow;
    const top = openUp
        ? Math.max(margin, summaryRect.top - height - gap)
        : Math.min(summaryRect.bottom + gap, window.innerHeight - height - margin);
    const left = Math.max(margin, Math.min(summaryRect.right - width, window.innerWidth - width - margin));
    list.style.left = `${left}px`;
    list.style.top = `${top}px`;
}

function _toggleDatasetMoreMenu(menu) {
    if (!menu) return;
    if (menu.open) {
        menu.open = false;
        return;
    }
    _closeDatasetMoreMenus(menu);
    menu.open = true;
    requestAnimationFrame(() => _positionDatasetMoreMenu(menu));
}

function _syncDatasetPanelHeight() {
    const panel = document.querySelector('.ds-panel');
    const versionCard = document.querySelector('.ds-main-card');
    if (!panel || !versionCard) return;
    if (window.matchMedia('(max-width: 1180px)').matches) {
        panel.style.height = '';
        return;
    }
    requestAnimationFrame(() => {
        const panelTop = panel.getBoundingClientRect().top;
        const historyCard = document.getElementById('ds-run-history');
        const targetBottom = (historyCard || versionCard).getBoundingClientRect().bottom;
        const height = Math.max(420, Math.ceil(targetBottom - panelTop));
        panel.style.height = `${height}px`;
    });
}

function _renderRunHistory() {
    const container = document.getElementById('ds-run-history');
    if (!container) return;
    container.innerHTML = _pipelineRunHistoryContent(_datasetsState.detail?.pipeline_runs || []);
}

function _renderList() {
    const list = document.getElementById('ds-list');
    if (!list) return;
    const q = (_datasetsState.search || '').trim().toLowerCase();
    const rows = q ? _datasetsState.datasets.filter(ds => [ds.name, ds.description, ds.target_column, ds.data_type, ds.task].some(value => String(value || '').toLowerCase().includes(q))) : _datasetsState.datasets;
    const count = document.getElementById('ds-list-count');
    if (count) count.textContent = `총 ${rows.length}개 데이터셋`;
    if (!rows.length) {
        list.innerHTML = '<div class="ds-empty">조건에 맞는 데이터셋이 없습니다.</div>';
        return;
    }
    list.innerHTML = rows.map(_datasetCard).join('');
}

function _renderDetail() {
    const panel = document.getElementById('ds-detail');
    const ds = _datasetsState.detail;
    if (!panel) return;
    if (!ds) {
        panel.innerHTML = '<div class="ds-empty ds-empty-tall">왼쪽에서 데이터셋을 선택하세요.</div>';
        return;
    }
    const versions = ds.versions || [];
    const selected = _selectedVersion(ds);
    const selectedVersionLabel = selected?.version_label || '-';
    panel.innerHTML = `
        <section class="ds-main-card">
            <div class="ds-section-head">
                <div>
                    <h3>데이터 버전</h3>
                    <p>버전별 처리 상태를 확인하고 작업을 실행합니다.</p>
                </div>
                <div class="ds-version-head-actions">
                    <button class="pm-btn pm-btn-sm pm-btn-primary ds-add-version-toggle" id="ds-toggle-version-form" type="button"><span class="ds-add-plus">+</span><span>새 데이터 추가</span></button>
                    <button class="pm-btn pm-btn-sm pm-btn-danger ds-delete" type="button">데이터셋 삭제</button>
                </div>
            </div>
            <div class="ds-version-form-inline" id="ds-version-form" hidden>
                <div class="ds-version-form-title">새 데이터 추가</div>
                <div class="ds-version-form-grid">
                    <label>종류
                        <select id="ds-source-kind" class="pm-input">
                            <option value="raw">원본 데이터</option>
                            <option value="labeling_export">라벨링 완료 데이터</option>
                            <option value="nifi_output">NiFi 출력</option>
                            <option value="external_uri">외부 URI</option>
                        </select>
                    </label>
                    <div class="ds-form-field">
                        <span class="ds-form-label">파일 업로드</span>
                        <span class="ds-file-picker">
                            <input id="ds-file" type="file" accept=".csv,.json,.jsonl,.parquet,.jpg,.jpeg,.png,.zip" />
                            <button class="ds-file-button" type="button">파일 선택</button>
                            <span class="ds-file-name" id="ds-file-name">선택된 파일 없음</span>
                        </span>
                    </div>
                    <label>또는 source URI/path
                        <input id="ds-source-uri" class="pm-input pm-input-mono" placeholder="https://... 또는 /path/to/data.parquet" />
                    </label>
                    <div class="ds-version-form-actions">
                        <button class="pm-btn pm-btn-sm" id="ds-cancel-version" type="button">취소</button>
                        <button class="pm-btn pm-btn-sm pm-btn-primary" id="ds-add-version" type="button">버전 등록</button>
                    </div>
                </div>
            </div>
            ${versions.length ? `
                <div class="ds-table-wrap">
                <table class="ds-table ds-version-table">
                    <colgroup>
                        <col class="ds-col-version" />
                        <col class="ds-col-kind" />
                        <col class="ds-col-size" />
                        <col class="ds-col-status" />
                        <col class="ds-col-ready" />
                        <col class="ds-col-created" />
                        <col class="ds-col-actions" />
                    </colgroup>
                    <thead><tr><th>버전</th><th>데이터 종류</th><th>데이터 규모</th><th>처리 상태</th><th>학습 사용</th><th>생성일</th><th>작업</th></tr></thead>
                    <tbody>${versions.map((ver, index) => _versionRow(ver, index, versions)).join('')}</tbody>
                </table>
                </div>
                ${selected ? `
                    <div class="ds-version-summary">
                        <div class="ds-version-summary-head">
                            <div>
                                <strong>선택한 버전: ${esc(selectedVersionLabel)}</strong>
                                <span>${esc(_kindLabel(selected.source_kind))} · ${esc(_versionReadyLabel(selected, ds))}</span>
                            </div>
                            <span class="ds-status-pill ${esc(_versionReadyClass(selected, ds))}">${esc(_versionReadyLabel(selected, ds))}</span>
                        </div>
                        <div class="ds-summary-grid">
                            <div><span>파일명</span><b title="${esc(selected.file_name || selected.source_uri || '-')}">${esc(selected.file_name || selected.source_uri || '-')}</b></div>
                            <div><span>Rows</span><b>${esc(selected.row_count ?? '-')}</b></div>
                            <div><span>Size</span><b>${esc(_fmtBytes(selected.size_bytes))}</b></div>
                            <div><span>Target</span><b>${esc((selected.metadata || {}).target_column || ds.target_column || '-')}</b></div>
                            <div><span>생성일</span><b>${esc(_fmtDate(selected.created_at))}</b></div>
                            <div><span>Lineage</span><b title="${esc(_versionLineageTitle(selected))}">${esc(_versionLineage(selected))}</b></div>
                        </div>
                    </div>` : ''}
            ` : '<div class="ds-empty compact">아직 등록된 데이터 버전이 없습니다.</div>'}
        </section>

        <div id="ds-work-panel"></div>

        <section class="ds-main-card" id="ds-run-history">${_pipelineRunHistoryContent(ds.pipeline_runs || [])}</section>
    `;
}

function _renderVersionDetail(version, profile = null, profileError = '') {
    const panel = document.getElementById('ds-work-panel');
    const ds = _datasetsState.detail || {};
    const ver = _findVersion(version);
    if (!panel || !ver) return;
    const meta = ver.metadata || {};
    const preprocess = meta.preprocess || {};
    const columns = profile?.columns || [];
    const target = meta.target_column || ds.target_column || '-';
    const task = meta.task || ds.task || 'unknown';
    const sourceLocation = ver.source_uri || ver.file_path || '-';
    const processingItems = [
        ['입력 행', preprocess.input_row_count],
        ['출력 행', preprocess.output_row_count ?? preprocess.row_count],
        ['중복 제거', preprocess.duplicate_rows_removed],
        ['이상치 제거', preprocess.outlier_rows_removed],
    ].filter(([, value]) => value !== undefined && value !== null);
    panel.innerHTML = `
        <section class="ds-section ds-work ds-version-detail-panel">
            <div class="ds-version-detail-head">
                <div>
                    <div class="ds-section-title">${esc(ver.version_label)} 버전 상세</div>
                    <div class="ds-muted">파일 정보, 학습 설정과 데이터 구조를 확인합니다.</div>
                </div>
                <button class="pm-btn pm-btn-sm ds-close-version-detail" type="button">닫기</button>
            </div>
            <div class="ds-version-detail-grid">
                <div><span>데이터 종류</span><b>${esc(_kindLabel(ver.source_kind))}</b></div>
                <div><span>파일 형식</span><b>${esc(_typeLabel(ver.data_type))}</b></div>
                <div><span>파일명</span><b title="${esc(ver.file_name || '-')}">${esc(ver.file_name || '-')}</b></div>
                <div><span>데이터 규모</span><b>${esc(_versionSizeLabel(ver))}</b></div>
                <div><span>파일 크기</span><b>${esc(_fmtBytes(ver.size_bytes))}</b></div>
                <div><span>처리 상태</span><b>${esc(_versionReadyLabel(ver, ds))}</b></div>
                <div><span>생성일</span><b>${esc(_fmtDate(ver.created_at))}</b></div>
                <div><span>생성자</span><b title="${esc(ver.created_by || '-')}">${esc(ver.created_by || '-')}</b></div>
            </div>
            <div class="ds-version-detail-section">
                <div class="ds-version-detail-title">학습 설정</div>
                <div class="ds-version-detail-lines">
                    <span><small>학습 유형</small><b>${esc(_taskLabel(task))}</b></span>
                    <span><small>Target 컬럼</small><b>${esc(target)}</b></span>
                    <span><small>학습 사용</small><b>${_isTrainingReady(ver, ds) ? '사용 가능' : '준비 필요'}</b></span>
                    <span><small>처리 이력</small><b title="${esc(_versionLineageTitle(ver))}">${esc(_versionLineage(ver))}</b></span>
                </div>
            </div>
            ${processingItems.length ? `
                <div class="ds-version-detail-section">
                    <div class="ds-version-detail-title">전처리 결과</div>
                    <div class="ds-version-detail-lines">
                        ${processingItems.map(([label, value]) => `<span><small>${esc(label)}</small><b>${esc(Number(value).toLocaleString())}건</b></span>`).join('')}
                    </div>
                </div>` : ''}
            <div class="ds-version-detail-section">
                <div class="ds-version-detail-title">데이터 컬럼</div>
                ${profile === null && !profileError
                    ? '<div class="ds-version-detail-loading">CSV 구조를 분석하는 중입니다.</div>'
                    : profileError
                        ? `<div class="ds-version-detail-note">${esc(profileError)}</div>`
                        : `<div class="ds-version-columns">
                            ${columns.map(column => `
                                <span class="ds-version-column ${column.type === 'numeric' ? 'numeric' : ''}" title="결측 ${esc(column.missing_count || 0)}건 · 예시 ${esc((column.sample_values || []).join(', ') || '-')}">
                                    <b>${esc(column.name)}</b>
                                    <small>${column.type === 'numeric' ? '숫자' : '문자'} · 결측 ${esc(column.missing_count || 0)}</small>
                                </span>`).join('') || '<span class="ds-muted">확인된 컬럼이 없습니다.</span>'}
                        </div>`}
            </div>
            <details class="ds-version-storage">
                <summary>저장 위치 보기</summary>
                <code>${esc(sourceLocation)}</code>
            </details>
        </section>`;
}

async function _openVersionDetail(version) {
    const ds = _datasetsState.detail;
    if (!ds) return;
    _datasetsState.selectedVersion = version;
    _renderDetail();
    _renderVersionDetail(version);
    const panel = document.querySelector('.ds-version-detail-panel');
    requestAnimationFrame(() => panel?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
    const ver = _findVersion(version);
    if (ver?.data_type === 'csv') {
        try {
            const profile = await API.get(`/api/datasets/${encodeURIComponent(ds.id)}/versions/${encodeURIComponent(version)}/profile`);
            if (String(_datasetsState.selectedVersion) === String(version)) {
                _renderVersionDetail(version, profile);
            }
        } catch (error) {
            if (String(_datasetsState.selectedVersion) === String(version)) {
                _renderVersionDetail(version, {}, `컬럼 분석을 완료하지 못했습니다: ${error.message}`);
            }
        }
    } else {
        _renderVersionDetail(version, {});
    }
    _syncDatasetPanelHeight();
}

function _renderPreprocessForm(version, profile = {}) {
    const panel = document.getElementById('ds-work-panel');
    if (!panel) return;
    const ds = _datasetsState.detail || {};
    const columns = profile.columns || [];
    const targetColumn = profile.target_column || ds.target_column || '';
    const task = profile.task || ds.task || 'unknown';
    const canBeReady = ['regression', 'classification'].includes(task) && Boolean(targetColumn);
    const columnOptions = columns.map(column => `
        <option value="${esc(column.name)}" ${column.name === targetColumn ? 'selected' : ''}>
            ${esc(column.name)} · ${column.type === 'numeric' ? '숫자' : '문자'} · 결측 ${esc(column.missing_count || 0)}
        </option>`).join('');
    const profileColumns = columns.slice(0, 12).map(column => `
        <span class="ds-column-chip ${column.type === 'numeric' ? 'numeric' : ''}" title="결측 ${esc(column.missing_count || 0)}건">
            ${esc(column.name)}
        </span>`).join('');
    panel.innerHTML = `
        <div class="ds-section ds-work">
            <div class="ds-section-title">v${esc(version)} 데이터 분석 및 전처리</div>
            <div class="ds-profile-summary">
                <span><small>분석 파일</small><b>${esc(profile.file_name || '-')}</b></span>
                <span><small>행</small><b>${esc(profile.row_count || 0)}건</b></span>
                <span><small>컬럼</small><b>${esc(profile.column_count || 0)}개</b></span>
                <span><small>중복 행</small><b>${esc(profile.duplicate_count || 0)}건</b></span>
            </div>
            <div class="ds-profile-columns">
                <b>확인된 컬럼</b>
                <div>${profileColumns || '<span class="ds-muted">컬럼 정보가 없습니다.</span>'}</div>
                ${columns.length > 12 ? `<small>외 ${esc(columns.length - 12)}개 컬럼</small>` : ''}
            </div>
            <div class="ds-merge-guide">
                현재 버전만 전처리하려면 그대로 두고, 여러 버전을 합치려면 숫자만 쉼표로 입력하세요. 예: <strong>2,3</strong> = v2와 v3 병합
            </div>
            <div class="ds-preprocess-fields">
                <label>학습 유형
                    <select id="ds-pre-task" class="pm-input">
                        <option value="unknown" ${task === 'unknown' ? 'selected' : ''}>미지정</option>
                        <option value="regression" ${task === 'regression' ? 'selected' : ''}>회귀</option>
                        <option value="classification" ${task === 'classification' ? 'selected' : ''}>분류</option>
                    </select>
                    <span class="ds-field-help">예측값이 숫자면 회귀, 범주/상태면 분류를 선택합니다.</span>
                </label>
                <label>Target 컬럼
                    <select id="ds-pre-target" class="pm-input">
                        <option value="">선택하지 않음</option>
                        ${columnOptions}
                    </select>
                    <span class="ds-field-help">학습에서 예측할 정답 컬럼을 선택합니다.</span>
                </label>
                <label>합칠 버전 번호
                    <input id="ds-pre-source" class="pm-input" value="${esc(version)}" placeholder="예: 2,3" />
                    <span class="ds-field-help">v는 빼고 숫자만 입력합니다. 하나만 입력하면 해당 버전만 전처리합니다.</span>
                </label>
                <label>샘플링 row 수
                    <input id="ds-pre-sample" class="pm-input" type="number" min="1" placeholder="비우면 전체" />
                    <span class="ds-field-help">비우면 합친 데이터 전체를 사용합니다.</span>
                </label>
                <label>출력 파일명
                    <input id="ds-pre-output" class="pm-input" value="preprocessed.csv" />
                    <span class="ds-field-help">새 버전에 저장될 CSV 파일명입니다.</span>
                </label>
            </div>
            <div class="ds-preprocess-bottom">
                <div class="ds-preprocess-options">
                    <label class="ds-check"><input id="ds-pre-clean" type="checkbox" checked /> 컬럼명 정리</label>
                    <label class="ds-check"><input id="ds-pre-fill" type="checkbox" checked /> 결측값 기본 처리</label>
                    <label class="ds-check"><input id="ds-pre-deduplicate" type="checkbox" checked /> 중복 행 제거</label>
                    <label class="ds-check"><input id="ds-pre-normalize" type="checkbox" /> 숫자 컬럼 min-max 정규화</label>
                    <label class="ds-check"><input id="ds-pre-outliers" type="checkbox" /> IQR 기준 이상치 행 제거</label>
                    ${profile.payload_json_detected ? '<label class="ds-check"><input id="ds-pre-expand-payload" type="checkbox" checked /> payload_json 센서 항목 펼치기</label>' : ''}
                    <label class="ds-check ds-ready-check"><input id="ds-pre-ready" type="checkbox" ${canBeReady ? 'checked' : ''} /> 전처리 후 학습 준비 완료</label>
                    <div class="ds-inline-help">학습 준비 완료에는 회귀/분류 유형과 Target 컬럼이 모두 필요합니다.</div>
                </div>
                <button class="pm-btn pm-btn-primary" id="ds-run-preprocess" data-version="${esc(version)}">전처리 실행</button>
            </div>
        </div>`;
}


async function _openPreprocessForm(version) {
    const panel = document.getElementById('ds-work-panel');
    const ds = _datasetsState.detail;
    if (!panel || !ds) return;
    panel.innerHTML = '<div class="ds-section ds-work"><div class="ds-empty compact">CSV 구조와 결측값을 분석하는 중입니다.</div></div>';
    const profile = await API.get(`/api/datasets/${encodeURIComponent(ds.id)}/versions/${encodeURIComponent(version)}/profile`);
    _renderPreprocessForm(version, profile);
}

function _renderImageStandardizeForm(version) {
    const panel = document.getElementById('ds-work-panel');
    if (!panel) return;
    panel.innerHTML = `
        <div class="ds-section ds-work">
            <div class="ds-section-title">${esc(version)} 이미지 표준화</div>
            <div class="ds-preprocess-grid">
                <label>출력 형식
                    <select id="ds-img-format" class="pm-input"><option value="jpeg">JPEG</option><option value="png">PNG</option></select>
                </label>
                <label>최대 width
                    <input id="ds-img-width" class="pm-input" type="number" min="1" placeholder="원본 유지" />
                </label>
                <label>최대 height
                    <input id="ds-img-height" class="pm-input" type="number" min="1" placeholder="원본 유지" />
                </label>
                <label>JPEG 품질
                    <input id="ds-img-quality" class="pm-input" type="number" min="1" max="100" value="95" />
                </label>
                <label>배경색
                    <input id="ds-img-bg" class="pm-input" value="#ffffff" />
                </label>
                <label>출력 ZIP
                    <input id="ds-img-output" class="pm-input" value="standardized-images.zip" />
                </label>
                <label class="ds-check"><input id="ds-img-aspect" type="checkbox" checked /> 비율 유지</label>
                <label class="ds-check"><input id="ds-img-ready" type="checkbox" checked /> 학습 파이프라인에 바로 사용</label>
                <button class="pm-btn pm-btn-primary" id="ds-run-image-standard" data-version="${esc(version)}">표준화 실행</button>
            </div>
        </div>`;
}

function _renderLabelStudioForm(version) {
    const panel = document.getElementById('ds-work-panel');
    if (!panel) return;
    panel.innerHTML = `
        <div class="ds-section ds-work">
            <div class="ds-section-title">${esc(version)} Label Studio export 등록</div>
            <div class="ds-label-grid">
                <label class="ds-label-field">Export JSON/JSONL
                    <input id="ds-ls-file" class="pm-input" type="file" accept=".json,.jsonl" />
                </label>
                <label class="ds-label-field">출력 CSV
                    <input id="ds-ls-output" class="pm-input" value="label-studio-export.csv" />
                </label>
                <label class="ds-label-field ds-toggle-field">파이프라인 사용
                    <span class="ds-toggle-row">
                        <span class="ds-switch"><input id="ds-ls-ready" type="checkbox" checked /><span></span></span>
                        <span>사용</span>
                    </span>
                </label>
                <div class="ds-label-action">
                    <button class="pm-btn pm-btn-primary" id="ds-upload-ls" data-version="${esc(version)}">라벨링 결과 등록</button>
                </div>
            </div>
        </div>`;
}

function _openPipelineRun(runId, namespace) {
    if (!runId) return;
    const datasetId = _datasetsState.detail?.id || '';
    const kubeflowHash = `#/runs/details/${encodeURIComponent(runId)}`;
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({
            type: 'prediction-manager-open-service',
            path: '/pipeline',
            namespace: namespace || '',
            runId,
            datasetId,
            kubeflowHash,
        }, window.location.origin);
        return;
    }
    const url = new URL('/prediction-manager/', window.location.origin);
    const current = new URLSearchParams(window.location.search);
    if (current.get('standalone') === '1') url.searchParams.set('standalone', '1');
    if (namespace) url.searchParams.set('ns', namespace);
    if (runId) url.searchParams.set('runId', runId);
    if (datasetId) url.searchParams.set('datasetId', datasetId);
    url.hash = '#/pipeline';
    window.location.href = `${url.pathname}${url.search}${url.hash}`;
}

function _renderPipelinePanel(data) {
    _datasetsState.pipeline = data;
    const panel = document.getElementById('ds-work-panel');
    if (!panel) return;
    const params = data.params || {};
    const dataset = data.dataset || {};
    const run = data.run || null;
    const experiment = data.experiment || null;
    const uploadedPipeline = data.uploaded_pipeline || null;
    const version = dataset.version || '';
    const defaultRunName = `pm-${dataset.name || 'dataset'}-v${version}`.replace(/[^a-zA-Z0-9-]/g, '-').slice(0, 80);
    const defaultExperimentName = experiment?.name || `pm-datasets-${params.namespace || ''}`.replace(/-$/, '');
    const defaultServiceAccount = run?.service_account || 'default-editor';
    panel.innerHTML = `
        <div class="ds-section ds-work">
            <div class="ds-section-title">파이프라인 입력 패키지</div>
            <div class="ds-pipeline-grid">
                ${Object.entries(params).map(([k, v]) => `
                    <div class="ds-param"><div>${esc(k)}</div><code>${esc(v)}</code></div>
                `).join('')}
            </div>
            <div class="ds-help">수동 실행이 필요하면 아래 값을 복사해서 Kubeflow Pipelines UI에 붙여넣을 수 있습니다.</div>
            <textarea id="ds-copy-text" class="pm-input pm-input-mono" rows="8" readonly>${esc(data.copy_text || '')}</textarea>
            <div class="ds-run-grid">
                <label>Run 이름
                    <input id="ds-run-name" class="pm-input" value="${esc(run?.name || defaultRunName)}" />
                </label>
                <label>Experiment
                    <input id="ds-experiment-name" class="pm-input" value="${esc(defaultExperimentName)}" placeholder="비우면 namespace 기준 자동 생성" />
                </label>
                <label>ServiceAccount
                    <input id="ds-service-account" class="pm-input" value="${esc(defaultServiceAccount)}" placeholder="기본값 default-editor" />
                </label>
                <button class="pm-btn pm-btn-primary" id="ds-run-pipeline" data-version="${esc(version)}">Pipeline 실행</button>
                <button class="pm-btn" id="ds-copy-pipeline">입력값 복사</button>
            </div>
            ${run ? `
                <div class="ds-run-result">
                    <div><b>Run 생성 완료</b><span>${esc(run.state || 'created')}</span></div>
                    <code>${esc(run.id || '-')}</code>
                    ${uploadedPipeline ? `<span class="ds-pill ok">Pipeline 등록됨</span>` : ''}
                    ${run.id ? `<button type="button" class="pm-btn pm-btn-sm" id="ds-open-pipeline-run" data-run-id="${esc(run.id)}" data-namespace="${esc(params.namespace || '')}">파이프라인 관리에서 보기</button>` : ''}
                </div>
                ${uploadedPipeline ? `<div class="ds-help">등록 Pipeline: ${esc(uploadedPipeline.name || '-')} / version ${esc(uploadedPipeline.version_name || uploadedPipeline.version_id || '-')}</div>` : ''}
            ` : ''}
        </div>`;
}

async function _refreshDatasets() {
    const buttons = [...document.querySelectorAll('.ds-refresh')];
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.dataset.originalText = btn.dataset.originalText || btn.textContent;
        btn.textContent = '새로고침 중';
    });
    try {
        await _loadDatasets(true);
    } finally {
        document.querySelectorAll('.ds-refresh').forEach(btn => {
            btn.disabled = false;
            btn.textContent = btn.dataset.originalText || '새로고침';
        });
    }
}

async function _loadDatasets(keepSelected = true) {
    const data = await API.get('/api/datasets');
    _datasetsState.datasets = data.datasets || [];
    if (!keepSelected || !_datasetsState.selectedId || !_datasetsState.datasets.some(d => d.id === _datasetsState.selectedId)) {
        _datasetsState.selectedId = _datasetsState.datasets[0]?.id || null;
    }
    _renderList();
    if (_datasetsState.selectedId) {
        _datasetsState.detail = await API.get(`/api/datasets/${encodeURIComponent(_datasetsState.selectedId)}`);
        const versions = _datasetsState.detail?.versions || [];
        if (!_datasetsState.selectedVersion || !versions.some(ver => String(ver.version) === String(_datasetsState.selectedVersion))) {
            _datasetsState.selectedVersion = versions[0]?.version || null;
        }
    } else {
        _datasetsState.detail = null;
        _datasetsState.selectedVersion = null;
    }
    _renderDetail();
    _syncDatasetPanelHeight();
    _refreshPipelineRunStatuses(false).catch(() => {});
}

async function _createDataset() {
    const payload = {
        name: document.getElementById('ds-name').value.trim(),
        description: document.getElementById('ds-desc').value.trim(),
        data_type: document.getElementById('ds-type').value,
        task: document.getElementById('ds-task').value,
        target_column: document.getElementById('ds-target').value.trim(),
    };
    if (!payload.name) throw new Error('데이터셋 이름을 입력하세요');
    const created = await API.post('/api/datasets', payload);
    _datasetsState.selectedId = created.id;
    _datasetsState.selectedVersion = null;
    await _loadDatasets(true);
}

async function _addVersion() {
    const ds = _datasetsState.detail;
    if (!ds) return;
    const kind = document.getElementById('ds-source-kind').value;
    const file = document.getElementById('ds-file').files[0];
    const sourceUri = document.getElementById('ds-source-uri').value.trim();
    const ready = false;
    if (file) {
        const resp = await fetch(API._withNs(`/api/datasets/${encodeURIComponent(ds.id)}/versions`), {
            method: 'POST',
            headers: API._headers({
                'Content-Type': 'application/octet-stream',
                'x-dataset-filename': encodeURIComponent(file.name),
                'x-dataset-source-kind': kind,
                'x-pipeline-ready': ready ? 'true' : 'false',
            }),
            body: await file.arrayBuffer(),
        });
        await API._json(resp);
    } else if (sourceUri) {
        await API.post(`/api/datasets/${encodeURIComponent(ds.id)}/versions`, {
            source_uri: sourceUri,
            source_kind: kind === 'raw' ? 'external_uri' : kind,
            file_name: sourceUri.split('/').pop() || 'external-dataset',
            pipeline_ready: ready,
        });
    } else {
        throw new Error('파일 또는 source URI/path를 입력하세요');
    }
    await _loadDatasets(true);
}

async function _runPreprocess(version) {
    const ds = _datasetsState.detail;
    const sourceVersions = _parseVersionNumbers(document.getElementById('ds-pre-source').value, version);
    const sampleRows = _parseSampleRows(document.getElementById('ds-pre-sample').value);
    const task = document.getElementById('ds-pre-task').value;
    const targetColumn = document.getElementById('ds-pre-target').value;
    const pipelineReady = document.getElementById('ds-pre-ready').checked;
    if (pipelineReady && !['regression', 'classification'].includes(task)) {
        throw new Error('학습 준비 완료를 사용하려면 학습 유형을 회귀 또는 분류로 선택하세요.');
    }
    if (pipelineReady && !targetColumn) {
        throw new Error('학습 준비 완료를 사용하려면 Target 컬럼을 선택하세요.');
    }
    const result = await API.post(`/api/datasets/${encodeURIComponent(ds.id)}/versions/${encodeURIComponent(version)}/preprocess`, {
        source_versions: sourceVersions,
        task,
        target_column: targetColumn,
        clean_columns: document.getElementById('ds-pre-clean').checked,
        fill_missing: document.getElementById('ds-pre-fill').checked,
        expand_payload_json: document.getElementById('ds-pre-expand-payload')?.checked !== false,
        drop_duplicates: document.getElementById('ds-pre-deduplicate').checked,
        normalize_numeric: document.getElementById('ds-pre-normalize').checked,
        remove_outliers: document.getElementById('ds-pre-outliers').checked,
        sample_rows: sampleRows,
        output_name: document.getElementById('ds-pre-output').value.trim() || 'preprocessed.csv',
        pipeline_ready: pipelineReady,
    });
    _datasetsState.selectedVersion = result.version;
    await _loadDatasets(true);
}

async function _runImageStandardize(version) {
    const ds = _datasetsState.detail;
    const width = document.getElementById('ds-img-width').value.trim();
    const height = document.getElementById('ds-img-height').value.trim();
    await API.post(`/api/datasets/${encodeURIComponent(ds.id)}/versions/${encodeURIComponent(version)}/standardize-images`, {
        target_format: document.getElementById('ds-img-format').value,
        max_width: width ? Number(width) : null,
        max_height: height ? Number(height) : null,
        keep_aspect_ratio: document.getElementById('ds-img-aspect').checked,
        background_color: document.getElementById('ds-img-bg').value.trim() || '#ffffff',
        quality: Number(document.getElementById('ds-img-quality').value || 95),
        output_name: document.getElementById('ds-img-output').value.trim() || 'standardized-images.zip',
        pipeline_ready: document.getElementById('ds-img-ready').checked,
    });
    await _loadDatasets(true);
}


async function _createLabelStudioProject(version) {
    const ds = _datasetsState.detail;
    const projectName = prompt('Label Studio 작업 이름', `${ds.name} v${version} labeling`);
    if (projectName === null) return;
    const result = await API.post(`/api/datasets/${encodeURIComponent(ds.id)}/versions/${encodeURIComponent(version)}/label-studio-project`, {
        project_name: projectName.trim(),
        data_key: 'image',
        file_path_column: 'file_path',
        task_limit: 500,
        create_remote: true,
        output_name: 'label-studio-project.json',
        notes: 'Label Studio project manifest',
    });
    await _loadDatasets(true);
    const remote = result?.metadata?.label_studio_project?.remote || {};
    const versionLabel = result.version_label || '새 버전';
    if (remote.created) {
        alert(`Label Studio 프로젝트가 생성되었습니다.\n버전: ${versionLabel}\n프로젝트 ID: ${remote.project_id || '-'}\nURL: ${remote.url || '-'}`);
    } else if (remote.attempted) {
        alert(`Label Studio 작업 manifest는 ${versionLabel}으로 생성했지만, 원격 프로젝트 생성은 실패했습니다.\n사유: ${remote.reason || '알 수 없음'}\nLABEL_STUDIO_URL/API_TOKEN 또는 Kubeflow SSO 설정을 확인하세요.`);
    } else {
        alert(`Label Studio 작업 manifest를 ${versionLabel}으로 생성했습니다.`);
    }
}

async function _uploadLabelStudioExport(version) {
    const ds = _datasetsState.detail;
    const file = document.getElementById('ds-ls-file').files[0];
    if (!file) throw new Error('Label Studio export JSON/JSONL 파일을 선택하세요');
    const resp = await fetch(API._withNs(`/api/datasets/${encodeURIComponent(ds.id)}/versions/${encodeURIComponent(version)}/label-studio-export`), {
        method: 'POST',
        headers: API._headers({
            'Content-Type': 'application/octet-stream',
            'x-dataset-filename': encodeURIComponent(file.name),
            'x-output-name': encodeURIComponent(document.getElementById('ds-ls-output').value.trim() || 'label-studio-export.csv'),
            'x-pipeline-ready': document.getElementById('ds-ls-ready').checked ? 'true' : 'false',
        }),
        body: await file.arrayBuffer(),
    });
    await API._json(resp);
    await _loadDatasets(true);
}

async function _publishVersion(version) {
    const ds = _datasetsState.detail;
    await API.post(`/api/datasets/${encodeURIComponent(ds.id)}/versions/${encodeURIComponent(version)}/publish`, {});
    await _loadDatasets(true);
}

async function _deleteVersion(version) {
    const ds = _datasetsState.detail;
    const ver = _findVersion(version);
    if (!ds || !ver) throw new Error('삭제할 데이터셋 버전을 찾을 수 없습니다.');
    const ok = confirm(`${ds.name} ${ver.version_label || `v${version}`} 버전을 삭제할까요?\n해당 버전 파일과 관련 실행 이력도 함께 삭제됩니다.`);
    if (!ok) return;
    await API.del(`/api/datasets/${encodeURIComponent(ds.id)}/versions/${encodeURIComponent(version)}`);
    _datasetsState.selectedVersion = null;
    await _loadDatasets(true);
}

async function _deleteDataset() {
    const ds = _datasetsState.detail;
    if (!ds) return;
    const typed = prompt(`데이터셋 ${ds.name} 을 삭제하려면 이름을 입력하세요.`);
    if (typed === null) return;
    if (typed !== ds.name) {
        alert('이름이 일치하지 않아 삭제하지 않았습니다.');
        return;
    }
    await API.del(`/api/datasets/${encodeURIComponent(ds.id)}`);
    _datasetsState.selectedId = null;
    _datasetsState.selectedVersion = null;
    _datasetsState.detail = null;
    await _loadDatasets(false);
}

async function _buildPipelineInputs(version) {
    const ds = _datasetsState.detail;
    const data = await API.post(`/api/datasets/${encodeURIComponent(ds.id)}/versions/${encodeURIComponent(version)}/pipeline-inputs`, {
        registered_name: ds.safe_name || ds.name,
        target_column: ds.target_column || '',
        threshold: 0.9,
        max_attempts: 10,
    });
    _renderPipelinePanel(data);
}

async function _kfpJson(path, options = {}) {
    const resp = await fetch(`/pipeline${path}`, {
        credentials: 'same-origin',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });
    const text = await resp.text();
    let data = {};
    if (text) {
        try { data = JSON.parse(text); }
        catch { data = { message: text }; }
    }
    if (!resp.ok) {
        throw new Error(data.message || data.error || data.detail || resp.statusText || 'KFP 요청 실패');
    }
    return data;
}

function _safePipelineName(text) {
    return String(text || 'pipeline')
        .replace(/[^a-zA-Z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80) || 'pipeline';
}

async function _kfpForm(path, formData) {
    const resp = await fetch(`/pipeline${path}`, {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
    });
    const text = await resp.text();
    let data = {};
    if (text) {
        try { data = JSON.parse(text); }
        catch { data = { message: text }; }
    }
    if (!resp.ok) {
        let msg = data.message || data.error || data.error_message || data.detail || resp.statusText || 'KFP 업로드 실패';
        if (msg && typeof msg === 'object') msg = JSON.stringify(msg);
        throw new Error(msg);
    }
    return data;
}

function _pipelineYamlFile(name, yamlText) {
    return new File([yamlText], `${_safePipelineName(name)}.yaml`, { type: 'application/x-yaml' });
}

function _pipelineId(pipeline) {
    return pipeline?.pipeline_id || pipeline?.id || pipeline?.pipeline?.pipeline_id || '';
}

function _pipelineVersionId(version) {
    return version?.pipeline_version_id || version?.version_id || version?.id || version?.pipeline_version?.pipeline_version_id || '';
}

function _kfpRunId(run) {
    return run?.run_id || run?.id || run?.run?.run_id || '';
}

function _kfpRunState(run) {
    return run?.state || run?.run?.state || run?.runtime_state || '';
}

async function _uploadKfpPipeline(namespace, displayName, yamlText) {
    const formData = new FormData();
    formData.append('uploadfile', _pipelineYamlFile(displayName, yamlText));
    const query = new URLSearchParams({
        name: displayName,
        display_name: displayName,
        description: `Prediction Manager weekly retrain pipeline for ${namespace}`,
    });
    if (namespace) query.set('namespace', namespace);
    return _kfpForm(`/apis/v2beta1/pipelines/upload?${query.toString()}`, formData);
}

async function _uploadKfpPipelineVersion(pipelineId, versionName, namespace, yamlText) {
    const formData = new FormData();
    formData.append('uploadfile', _pipelineYamlFile(versionName, yamlText));
    const query = new URLSearchParams({
        name: versionName,
        pipelineid: pipelineId,
        display_name: versionName,
        description: `Dataset pipeline spec generated by Prediction Manager (${namespace})`,
    });
    return _kfpForm(`/apis/v2beta1/pipelines/upload_version?${query.toString()}`, formData);
}

async function _ensureKfpPipeline(namespace, displayName, yamlText) {
    const list = await _kfpJson(`/apis/v2beta1/pipelines?namespace=${encodeURIComponent(namespace)}&page_size=100`);
    let pipeline = (list.pipelines || []).find(p => p.display_name === displayName);
    let created = false;
    if (!pipeline) {
        pipeline = await _uploadKfpPipeline(namespace, displayName, yamlText);
        created = true;
    }

    const pipelineId = _pipelineId(pipeline);
    if (!pipelineId) throw new Error('KFP pipeline_id를 받지 못했습니다.');
    const versionName = `${displayName}-${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)}`;
    const version = await _uploadKfpPipelineVersion(pipelineId, versionName, namespace, yamlText);
    const versionId = _pipelineVersionId(version);
    if (!versionId) throw new Error('KFP pipeline_version_id를 받지 못했습니다.');
    return {
        id: pipelineId,
        version_id: versionId,
        name: pipeline.display_name || pipeline.name || displayName,
        version_name: version.display_name || version.name || versionName,
        created,
    };
}

async function _ensureKfpExperiment(namespace, displayName) {
    const list = await _kfpJson(`/apis/v2beta1/experiments?namespace=${encodeURIComponent(namespace)}&page_size=100`);
    const found = (list.experiments || []).find(exp => exp.display_name === displayName);
    if (found) return found;
    return _kfpJson('/apis/v2beta1/experiments', {
        method: 'POST',
        body: JSON.stringify({
            display_name: displayName,
            description: `Prediction Manager dataset pipeline runs for ${namespace}`,
            namespace,
        }),
    });
}

async function _runPipeline(version) {
    const data = _datasetsState.pipeline;
    const ds = _datasetsState.detail;
    const params = data?.params || {};
    const spec = data?.pipeline?.spec;
    const yamlText = data?.pipeline?.yaml;
    if (!ds) throw new Error('데이터셋을 먼저 선택하세요.');
    if (!spec || !yamlText) throw new Error('파이프라인 spec이 없습니다. 파이프라인 입력을 다시 생성하세요.');
    const btn = document.getElementById('ds-run-pipeline');
    const originalText = btn?.textContent || 'Pipeline 실행';
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Pipeline 등록 중';
    }
    try {
        const namespace = params.namespace || API.namespace || '';
        const runName = document.getElementById('ds-run-name')?.value.trim() || `pm-dataset-v${version}`;
        const experimentName = document.getElementById('ds-experiment-name')?.value.trim() || `pm-datasets-${namespace}`;
        const serviceAccount = document.getElementById('ds-service-account')?.value.trim() || 'default-editor';
        const pipelineName = _safePipelineName(`pm-${data.dataset?.name || 'dataset'}-v${version}-weekly-retrain`);
        const uploadedPipeline = await _ensureKfpPipeline(namespace, pipelineName, yamlText);
        if (btn) btn.textContent = 'Run 생성 중';
        const experiment = await _ensureKfpExperiment(namespace, experimentName);
        const experimentId = experiment.experiment_id;
        if (!experimentId) throw new Error('KFP experiment_id를 받지 못했습니다.');
        const run = await _kfpJson(`/apis/v2beta1/runs?experiment_id=${encodeURIComponent(experimentId)}`, {
            method: 'POST',
            body: JSON.stringify({
                display_name: runName,
                description: `Prediction Manager dataset ${data.dataset?.name || ''} v${version}`,
                experiment_id: experimentId,
                pipeline_version_id: uploadedPipeline.version_id,
                pipeline_version_reference: {
                    pipeline_id: uploadedPipeline.id,
                    pipeline_version_id: uploadedPipeline.version_id,
                },
                runtime_config: {
                    pipeline_root: '',
                    parameters: params,
                },
                service_account: serviceAccount,
            }),
        });
        const runId = _kfpRunId(run);
        if (!runId) throw new Error('KFP run_id를 받지 못했습니다.');
        const record = await API.post(`/api/datasets/${encodeURIComponent(ds.id)}/pipeline-runs`, {
            dataset_version: Number(version),
            run_id: runId,
            run_name: run.display_name || runName,
            state: _kfpRunState(run),
            experiment_id: experimentId,
            experiment_name: experiment.display_name || experimentName,
            pipeline_id: uploadedPipeline.id,
            pipeline_name: uploadedPipeline.name || pipelineName,
            pipeline_version_id: uploadedPipeline.version_id,
            pipeline_version_name: uploadedPipeline.version_name || uploadedPipeline.version_id,
            service_account: serviceAccount,
            ui_url: `/pipeline/?ns=${encodeURIComponent(namespace)}#/runs/details/${encodeURIComponent(runId)}`,
            params,
            kfp_run: run,
        });
        const existing = (_datasetsState.detail.pipeline_runs || []).filter(item => item.run_id !== record.run_id);
        _datasetsState.detail.pipeline_runs = [record, ...existing];
        _renderRunHistory();
        _renderPipelinePanel({
            ...data,
            experiment: {
                id: experimentId,
                name: experiment.display_name || experimentName,
                namespace: experiment.namespace || namespace,
            },
            uploaded_pipeline: uploadedPipeline,
            run: {
                id: record.run_id,
                name: record.run_name || runName,
                state: record.state || 'CREATED',
                created_at: record.created_at || run.created_at || '',
                service_account: serviceAccount,
                ui_url: record.ui_url,
            },
        });
        _openPipelineRun(record.run_id, namespace);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }
}

async function _refreshPipelineRunStatuses(showErrors = true) {
    const ds = _datasetsState.detail;
    const runs = ds?.pipeline_runs || [];
    if (!ds || !runs.length) return;
    const errors = [];
    const updated = [];
    for (const run of runs) {
        if (!run.run_id) {
            updated.push(run);
            continue;
        }
        try {
            const kfpRun = await _kfpJson(`/apis/v2beta1/runs/${encodeURIComponent(run.run_id)}`);
            const saved = await API.post(`/api/datasets/${encodeURIComponent(ds.id)}/pipeline-runs/${encodeURIComponent(run.run_id)}/status`, {
                state: _kfpRunState(kfpRun) || run.state || '',
                kfp_run: kfpRun,
            });
            updated.push(saved);
        } catch (err) {
            errors.push(`${run.run_name || run.run_id}: ${err.message}`);
            updated.push(run);
        }
    }
    _datasetsState.detail.pipeline_runs = updated.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
    _renderRunHistory();
    if (showErrors && errors.length) alert(errors.join('\n'));
}

async function renderDatasets() {
    return `
        <style>
        .ds-page-head { display:flex; justify-content:space-between; gap:16px; align-items:flex-start; flex-wrap:wrap; margin-bottom:14px; }
        .ds-title-wrap { min-width:0; }
        .ds-page-title { margin:0; font-size:26px; letter-spacing:0; color:#111827; }
        .ds-page-desc { margin:7px 0 0; color:var(--text-muted); line-height:1.5; font-size:13px; }
        .ds-head-actions { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
        .ds-layout { display:grid; grid-template-columns:minmax(280px,330px) minmax(0,1fr); gap:16px; align-items:start; min-width:0; }
        .ds-panel, .ds-main-card { min-width:0; max-width:100%; background:white; border:1px solid var(--border); border-radius:8px; box-shadow:var(--shadow); overflow:visible; }
        .ds-panel { padding:16px; min-height:0; display:flex; flex-direction:column; overflow:hidden; }
        .ds-panel-head { display:flex; justify-content:space-between; gap:10px; align-items:center; margin-bottom:14px; position:relative; }
        .ds-panel-title, .ds-section-title { font-weight:900; color:#111827; font-size:15px; }
        .ds-create-details { margin:0; position:relative; flex:0 0 auto; }
        .ds-create-details > summary { list-style:none; min-width:112px; height:34px; padding:0 12px; display:flex; align-items:center; justify-content:center; gap:6px; border-radius:7px; background:var(--accent); color:white; font-size:12px; font-weight:900; cursor:pointer; }
        .ds-create-details > summary::-webkit-details-marker { display:none; }
        .ds-create-plus { font-size:13px; line-height:1; font-weight:900; }
        .ds-create { position:absolute; right:0; top:42px; z-index:30; width:min(300px, calc(100vw - 48px)); display:grid; gap:9px; padding:12px; border:1px solid #bfdbfe; border-radius:8px; background:#fff; box-shadow:0 16px 32px rgba(15,23,42,.16); }
        .ds-create-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .ds-search-row { display:block; margin-bottom:14px; }
        .ds-list { display:grid; gap:10px; overflow:auto; padding-right:2px; }
        .ds-list-footer { margin-top:auto; padding-top:14px; color:var(--text-muted); font-size:12px; }
        .ds-card { width:100%; text-align:left; border:1px solid var(--border); border-radius:8px; background:#fff; padding:13px; cursor:pointer; display:block; }
        .ds-card:hover, .ds-card.selected { border-color:var(--accent); background:var(--accent-bg); }
        .ds-card-main { display:grid; gap:7px; min-width:0; }
        .ds-card-top { display:flex; gap:8px; justify-content:space-between; align-items:center; min-width:0; }
        .ds-card-top b { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:14px; color:#111827; }
        .ds-card-meta, .ds-card-sub, .ds-muted, .ds-help { color:var(--text-muted); font-size:11px; line-height:1.45; }
        .ds-ready, .ds-status-pill, .ds-latest-tag { display:inline-flex; align-items:center; justify-content:center; height:22px; padding:0 8px; border-radius:999px; font-size:10px; font-weight:900; white-space:nowrap; background:#f1f5f9; color:#475569; }
        .ds-ready.ok, .ds-status-pill.ok, .ds-run-state.ok, .ds-use-ok { color:#059669; background:#dcfce7; }
        .ds-ready.warn, .ds-status-pill.warn { color:#b45309; background:#fef3c7; }
        .ds-ready.info, .ds-status-pill.info { color:#1d4ed8; background:#dbeafe; }
        .ds-use-ok { display:inline-flex; align-items:center; height:22px; padding:0 8px; border-radius:999px; font-size:10px; font-weight:900; }
        .ds-empty { padding:24px; text-align:center; color:var(--text-muted); border:1px dashed var(--border); border-radius:8px; background:#fafafa; }
        .ds-empty.compact { padding:16px; }
        .ds-empty-tall { min-height:260px; display:flex; align-items:center; justify-content:center; }
        .ds-detail-stack { display:grid; gap:14px; }
        .ds-meta-line { display:flex; gap:7px; flex-wrap:wrap; align-items:center; }
        .ds-meta-line span { display:inline-flex; align-items:center; justify-content:center; height:22px; padding:0 9px; border-radius:6px; background:#f1f5f9; color:#334155; font-size:10px; font-weight:900; line-height:1; white-space:nowrap; vertical-align:middle; }
        .ds-main-card { padding:16px; margin-bottom:8px; display:flex; flex-direction:column; position:relative; }
        .ds-section-head { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; padding-bottom:12px; margin-bottom:12px; border-bottom:1px solid #edf2f7; }
        .ds-section-head.compact { align-items:center; }
        .ds-section-head h3 { margin:0; font-size:16px; color:#111827; }
        .ds-section-head p { margin:5px 0 0; color:var(--text-muted); font-size:12px; line-height:1.4; }
        .ds-version-head-actions { display:flex; align-items:center; justify-content:flex-end; gap:8px; flex-wrap:wrap; }
        .ds-version-head-actions .ds-delete, .ds-add-version-toggle { min-width:112px; height:30px; padding:0 10px; justify-content:center; }
        .ds-add-version-toggle { gap:6px; }
        .ds-add-plus { font-size:11px; line-height:1; font-weight:900; }
        .ds-version-form-inline { margin:-2px 0 12px; padding:14px; border:1px solid #dbeafe; border-radius:8px; background:#f8fbff; }
        .ds-version-form-title { color:#111827; font-size:13px; font-weight:900; margin-bottom:10px; }
        .ds-version-form-grid { display:grid; grid-template-columns:minmax(150px,.7fr) minmax(260px,1.7fr) minmax(300px,2fr) auto; gap:10px; align-items:end; }
        .ds-version-form-grid .pm-input { height:40px; min-height:40px; }
        .ds-file-picker { height:40px; min-height:40px; display:flex; align-items:center; gap:8px; min-width:0; border:1px solid var(--border); border-radius:6px; background:#fff; padding:0 10px; }
        .ds-file-picker input[type="file"] { position:absolute; width:1px; height:1px; opacity:0; pointer-events:none; }
        .ds-file-button { flex:0 0 auto; height:28px; padding:0 10px; border:1px solid #cbd5e1; border-radius:5px; background:#f8fafc; color:#111827; display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; cursor:pointer; }
        .ds-file-name { min-width:0; color:#334155; font-size:12px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ds-file-picker:focus-within { border-color:var(--accent); box-shadow:0 0 0 2px var(--accent-bg); }
        .ds-version-form-actions { display:flex; align-items:center; justify-content:flex-end; gap:8px; height:40px; }
        .ds-version-form-actions .pm-btn { height:34px; padding:0 14px; justify-content:center; white-space:nowrap; }
        .ds-version-form-actions #ds-cancel-version { min-width:0; width:auto; }
        .ds-version-form-actions #ds-add-version { min-width:76px; }
        .ds-create label, .ds-version-form-inline label, .ds-version-form-inline .ds-form-field, .ds-preprocess-grid label, .ds-preprocess-fields label, .ds-label-grid label, .ds-run-grid label { font-size:11px; font-weight:800; color:var(--text-secondary); display:grid; gap:5px; }
        .ds-form-label { color:var(--text-secondary); font-size:11px; font-weight:800; }
        .ds-table-wrap { width:100%; max-width:100%; overflow-x:auto; overflow-y:visible; -webkit-overflow-scrolling:touch; }
        .ds-main-card > .ds-table-wrap { flex:1 1 auto; }
        #ds-run-history { margin-top:0; }
        .ds-table { width:100%; border-collapse:collapse; font-size:12px; }
        .ds-version-table { min-width:980px; table-layout:fixed; }
        .ds-version-table .ds-col-version { width:82px; }
        .ds-version-table .ds-col-kind { width:120px; }
        .ds-version-table .ds-col-size { width:115px; }
        .ds-version-table .ds-col-status { width:116px; }
        .ds-version-table .ds-col-ready { width:112px; }
        .ds-version-table .ds-col-created { width:190px; }
        .ds-version-table .ds-col-actions { width:330px; }
        .ds-run-table { min-width:680px; }
        .ds-table th, .ds-table td { border-bottom:1px solid #eef2f7; padding:10px 8px; vertical-align:middle; }
        .ds-version-table th, .ds-version-table td { text-align:left; }
        .ds-version-table th:nth-child(7), .ds-version-table td:nth-child(7) { text-align:center; }
        .ds-table th { color:var(--text-muted); font-size:10px; text-transform:uppercase; text-align:left; white-space:nowrap; background:#f8fafc; }
        .ds-version-row.selected td { background:#f8fbff; }
        .ds-version-pick { border:0; background:transparent; color:#111827; font-weight:900; cursor:pointer; padding:0; }
        .ds-latest-tag { margin-left:8px; color:#1d4ed8; background:#dbeafe; }
        .ds-row-actions { display:flex; flex-wrap:nowrap; justify-content:center; align-items:center; gap:6px; width:100%; position:relative; }
        .ds-row-actions .pm-btn-sm { height:30px; min-width:74px; padding:0 9px; justify-content:center; line-height:1; white-space:nowrap; }
        .ds-row-actions .ds-pipeline { min-width:118px; }
        .ds-more-menu { position:relative; }
        .ds-more-menu > summary { list-style:none; height:30px; min-width:74px; padding:0 10px; border:1px solid var(--border); border-radius:6px; background:#fff; color:#334155; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; cursor:pointer; }
        .ds-more-menu > summary::-webkit-details-marker { display:none; }
        .ds-more-menu[open] > summary { border-color:var(--accent); color:var(--accent); background:var(--accent-bg); }
        .ds-more-list { position:fixed; left:0; top:0; z-index:10000; min-width:170px; padding:6px; border:1px solid #dbe3ef; border-radius:8px; background:#fff; box-shadow:0 14px 28px rgba(15,23,42,.16); display:grid; gap:3px; }
        .ds-more-list button { width:100%; height:34px; border:0; border-radius:6px; background:#fff; color:#334155; text-align:left; padding:0 10px; font-size:12px; font-weight:800; cursor:pointer; }
        .ds-more-list button:hover { background:#f1f5f9; color:#111827; }
        .ds-more-list button.danger { color:#dc2626; }
        .ds-more-list button.danger:hover { background:#fef2f2; color:#b91c1c; }
        .ds-version-summary { margin-top:0; border-top:1px solid #eef2f7; background:#f8fafc; padding:14px; }
        .ds-version-summary-head { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; margin-bottom:12px; }
        .ds-version-summary-head strong { display:block; color:#111827; font-size:14px; margin-bottom:4px; }
        .ds-version-summary-head span:not(.ds-status-pill) { color:var(--text-muted); font-size:12px; }
        .ds-summary-grid { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:10px; }
        .ds-summary-grid div { min-width:0; border:1px solid #e5e7eb; border-radius:7px; background:#fff; padding:10px; }
        .ds-summary-grid span { display:block; color:var(--text-muted); font-size:10px; font-weight:900; margin-bottom:5px; text-transform:uppercase; }
        .ds-summary-grid b { display:block; color:#111827; font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ds-version-detail-panel { background:#fff; }
        .ds-version-detail-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding-bottom:12px; margin-bottom:12px; border-bottom:1px solid #edf2f7; }
        .ds-version-detail-head .ds-section-title { margin-bottom:4px; }
        .ds-version-detail-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; }
        .ds-version-detail-grid > div { min-width:0; padding:10px; border:1px solid #e5e7eb; border-radius:7px; background:#f8fafc; }
        .ds-version-detail-grid span, .ds-version-detail-lines small { display:block; color:var(--text-muted); font-size:10px; font-weight:800; margin-bottom:4px; }
        .ds-version-detail-grid b, .ds-version-detail-lines b { display:block; min-width:0; color:#111827; font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ds-version-detail-section { margin-top:14px; padding-top:12px; border-top:1px solid #edf2f7; }
        .ds-version-detail-title { margin-bottom:8px; color:#111827; font-size:12px; font-weight:900; }
        .ds-version-detail-lines { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; }
        .ds-version-detail-lines > span { min-width:0; padding:0 8px; border-left:2px solid #dbeafe; }
        .ds-version-columns { display:flex; flex-wrap:wrap; gap:6px; max-height:148px; overflow:auto; padding-right:3px; }
        .ds-version-column { display:inline-flex; align-items:center; gap:6px; min-width:0; max-width:260px; padding:6px 8px; border:1px solid #e2e8f0; border-radius:6px; background:#f8fafc; }
        .ds-version-column.numeric { border-color:#bbf7d0; background:#f0fdf4; }
        .ds-version-column b { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#111827; font-size:11px; }
        .ds-version-column small { flex:0 0 auto; color:var(--text-muted); font-size:9px; }
        .ds-version-detail-loading, .ds-version-detail-note { padding:12px; border:1px dashed var(--border); border-radius:7px; color:var(--text-muted); background:#fafafa; font-size:11px; }
        .ds-version-storage { margin-top:12px; padding-top:10px; border-top:1px solid #edf2f7; }
        .ds-version-storage summary { color:#475569; font-size:11px; font-weight:800; cursor:pointer; }
        .ds-version-storage code { display:block; margin-top:8px; padding:9px; border-radius:6px; background:#0f172a; color:#e2e8f0; font-family:var(--font-mono); font-size:10px; overflow:auto; white-space:nowrap; }
        .ds-work { background:#f8fafc; border:1px solid #e5e7eb; border-radius:8px; padding:14px; margin-bottom:14px; }
        .ds-section-title { margin-bottom:10px; }
        .ds-merge-guide { margin:-2px 0 12px; padding:9px 10px; border:1px solid #bfdbfe; border-radius:6px; background:#eff6ff; color:#1e3a8a; font-size:12px; line-height:1.5; }
        .ds-merge-guide strong { font-weight:900; color:#1d4ed8; }
        .ds-field-help { color:var(--text-muted); font-size:10px; font-weight:500; line-height:1.35; }
        .ds-inline-help { color:var(--text-muted); font-size:10px; line-height:1.35; flex-basis:100%; margin-top:-4px; }
        .ds-check { display:flex !important; align-items:center; gap:6px !important; min-height:44px; padding-bottom:0; white-space:nowrap; }
        .ds-preprocess-fields { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:10px; align-items:start; }
        .ds-profile-summary { display:grid; grid-template-columns:2fr repeat(3, minmax(90px, .7fr)); gap:8px; margin:10px 0; }
        .ds-profile-summary > span { min-width:0; border:1px solid var(--border); border-radius:7px; padding:9px 10px; background:#fff; }
        .ds-profile-summary small, .ds-profile-summary b { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ds-profile-summary small { color:var(--text-muted); font-size:10px; margin-bottom:3px; }
        .ds-profile-summary b { font-size:12px; }
        .ds-profile-columns { display:flex; align-items:flex-start; gap:10px; padding:9px 10px; border:1px solid #dce8f8; border-radius:7px; background:#f7fbff; font-size:10px; }
        .ds-profile-columns > b { flex:0 0 auto; padding-top:3px; font-size:11px; }
        .ds-profile-columns > div { display:flex; flex-wrap:wrap; gap:5px; min-width:0; }
        .ds-profile-columns > small { flex:0 0 auto; color:var(--text-muted); padding-top:3px; }
        .ds-column-chip { display:inline-flex; align-items:center; min-height:21px; padding:2px 7px; border-radius:999px; background:#eef2f7; color:var(--text-secondary); font-weight:700; }
        .ds-column-chip.numeric { color:#087f4f; background:#e8f7ef; }
        .ds-preprocess-bottom { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-top:12px; }
        .ds-preprocess-options { display:flex; align-items:center; flex-wrap:wrap; gap:8px 18px; min-width:0; }
        .ds-preprocess-options .ds-check { min-height:32px; padding:0; font-size:10px; font-weight:600; line-height:1.3; color:var(--text-muted); }
        .ds-preprocess-options input[type="checkbox"] { width:14px; height:14px; }
        .ds-preprocess-bottom .pm-btn { min-width:240px; min-height:42px; }
        .ds-preprocess-grid { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:8px; align-items:end; }
        .ds-label-grid { display:grid; grid-template-columns:minmax(220px,1.25fr) minmax(180px,.95fr) minmax(126px,.52fr) minmax(168px,.7fr); gap:8px; align-items:end; }
        .ds-label-grid .ds-label-field { display:grid; grid-template-rows:14px 44px; gap:5px; min-width:0; font-size:11px; font-weight:700; color:var(--text-secondary); align-content:start; }
        .ds-label-grid .pm-input, .ds-label-grid .pm-btn, .ds-toggle-row { height:44px; min-height:44px; }
        .ds-label-action { display:flex; align-items:flex-end; min-width:0; }
        .ds-label-action .pm-btn { width:100%; min-width:0; height:44px; justify-content:center; padding:0 12px; white-space:normal; line-height:1.15; }
        .ds-toggle-row { display:flex; align-items:center; justify-content:flex-start; gap:9px; color:var(--text-secondary); font-size:12px; font-weight:700; line-height:1.2; min-width:0; }
        .ds-switch { position:relative; width:42px; height:24px; flex:0 0 auto; display:inline-flex; align-items:center; }
        .ds-switch input { position:absolute; inset:0; opacity:0; cursor:pointer; }
        .ds-switch span { width:42px; height:24px; border-radius:999px; background:#d1d5db; transition:background .15s; }
        .ds-switch span::after { content:''; position:absolute; width:18px; height:18px; left:3px; top:3px; border-radius:50%; background:#fff; box-shadow:0 1px 2px rgba(0,0,0,.18); transition:transform .15s; }
        .ds-switch input:checked + span { background:var(--accent); }
        .ds-switch input:checked + span::after { transform:translateX(18px); }
        .ds-pipeline-grid { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:8px; margin-bottom:10px; }
        .ds-run-grid { display:grid; grid-template-columns:minmax(180px,1fr) minmax(180px,1fr) minmax(160px,.8fr) auto auto; gap:8px; align-items:end; margin-top:10px; }
        .ds-param { border:1px solid #e5e7eb; border-radius:6px; background:#fff; padding:8px; min-width:0; }
        .ds-param div { color:var(--text-muted); font-size:10px; font-weight:800; margin-bottom:4px; }
        .ds-param code { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-family:var(--font-mono); font-size:11px; }
        .ds-run-result { display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-top:12px; padding:10px; border:1px solid #bfdbfe; border-radius:8px; background:#eff6ff; }
        .ds-run-result div { display:flex; align-items:center; gap:8px; color:#1e3a8a; }
        .ds-run-result span { color:#2563eb; font-size:11px; font-weight:800; }
        .ds-run-result code { font-family:var(--font-mono); font-size:11px; color:#1e40af; }
        .ds-run-state { display:inline-flex; align-items:center; justify-content:center; min-width:86px; height:24px; padding:0 8px; border-radius:999px; background:#f1f5f9; color:#475569; font-size:10px; font-weight:900; line-height:1; }
        .ds-run-state.bad { color:#b91c1c; background:#fee2e2; }
        .ds-run-state.active { color:#1d4ed8; background:#dbeafe; }
        @media (max-width: 1180px) { .ds-layout { grid-template-columns:1fr; } .ds-panel { height:auto !important; } .ds-list { max-height:420px; } .ds-version-form-grid { grid-template-columns:1fr; } .ds-version-form-actions { justify-content:flex-start; height:auto; } }
        @media (max-width: 900px) { .ds-preprocess-grid, .ds-preprocess-fields, .ds-label-grid, .ds-pipeline-grid, .ds-run-grid, .ds-summary-grid, .ds-profile-summary, .ds-version-detail-grid, .ds-version-detail-lines { grid-template-columns:1fr; } .ds-profile-columns { flex-direction:column; } .ds-preprocess-bottom { align-items:stretch; flex-direction:column; } .ds-preprocess-bottom .pm-btn { width:100%; } .ds-row-actions { justify-content:flex-start; } }
        @media (max-width: 720px) { .ds-create-grid { grid-template-columns:1fr; } .ds-create { position:static; width:100%; margin-top:10px; box-shadow:none; } .ds-page-head, .ds-section-head { align-items:stretch; flex-direction:column; } .ds-version-head-actions { justify-content:stretch; } .ds-version-head-actions .pm-btn, .ds-head-actions .pm-btn, .ds-delete { width:100%; justify-content:center; } .ds-version-form-actions { flex-direction:column; align-items:stretch; } .ds-version-form-actions .pm-btn { width:100%; } .ds-version-table { min-width:920px; } .ds-run-table { min-width:680px; } }
        </style>
        <div class="ds-page-head">
            <div class="ds-title-wrap">
                <h1 class="ds-page-title">학습 데이터셋 준비</h1>
                <p class="ds-page-desc">등록된 데이터를 전처리하고, 라벨링 결과를 반영해 학습에 사용할 데이터셋 버전을 준비합니다.</p>
            </div>
            <div class="ds-head-actions">
                <button class="pm-btn" id="ds-guide" type="button">사용 가이드</button>
                <button class="pm-btn pm-btn-ghost ds-refresh" id="ds-refresh" type="button">새로고침</button>
            </div>
        </div>
        <div class="ds-layout">
            <aside class="ds-panel">
                <div class="ds-panel-head">
                    <div class="ds-panel-title">데이터셋 목록</div>
                    <details class="ds-create-details">
                        <summary><span class="ds-create-plus">+</span><span>새 데이터셋</span></summary>
                        <div class="ds-create">
                            <input id="ds-name" class="pm-input" placeholder="데이터셋 이름" />
                            <input id="ds-target" class="pm-input" placeholder="target column" />
                            <div class="ds-create-grid">
                                <select id="ds-type" class="pm-input"><option value="csv">CSV</option><option value="json">JSON</option><option value="jsonl">JSONL</option><option value="parquet">Parquet</option><option value="image">Image</option></select>
                                <select id="ds-task" class="pm-input"><option value="unknown">미지정</option><option value="regression">회귀</option><option value="classification">분류</option><option value="labeling">라벨링</option></select>
                            </div>
                            <textarea id="ds-desc" class="pm-input" rows="2" placeholder="설명"></textarea>
                            <button class="pm-btn pm-btn-primary pm-btn-full" id="ds-create-btn" type="button">데이터셋 생성</button>
                        </div>
                    </details>
                </div>
                <div class="ds-search-row">
                    <input id="ds-search" class="pm-input" placeholder="데이터셋 검색..." autocomplete="off" />
                </div>
                <div id="ds-list" class="ds-list"><div class="ds-empty">로딩 중...</div></div>
                <div id="ds-list-count" class="ds-list-footer">총 0개 데이터셋</div>
            </aside>
            <main id="ds-detail" class="ds-detail-stack"><div class="ds-empty ds-empty-tall">로딩 중...</div></main>
        </div>`;
}

function setupDatasetsPage() {
    window.addEventListener('resize', () => {
        _syncDatasetPanelHeight();
        document.querySelectorAll('.ds-more-menu[open]').forEach(_positionDatasetMoreMenu);
    });
    window.addEventListener('scroll', () => _closeDatasetMoreMenus(), true);
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.ds-more-menu')) _closeDatasetMoreMenus();
    });
    document.getElementById('ds-refresh')?.addEventListener('click', () => _refreshDatasets().catch(e => alert(e.message)));
    document.getElementById('ds-create-btn')?.addEventListener('click', () => _createDataset().catch(e => alert(e.message)));
    document.getElementById('ds-guide')?.addEventListener('click', () => {
        alert('1. 데이터셋을 선택합니다.\n2. 학습에 사용할 버전을 선택합니다.\n3. 전처리, 라벨링 결과 등록, 준비 완료 처리 후 학습에 사용하기를 실행합니다.');
    });
    document.getElementById('ds-search')?.addEventListener('input', (e) => {
        _datasetsState.search = e.target.value || '';
        _renderList();
    });
    document.getElementById('ds-detail')?.addEventListener('change', (e) => {
        if (e.target?.id === 'ds-file') {
            const label = document.getElementById('ds-file-name');
            if (label) label.textContent = e.target.files?.[0]?.name || '선택된 파일 없음';
        }
    });
    document.getElementById('ds-list')?.addEventListener('click', async (e) => {
        const card = e.target.closest('.ds-card');
        if (!card) return;
        _datasetsState.selectedId = card.dataset.datasetId;
        _datasetsState.selectedVersion = null;
        await _loadDatasets(true).catch(err => alert(err.message));
    });
    document.getElementById('ds-detail')?.addEventListener('click', async (e) => {
        const moreSummary = e.target.closest('.ds-more-menu > summary');
        if (moreSummary) {
            e.preventDefault();
            _toggleDatasetMoreMenu(moreSummary.closest('.ds-more-menu'));
            return;
        }
        const moreAction = e.target.closest('.ds-more-list button');
        if (moreAction) {
            const openedMenu = moreAction.closest('.ds-more-menu');
            if (openedMenu) openedMenu.open = false;
        }
        const selectVersion = e.target.closest('.ds-select-version');
        if (selectVersion) {
            _datasetsState.selectedVersion = selectVersion.dataset.version;
            _renderDetail();
            _syncDatasetPanelHeight();
            return;
        }
        const versionDetail = e.target.closest('.ds-version-detail-btn');
        if (versionDetail) {
            return _openVersionDetail(versionDetail.dataset.version).catch(err => alert(err.message));
        }
        const closeVersionDetail = e.target.closest('.ds-close-version-detail');
        if (closeVersionDetail) {
            const workPanel = document.getElementById('ds-work-panel');
            if (workPanel) workPanel.innerHTML = '';
            _syncDatasetPanelHeight();
            return;
        }
        const fileButton = e.target.closest('.ds-file-button');
        if (fileButton) {
            e.preventDefault();
            e.stopPropagation();
            document.getElementById('ds-file')?.click();
            return;
        }
        const toggleVersionForm = e.target.closest('#ds-toggle-version-form');
        if (toggleVersionForm) {
            const form = document.getElementById('ds-version-form');
            if (form) {
                form.hidden = !form.hidden;
                _syncDatasetPanelHeight();
            }
            return;
        }
        const cancelVersion = e.target.closest('#ds-cancel-version');
        if (cancelVersion) {
            const form = document.getElementById('ds-version-form');
            if (form) {
                form.hidden = true;
                _syncDatasetPanelHeight();
            }
            return;
        }
        const del = e.target.closest('.ds-delete');
        if (del) return _deleteDataset().catch(err => alert(err.message));
        const add = e.target.closest('#ds-add-version');
        if (add) return _addVersion().catch(err => alert(err.message));
        const prep = e.target.closest('.ds-prep');
        if (prep) return _openPreprocessForm(prep.dataset.version).catch(err => alert(err.message));
        const runPrep = e.target.closest('#ds-run-preprocess');
        if (runPrep) return _runPreprocess(runPrep.dataset.version).catch(err => alert(err.message));
        const img = e.target.closest('.ds-image-standard');
        if (img) return _renderImageStandardizeForm(img.dataset.version);
        const runImg = e.target.closest('#ds-run-image-standard');
        if (runImg) return _runImageStandardize(runImg.dataset.version).catch(err => alert(err.message));
        const download = e.target.closest('.ds-download');
        if (download) return Promise.resolve().then(() => _downloadVersion(download.dataset.version)).catch(err => alert(err.message));
        const lsProject = e.target.closest('.ds-ls-project');
        if (lsProject) return _createLabelStudioProject(lsProject.dataset.version).catch(err => alert(err.message));
        const ls = e.target.closest('.ds-labelstudio');
        if (ls) return _renderLabelStudioForm(ls.dataset.version);
        const uploadLs = e.target.closest('#ds-upload-ls');
        if (uploadLs) return _uploadLabelStudioExport(uploadLs.dataset.version).catch(err => alert(err.message));
        const publish = e.target.closest('.ds-publish');
        if (publish) return _publishVersion(publish.dataset.version).catch(err => alert(err.message));
        const deleteVersion = e.target.closest('.ds-delete-version');
        if (deleteVersion) return _deleteVersion(deleteVersion.dataset.version).catch(err => alert(err.message));
        const pipe = e.target.closest('.ds-pipeline');
        if (pipe) return _buildPipelineInputs(pipe.dataset.version).catch(err => alert(err.message));
        const refreshRuns = e.target.closest('#ds-refresh-runs');
        if (refreshRuns) return _refreshPipelineRunStatuses(true).catch(err => alert(err.message));
        const runPipe = e.target.closest('#ds-run-pipeline');
        if (runPipe) return _runPipeline(runPipe.dataset.version).catch(err => alert(err.message));
        const openRun = e.target.closest('#ds-open-pipeline-run, .ds-open-run');
        if (openRun) {
            _openPipelineRun(openRun.dataset.runId, openRun.dataset.namespace);
            return;
        }
        const copy = e.target.closest('#ds-copy-pipeline');
        if (copy) {
            const text = document.getElementById('ds-copy-text')?.value || '';
            try { await navigator.clipboard.writeText(text); alert('파이프라인 입력값을 복사했습니다'); }
            catch { alert(text); }
        }
    });
    _loadDatasets(false).catch(e => {
        const list = document.getElementById('ds-list');
        if (list) list.innerHTML = `<div class="ds-empty">${esc(e.message)}</div>`;
    });
}

window.renderDatasets = renderDatasets;
window.setupDatasetsPage = setupDatasetsPage;
})();
