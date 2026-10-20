// =============================================================================
//  모델관리 (모델 탭: 목록 / 추가 / 삭제, 패키지 탭: 이름변경 / 삭제)
//
//  목록 : Node API  /get_all_model_list  -> DB 의 원자·커플드 모델 + 사용처(참조하는 커플드 모델)
//  추가 : 브라우저에서 고른 .py / .dll 을 atomic_model_manager(GUI WS 8870, /model) 로 보낸다.
//         매니저가 sim_engine/projects/<프로젝트>/<파일> 로 저장하고 콘솔 "update" 와 같은
//         인벤토리 갱신으로 DB 에 등록한다.
//  삭제 : 원자모델은 매니저가 서버 파일을 먼저 지우고(deleteatomicmodel),
//         원자·커플드 모두 Node API /delete_model_info 로 DB 행을 지운다.
//  패키지(= 프로젝트 폴더 sim_engine/projects/<패키지> + DB 의 패키지·모델 정보)
//    이름변경 : 매니저가 폴더와 인벤토리를 옮기고(renameatomicproject), Node API /rename_project 가
//               DB 패키지명·원자모델 등록 정보·모든 커플드 모델의 하위 모델 참조(file_path)를 바꾼다.
//               DB 변경이 실패하면 폴더 이름을 되돌린다.
//    삭제     : 매니저가 폴더를 지우고(deleteatomicproject, 사용 중인 파일이 있으면 아무것도 지우지 않음),
//               Node API /delete_project 가 DB 의 패키지·모델 행을 지운다.
//  추가·삭제·이름변경 후에는 툴바 아톰모델 목록과 좌측 드래그 목록(모델리스트)을 다시 그린다.
//
//  atomic_model_manager 메시지 (req_id 로 응답을 찾는다)
//    uploadatomicmodel   { project_name, file_name, content(base64), overwrite } -> atomic_upload
//    deleteatomicmodel   { project_name, file_name }                            -> atomic_delete
//    listatomicfiles     {}                                                     -> atomic_files
//    renameatomicproject { project_name, new_project_name }                     -> atomic_project_rename
//    deleteatomicproject { project_name }                                       -> atomic_project_delete
// =============================================================================

// 서버(atomic_manager.cpp)와 같은 규칙. 20MB 의 base64 가 WebSocket 메시지 한도(32MB) 안에 들어간다.
const AU_MAX_BYTES = 20 * 1024 * 1024;
const AU_NAME_RE = /^[A-Za-z0-9_-]{1,64}$/;
const AU_RESERVED_RE = /^(CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9])$/i;

const AU_ERRORS = {
    invalid_project_name: '프로젝트 이름은 영문·숫자·_·- 로 1~64자여야 합니다.',
    invalid_file_name: '파일 이름은 영문·숫자·_·- 로 1~64자(+ .py/.dll)여야 합니다.',
    unsupported_extension: '.py, .dll 파일만 업로드할 수 있습니다.',
    too_large: '파일이 20MB 를 넘습니다.',
    empty_file: '빈 파일입니다.',
    bad_base64: '전송 중 데이터가 손상되었습니다. 다시 시도하세요.',
    not_x64_dll: '64비트(x64) Windows DLL 이 아닙니다.',
    not_text: 'Python 모델은 텍스트 파일이어야 합니다.',
    file_exists: '같은 이름의 파일이 이미 있습니다. "덮어쓰기"를 체크하고 다시 업로드하세요.',
    file_in_use: '실행 중인 모델이 사용 중입니다. 시뮬레이션을 중단한 뒤 다시 시도하세요.',
    write_failed: '서버에 파일을 저장하지 못했습니다.',
    delete_failed: '서버의 모델 파일을 지우지 못했습니다.',
    // 패키지 이름변경 / 삭제 (atomic_model_manager, Node API)
    invalid_new_project_name: '새 패키지 이름은 영문·숫자·_·- 로 1~64자여야 합니다.',
    same_project_name: '현재 이름과 같습니다.',
    project_exists: '같은 이름의 패키지가 이미 있습니다. 다른 이름을 입력하세요.',
    project_in_use: '실행 중인 모델이 이 패키지의 파일을 사용 중입니다. 시뮬레이션을 중단한 뒤 다시 시도하세요.',
    rename_failed: '서버의 패키지 폴더 이름을 바꾸지 못했습니다.',
    builtin: '시스템 기본 모델이 들어 있는 패키지는 바꾸거나 삭제할 수 없습니다.',
    db_error: 'DB 처리 중 오류가 발생했습니다.'
};
const AU_MANAGER_DOWN = '원자모델 관리자(atomic_model_manager)에 연결할 수 없습니다. 서버에서 실행 중인지 확인하세요.';
const AM_PROJECT_UNSUPPORTED = '원자모델 관리자가 응답하지 않습니다. 패키지 이름변경·삭제 기능이 없는 이전 버전일 수 있으니 서버의 atomic_model_manager 를 확인하세요.';

function _au_el(id) { return document.getElementById(id); }

function _au_check_name(name) {
    return AU_NAME_RE.test(name) && !AU_RESERVED_RE.test(name);
}

