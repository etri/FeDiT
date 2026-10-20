// =============================================================================
//  external_sim_api.js  -  외부연동 상태창(ExternalPanel.html) ↔ poc_manager REST API
//
//  흐름 (조합기 페이지와 같은 출처, /simulation 프리픽스 포함 경로)
//    1) PUSH : POST <base>/api/simulations/push  본문 = Push JSON(multi_load)
//              → 200 { request_id, status:"pushed", count, ... }
//    2) RUN  : POST <base>/api/simulations/run   본문 = Run JSON(multi_run_loaded) + request_id
//              → 202 { status:"queued_run", ... }
//    3) 조회 : GET  <base>/api/simulations/<request_id>
//              → { status, outputs:[res_m Data ...], run_response, error ... }  succeeded/failed 까지 폴링
//
//  REST 호출과 폴링은 이 메인(조합기) 창이 맡고, 상태창은 버튼·로그·결과표만 그린다.
//  그래서 상태창을 닫아도 실행 결과는 조합기 결과창에 계속 그려진다.
//
//  poc_manager 는 자체 WebSocket 으로 fDTSimServer 에 붙으므로 실행 결과(res_m)는 조합기 WS 로 오지 않는다.
//  폴링으로 받은 outputs 를 병렬실행 결과창과 같은 모양의 PRINT/GRAPH 창([REST paramN])에 그린다.
//  RUN 이 끝나면 poc_manager 가 엔진을 정리하므로, 다시 실행하려면 PUSH 부터 다시 한다.
// =============================================================================

let panelWindow = null;

// 상태창 URL 버전 — 서버가 Cache-Control 을 주지 않아 브라우저가 옛 ExternalPanel.html 을 재사용하므로 바꿀 때마다 올린다
var EXT_PANEL_VERSION = '20261003b';
var EXT_ORIGIN   = (location.origin && location.origin !== 'null') ? location.origin : '*';
var EXT_POLL_MS  = 1000;
var EXT_POLL_MAX_FAILURES = 10;   // 연속 조회 실패가 이 횟수를 넘으면 폴링 중단
var EXT_LOG_MAX  = 500;           // 상태창 재오픈 시 다시 보낼 로그 수
var EXT_ROW_MAX  = 2000;          // 결과표 행 보관 수 (poc_manager 는 outputs 를 최대 1000건 보관)

var _ext = {
    phase:       'idle',   // idle | pushing | pushed | running | succeeded | failed
    request_id:  null,
    push:        null,     // { request_id, project_name, count, run_ids, start_t, end_t, names, embedded }
    run_started: false,    // 이 PUSH 에 RUN 을 보냈는지
    rendered:    0,        // outputs 중 이미 그린 개수 (GET 은 매번 전체 outputs 를 준다)
    status:      null,     // 마지막 GET 응답의 status
    truncated:   false,
    failures:    0,
    poll_timer:  null,
    summary:     null,     // 마지막 응답 요약 (outputs 제외)
    last:        null,     // 마지막 응답 원본 (상태창 JSON 보기/저장용)
    logs:        [],
    rows:        [],
    health:      null,     // { ok, text }
    meta:        {}        // run_id → { printWins:[{orig_iid, win_id}], graphWins:[...] } 조합기 결과창
};

function _ext_url(path) { return api_server_url + path; }

function _ext_post(msg) {
    if (panelWindow && !panelWindow.closed) panelWindow.postMessage(msg, EXT_ORIGIN);
}

/** 로그 한 줄 (level: info | ok | warn | error) — 상태창이 닫혀 있어도 보관했다가 열릴 때 보낸다 */
function ext_log(level, text) {
    var entry = { level: level, text: String(text), time: _fmt_time(new Date()).slice(11) };
    _ext.logs.push(entry);
    if (_ext.logs.length > EXT_LOG_MAX) _ext.logs.shift();
    _ext_post({ type: 'EXT_LOG', entry: entry });
}

// 기존 호출부(rest_run 콜백 등) 호환
function appendLogToPanel(message) { ext_log('info', message); }

