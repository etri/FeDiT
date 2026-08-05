(function () {
const APP_CONNECTED_EVENT = 'iframe-connected';
const PARENT_CONNECTED_EVENT = 'parent-connected';
const NAMESPACE_SELECTED_EVENT = 'namespace-selected';

const KFP_MENU_ITEMS = [
    {
        id: 'pipelines',
        label: 'Pipelines',
        hash: '#/pipelines',
        desc: '파이프라인 정의와 버전을 관리합니다.',
    },
    {
        id: 'experiments',
        label: 'Experiments',
        hash: '#/experiments',
        desc: '관련 Run을 묶는 실험 단위입니다.',
    },
    {
        id: 'runs',
        label: 'Runs',
        hash: '#/runs',
        desc: '개별 실행의 상태, 그래프, 로그를 확인합니다.',
    },
    {
        id: 'recurring-runs',
        label: 'Recurring Runs',
        hash: '#/recurringruns',
        desc: '정해진 주기로 반복 실행되는 스케줄입니다.',
    },
    {
        id: 'artifacts',
        label: 'Artifacts',
        hash: '#/artifacts',
        desc: '실행 단계가 만들거나 사용한 데이터 산출물입니다.',
        advanced: true,
    },
    {
        id: 'executions',
        label: 'Executions',
        hash: '#/executions',
        desc: '컴포넌트별 실행 기록과 메타데이터입니다.',
        advanced: true,
    },
];

const query = new URLSearchParams(window.location.search);
let _pipelineKfpState = {
    activeView: _initialView(),
    kfpHashOverride: _initialKfpHash(),
};
let _kfpMessageBound = false;

function _validView(view) {
    return KFP_MENU_ITEMS.some(item => item.id === view) ? view : 'pipelines';
}

function _initialView() {
    if (query.get('view')) return _validView(query.get('view'));
    return query.get('runId') ? 'runs' : 'pipelines';
}

function _initialKfpHash() {
    const explicit = query.get('kfpHash') || '';
    const runId = query.get('runId') || '';
    if (explicit) return explicit;
    return runId ? `#/runs/details/${encodeURIComponent(runId)}` : '';
}

function _activeMenuItem() {
    return KFP_MENU_ITEMS.find(item => item.id === _pipelineKfpState.activeView) || KFP_MENU_ITEMS[0];
}

function _updateUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set('view', _pipelineKfpState.activeView);
    if (_pipelineKfpState.kfpHashOverride) url.searchParams.set('kfpHash', _pipelineKfpState.kfpHashOverride);
    else url.searchParams.delete('kfpHash');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

function _setActiveView(view) {
    _pipelineKfpState.activeView = _validView(view);
    _pipelineKfpState.kfpHashOverride = '';
    _updateUrl();
    _renderPipelineKfpPage();
}

function _kfpUrl() {
    const item = _activeMenuItem();
    const ns = API.namespace || '';
    const url = new URL('/pipeline/', window.location.origin);
    if (ns) url.searchParams.set('ns', ns);
    const hash = _pipelineKfpState.kfpHashOverride || item.hash || '#/pipelines';
    return `${url.pathname}${url.search}${hash}`;
}

function _sendKfpNamespace(targetWindow, origin = '*') {
    if (!targetWindow) return;
    targetWindow.postMessage({ type: PARENT_CONNECTED_EVENT, value: null }, origin || '*');
    targetWindow.postMessage({ type: NAMESPACE_SELECTED_EVENT, value: API.namespace || '' }, origin || '*');
}

function _bindKfpBridge() {
    if (_kfpMessageBound) return;
    _kfpMessageBound = true;
    window.addEventListener('message', (event) => {
        const frame = document.getElementById('pl-kfp-iframe');
        if (!frame || event.source !== frame.contentWindow) return;
        if (event.data?.type === APP_CONNECTED_EVENT) {
            _sendKfpNamespace(frame.contentWindow, event.origin || '*');
        }
    });
}

function _wireKfpIframe() {
    const frame = document.getElementById('pl-kfp-iframe');
    if (!frame) return;
    frame.addEventListener('load', () => {
        setTimeout(() => _sendKfpNamespace(frame.contentWindow, '*'), 400);
    }, { once: true });
}

function _openDatasets() {
    window.location.hash = '#/datasets';
}

function _menuHtml() {
    const primary = KFP_MENU_ITEMS.filter(item => !item.advanced);
    const advanced = KFP_MENU_ITEMS.filter(item => item.advanced);
    const button = item => `
        <button type="button" class="pl-menu-item ${item.id === _pipelineKfpState.activeView ? 'active' : ''}" data-view="${esc(item.id)}">
            <span class="pl-menu-item-label">${esc(item.label)}</span>
            <span class="pl-menu-item-desc">${esc(item.desc || '')}</span>
        </button>
    `;
    return `
        <div class="pl-menu-head">
            <div class="pl-menu-icon">P</div>
            <div>
                <strong>파이프라인</strong>
                <span>Kubeflow Pipelines</span>
            </div>
        </div>
        <div class="pl-menu-group">${primary.map(button).join('')}</div>
        <div class="pl-menu-label">고급</div>
        <div class="pl-menu-group">${advanced.map(button).join('')}</div>
    `;
}

function _kfpFrameHtml() {
    const item = _activeMenuItem();
    return `
        <div class="pl-kfp-panel">
            <div class="pl-kfp-bar">
                <div>
                    <div class="pl-kicker">Kubeflow Pipelines</div>
                    <h2>${esc(item.label)}</h2>
                    <p>${esc(item.desc || '')}</p>
                </div>
            </div>
            <iframe id="pl-kfp-iframe" class="pl-kfp-iframe" title="${esc(item.label)}" src="${esc(_kfpUrl())}"></iframe>
        </div>
    `;
}

function _renderPipelineKfpPage() {
    const menu = document.getElementById('pl-menu');
    const content = document.getElementById('pl-content');
    if (menu) menu.innerHTML = _menuHtml();
    if (content) {
        content.innerHTML = _kfpFrameHtml();
        _wireKfpIframe();
    }
}

async function renderPipelineRuns() {
    return `
        <style>
        .pl-shell { display:grid; grid-template-columns:220px minmax(0,1fr); gap:16px; align-items:start; min-height:calc(100vh - 168px); }
        .pl-side { background:#fff; border:1px solid var(--border); border-radius:8px; padding:14px 12px; box-shadow:var(--shadow); }
        .pl-menu-head { display:flex; align-items:center; gap:10px; padding:4px 8px 14px; border-bottom:1px solid #edf2f7; margin-bottom:10px; }
        .pl-menu-icon { width:28px; height:28px; border-radius:6px; display:flex; align-items:center; justify-content:center; background:var(--accent-bg); color:var(--accent); font-weight:900; font-size:12px; }
        .pl-menu-head strong { display:block; color:var(--text); font-size:14px; line-height:18px; }
        .pl-menu-head span { display:block; color:var(--text-muted); font-size:10px; line-height:14px; }
        .pl-menu-group { display:grid; gap:2px; }
        .pl-menu-label { margin:16px 8px 6px; color:var(--text-muted); font-size:10px; font-weight:800; text-transform:uppercase; }
        .pl-menu-item { width:100%; min-height:54px; border:0; border-radius:6px; background:transparent; color:var(--text-secondary); text-align:left; padding:8px 10px; cursor:pointer; font-family:inherit; display:grid; gap:3px; align-content:center; }
        .pl-menu-item-label { font-size:13px; font-weight:700; line-height:17px; }
        .pl-menu-item-desc { color:var(--text-muted); font-size:10px; font-weight:500; line-height:14px; }
        .pl-menu-item:hover { background:var(--bg); color:var(--text); }
        .pl-menu-item.active { background:var(--accent-bg); color:var(--accent); box-shadow:inset 3px 0 0 var(--accent); }
        .pl-menu-item.active .pl-menu-item-desc { color:var(--text-secondary); }
        .pl-content { min-width:0; }
        .pl-kfp-panel { background:#fff; border:1px solid var(--border); border-radius:8px; box-shadow:var(--shadow); padding:16px; min-width:0; }
        .pl-kfp-bar { display:flex; justify-content:space-between; gap:16px; align-items:flex-start; margin-bottom:16px; }
        .pl-kicker { color:var(--text-muted); font-size:11px; font-weight:800; text-transform:uppercase; margin-bottom:4px; }
        .pl-kfp-bar h2 { margin:0 0 4px; font-size:20px; font-weight:700; }
        .pl-kfp-bar p { margin:0; color:var(--text-muted); font-size:12px; line-height:18px; }
        .pl-kfp-iframe { width:100%; height:calc(100vh - 250px); min-height:680px; border:1px solid #e5e7eb; border-radius:8px; background:#fff; }
        .pl-actions { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:8px; }
        @media (max-width: 1100px) { .pl-shell { grid-template-columns:1fr; } .pl-side { min-height:auto; } .pl-kfp-bar { flex-direction:column; } .pl-actions { justify-content:flex-start; } .pl-kfp-iframe { min-height:620px; } }
        </style>
        <div class="pm-page-header" style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
            <div>
                <h1 class="pm-page-title">파이프라인</h1>
                <p class="pm-page-desc">Kubeflow Pipelines 메뉴를 한 곳에서 확인합니다.</p>
            </div>
            <div class="pl-actions">
                <button type="button" class="pm-btn pm-btn-ghost" id="pl-open-datasets">데이터셋 카탈로그</button>
            </div>
        </div>
        <div class="pl-shell" id="pl-page-root">
            <aside class="pl-side" id="pl-menu"></aside>
            <main class="pl-content" id="pl-content"></main>
        </div>`;
}

function setupPipelineRunsPage() {
    _bindKfpBridge();
    _renderPipelineKfpPage();
    document.getElementById('pl-page-root')?.addEventListener('click', (e) => {
        const menu = e.target.closest('.pl-menu-item');
        if (!menu) return;
        _setActiveView(menu.dataset.view || 'pipelines');
    });
    document.getElementById('pl-open-datasets')?.addEventListener('click', _openDatasets);
}

window.renderPipelineRuns = renderPipelineRuns;
window.setupPipelineRunsPage = setupPipelineRunsPage;
})();