function _au_set_status(id, text, is_error) {
    let status = _au_el(id);
    status.textContent = text;
    status.className = 'au-status' + (is_error ? ' au-error' : '');
}

// -----------------------------------------------------------------------------
//  atomic_model_manager 연결 (ws2 : sim_connector.js)
// -----------------------------------------------------------------------------
let _au_pending = {};        // req_id -> { resolve }
let _au_files_timer = 0;     // listatomicfiles 응답 대기 (구버전 매니저는 응답하지 않는다)

// ws2 가 끊겨 있으면 다시 연결한다.
function _au_model_ws() {
    return new Promise((resolve, reject) => {
        if (ws2 && ws2.websocket.readyState === WebSocket.OPEN) {
            _au_bind(ws2);
            resolve(ws2);
            return;
        }
        if (!ws2 || ws2.websocket.readyState >= WebSocket.CLOSING) {
            let callbacks = ws2 ? ws2.on_data_callback : {};
            ws2 = new model_connector(WS_BASE + '/model');
            ws2.on_data_callback = callbacks;
        }
        let socket = ws2.websocket;
        let timer = setTimeout(() => reject(new Error('timeout')), 5000);
        socket.addEventListener('open', () => { clearTimeout(timer); _au_bind(ws2); resolve(ws2); }, { once: true });
        socket.addEventListener('close', () => { clearTimeout(timer); reject(new Error('closed')); }, { once: true });
    });
}

function _au_bind(conn) {
    let settle = (json) => {
        let pending = _au_pending[json.Data.req_id];
        if (pending) pending.resolve(json.Data);
    };
    conn.on_data_callback['atomic_upload'] = settle;
    conn.on_data_callback['atomic_delete'] = settle;
    conn.on_data_callback['atomic_project_rename'] = settle;
    conn.on_data_callback['atomic_project_delete'] = settle;
    conn.on_data_callback['atomic_files'] = (json) => {
        clearTimeout(_au_files_timer);
        _au_server_listed = true;
        _au_server_files = {};
        (json.Data.projects || []).forEach((p) => {
            _au_server_files[p.name] = new Set((p.files || []).map((f) => f.name.toLowerCase()));
        });
        let list = _au_el('au_project_list');
        list.innerHTML = '';
        Object.keys(_au_server_files).sort().forEach((name) => {
            let option = document.createElement('option');
            option.value = name;
            list.appendChild(option);
        });
        _au_render();
        // 패키지 탭의 "서버 파일" 열도 이 목록으로 그린다.
        if (_au_el('am_overlay').style.display !== 'none') _am_render();
    };
}

// 요청을 보내고 같은 req_id 의 응답을 기다린다. on_progress 를 주면 전송률(%)을 알려준다.
function _au_request(conn, type, data, timeout_ms, on_progress) {
    return new Promise((resolve, reject) => {
        let req_id = 'au' + Date.now() + Math.random().toString(36).substring(2, 8);
        let message = JSON.stringify({ Type: type, Data: Object.assign({}, data, { req_id: req_id }) });
        let socket = conn.websocket;
        let progress = 0;
        if (on_progress) {
            let start = socket.bufferedAmount;
            progress = setInterval(() => {
                let sent = message.length - Math.max(0, socket.bufferedAmount - start);
                on_progress(Math.min(100, Math.floor(sent * 100 / message.length)));
            }, 200);
        }
        let finish = () => {
            clearInterval(progress);
            clearTimeout(_au_pending[req_id].timer);
            delete _au_pending[req_id];
        };
        _au_pending[req_id] = {
            resolve: (res) => { finish(); resolve(res); },
            timer: setTimeout(() => { finish(); reject(new Error('서버 응답 시간 초과')); }, timeout_ms)
        };
        socket.addEventListener('close', () => {
            if (!_au_pending[req_id]) return;
            finish();
            reject(new Error('처리 중 서버 연결이 끊어졌습니다.'));
        }, { once: true });
        socket.send(message);
    });
}

function _au_post(path, data) {
    return new Promise((resolve, reject) => {
        send_post_ex(api_server_url + path, data, resolve, () => reject(new Error(path + ' 요청 실패')));
    });
}

// 툴바의 아톰모델 목록과 좌측 드래그 목록(모델리스트)을 다시 그린다.
// 바뀐 프로젝트를 선택해 추가된 모델은 바로 끌어다 쓸 수 있고, 삭제된 모델은 사라진다.
function _am_refresh_views(project) {
    req_atomic_list('atomicmodule_list');
    req_list_projects('module_list', () => {
        let list = _au_el('module_list');
        if (project && Array.from(list.options).some((o) => o.value === project)) list.value = project;
        req_list_models(list.value);
    });
}

// -----------------------------------------------------------------------------
//  모델관리 창 - 모델 탭
// -----------------------------------------------------------------------------
let _am_models = [];
let _am_selected = null;     // project_name/kind/uid
let _am_busy = false;
let _am_tab = 'models';      // 'models' | 'packages'
let _am_projects = [];       // DB 의 패키지 이름 (get_all_model_list.projects)
let _am_pkg_selected = null; // 선택한 패키지 이름(소문자)
let _au_server_listed = false; // listatomicfiles 응답을 받아 _au_server_files 가 유효한지