/** 지금 조합기에 올려진 모델 정보 — PUSH 하면 이 모델이 전송된다 */
function _ext_designer_state() {
    var models = (_root_model && Array.isArray(_root_model.models)) ? _root_model.models : [];
    return {
        project_name: document.all.project_name.value,
        start_t:      document.all.sim_start_time.value,
        end_t:        document.all.sim_end_time.value,
        tab_count:    tabs.length,
        models:       models.map(function(m) { return m.model_name; })
    };
}

function _ext_state() {
    var p = _ext.push;
    return {
        phase:      _ext.phase,
        request_id: _ext.request_id,
        push:       p ? { project_name: p.project_name, count: p.count, start_t: p.start_t, end_t: p.end_t } : null,
        designer:   _ext_designer_state(),
        health:     _ext.health,
        urls: {
            push:   _ext_url('/api/simulations/push'),
            run:    _ext_url('/api/simulations/run'),
            status: _ext_url('/api/simulations/')
        }
    };
}

function _ext_send_state() { _ext_post({ type: 'EXT_STATE', state: _ext_state() }); }

/** 상태창이 (다시) 열렸을 때 로그·결과·상태를 한 번에 보낸다 */
function _ext_sync_panel() {
    _ext_post({ type: 'EXT_SYNC', state: _ext_state(), logs: _ext.logs, rows: _ext.rows,
                summary: _ext.summary, last: _ext.last });
}

function open_External_Panel() {
    if (panelWindow && !panelWindow.closed) {
        panelWindow.focus();
        _ext_sync_panel();
        return;
    }
    // 상태창은 로드되면 EXT_HELLO 를 보내고, 그때 로그·상태를 동기화한다.
    panelWindow = window.open('ExternalPanel.html?v=' + EXT_PANEL_VERSION, 'ExternalPanel',
        'width=1180,height=880,menubar=no,toolbar=no,location=no');
}

// ── REST 공통 ────────────────────────────────────────────────────────────

function _ext_parse(text) {
    try { return JSON.parse(text); } catch (e) { return null; }
}

/** 응답을 { ok, status, body(JSON 또는 null), text } 로 돌려준다. 네트워크 오류만 reject. */
function _ext_request(method, path, body) {
    var opt = { method: method, cache: 'no-store', headers: { 'Accept': 'application/json' } };
    if (body !== undefined) {
        opt.headers['Content-Type'] = 'application/json; charset=utf-8';
        opt.body = (typeof body === 'string') ? body : JSON.stringify(body);
    }
    return fetch(_ext_url(path), opt).then(function(res) {
        return res.text().then(function(text) {
            return { ok: res.ok, status: res.status, body: _ext_parse(text), text: text };
        });
    });
}

// poc_manager 오류 형식 { error: { status, message } } 를 한 줄로
function _ext_error_text(r) {
    var b = r.body;
    var msg = (b && b.error && b.error.message) ? b.error.message : String(r.text || '').slice(0, 200);
    return 'HTTP ' + r.status + (msg ? ' — ' + msg : '');
}

/**
 * 상태창에서 바꾼 SIM_TIME 종료 시간을 조합기 입력칸에 반영한다 (두 창이 같은 값을 쓰도록).
 * 0(시작 시간) 이상의 숫자가 아니면 바꾸지 않고 false.
 */
function _ext_apply_end_time(value) {
    var end_t = Number(value);
    var start_t = parseFloat(document.all.sim_start_time.value) || 0;
    if (value === '' || value === null || !isFinite(end_t) || end_t < start_t) {
        ext_log('error', 'SIM_TIME(종료 시간)을 ' + start_t + ' 이상의 숫자로 입력하세요. (입력값: ' + value + ')');
        return false;
    }
    var before = document.all.sim_end_time.value;
    if (parseFloat(before) !== end_t) {
        document.all.sim_end_time.value = String(end_t);
        ext_log('info', 'SIM_TIME 종료 시간 ' + before + ' → ' + end_t + ' (조합기 SIM_TIME 에도 반영)');
    }
    return true;
}

function _ext_read_times() {
    var start_t = parseFloat(document.all.sim_start_time.value);
    var end_t   = parseFloat(document.all.sim_end_time.value);
    if (!isFinite(start_t)) start_t = 0;
    if (!isFinite(end_t) || end_t < start_t) return null;
    return { start_t: start_t, end_t: end_t };
}

// 상태창 입력값(1–3600). 비우면 poc_manager 기본값을 쓴다.
function _ext_timeout(opts) {
    var t = parseInt(opts && opts.timeout_seconds, 10);
    return (t >= 1 && t <= 3600) ? t : undefined;
}

/** poc_manager(/api/health) 연결 확인. 응답이 poc_manager 형식이 아니면 nginx 프록시 대상이 다른 것이다. */
function ext_check_health(log_result) {
    return _ext_request('GET', '/api/health').then(function(r) {
        var b = r.body;
        if (r.ok && b && b.status === 'ok') {
            _ext.health = { ok: true, text: 'REST API 연결됨' };
            if (log_result) ext_log('ok', 'REST API(poc_manager) 정상 — 실행 ' + b.active + ' · 대기 ' + b.pending + ' · PUSH 대기 ' + b.pushed);
        } else {
            _ext.health = { ok: false, text: 'REST API 응답 이상 (HTTP ' + r.status + ')' };
            if (log_result) ext_log('error', 'GET ' + _ext_url('/api/health') + ' 응답이 poc_manager 가 아닙니다 (' + _ext_error_text(r)
                + '). nginx /api/ 프록시가 poc_manager 포트로 가는지 확인하세요.');
        }
    }, function(e) {
        _ext.health = { ok: false, text: 'REST API 연결 실패' };
        if (log_result) ext_log('error', 'REST API 연결 실패: ' + e.message);
    }).then(_ext_send_state);
}

// ── PUSH ────────────────────────────────────────────────────────────────

function _ext_reset_result() {
    _ext_stop_poll();
    _ext.rendered  = 0;
    _ext.status    = null;
    _ext.truncated = false;
    _ext.failures  = 0;
    _ext.summary   = null;
    _ext.last      = null;
    _ext.rows      = [];
    _ext_post({ type: 'EXT_RESULT_RESET' });
}

/** 조합기에 올려진 모델을 Push JSON 으로 만들어 POST /api/simulations/push */
function ext_push(opts) {
    if (_ext.phase === 'pushing' || _ext.phase === 'running') {
        ext_log('warn', (_ext.phase === 'pushing' ? 'PUSH' : 'RUN') + ' 진행 중입니다. 끝난 뒤 다시 시도하세요.');
        return;
    }
    var project_name = document.all.project_name.value;
    if (!String(project_name || '').trim()) { ext_log('error', '프로젝트 명을 입력하세요.'); return; }
    if (!_root_model || !_root_model.models || _root_model.models.length === 0) {
        ext_log('error', '조합기에 올려진 모델이 없습니다. 모델을 먼저 로드하세요.');
        return;
    }
    if (opts && opts.end_t !== undefined && !_ext_apply_end_time(opts.end_t)) return;
    var times = _ext_read_times();
    if (!times) { ext_log('error', 'SIM_TIME(종료 시간)을 0 이상의 숫자로 입력하세요.'); return; }

    saveUIToActiveTab();
    var payload = simulationParamPayload();
    var body = _min_sim_messages([_multi_load_packet(project_name, payload, times.start_t, times.end_t)]);
    var timeout = _ext_timeout(opts);
    if (timeout) body.timeout_seconds = timeout;   // poc_manager 옵션 (패킷 최상위)
    var text = JSON.stringify(body);
    var count = payload.param_sets.length;

    _ext_reset_result();
    _ext.phase       = 'pushing';
    _ext.request_id  = null;
    _ext.push        = null;
    _ext.run_started = false;
    _ext_send_state();
    ext_log('info', 'PUSH 전송 → POST ' + _ext_url('/api/simulations/push') + '  (프로젝트 ' + project_name
        + ', 병렬 ' + count + '개, ' + (text.length / 1024).toFixed(1) + ' KB)');

    _ext_request('POST', '/api/simulations/push', text).then(function(r) {
        var b = r.body || {};
        _ext_show_response(b);
        if (r.ok && b.status === 'pushed' && b.request_id) {
            _ext.phase      = 'pushed';
            _ext.request_id = b.request_id;
            _ext.push = {
                request_id:   b.request_id,
                project_name: b.project_name || project_name,
                count:        b.count || count,
                run_ids:      payload.param_sets.map(function(s) { return s.run_id; }),
                start_t:      times.start_t,
                end_t:        times.end_t,
                names:        _ext_model_names(payload.json_data),
                embedded:     _ext_embedded_models(payload.json_data)
            };
            ext_log('ok', 'PUSH 완료 — request_id: ' + b.request_id + '  (엔진 ' + _ext.push.count + '개 로드)');
        } else {
            _ext.phase      = 'failed';
            _ext.request_id = b.request_id || null;
            ext_log('error', 'PUSH 실패 — ' + _ext_error_text(r));
        }
    }, function(e) {
        _ext.phase = 'failed';
        ext_log('error', 'PUSH 요청 실패 (네트워크): ' + e.message);
    }).then(_ext_send_state);
}