function _am_key(m) { return m.project_name + '/' + m.kind + '/' + m.uid; }

function open_atomic_manage() {
    _au_el('am_overlay').style.display = 'flex';
    _au_set_status('am_status', '');
    am_reload();
}

function close_atomic_manage() {
    if (_am_busy) return;
    _au_el('am_overlay').style.display = 'none';
}

// show_project: 프로젝트 필터가 걸려 있으면 이 프로젝트로 바꿔 방금 추가한 모델이 보이게 한다.
function am_reload(show_project) {
    _am_request_files();
    return _au_post('/get_all_model_list', { _: '' }).then((res) => {
        if (res.result != 1) throw new Error('result ' + res.result);
        _am_models = res.data;
        _am_projects = res.projects || [];
        let select = _au_el('am_project');
        let prev = select.value;
        let names = new Set(res.projects || []);
        _am_models.forEach((m) => names.add(m.project_name));
        select.innerHTML = '<option value="">전체</option>';
        Array.from(names).sort().forEach((name) => {
            let option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });
        select.value = names.has(prev) ? prev : '';
        if (show_project && select.value && names.has(show_project)) select.value = show_project;
        if (!_am_models.some((m) => _am_key(m) === _am_selected)) _am_selected = null;
        _am_render();
    }).catch(() => {
        _am_models = [];
        _am_projects = [];
        _am_render();
        _au_set_status('am_status', '모델 목록을 불러오지 못했습니다. 서버의 Node API(/get_all_model_list)가 최신 버전인지 확인하세요.', true);
    });
}

function _am_visible() {
    let project = _au_el('am_project').value;
    let kind = _au_el('am_kind').value;
    let search = _au_el('am_search').value.trim().toLowerCase();
    return _am_models.filter((m) =>
        (!project || m.project_name === project) && (!kind || m.kind === kind) &&
        (!search || (m.model_name + ' ' + m.file_name).toLowerCase().includes(search)));
}

function am_show_tab(tab) {
    if (_am_busy || tab === _am_tab) return;
    _am_tab = tab;
    am_project_rename_cancel();
    _au_set_status('am_status', '');
    _am_render();
}

function _am_render() {
    let models_tab = _am_tab === 'models';
    _au_el('am_view_models').style.display = models_tab ? '' : 'none';
    _au_el('am_view_packages').style.display = models_tab ? 'none' : '';
    [['am_tab_models', models_tab], ['am_tab_packages', !models_tab]].forEach(([id, active]) => {
        let tab = _au_el(id);
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
        tab.disabled = _am_busy && !active;
    });
    ['am_btn_add', 'am_btn_delete'].forEach((id) => { _au_el(id).style.display = models_tab ? '' : 'none'; });
    ['am_btn_pkg_rename', 'am_btn_pkg_delete'].forEach((id) => { _au_el(id).style.display = models_tab ? 'none' : ''; });
    _au_el('am_btn_close').disabled = _am_busy;
    _am_render_models(models_tab);
    _am_render_packages(!models_tab);
}

function _am_render_models(shown) {
    let rows = _am_visible();
    let body = _au_el('am_rows');
    body.innerHTML = '';
    rows.forEach((m) => {
        let row = document.createElement('tr');
        let key = _am_key(m);
        if (key === _am_selected) row.className = 'am-selected';
        let cells = [
            m.kind === 'a' ? (m.builtin ? '원자 · 기본' : '원자') : '커플드',
            m.project_name, m.model_name, m.file_name, m.updated || '',
            m.used_by.length ? m.used_by.length + '개' : '-'
        ];
        cells.forEach((text, i) => {
            let cell = document.createElement('td');
            cell.textContent = text;
            cell.title = i === 5 && m.used_by.length ? '사용하는 커플드 모델\n' + m.used_by.join('\n') : text;
            if (i === 0) cell.className = m.kind === 'a' ? 'am-kind-a' : 'am-kind-c';
            row.appendChild(cell);
        });
        row.onclick = () => {
            if (_am_busy) return;
            _am_selected = key;
            _am_render();
        };
        body.appendChild(row);
    });
    _au_el('am_empty').style.display = rows.length ? 'none' : '';
    if (shown) _au_el('am_count').textContent = rows.length + '개 모델' + (rows.length !== _am_models.length ? ' (전체 ' + _am_models.length + ')' : '');
    let selected = _am_models.find((m) => _am_key(m) === _am_selected);
    let del = _au_el('am_btn_delete');
    del.disabled = _am_busy || !selected || selected.builtin;
    del.title = selected && selected.builtin ? '시스템 기본 모델은 삭제할 수 없습니다.' : '선택한 모델 삭제';
    _au_el('am_btn_add').disabled = _am_busy;
}

function am_add() {
    open_atomic_upload(_au_el('am_project').value);
}

async function am_delete() {
    let m = _am_models.find((x) => _am_key(x) === _am_selected);
    if (!m || m.builtin || _am_busy) return;
    let lines = ['정말로 삭제하시겠습니까?', '',
        '종류 : ' + (m.kind === 'a' ? '원자모델' : '커플드 모델'),
        '프로젝트 : ' + m.project_name,
        '모델 : ' + m.model_name + ' (' + m.file_name + ')', ''];
    lines.push(m.kind === 'a'
        ? '서버의 모델 파일(sim_engine/projects/' + m.project_name + '/' + m.file_name + ')과 DB 등록 정보가 함께 삭제됩니다.'
        : 'DB 에 저장된 커플드 모델이 삭제됩니다.');
    if (m.used_by.length) {
        lines.push('', '※ 이 모델을 사용하는 커플드 모델 ' + m.used_by.length + '개:');
        m.used_by.slice(0, 5).forEach((name) => lines.push('   - ' + name));
        if (m.used_by.length > 5) lines.push('   … 외 ' + (m.used_by.length - 5) + '개');
        lines.push('삭제하면 해당 커플드 모델은 이 모델 없이는 실행할 수 없습니다.');
    }
    if (!confirm(lines.join('\n'))) return;

    _am_busy = true;
    _am_render();
    _au_set_status('am_status', '삭제 중… ' + m.project_name + '/' + m.file_name);
    let note = '';
    try {
        if (m.kind === 'a') {
            let conn;
            try { conn = await _au_model_ws(); }
            catch (e) { throw new Error(AU_MANAGER_DOWN); }
            let file = await _au_request(conn, 'deleteatomicmodel', { project_name: m.project_name, file_name: m.file_name }, 30000);
            if (!file.ok) {
                // 웹 규칙에 맞지 않는 이름은 웹으로 올린 파일이 아니므로 DB 등록만 지운다.
                if (['invalid_project_name', 'invalid_file_name', 'unsupported_extension'].includes(file.error_code))
                    note = ' (서버 파일은 이름 규칙상 웹에서 지울 수 없어 남겨 두었습니다)';
                else
                    throw new Error(AU_ERRORS[file.error_code] || file.error || '서버 파일 삭제 실패');
            }
            else if (!file.deleted) note = ' (서버에 모델 파일은 없었습니다)';
        }
        let res = await _au_post('/delete_model_info', { kind: m.kind, uid: String(m.uid), project_name: m.project_name, file_name: m.file_name });
        if (res.result != 1) throw new Error('DB 삭제 실패');
        _am_selected = null;
        _au_set_status('am_status', (res.deleted ? '삭제했습니다: ' : 'DB 에 이미 없는 모델입니다: ') + m.project_name + '/' + m.file_name + note);
    }
    catch (e) {
        _au_set_status('am_status', '삭제하지 못했습니다 - ' + (e.message || e), true);
    }
    _am_busy = false;
    await am_reload();
    _am_refresh_views(m.project_name);
}

// -----------------------------------------------------------------------------
//  모델관리 창 - 패키지 탭
// -----------------------------------------------------------------------------
function _am_lower(name) { return String(name).toLowerCase(); }

// 패키지 탭의 "서버 파일" 열을 위해 서버 폴더 목록을 요청한다(응답은 _au_bind 의 atomic_files).
function _am_request_files() {
    _au_model_ws()
        .then((conn) => conn.send(JSON.stringify({ Type: 'listatomicfiles', Data: {} })))
        .catch(() => {
            _au_server_listed = false;
            if (_au_el('am_overlay').style.display !== 'none') _am_render();
        });
}

// DB 의 패키지·모델과 서버 폴더를 패키지별로 모은다. DB 와 Windows 폴더 모두 대소문자를 구분하지 않는다.
function _am_packages() {
    let map = new Map();
    let get = (name) => {
        let key = _am_lower(name);
        if (!map.has(key))
            map.set(key, { key: key, name: name, in_db: false, atomic: 0, coupled: 0, builtin: false, files: null, used_from: new Set() });
        return map.get(key);
    };
    _am_projects.forEach((name) => { get(name).in_db = true; });
    _am_models.forEach((m) => {
        let p = get(m.project_name);
        p.in_db = true;
        if (m.kind === 'a') p.atomic++;
        else p.coupled++;
        if (m.builtin) p.builtin = true;
        // 다른 패키지의 커플드 모델이 이 패키지의 모델을 쓰는 경우
        m.used_by.forEach((user) => {
            if (_am_lower(user.split('/')[0]) !== p.key) p.used_from.add(user);
        });
    });
    if (_au_server_listed)
        Object.keys(_au_server_files).forEach((name) => { get(name).files = _au_server_files[name].size; });
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
}

function _am_selected_package() {
    return _am_packages().find((p) => p.key === _am_pkg_selected) || null;
}