function _ext_model_names(root) {
    var names = {};
    walkModels(root, function(m) { names[m.iid] = m.model_name; });
    return names;
}

// 결과창을 만들 PRINT / GRAPH 2D 모델 (PUSH 한 JSON 기준 — 그 뒤 화면을 바꿔도 엔진은 이 모델로 돈다)
function _ext_embedded_models(root) {
    var list = [];
    walkModels(root, function(m) {
        if (m.model_type === MODEL_TYPE.EMBEDED_FUNC_PRINT || m.model_type === MODEL_TYPE.EMBEDED_FUNC_GRAPH_2D)
            list.push({ iid: m.iid, model_name: m.model_name, model_type: m.model_type });
    });
    return list;
}

// ── RUN ─────────────────────────────────────────────────────────────────

/** PUSH 한 엔진을 Run JSON 으로 실행: POST /api/simulations/run → 결과는 GET 폴링 */
function ext_run(opts) {
    var p = _ext.push;
    if (_ext.phase !== 'pushed' || !p) {
        ext_log('warn', _ext.phase === 'running' ? 'RUN 진행 중입니다.'
            : '먼저 PUSH 를 완료하세요. (RUN 이 끝나면 엔진이 정리되므로 다시 실행할 때도 PUSH 부터 합니다)');
        return;
    }
    if (opts && opts.end_t !== undefined && !_ext_apply_end_time(opts.end_t)) return;
    var times = _ext_read_times();
    if (!times) { ext_log('error', 'SIM_TIME(종료 시간)을 0 이상의 숫자로 입력하세요.'); return; }

    var body = _min_sim_messages([_multi_run_packet(p.project_name, p.count, times.start_t, times.end_t)]);
    body.request_id = p.request_id;               // 이 PUSH 의 엔진을 실행 (poc_manager 옵션)
    var timeout = _ext_timeout(opts);
    if (timeout) body.timeout_seconds = timeout;

    _ext_reset_result();
    _ext.phase       = 'running';
    _ext.run_started = true;
    _ext_create_windows(p);
    _ext_send_state();
    ext_log('info', 'RUN 전송 → POST ' + _ext_url('/api/simulations/run') + '  (request_id ' + p.request_id
        + ', 시간 ' + times.start_t + '~' + times.end_t + ')');

    _ext_request('POST', '/api/simulations/run', body).then(function(r) {
        var b = r.body || {};
        if (r.ok) {
            ext_log('ok', 'RUN 접수 (' + b.status + ') — 결과 조회: GET ' + _ext_url('/api/simulations/' + p.request_id));
            _ext_on_snapshot(b);
            if (_ext.phase === 'running') _ext_schedule_poll();
        } else {
            _ext.phase = 'failed';
            _ext_show_response(b);
            ext_log('error', 'RUN 실패 — ' + _ext_error_text(r));
        }
    }, function(e) {
        // 요청이 서버에 닿았는지 알 수 없으므로 조회로 확인한다
        ext_log('warn', 'RUN 응답을 받지 못했습니다 (' + e.message + ') — 상태를 조회합니다.');
        _ext_schedule_poll();
    }).then(_ext_send_state);
}

// ── 조회(GET) / 폴링 ─────────────────────────────────────────────────────