function _am_render_packages(shown) {
    let all = _am_packages();
    if (_am_pkg_selected && !all.some((p) => p.key === _am_pkg_selected)) _am_pkg_selected = null;
    let search = _au_el('am_pkg_search').value.trim().toLowerCase();
    let rows = all.filter((p) => !search || p.key.includes(search));
    let body = _au_el('am_pkg_rows');
    body.innerHTML = '';
    rows.forEach((p) => {
        let row = document.createElement('tr');
        if (p.key === _am_pkg_selected) row.className = 'am-selected';
        let folder = 'sim_engine/projects/' + p.name;
        let used = Array.from(p.used_from);
        let cells = [
            [p.name + (p.builtin ? ' (기본)' : '') + (p.in_db ? '' : ' (서버 폴더만)'), '', p.name],
            [p.atomic + '개', '', ''],
            [p.coupled + '개', '', ''],
            !_au_server_listed ? ['확인 불가', 'am-pkg-none', '원자모델 관리자에 연결하지 못해 서버 폴더를 확인할 수 없습니다.']
                : p.files === null ? ['폴더 없음', 'am-pkg-none', '서버에 ' + folder + ' 폴더가 없습니다 (DB 에만 등록됨).']
                : [p.files + '개', '', folder + ' 의 모델 파일(.py / .dll / .m)'],
            used.length ? [used.length + '개', 'am-pkg-warn', '이 패키지의 모델을 쓰는 다른 패키지의 커플드 모델\n' + used.join('\n')] : ['-', '', '']
        ];
        cells.forEach(([text, cls, title]) => {
            let cell = document.createElement('td');
            cell.textContent = text;
            cell.title = title || text;
            if (cls) cell.className = cls;
            row.appendChild(cell);
        });
        row.onclick = () => {
            if (_am_busy) return;
            if (_am_pkg_selected !== p.key) am_project_rename_cancel();
            _am_pkg_selected = p.key;
            _am_render();
        };
        // 두 번 클릭하면 모델 탭에서 이 패키지의 모델만 본다.
        row.ondblclick = () => {
            if (_am_busy) return;
            let filter = _au_el('am_project');
            let option = Array.from(filter.options).find((o) => o.value && _am_lower(o.value) === p.key);
            filter.value = option ? option.value : '';
            am_show_tab('models');
        };
        body.appendChild(row);
    });
    _au_el('am_pkg_empty').style.display = rows.length ? 'none' : '';
    if (shown) _au_el('am_count').textContent = rows.length + '개 패키지' + (rows.length !== all.length ? ' (전체 ' + all.length + ')' : '');
    let selected = all.find((p) => p.key === _am_pkg_selected);
    let builtin_title = '시스템 기본 모델이 들어 있는 패키지는 바꾸거나 삭제할 수 없습니다.';
    let rename = _au_el('am_btn_pkg_rename');
    rename.disabled = _am_busy || !selected || selected.builtin;
    rename.title = selected && selected.builtin ? builtin_title : '선택한 패키지 이름 변경';
    let del = _au_el('am_btn_pkg_delete');
    del.disabled = _am_busy || !selected || selected.builtin;
    del.title = selected && selected.builtin ? builtin_title : '선택한 패키지 전체 삭제 (서버 폴더 + DB)';
    ['am_pkg_new_name', 'am_btn_pkg_rename_ok', 'am_btn_pkg_rename_cancel'].forEach((id) => { _au_el(id).disabled = _am_busy; });
}

// 매니저의 패키지 요청. 응답이 없으면 이 기능이 없는 이전 버전 매니저다.
function _am_project_request(conn, type, data, timeout_ms) {
    return _au_request(conn, type, data, timeout_ms).catch((e) => {
        throw new Error(e.message === '서버 응답 시간 초과' ? AM_PROJECT_UNSUPPORTED : e.message);
    });
}

function am_project_rename_start() {
    let p = _am_selected_package();
    if (!p || p.builtin || _am_busy) return;
    let input = _au_el('am_pkg_new_name');
    input.value = p.name;
    _au_el('am_pkg_rename').style.display = '';
    _au_set_status('am_status', '');
    input.focus();
    input.select();
}

function am_project_rename_cancel() {
    _au_el('am_pkg_rename').style.display = 'none';
}

// 화면에 열려 있는 모델과 Project 입력칸이 옛 패키지 이름을 가리키지 않게 한다.
// (DB 에 저장된 커플드 모델의 참조는 /rename_project 가 바꿨다.)
function _am_apply_project_rename(old_name, new_name) {
    let same = (value) => typeof value === 'string' && _am_lower(value) === _am_lower(old_name);
    let walk = (model) => {
        if (!model) return;
        if (same(model.file_path)) model.file_path = new_name;
        (model.models || []).forEach(walk);
    };
    walk(_root_model);
    let project = document.all.project_name;
    if (project && same(project.value)) project.value = new_name;
}

async function am_project_rename_submit() {
    let p = _am_selected_package();
    if (!p || p.builtin || _am_busy) return;
    let new_name = _au_el('am_pkg_new_name').value.trim();
    let error = !_au_check_name(new_name) ? AU_ERRORS.invalid_new_project_name
        : new_name === p.name ? AU_ERRORS.same_project_name
        : _am_packages().some((x) => x.key === _am_lower(new_name) && x.key !== p.key) ? AU_ERRORS.project_exists
        : null;
    if (error) {
        _au_set_status('am_status', error, true);
        _au_el('am_pkg_new_name').focus();
        return;
    }
    let lines = ['패키지 이름을 바꾸시겠습니까?', '', '   ' + p.name + '  →  ' + new_name, '', '함께 바뀌는 항목',
        '   - 서버 폴더 sim_engine/projects/' + p.name + (_au_server_listed && p.files === null ? ' (서버에 없음)' : ''),
        '   - 원자모델 ' + p.atomic + '개, 커플드 모델 ' + p.coupled + '개의 패키지',
        '   - 이 패키지를 쓰는 커플드 모델의 하위 모델 참조' + (p.used_from.size ? ' (다른 패키지 ' + p.used_from.size + '개 포함)' : ''),
        '', '이 패키지의 모델로 실행 중인 시뮬레이션이 있으면 먼저 중단하세요.'];
    if (!confirm(lines.join('\n'))) return;

    _am_busy = true;
    _am_render();
    _au_set_status('am_status', '이름 변경 중… ' + p.name + ' → ' + new_name);
    let done = false;
    try {
        let conn;
        try { conn = await _au_model_ws(); }
        catch (e) { throw new Error(AU_MANAGER_DOWN); }
        let folder = await _am_project_request(conn, 'renameatomicproject', { project_name: p.name, new_project_name: new_name }, 30000);
        if (!folder.ok) throw new Error(AU_ERRORS[folder.error_code] || folder.error || '서버 폴더 이름을 바꾸지 못했습니다.');
        let db = await _au_post('/rename_project', { project_name: p.name, new_project_name: new_name }).catch(() => null);
        if (!db || db.result != 1) {
            let reason = (db && AU_ERRORS[db.error_code]) || 'DB 의 패키지 이름을 바꾸지 못했습니다. 서버의 Node API(/rename_project)가 최신 버전인지 확인하세요.';
            // DB 는 그대로이므로 폴더 이름도 되돌린다.
            let undo = !folder.renamed ? { ok: true }
                : await _am_project_request(conn, 'renameatomicproject', { project_name: new_name, new_project_name: p.name }, 30000).catch(() => null);
            throw new Error(reason + (undo && undo.ok ? '' : ' 서버 폴더(' + new_name + ')를 원래 이름으로 되돌리지 못했습니다. 서버에서 확인하세요.'));
        }
        done = true;
        _am_pkg_selected = _am_lower(new_name);
        am_project_rename_cancel();
        _am_apply_project_rename(p.name, new_name);
        _au_set_status('am_status', '패키지 이름을 바꿨습니다: ' + p.name + ' → ' + new_name +
            ' (원자모델 등록 정보 ' + db.atomic + '개 · 커플드 모델 ' + db.coupled + '개 갱신' + (folder.renamed ? '' : ' · 서버 폴더 없음') + ')');
    }
    catch (e) {
        _au_set_status('am_status', '이름을 바꾸지 못했습니다 - ' + (e.message || e), true);
    }
    _am_busy = false;
    await am_reload();
    _am_refresh_views(done ? new_name : p.name);
}

async function am_project_delete() {
    let p = _am_selected_package();
    if (!p || p.builtin || _am_busy) return;
    am_project_rename_cancel();
    let used = Array.from(p.used_from);
    let lines = ['패키지 전체를 삭제합니다. 되돌릴 수 없습니다.', '', '패키지 : ' + p.name,
        '   - DB : 원자모델 ' + p.atomic + '개, 커플드 모델 ' + p.coupled + '개',
        '   - 서버 폴더 sim_engine/projects/' + p.name + ' 전체' + (p.files !== null ? ' (모델 파일 ' + p.files + '개 포함)' : '')];
    if (used.length) {
        lines.push('', '※ 이 패키지의 모델을 쓰는 다른 패키지의 커플드 모델 ' + used.length + '개:');
        used.slice(0, 5).forEach((name) => lines.push('   - ' + name));
        if (used.length > 5) lines.push('   … 외 ' + (used.length - 5) + '개');
        lines.push('삭제하면 해당 커플드 모델은 실행할 수 없습니다.');
    }
    lines.push('', '삭제하려면 패키지 이름(' + p.name + ')을 입력하세요.');
    let answer = prompt(lines.join('\n'), '');
    if (answer === null) return;
    if (answer.trim() !== p.name) {
        _au_set_status('am_status', '입력한 이름이 패키지 이름과 달라 삭제하지 않았습니다.', true);
        return;
    }

    _am_busy = true;
    _am_render();
    _au_set_status('am_status', '패키지 삭제 중… ' + p.name);
    try {
        let conn;
        try { conn = await _au_model_ws(); }
        catch (e) { throw new Error(AU_MANAGER_DOWN); }
        let folder = await _am_project_request(conn, 'deleteatomicproject', { project_name: p.name }, 120000);
        if (!folder.ok) throw new Error(AU_ERRORS[folder.error_code] || folder.error || '서버 폴더를 지우지 못했습니다.');
        let db = await _au_post('/delete_project', { project_name: p.name }).catch(() => null);
        if (!db || db.result != 1)
            throw new Error(((db && AU_ERRORS[db.error_code]) || 'DB 의 패키지 정보를 지우지 못했습니다. 서버의 Node API(/delete_project)가 최신 버전인지 확인하세요.') +
                (folder.deleted ? ' 서버 폴더는 이미 삭제되었습니다. 다시 삭제하면 DB 정보만 지웁니다.' : ''));
        _am_pkg_selected = null;
        _au_set_status('am_status', '패키지를 삭제했습니다: ' + p.name + ' (원자모델 ' + db.atomic + '개 · 커플드 모델 ' + db.coupled + '개 · 서버 파일 ' + (folder.files || 0) + '개)' +
            (folder.leftover ? ' - 서버에 남은 빈 폴더는 다음 삭제 때 정리됩니다.' : ''));
    }
    catch (e) {
        _au_set_status('am_status', '패키지를 삭제하지 못했습니다 - ' + (e.message || e), true);
    }
    _am_busy = false;
    await am_reload();
    _am_refresh_views(null);
}