function _ext_stop_poll() {
    if (_ext.poll_timer) clearTimeout(_ext.poll_timer);
    _ext.poll_timer = null;
}

function _ext_schedule_poll() {
    _ext_stop_poll();
    _ext.poll_timer = setTimeout(_ext_poll, EXT_POLL_MS);
}

function _ext_poll() {
    _ext.poll_timer = null;
    var id = _ext.request_id;
    if (!id || _ext.phase !== 'running') return;
    _ext_request('GET', '/api/simulations/' + encodeURIComponent(id)).then(function(r) {
        if (id !== _ext.request_id || _ext.phase !== 'running') return;   // 그 사이 새 PUSH
        if (r.ok && r.body) {
            _ext.failures = 0;
            _ext_on_snapshot(r.body);
        } else if (r.status === 404) {
            _ext.phase = 'failed';
            ext_log('error', '조회 실패 — ' + _ext_error_text(r) + ' (만료됐거나 poc_manager 가 재시작됨)');
            _ext_send_state();
            return;
        } else {
            _ext_poll_failed(_ext_error_text(r));
        }
        if (_ext.phase === 'running') _ext_schedule_poll();
    }, function(e) {
        if (id !== _ext.request_id || _ext.phase !== 'running') return;
        _ext_poll_failed(e.message);
        if (_ext.phase === 'running') _ext_schedule_poll();
    });
}

function _ext_poll_failed(reason) {
    _ext.failures++;
    if (_ext.failures === 1) ext_log('warn', '조회 실패 — ' + reason + ' (재시도)');
    if (_ext.failures >= EXT_POLL_MAX_FAILURES) {
        _ext.phase = 'failed';
        ext_log('error', '조회가 ' + _ext.failures + '회 연속 실패해 중단합니다. [결과 조회] 로 다시 확인할 수 있습니다.');
        _ext_send_state();
    }
}

function _ext_terminal(status) { return status === 'succeeded' || status === 'failed'; }

/** 상태창의 [결과 조회] — 현재 request_id 를 GET */
function ext_query() {
    var id = _ext.request_id;
    if (!id) { ext_log('warn', '조회할 request_id 가 없습니다. 먼저 PUSH 하세요.'); return; }
    // 조회 실패로 폴링이 멈춘 RUN 이면 폴링을 다시 시작한다 (조합기 결과창에도 이어서 그린다)
    if (_ext.run_started && !_ext_terminal(_ext.status)) {
        _ext.phase    = 'running';
        _ext.failures = 0;
        ext_log('info', '조회 재개 → GET ' + _ext_url('/api/simulations/' + id));
        _ext_send_state();
        _ext_stop_poll();
        _ext_poll();
        return;
    }
    ext_log('info', '조회 → GET ' + _ext_url('/api/simulations/' + id));
    _ext_request('GET', '/api/simulations/' + encodeURIComponent(id)).then(function(r) {
        if (!r.ok || !r.body) { ext_log('error', '조회 실패 — ' + _ext_error_text(r)); return; }
        if (id !== _ext.request_id) return;
        _ext_show_response(r.body);
        var n = Array.isArray(r.body.outputs) ? r.body.outputs.length : 0;
        ext_log('info', '상태: ' + r.body.status + ' · outputs ' + n + '건'
            + (r.body.error ? ' · 오류: ' + r.body.error.message : ''));
    }, function(e) {
        ext_log('error', '조회 실패 (네트워크): ' + e.message);
    });
}

var EXT_STATUS_TEXT = {
    queued_run:     'RUN 대기열',
    running:        '실행 중',
    waiting_result: '결과 콜백 대기',
    succeeded:      '완료',
    failed:         '실패'
};

function _ext_summary(s) {
    var o = {};
    Object.keys(s || {}).forEach(function(k) { if (k !== 'outputs') o[k] = s[k]; });
    o.outputs_count = Array.isArray(s && s.outputs) ? s.outputs.length : 0;
    return o;
}

function _ext_show_response(s) {
    _ext.summary = _ext_summary(s);
    _ext.last    = s;
    _ext_post({ type: 'EXT_RESULT', summary: _ext.summary, rows: [], last: s });
}