// -----------------------------------------------------------------------------
//  추가(업로드) 창
// -----------------------------------------------------------------------------
let _au_items = [];          // { file, name, state, message }
let _au_server_files = {};   // 프로젝트 -> 서버에 있는 파일명(소문자) 집합
let _au_busy = false;

function _au_format_size(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

// 서버 저장 이름(확장자 소문자) 기준으로 파일을 검사한다. 문제 없으면 null.
function _au_validate_file(file) {
    let dot = file.name.lastIndexOf('.');
    let ext = dot < 0 ? '' : file.name.substring(dot + 1).toLowerCase();
    if (ext !== 'py' && ext !== 'dll') return AU_ERRORS.unsupported_extension;
    if (!_au_check_name(file.name.substring(0, dot))) return AU_ERRORS.invalid_file_name;
    if (file.size === 0) return AU_ERRORS.empty_file;
    if (file.size > AU_MAX_BYTES) return AU_ERRORS.too_large;
    return null;
}

function _au_saved_name(name) {
    let dot = name.lastIndexOf('.');
    return name.substring(0, dot) + '.' + name.substring(dot + 1).toLowerCase();
}

function open_atomic_upload(project_name) {
    // 이전에 끝났거나 거절된 파일은 정리하고, 아직 올리지 않았거나 등록 확인 중인 파일만 남긴다.
    _au_items = _au_items.filter((item) => item.state === 'ready' || item.state === 'registering');
    let project = _au_el('au_project');
    if (project_name) project.value = project_name;
    else if (!project.value && _au_check_name(document.all.project_name.value))
        project.value = document.all.project_name.value;
    // 덮어쓰기는 매번 다시 선택하게 한다.
    _au_el('au_overwrite').checked = false;
    _au_el('au_overlay').style.display = 'flex';
    _au_set_status('au_status', '');
    _au_render();
    _au_refresh_server_files();
}

function close_atomic_upload() {
    if (_au_busy) return;
    _au_el('au_overlay').style.display = 'none';
}

function _au_refresh_server_files() {
    _au_model_ws()
        .then((conn) => {
            clearTimeout(_au_files_timer);
            _au_files_timer = setTimeout(() => _au_set_status('au_status',
                '서버의 atomic_model_manager 가 응답하지 않습니다. 업로드 기능이 없는 이전 버전일 수 있으니 서버 관리자에게 확인하세요.', true), 5000);
            conn.send(JSON.stringify({ Type: 'listatomicfiles', Data: {} }));
        })
        .catch(() => _au_set_status('au_status', AU_MANAGER_DOWN, true));
}

function _au_add_files(files) {
    if (_au_busy) return;
    Array.from(files).forEach((file) => {
        // 같은 이름을 다시 고르면 새 파일로 교체한다.
        _au_items = _au_items.filter((item) => item.name.toLowerCase() !== file.name.toLowerCase());
        let error = _au_validate_file(file);
        _au_items.push({ file: file, name: file.name, state: error ? 'invalid' : 'ready', message: error || '' });
    });
    _au_render();
}

function _au_remove(index) {
    if (_au_busy) return;
    _au_items.splice(index, 1);
    _au_render();
}

function _au_render() {
    let project = _au_el('au_project').value.trim();
    let existing = _au_server_files[project] || new Set();
    let body = _au_el('au_file_rows');
    body.innerHTML = '';
    _au_items.forEach((item, index) => {
        let row = document.createElement('tr');
        let state = item.state;
        let text = item.message;
        if (state === 'ready') {
            let replaces = existing.has(_au_saved_name(item.name).toLowerCase());
            text = replaces ? '같은 이름 파일 있음 (덮어쓰기 필요)' : '대기';
            if (replaces) state = 'warn';
        }
        let name = document.createElement('td');
        name.textContent = item.name;
        name.title = item.name;
        let size = document.createElement('td');
        size.textContent = _au_format_size(item.file.size);
        let status = document.createElement('td');
        status.textContent = text;
        status.className = 'au-state-' + state;
        let remove = document.createElement('td');
        if (!_au_busy && item.state !== 'uploading') {
            let button = document.createElement('button');
            button.type = 'button';
            button.className = 'au-remove';
            button.title = '목록에서 제거';
            button.textContent = '✕';
            button.onclick = () => _au_remove(index);
            remove.appendChild(button);
        }
        row.append(name, size, status, remove);
        body.appendChild(row);
    });
    _au_el('au_empty').style.display = _au_items.length ? 'none' : '';
    let pending = _au_items.some((item) => item.state === 'ready' || item.state === 'failed');
    _au_el('au_submit').disabled = _au_busy || !pending;
    _au_el('au_close').disabled = _au_busy;
}

function _au_read_base64(file) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = () => resolve(reader.result.substring(reader.result.indexOf(',') + 1));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

// /get_atomic_info 는 get_atomic 을 인자 2개로 불러 DB 에서 실패한다. 화면이 모델을 불러올 때
// 쓰는 /get_model_info 로 조회한다(uid 가 빈 문자열이면 프로젝트 + 파일명으로 찾는다).
function _au_atomic_snapshot(project, file_name) {
    return _au_post('/get_model_info', { project_name: project, file_name: file_name, uid: '' })
        .then((res) => res && res.result == 1 && Array.isArray(res.data) ? JSON.stringify(res.data[0] || []) : null)
        .catch(() => null);
}

// 등록은 매니저가 띄운 모델 프로세스가 비동기로 DB 에 올린다. DB 행이 바뀔 때까지 확인한다.
async function _au_wait_registration(item, project, file_name, before) {
    for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        let now = await _au_atomic_snapshot(project, file_name);
        if (now !== null && now !== '[]' && now !== before) {
            item.state = 'done';
            item.message = 'DB 등록 완료';
            _au_render();
            return true;
        }
    }
    item.state = 'warn';
    item.message = '저장 완료 · DB 반영 확인 안 됨 (잠시 후 목록 새로고침)';
    _au_render();
    return false;
}