/** RUN 이후 GET 응답 처리: 새 outputs 만 조합기 결과창·상태창 결과표에 추가하고, 끝나면 마무리 */
function _ext_on_snapshot(s) {
    var outputs = Array.isArray(s.outputs) ? s.outputs : [];
    var fresh   = outputs.slice(_ext.rendered);
    var rows    = [];
    if (fresh.length) {
        var base = _ext.rendered;
        _ext.rendered = outputs.length;
        _ext_route_outputs(fresh);
        rows = fresh.map(function(d, i) { return _ext_row(d, base + i); });
        Array.prototype.push.apply(_ext.rows, rows);
        if (_ext.rows.length > EXT_ROW_MAX) _ext.rows.splice(0, _ext.rows.length - EXT_ROW_MAX);
    }
    var terminal = _ext_terminal(s.status);
    _ext.summary = _ext_summary(s);
    _ext.last    = terminal ? s : null;   // 진행 중에는 요약만 보내고, 끝나면 원본 전체를 보낸다
    _ext_post({ type: 'EXT_RESULT', summary: _ext.summary, rows: rows, last: _ext.last });

    if (s.status !== _ext.status) {
        _ext.status = s.status;
        if (!terminal) ext_log('info', '상태: ' + (EXT_STATUS_TEXT[s.status] || s.status) + ' (' + s.status + ')');
    }
    if (s.outputs_truncated && !_ext.truncated) {
        _ext.truncated = true;
        ext_log('warn', 'poc_manager 가 outputs 를 최대 1000건(2 MiB)까지만 보관합니다 — 이후 결과는 조회되지 않습니다.');
    }
    if (!terminal) return;

    _ext_stop_poll();
    _ext.phase = s.status;
    Object.keys(_ext.meta).forEach(function(rid) { _mr_mark_window_done(rid, _ext.meta); });
    if (s.status === 'succeeded') {
        ext_log('ok', 'RUN 완료 — outputs ' + outputs.length + '건' + _ext_stop_text(s.run_response));
    } else {
        var err = s.error ? ('HTTP ' + s.error.status + ' — ' + s.error.message) : '원인 미상';
        ext_log('error', 'RUN 실패 — ' + err);
    }
    ext_log('info', '다시 실행하려면 PUSH 부터 다시 하세요. (RUN 이 끝나면 poc_manager 가 엔진을 정리합니다)');
    _ext_send_state();
}

// 병렬 RUN 의 run_response 는 run_id 별 stop 응답 배열
function _ext_stop_text(run_response) {
    var list = Array.isArray(run_response) ? run_response : (run_response ? [run_response] : []);
    if (!list.length) return '';
    return ', 종료 응답: ' + list.map(function(r) {
        return (r.run_id !== undefined ? 'param' + (r.run_id + 1) + ' ' : '') + 'stop ' + r.stop;
    }).join(', ');
}

function _ext_row(d, index) {
    var names = _ext.push ? _ext.push.names : {};
    return {
        n:        index + 1,
        run_id:   d.run_id,
        sim_time: d.sim_time,
        model:    (d.iid && names[d.iid]) || d.iid || '',
        port:     d.src_port_name,
        value:    d.value
    };
}

// ── 조합기 결과창 (병렬실행 결과창과 같은 모양, 별도 묶음 _ext.meta) ─────────

function _ext_create_windows(p) {
    Object.keys(_ext.meta).forEach(function(rid) { _mr_destroy_run_windows(rid, _ext.meta); });
    _ext.meta = {};
    if (!p.embedded.length) {
        ext_log('info', '모델에 PRINT/GRAPH 출력 모델이 없어 조합기 결과창은 만들지 않습니다. 결과는 상태창 결과표에서 확인하세요.');
        return;
    }
    p.run_ids.forEach(function(rid) {
        var label = 'REST param' + (rid + 1);
        var meta  = _ext.meta[rid] = { printWins: [], graphWins: [] };
        p.embedded.forEach(function(m) {
            var win_id = 'ext_' + rid + '_' + m.iid;
            if (m.model_type === MODEL_TYPE.EMBEDED_FUNC_PRINT) {
                _mr_add_print_window(win_id, label, m.model_name);
                meta.printWins.push({ orig_iid: m.iid, win_id: win_id });
            } else {
                _mr_add_graph_window(win_id, label, m.model_name);
                meta.graphWins.push({ orig_iid: m.iid, win_id: win_id });
            }
        });
    });
}

function _ext_escape(v) {
    return String(v).replace(/[&<>"']/g, function(c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

/** outputs 묶음을 창별로 모아 PRINT 는 한 번에 붙이고 GRAPH 는 한 번만 다시 그린다 */
function _ext_route_outputs(list) {
    var prints = {}, graphs = {};
    list.forEach(function(d) {
        var meta = d && _ext.meta[d.run_id];
        if (!meta) return;
        var pw = meta.printWins.find(function(w) { return w.orig_iid === d.iid; });
        if (pw) {
            (prints[pw.win_id] = prints[pw.win_id] || []).push(
                Number(d.sim_time).toFixed(2) + '][' + _ext_escape(d.src_port_name) + '] ' + _ext_escape(d.value));
            return;
        }
        var gw = meta.graphWins.find(function(w) { return w.orig_iid === d.iid; });
        if (gw) {
            (graphs[gw.win_id] = graphs[gw.win_id] || []).push(
                { key: d.src_port_name, x: Math.round(d.sim_time * 1e3) / 1e3, y: d.value });
        }
    });
    Object.keys(prints).forEach(function(win_id) {
        var el = document.getElementById(win_id + '_div_content');
        if (!el) return;
        el.insertAdjacentHTML('beforeend', prints[win_id].join('<br>') + '<br>');
        el.scrollTop = el.scrollHeight;
    });
    Object.keys(graphs).forEach(function(win_id) { graph_add_batch(win_id, graphs[win_id]); });
}

// 조합기에서 SIM_TIME / 프로젝트 명을 바꾸면 열린 상태창 표시도 바로 갱신한다
// (이 스크립트는 <head> 에서 로드되므로 입력칸 대신 document 에 위임)
document.addEventListener('input', function(e) {
    var name = e.target && e.target.name;
    if ((name === 'sim_end_time' || name === 'project_name') && panelWindow && !panelWindow.closed) _ext_send_state();
});

// ── 상태창 메시지 ─────────────────────────────────────────────────────────

window.addEventListener('message', function(event) {
    if (EXT_ORIGIN !== '*' && event.origin !== EXT_ORIGIN) return;
    var d = event.data;
    if (!d || !d.type) return;
    var known = ['EXT_HELLO', 'REQUEST_REFRESH', 'EXT_STATE_REQ', 'EXT_SET_TIME', 'EXT_PUSH', 'EXT_RUN', 'EXT_QUERY'];
    if (known.indexOf(d.type) < 0) return;
    // 조합기를 새로고침해도 열려 있던 상태창이 다시 붙을 수 있도록 보낸 창을 기억한다
    panelWindow = event.source;
    switch (d.type) {
        case 'EXT_HELLO':          // 상태창 로드 완료
            _ext_sync_panel();
            ext_check_health(true);
            break;
        case 'REQUEST_REFRESH':    // 상태창 [새로고침]
            _ext_sync_panel();
            ext_check_health(true);
            break;
        case 'EXT_STATE_REQ':      // 상태창 포커스 — 조합기 모델/시간이 바뀌었을 수 있다
            _ext_send_state();
            break;
        case 'EXT_SET_TIME':       // 상태창에서 SIM_TIME 종료 시간 변경
            _ext_apply_end_time(d.end_t);
            _ext_send_state();     // 거부된 값이면 조합기 값으로 되돌려 표시
            break;
        case 'EXT_PUSH':  ext_push(d);  break;
        case 'EXT_RUN':   ext_run(d);   break;
        case 'EXT_QUERY': ext_query();  break;
    }
    // 상태창은 클릭 즉시 버튼을 잠그므로, 입력 오류로 요청을 보내지 않은 경우에도 상태를 돌려줘 다시 풀리게 한다
    if (d.type === 'EXT_PUSH' || d.type === 'EXT_RUN') _ext_send_state();
});