async function submit_atomic_upload() {
    let project = _au_el('au_project').value.trim();
    if (!_au_check_name(project)) {
        _au_set_status('au_status', AU_ERRORS.invalid_project_name, true);
        _au_el('au_project').focus();
        return;
    }
    let overwrite = _au_el('au_overwrite').checked;
    let conn;
    try {
        conn = await _au_model_ws();
    }
    catch (e) {
        _au_set_status('au_status', AU_MANAGER_DOWN, true);
        return;
    }
    _au_busy = true;
    _au_set_status('au_status', '업로드 중…');
    let targets = _au_items.filter((item) => item.state === 'ready' || item.state === 'failed');
    let registrations = [];
    let failed = 0;
    for (let item of targets) {
        item.state = 'uploading';
        item.message = '읽는 중…';
        _au_render();
        try {
            let saved_name = _au_saved_name(item.name);
            let before = await _au_atomic_snapshot(project, saved_name);
            let content = await _au_read_base64(item.file);
            // 20MB 를 느린 회선으로 보내는 경우까지 기다린다.
            let res = await _au_request(conn, 'uploadatomicmodel',
                { project_name: project, file_name: item.name, content: content, overwrite: overwrite }, 300000,
                (percent) => { item.message = '전송 중 ' + percent + '%'; _au_render(); });
            if (!res.ok) {
                item.state = 'failed';
                item.message = AU_ERRORS[res.error_code] || res.error || '업로드 실패';
                failed++;
            }
            else if (!res.registered) {
                // 파일은 저장됐지만 등록 프로세스를 띄우지 못함 - 다음 update 때 다시 시도된다.
                item.state = 'warn';
                item.message = '저장 완료 · 등록 실행 실패 (서버 로그 확인)';
            }
            else {
                item.state = 'registering';
                item.message = '저장 완료 · DB 등록 중…';
                registrations.push(_au_wait_registration(item, project, res.file_name, before));
            }
        }
        catch (e) {
            item.state = 'failed';
            item.message = e.message || String(e);
            failed++;
        }
        _au_render();
    }
    _au_busy = false;
    _au_render();
    _au_refresh_server_files();
    _au_set_status('au_status', failed ? failed + '개 파일 업로드 실패 - 사유를 확인하세요.' : '업로드 완료. DB 등록 상태를 확인하는 중입니다.', failed > 0);
    await Promise.all(registrations);
    if (!failed && registrations.length) _au_set_status('au_status', '업로드와 등록이 끝났습니다. 모델리스트에서 끌어다 쓸 수 있습니다.');
    if (_au_el('am_overlay').style.display !== 'none') am_reload(project);
    _am_refresh_views(project);
}

function init_atomic_manage() {
    // 입력 중 Delete 등이 디자이너 단축키(document.onkeydown)로 가지 않게 하고, Escape 로 닫는다.
    [['am_overlay', close_atomic_manage], ['au_overlay', close_atomic_upload]].forEach(([id, close]) => {
        let overlay = _au_el(id);
        overlay.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Escape') close();
        });
        overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(); });
    });
    ['am_project', 'am_kind'].forEach((id) => _au_el(id).addEventListener('change', _am_render));
    _au_el('am_search').addEventListener('input', _am_render);
    _au_el('am_pkg_search').addEventListener('input', _am_render);
    // 새 이름 입력칸: Enter 로 변경, Escape 는 창 대신 이름변경만 취소한다.
    _au_el('am_pkg_new_name').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); am_project_rename_submit(); }
        else if (e.key === 'Escape') { e.stopPropagation(); am_project_rename_cancel(); }
    });

    let input = _au_el('au_file_input');
    input.addEventListener('change', () => { _au_add_files(input.files); input.value = ''; });
    let drop = _au_el('au_drop');
    drop.addEventListener('click', () => input.click());
    drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('au-drag'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('au-drag'));
    drop.addEventListener('drop', (e) => {
        e.preventDefault();
        drop.classList.remove('au-drag');
        _au_add_files(e.dataTransfer.files);
    });
    _au_el('au_project').addEventListener('input', _au_render);
}
