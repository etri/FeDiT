let canvas;
let ctx;
let screenRect;
let inport=['in_water_height','in_signal','in_3'];
let outport=['out_gen','out_water_height','out_signal'];
let outport2=['in_water_height','in_signal','inport3'];
let inport2=['out_gen','out_water_height','out_signal'];
let animate_state = 1;
let json_dict = {};
let cpd_designer = null;
let arrow_obj = null;
let project_name = null;
// model_name / filename 입력칸은 툴바에서 숨겨져 있다. 새로만들기 시 이 기본값이 들어간다.
// (클라우드 저장은 이 값이 아니라 프로젝트 트리 최상위 모델의 이름을 쓴다 — save_to_api_server)
const DEFAULT_MODEL_NAME = 'index';
const DEFAULT_FILE_NAME = 'index.json';
// 새로 만든 최상위 모델의 이름 (base_model 기본값). 이 이름 그대로 저장하면 이름을 묻는다.
const UNTITLED_MODEL_NAME = 'untitled';
// coupled_models.model_name / file_name 이 varchar(100) 이고 file_name 은 이름 + '.json'
const MODEL_NAME_MAX_LEN = 95;
// REST API 는 Nginx 리버스 프록시를 통해 같은 origin 으로 호출한다.
//  - https 페이지에서 http://...:8081 을 직접 부르면 mixed-content 로 차단되므로
//    반드시 현재 origin + 경로 프리픽스를 사용한다.
//    예) https://220.124.222.89/simulation/ -> https://220.124.222.89/simulation
let api_server_url = location.origin + location.pathname.replace(/\/[^\/]*$/, '');
let selected_model_data = null;
let add_model_tmp = null;//드래그로 임시 추가중인 모델
let _window_z_index = 1000;//print, graph2d 등 서브창의 z-index
let WebId = null;
let ModelLoaded = null;
function init_designer() {
    console.log("init()");
    
    
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    screenRect = canvas.getBoundingClientRect();
    arrow_obj = new Path2D();
    arrow_obj.moveTo(0,0);
    arrow_obj.lineTo(PORT_ARROW_WIDTH, PORT_ARROW_HEIGHT * 0.5);
    arrow_obj.lineTo(0, PORT_ARROW_HEIGHT);
    arrow_obj.closePath();
    cpd_designer = new coupling_designer({ctx:ctx, on_model_changed_proc:on_model_changed});
    cpd_designer.adjust_pane(true);

    /*cpd_designer.add_model({model_name:'한글 모델명', in_port:inport, out_port:outport,
        position:{x:100, y:100}, width:100, height:10, color:'rgba(200,200,0,1)'});
    cpd_designer.add_model({model_name:'WaterTank_atomic', in_port:inport2, out_port:outport2, 
        position:{x:100, y:100}, width:100, height:10, color:'rgba(0,200,0,1)'});
    cpd_designer.add_model({model_name:'Controller_atomic', in_port:inport, out_port:outport, 
        position:{x:100, y:100}, width:100, height:10, color:'rgba(0,0,200,1)'});*/
    add_keyevent_listener();
    animate_loop();

    let model_img_list = document.getElementById('img_list');
    model_img_list.innerHTML = '';
    set_default_btn(model_img_list);

    
}
function get_thumbnail(){
    cpd_designer.adjust_pane(true);
    let new_size = Object.assign({}, cpd_designer.cpd_pane_size);
    new_size.x *= cpd_designer.scale_ratio.x;
    new_size.y *= cpd_designer.scale_ratio.y;

    let nc = document.createElement('canvas');
    let nc_ctx = nc.getContext('2d');
    let xy_r = new_size.y / new_size.x;
    nc.width = 300;
    nc.height = 300 * xy_r;
    console.log(new_size, xy_r, nc.height);
    nc_ctx.drawImage(canvas, 0, 0, new_size.x, new_size.y, 0, 0, nc.width, nc.height);
    let img = nc.toDataURL('image/jpeg');
    return img;
}

function test(){
    
}
function set_default_btn(obj){
    add_model_btn(obj, '외부입력', 'external input', '', 'ein');
    add_model_btn(obj, '외부출력', 'external output', '', 'eout');
    //add_model_btn(obj, 'print', 'print message', '', 'print_msg');
    //add_model_btn(obj, 'graph', '2D graph', '', 'graph_2d');
    //add_model_btn(obj, 'plus', 'in_plus', '', 'plus');
}
function add_model(o, x, y){
    console.log('add_model', o);
    let ret = null;
    if(o == 'ein'){
        ret = cpd_designer.activated_model.add_ein_port({name:'ein_' + cpd_designer.activated_model.in_port.length});
    }
    else if(o == 'eout'){
        ret = cpd_designer.activated_model.add_eout_port({name:'eout_' + cpd_designer.activated_model.out_port.length});
    }
    else if(o == 'print_msg'){
        ret = cpd_designer.activated_model.add_model({model_name:'print', model_type:MODEL_TYPE.EMBEDED_FUNC_PRINT, in_port:[{name:'message'}]});
    }
    else if(o == 'graph_2d'){
        ret = cpd_designer.activated_model.add_model({model_name:'graph 2d', model_type:MODEL_TYPE.EMBEDED_FUNC_GRAPH_2D, in_port:[{name:'y'}]});
    }
    else if(o == 'plus'){
        ret = cpd_designer.activated_model.add_model({model_name:'plus', model_type:MODEL_TYPE.EMBEDED_FUNC_PLUS, in_port:[{name:'in'}], out_port:[{name:'plus_out'}], in_param:[{name:'value', value:0}]});
    }
    else{
        let json = JSON.parse(o);
        
        json.position = new vector2({x:x, y:y});
        json.uid = json.uid || json.id;
        json.iid = get_random_string();
        console.log(json);
        ret = cpd_designer.activated_model.add_model(json);
         
    }
    return ret;
}


// 탭 상태: 탭마다 파라미터 값을 저장
const tabs = []; // { id, title, active, paramMap }
let activeTabId = null;
let currentSelectedModelRoot = null; // 현재 클릭된 activated_model.models[i] (root)

function sortAndRenumberTabs() {
  // n 기준 오름차순 정렬
  tabs.sort((a, b) => a.n - b.n);

  // 1..N으로 재번호 부여 (빈 번호 제거 + 중복 제거)
  tabs.forEach((t, i) => { t.n = i + 1; });
}

// 고유 탭 id
function uid() {
  return 'tab_' + Math.random().toString(36).slice(2);
}

// 모델 트리 순회
function walkModels(obj, fn) {
  if (!obj) return;
  fn(obj);
  if (obj.models !== undefined) obj.models.forEach(child => walkModels(child, fn));
}

// 같은 커플드 모델을 여러 번 배치하면 자식 iid가 같을 수 있으므로 부모 경로도 포함한다.
function walkParamModels(root, fn, parentPath = []) {
  if (!root) return;
  const path = parentPath.concat(root.iid);
  fn(root, path);
  (root.models || []).forEach(child => walkParamModels(child, fn, path));
}

function paramKey(path, name) {
  return JSON.stringify([path, name]);
}

// 파라미터 탭은 선택된 모델과 무관하게 프로젝트 전체 값을 보관한다.
function collectParamMap(root) {
  const map = {};
  walkParamModels(root, (m, path) => {
    if (!m.in_param) return;
    m.in_param.forEach(p => {
      map[paramKey(path, p.name)] = structuredClone(p.value);
    });
  });
  return map;
}

// paramMap을 모델 트리에 다시 적용
function applyParamMap(root, map) {
  walkParamModels(root, (m, path) => {
    if (!m.in_param) return;
    m.in_param.forEach(p => {
      const key = paramKey(path, p.name);
      if (Object.prototype.hasOwnProperty.call(map, key)) {
        p.value = structuredClone(map[key]);
      }
    });
  });
}

// 엔진의 기존 model_name::param_name 형식을 유지하되 중복 이름은 전송 사본에서만 구분한다.
function simulationParamPayload(activeMap = null) {
  const json_data = JSON.parse(JSON.stringify(cpd_designer.save()));
  const names = new Map();
  walkModels(json_data, m => names.set(m.model_name, (names.get(m.model_name) || 0) + 1));
  const usedNames = new Set(names.keys());
  const active = getActiveTab();
  const param_sets = tabs.map((t, i) => ({ run_id: i, overrides: {} }));
  let nextName = 1;
  walkParamModels(json_data, (m, path) => {
    if (names.get(m.model_name) > 1) {
      let name;
      do { name = m.model_name + '__instance_' + nextName++; } while (usedNames.has(name));
      usedNames.add(name);
      m.model_name = name;
    }
    (m.in_param || []).forEach(p => {
      const key = paramKey(path, p.name);
      tabs.forEach((t, i) => {
        const map = (t === active && activeMap) ? activeMap : t.paramMap;
        param_sets[i].overrides[m.model_name + '::' + p.name] =
          Object.prototype.hasOwnProperty.call(map, key) ? structuredClone(map[key]) : p.value;
      });
    });
  });
  return { json_data, param_sets };
}

function selectParamModel(model) {
  saveUIToActiveTab();
  currentSelectedModelRoot = model;
  ensureTabUI();
  renderTabs();
  set_param_to_form(model);
}

function resetParamTabs() {
  currentSelectedModelRoot = null;
  tabs.length = 0;
  activeTabId = null;
  ensureDefaultTab();
  set_param_to_form(null);
}

function ensureDefaultTab() {
  if (tabs.length === 0) {
    const id = uid();
    tabs.push({ id, n: 1, paramMap: {} });
    activeTabId = id;
  }
  sortAndRenumberTabs();
  renderTabs();
}

function renderTabs() {
  const tabbar = document.getElementById('tabbar');
  if (!tabbar) return;   // DOM 미준비(head에서 로드되어 #tabbar가 아직 없을 때) 크래시 방지 — 이후 DOMContentLoaded에서 재렌더링
  tabbar.innerHTML = '';

  // 항상 오름차순 보장
  sortAndRenumberTabs();

  tabs.forEach((t) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.textContent = `param${t.n}`;
    // 스타일은 index.html 의 #tabbar .param-tab
    tab.className = 'param-tab' + (t.id === activeTabId ? ' active' : '');

    tab.onclick = () => switchTab(t.id);

    // 우측 닫기(최소 1개 남기기 때문에 1개일 때는 숨김)
    if (tabs.length > 1) {
      tab.classList.add('closable');
      const close = document.createElement('span');
      close.textContent = '×';
      close.className = 'param-tab-x';
      close.title = '닫기';

      close.onclick = (e) => {
        e.stopPropagation();
        removeTab(t.id);
      };

      tab.appendChild(close);
    }

    tabbar.appendChild(tab);
  });
}
function addTab() {
  saveUIToActiveTab();
  const id = uid();

  const active = getActiveTab();
  const clonedMap = active ? structuredClone(active.paramMap) : {};

  // 일단 끝에 추가
  tabs.push({ id, n: tabs.length + 1, paramMap: clonedMap });

  // 정렬 + 1..N 재번호
  sortAndRenumberTabs();

  // 방금 만든 탭으로 이동
  activeTabId = id;
  renderTabs();
  restoreActiveTabToUI();
}

function removeTab(id) {
  if (tabs.length === 1) return; // ✅ 탭은 무조건 1개 존재

  const idx = tabs.findIndex(t => t.id === id);
  if (idx < 0) return;

  const wasActive = (activeTabId === id);
  tabs.splice(idx, 1);

  sortAndRenumberTabs();

  if (wasActive) {
    // 삭제한 위치 기준으로 옆 탭 활성화
    const nextIdx = Math.min(idx, tabs.length - 1);
    activeTabId = tabs[nextIdx].id;
    restoreActiveTabToUI();
  }

  renderTabs();
}
function getActiveTab() {
  return tabs.find(t => t.id === activeTabId) || null;
}

function switchTab(id) {
  // 전환 전에 "현재 화면 값"을 활성 탭 상태로 저장
  saveUIToActiveTab();

  activeTabId = id;
  renderTabs();

  // 전환 후: 탭 상태를 모델에 적용하고 UI 다시 렌더
  restoreActiveTabToUI();
}

function saveUIToActiveTab() {
  const tab = getActiveTab();
  if (!tab || !_root_model) return;

  const values = collectParamMap(_root_model);
  // 탭 생성 뒤 추가된 모델은 모든 탭에 같은 초기값으로 등록한다.
  tabs.forEach(t => {
    Object.keys(values).forEach(key => {
      if (!Object.prototype.hasOwnProperty.call(t.paramMap, key)) {
        t.paramMap[key] = structuredClone(values[key]);
      }
    });
  });
  tab.paramMap = values;
}

function restoreActiveTabToUI() {
  const tab = getActiveTab();
  if (!tab) return;

  applyParamMap(_root_model, tab.paramMap);
  if (currentSelectedModelRoot) {
    set_param_to_form(currentSelectedModelRoot, true);
  } else {
    // 모델 선택 전이라면 그냥 비우기
    document.getElementById('tb_properties').innerHTML = '';
  }
}

function ensureTabUI() {
  const table = document.getElementById('tb_properties');
  if (!table) {
    console.error('tb_properties not found');
    return;
  }

  // 이미 만들어졌으면 재생성하지 않음
  if (document.getElementById('tabbar')) return;

  // tab UI 컨테이너
  const wrap = document.createElement('div');
  wrap.id = 'tab_wrap';
  wrap.style.display = 'flex';
  wrap.style.alignItems = 'center';
  wrap.style.gap = '6px';
  wrap.style.padding = '6px';
  wrap.style.borderBottom = '1px solid #aaa';
  wrap.style.background = '#f7f7f7';

  // 탭바
  const tabbar = document.createElement('div');
  tabbar.id = 'tabbar';
  tabbar.style.display = 'flex';
  tabbar.style.gap = '4px';
  tabbar.style.flexWrap = 'wrap';

  // + 버튼
  const btn = document.createElement('button');
  btn.id = 'btnAddTab';
  btn.type = 'button';
  btn.textContent = '+';

  wrap.appendChild(tabbar);
  wrap.appendChild(btn);

  // 테이블 바로 위에 삽입
  table.parentNode.insertBefore(wrap, table);
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('#btnAddTab'); // 버튼 내부 클릭도 잡힘
  if (!btn) return;

  addTab();
});

// 초기 탭 1개 (탭 데이터는 지금 생성; 렌더링은 #tabbar가 존재하는 DOM 준비 후 수행)
ensureDefaultTab();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderTabs);
}





function add_param_form(form, obj){
    if(obj.in_param.length == 0)
        return;
    let tr = document.createElement('tr');
    let td = document.createElement('td');
    td.setAttribute('colspan', 2);
    td.setAttribute('bgcolor','#e0e0e0');
    td.setAttribute('align','center');
    td.innerHTML = "<b>" + obj.model_name + "</b>";
    tr.appendChild(td);
    form.appendChild(tr);

    obj.in_param.forEach((v, idx)=>{
        console.log(v);
        let tr = document.createElement('tr');
        let td = document.createElement('td');
        td.setAttribute('style','width:100px;text-align:center;');
        td.setAttribute('bgcolor','white');
        td.setAttribute('title', v.desc);
        td.innerText = v.name;
        tr.appendChild(td);
        td = document.createElement('td');
        td.setAttribute('bgcolor','white');
        let txt = document.createElement('input');
        if(v.d_type == 'int' || v.d_type == 'dbl'){
            txt.setAttribute('type','number');    
        }
        else{
            txt.setAttribute('type','text');
        }
        txt.setAttribute('style','width:99%;');
        txt.setAttribute('name','p[]');
        txt.setAttribute('value',v.value);
        txt.onchange=function(e){
            console.log(e.target.value);
            if(v.d_type == 'int'){
                obj.in_param[idx].value = parseInt(e.target.value);
            }
            else if(v.d_type == 'dbl'){
                obj.in_param[idx].value = parseFloat(e.target.value);
            }
            else{
                obj.in_param[idx].value = e.target.value;
            }
            saveUIToActiveTab();
            cpd_designer.on_model_changed(obj);
        }
        td.appendChild(txt);
        tr.appendChild(td);
        form.appendChild(tr);
    });
}

function set_param_to_form(obj, clear_form = true){
    let d = document.getElementById('tb_properties');
    if(clear_form)
        d.innerHTML = '';
    if(obj != null){
        add_param_form(d, obj);
        if(obj.models !== undefined){
            obj.models.forEach(v=>{
                set_param_to_form(v, false);
            });
        }
    }
}

function clear_properties_window(){
    let d = document.getElementById('tb_properties');

}
function add_properties_window(p_name, p_value){

}
function get_model_list(project){
    send_post_ex(api_server_url + '/get_model_list',
        {project_name:project}, (res)=>{
            console.log(res);
        });
}
function stop_animate(){
    animate_state = 0;
}
function save_to_local(filename){
    return cpd_designer.save(filename);
}
// 클라우드 저장 — 프로젝트 트리 최상위 모델의 이름으로 저장한다.
//  - 불러온(또는 마지막으로 저장한) 모델과 프로젝트·이름이 같으면 그 모델을 덮어쓴다.
//  - 이름이나 프로젝트가 바뀌었으면 다른 이름으로(새 모델로) 저장한다.
//    update_coupled 프로시저는 uid 로 행을 찾아 덮어쓰므로, 새 uid 로 보내야 원래 모델이 남는다.
//  - 저장할 프로젝트에 같은 이름의 커플모델이 이미 있으면 덮어쓸지 묻는다.
function save_to_api_server(projectname){
    projectname = (projectname || '').trim();
    if(projectname == ''){
        alert('프로젝트 명을 넣어주세요');
        return;
    }
    let model_name = _root_model.model_name;
    if(model_name == UNTITLED_MODEL_NAME || check_model_name(model_name) != ''){
        model_name = ask_model_name('저장할 커플모델 이름을 입력하세요.',
            model_name == UNTITLED_MODEL_NAME ? '' : model_name);
        if(model_name == null)
            return;
    }
    let info = cpd_designer.saved_info;
    if(info && info.project_name == projectname && info.model_name == model_name){
        post_coupled_model(projectname, model_name, info.file_name, info.uid);
        return;
    }
    let file_name = model_name + '.json';
    find_coupled_model(projectname, model_name, file_name, (found)=>{
        if(found == null){
            post_coupled_model(projectname, model_name, file_name, get_random_string());
        }
        else if(confirm('[' + projectname + '] 프로젝트에 같은 이름의 커플모델 [' + found.model_name
                + '] 이(가) 이미 있습니다.\n덮어쓰시겠습니까?')){
            post_coupled_model(projectname, model_name, found.file_name, found.uid);
        }
    });
}
// 프로젝트에 이름이나 파일명이 같은 커플모델이 있으면 {uid, model_name, file_name}, 없으면 null 을 cb 로 넘긴다
function find_coupled_model(projectname, model_name, file_name, cb){
    const fail = ()=>alert('모델 목록을 확인하지 못해 저장하지 않았습니다.');
    send_post_ex(api_server_url + '/get_model_list',
        {project_name:projectname}, (res)=>{
            if(res.result != 1){
                fail();
                return;
            }
            let found = null;
            // 없는 프로젝트면 [{'project is not found': ...}] 가 온다
            (res.data[0] || []).some(row => {
                if(row.model_type != 'c')
                    return false;
                let j = null;
                try{ j = JSON.parse(row.json_data); } catch(e){ return false; }
                if(j.uid && (j.model_name == model_name || j.file_name == file_name)){
                    found = {uid:j.uid, model_name:j.model_name, file_name:j.file_name};
                    return true;
                }
                return false;
            });
            cb(found);
        }, fail);
}
function post_coupled_model(projectname, model_name, file_name, uid){
    let json = cpd_designer.save();
    json.uid = uid;
    json.model_name = model_name;
    json.file_name = file_name;
    console.log('save_to_api', json);
    send_post_ex(api_server_url + '/set_coupled_info',
        {project_name:projectname, model_name:model_name,
        file_name:file_name, json_data:JSON.stringify(json)},
        (res)=>{
            console.log(res);
            if(res.result != 1){
                alert('저장하지 못했습니다.\n' + ((res.data && (res.data.sqlMessage || res.data.code)) || res.result));
                return;
            }
            _root_model.uid = uid;
            _root_model.model_name = model_name;
            _root_model.file_name = file_name;
            cpd_designer.saved_info = {project_name:projectname, uid:uid, model_name:model_name, file_name:file_name};
            document.all.load_model_name.value = model_name;
            document.all.load_file_name.value = file_name;
            update_tree();
            refresh_model_list_panel();
            document.getElementById('btn_sim_save').disabled = true;
            alert('저장완료!');
        },
        ()=>alert('저장하지 못했습니다. (API 서버 응답 없음)'));
}
// 모델리스트 창이 열려 있으면 패키지·모델 목록을 다시 받아 방금 저장한 모델이 보이게 한다
function refresh_model_list_panel(){
    let d = document.getElementById('div_left_model_list');
    if(d && d.style.display != 'none')
        req_list_projects('module_list', req_list_models);
}
// 모델 이름 검사 — 문제가 없으면 '', 있으면 안내 문구
function check_model_name(name){
    if(name == '')
        return '이름을 입력해주세요.';
    if(name.length > MODEL_NAME_MAX_LEN)
        return '이름은 ' + MODEL_NAME_MAX_LEN + '자 이하로 입력해주세요.';
    if(/[\\\/:*?"<>|]/.test(name))
        return '이름에 \\ / : * ? " < > | 는 쓸 수 없습니다.';
    return '';
}
// 이름을 입력받는다. 취소하면 null
function ask_model_name(message, default_name){
    let name = default_name;
    while(true){
        name = prompt(message, name);
        if(name == null)
            return null;
        name = name.trim();
        let err = check_model_name(name);
        if(err == '')
            return name;
        alert(err);
    }
}
function save_to_stack(){
    return;
    let json = cpd_designer.save();
    if(json.models === undefined){
        return;
    }
    
    if(json.models.length > 0){
        json_dict[cpd_designer.file_name] = json;
    }
    
}
function load_from_stack(file_name){
    if(json_dict.hasOwnProperty(file_name)){
        save_to_stack();
        load_from_json(json_dict[file_name], file_name);
    }
}
function add_graph2d_window(parent_iid){
    let d1 = document.createElement('div');
    d1.setAttribute('id', parent_iid + '_div');
    d1.setAttribute('style','display:none;position:absolute;left:100px;top:100px;width:500px;height:300px;resize:both;overflow:auto;');
    
    let d2 = document.createElement('div');
    d2.setAttribute('style','display:table;width:100%;height:100%;');
    d1.appendChild(d2);

    let d3 = document.createElement('div');
    d3.setAttribute('style','display:table-row;height:30px;background-color:#EAEEF1;border:1px solid #1bf;padding:5px;line-height:1rem;border-top-left-radius:0.5rem;border-top-right-radius:0.5rem;');
    d3.onmousedown = function(e){
        _window_z_index++;
        d1.style.zIndex = _window_z_index.toString();
        _selected_window = d1;
    }
    let d4 = document.createElement('div');
    d4.setAttribute('style','position:absolute;left:20px;top:10px;');
    d4.innerHTML = '<font size=4>GRAPH 2D</font>';
    let d5 = document.createElement('button');
    d5.setAttribute('type','button');
    d5.innerHTML = '&times;';
    d5.setAttribute('style','position:absolute;right:10px;top:2px;height:10px;font-size: 1.5rem;border:0px;');
    d5.onclick=function(e){
        d1.style.display='none';
    }
    d3.appendChild(d4);
    d3.appendChild(d5);

    let d_bottom = document.createElement('div');
    d_bottom.setAttribute('style','display:table-row;background-color:black;border:1px solid #1bf;padding:5px;line-height:1rem;border-top:0px;border-bottom-left-radius:0.5rem;border-bottom-right-radius:0.5rem;');
    let d_bottom2 = document.createElement('div');
    d_bottom2.setAttribute('id',parent_iid + '_div_graph');
    d_bottom2.setAttribute('style','height:100%;');
    let d_svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    d_bottom2.appendChild(d_svg);
    d_bottom.appendChild(d_bottom2);

    d2.appendChild(d3);
    d2.appendChild(d_bottom);
   
    document.body.appendChild(d1); 
    setTimeout(()=>{
        create_graph(parent_iid + '_div_graph');
        add_resize_observer(d1);
    }, 200);
}
function add_print_window(parent_iid){
    let d1 = document.createElement('div');
    d1.setAttribute('id', parent_iid + '_div');
    d1.setAttribute('style','display:none;position:absolute;left:100px;top:100px;width:300px;height:300px;resize:both;overflow:auto;');
    
    let d2 = document.createElement('div');
    d2.setAttribute('style','display:table;width:100%;height:100%;');
    d1.appendChild(d2);

    let d3 = document.createElement('div');
    d3.setAttribute('style','display:table-row;height:30px;background-color:#EAEEF1;border:1px solid #1bf;padding:5px;line-height:1rem;border-top-left-radius:0.5rem;border-top-right-radius:0.5rem;');
    d3.onmousedown = function(e){
        _window_z_index++;
        d1.style.zIndex = _window_z_index.toString();
        _selected_window = d1;
    }
    let d4 = document.createElement('div');
    d4.setAttribute('style','position:absolute;left:20px;top:10px;');
    d4.innerHTML = '<font size=4>PRINT CONSOLE</font>';
    let d5 = document.createElement('button');
    d5.setAttribute('type','button');
    d5.innerHTML = '&times;';
    d5.setAttribute('style','position:absolute;right:10px;top:2px;height:10px;font-size: 1.5rem;border:0px;');
    d5.onclick=function(e){
        d1.style.display='none';
    }
    d3.appendChild(d4);
    d3.appendChild(d5);

    let d_bottom = document.createElement('div');
    d_bottom.setAttribute('style','display:table-row;background-color:black;border:1px solid #1bf;padding:5px;line-height:1rem;border-top:0px;border-bottom-left-radius:0.5rem;border-bottom-right-radius:0.5rem;');
    let d_bottom2 = document.createElement('div');
    d_bottom2.setAttribute('id',parent_iid + '_div_content');
    d_bottom2.setAttribute('style','height:100%;color:green;overflow:auto;');
    d_bottom.appendChild(d_bottom2);

    d2.appendChild(d3);
    d2.appendChild(d_bottom);
   
    document.body.appendChild(d1); 
}
function add_model_btn(parent_div, title, filename, update_time, data){
    let btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'model-card'; // 스타일은 index.html 의 #img_list .model-card
    btn.setAttribute('draggable', true);
    btn.ondragstart = function(e){
        console.log('dragstart');
        e.dataTransfer.setData('data',data);
        e.dataTransfer.dropEffect = 'copy';
        selected_model_data = data;
        this.style.opacity = 0;
    };
    btn.ondragend = function(e){
        console.log('dragendy');
        selected_model_data = null;
        this.style.opacity = 1;
        update_tree();
    };
    btn.ondblclick = function(e){
        let j = JSON.parse(data);
        console.log(j);
        document.all.load_file_name.value = j.file_name;
        save_to_stack();
        load_from_api_server(document.all.module_name.value, document.all.load_file_name.value, j.uid);
        setTimeout(()=>{
            cpd_designer.adjust_pane(true);
        },100);
        
    }
    /*let img = document.createElement('img');
    img.src='http://143.248.187.105:30001/thumbnails/banksim/teller_atomic.py.jpg';
    btn.appendChild(img);*/
    let lb = document.createElement('label');
    lb.innerText = title;
    lb.className = 'model-card-title';
    btn.appendChild(lb);
    //let br = document.createElement('br');
    //btn.appendChild(br);
    lb = document.createElement('label');
    lb.innerText = filename;
    btn.appendChild(lb);
    //br = document.createElement('br');
    //btn.appendChild(br);
    lb = document.createElement('label');
    lb.innerText = update_time;
    btn.appendChild(lb);
    parent_div.appendChild(btn);
}


// res_m 초기 등록은 아래 _on_res_m 함수로 통합

ws.on_data_callback["rest_run"] = (json) => {

    appendLogToPanel("프로젝트 명:" + json.Data.projectname + " 시뮬레이션 합니다.");

    run_model_on_server(json.Data.projectname, 0, json.Data.end_t);
};


function req_list_models(module_name){
    console.log(module_name);
    send_post_ex(api_server_url + '/get_model_list',
        {project_name:module_name}, (res)=>{
            console.log(res);
            if(res.result == 1){
                let model_img_list = document.getElementById('img_list');
                model_img_list.innerHTML = '';
                set_default_btn(model_img_list);
                res.data[0].forEach(element => {
                    let json = JSON.parse(element.json_data);
                    console.log(json);
                    add_model_btn(model_img_list, json.model_name, json.file_name, element.updated, element.json_data);
                });
            }
        });
}
// on_done(optional): 목록 갱신 후 선택된 프로젝트명을 받아 호출 (예: 모델 목록 조회)
function req_list_projects(element_id, on_done) {
    console.log('req_list_projects')
    send_post_ex(
        api_server_url  + '/get_project_list',
        //"http://localhost:8081/get_project_list", // api_server_url + "/get_project_list",
        {_:""},
        (res)=>{
            if(res.result == 1){
            let project_list_node = document.getElementById(element_id);
            let prev = project_list_node.value;
            project_list_node.innerHTML="";
            let names = [];
            res.data[0].forEach((element)=>{
                add_project_list_option(project_list_node,element.project_name)
                names.push(element.project_name);
            })
            // 기존 선택 유지, 없으면 첫 번째 프로젝트 선택
            if(names.length > 0)
                project_list_node.value = names.includes(prev) ? prev : names[0];
            if(typeof on_done === 'function' && project_list_node.value)
                on_done(project_list_node.value);
            }
        }
    );
}
function update_stack_label(){
    return;
    let lbl = document.getElementById('lbl_stack');
    let str = 'HOME';
    for(let key in json_dict){
        str += " / <a href='#' onclick=\"load_from_stack('" + key + "');\">" + key + "</a>";
    }
    if(!json_dict.hasOwnProperty(cpd_designer.file_name)){
        str += " / <a href='#' onclick=''>" + cpd_designer.file_name + "</a>";
    }
    lbl.innerHTML = str;
}
function load_from_json(j, file_name, id = undefined){
    console.log('load', j);
    cpd_designer.clear_designer();
    cpd_designer.saved_info = null;// 클라우드에서 불러온 경우 load_from_api_server 가 채운다
    cpd_designer.model_name = j.model_name || file_name;
    cpd_designer.file_name = file_name;
    document.all.load_file_name.value = file_name;
    document.all.load_model_name.value = cpd_designer.model_name;
    cpd_designer.iid = j.iid || get_random_string();
    cpd_designer.uid = j.uid || get_random_string();
    cpd_designer.activated_model.load(j);
    _root_model = cpd_designer.activated_model;
    /*
    j.models.forEach((v, idx) =>{
        if(v.model_type === undefined){
            let ext = v.file_name.substring(v.file_name.lastIndexOf('.'), v.file_name.length).toLowerCase();
            if(ext == '.json')
                v.model_type = MODEL_TYPE.COUPLED;
            else
                v.model_type = MODEL_TYPE.DISCRETE;
        }
        cpd_designer.add_model(Object.assign(v));
    });
    j.out_port.forEach((v, idx) =>{
        cpd_designer.add_eout_port(v);
    });
    j.in_port.forEach((v, idx) =>{
        cpd_designer.add_ein_port(v);
    });
    */
    
    /*j.couples.forEach((v) =>{
        cpd_designer.set_coupling(v);
    });*/
    
    setTimeout(cpd_designer.adjust_pane, 100);
    update_stack_label();
    document.getElementById('btn_sim_push').disabled = false;
    document.getElementById('btn_sim_update').disabled = false;
}
function update_tree(){
    let tree_data = [];
    _root_model.get_tree(tree_data);
    tree_data[0].a_attr = {title:'우클릭: 이름 변경 / 상위 모델 제거'};
    $('#tree').jstree("destroy");
    $('#tree').jstree({
        'core' : {
            dblclick_toggle : false,
            //themes: { dots: false },
            'data' : tree_data
        },
        'plugins' : ['contextmenu'],
        'contextmenu' : {
            'select_node' : false,
            'items' : tree_context_menu
        }
    });

    $('#tree').bind("dblclick.jstree", function (e){
        var clickId = e.target.id.substring(0, e.target.id.indexOf('_'));
        if(_root_model != null){
            let obj = _root_model.get_model_by_id(clickId, true);
            if(obj != null){
                if(obj.model_type == MODEL_TYPE.COUPLED){
                    cpd_designer.set_model(obj);
                }
            }
        }
    });
    $('#tree').bind("click.jstree", function (e){
        var clickId = e.target.id.substring(0, e.target.id.indexOf('_'));
        if(_root_model != null){
            let obj = _root_model.get_model_by_id(clickId, true);
            if(obj != null){
                if(obj.model_type == MODEL_TYPE.COUPLED){

                    selectParamModel(obj);
                }
            }
        }
    });
}
// 프로젝트 트리 우클릭 메뉴 — 최상위 모델에만 있다
// (메뉴가 닫힌 뒤 prompt/confirm 이 뜨도록 setTimeout 으로 실행)
function tree_context_menu(node){
    if(_root_model == null || node.id != _root_model.iid)
        return false;
    return {
        rename : {
            label : '이름 변경',
            action : ()=>setTimeout(rename_root_model, 0)
        },
        unwrap : {
            label : '상위 모델 제거 (하위 모델을 최상위로)',
            _disabled : get_unwrap_child() == null,
            action : ()=>setTimeout(remove_root_wrapper, 0)
        }
    };
}
function rename_root_model(){
    let name = ask_model_name('커플모델 이름', _root_model.model_name);
    if(name == null || name == _root_model.model_name)
        return;
    _root_model.model_name = name;
    document.all.load_model_name.value = name;
    update_tree();
    cpd_designer.on_model_changed(_root_model);// 저장 버튼 활성화
}
// 최상위 모델이 커플모델 하나만 감싸고 있으면 그 하위 모델, 아니면 null
function get_unwrap_child(){
    if(_root_model == null || _root_model.models.length != 1)
        return null;
    let child = _root_model.models[0];
    return child.model_type == MODEL_TYPE.COUPLED ? child : null;
}
// 최상위 모델(예: untitled)을 없애고 그 아래 커플모델을 최상위로 올린다.
// 하위 모델을 JSON 으로 저장한 뒤 최상위로 다시 불러온다. 그러면 하위 모델의 입출력 포트가 외부 입출력 포트가 되고
// 내부 연결선은 유지된다. 없어지는 최상위 모델의 외부 포트와 그 연결선은 함께 삭제된다.
function remove_root_wrapper(){
    let child = get_unwrap_child();
    if(child == null){
        alert('하위에 커플모델이 하나만 있을 때 상위 모델을 제거할 수 있습니다.');
        return;
    }
    let msg = '[' + _root_model.model_name + '] 을(를) 제거하고 [' + child.model_name + '] 을(를) 최상위 모델로 올리시겠습니까?';
    let port_cnt = _root_model.in_port.length + _root_model.out_port.length;
    if(port_cnt > 0)
        msg += '\n[' + _root_model.model_name + '] 의 외부 입출력 포트 ' + port_cnt + '개와 그 연결선은 삭제됩니다.';
    if(!confirm(msg))
        return;

    // 파라미터 탭 값의 키는 최상위부터의 iid 경로이므로 맨 앞(없어지는 최상위) iid 를 떼어 옮긴다
    saveUIToActiveTab();
    let old_root_iid = _root_model.iid;
    let saved_tabs = tabs.map(t => ({id:t.id, n:t.n, paramMap:strip_root_from_param_map(t.paramMap, old_root_iid)}));
    let saved_active_tab = activeTabId;
    let saved_info = cpd_designer.saved_info;

    let j = JSON.parse(JSON.stringify(child.save()));
    // 하위 모델 포트의 연결선에는 바깥(없어지는 최상위) 쪽 연결도 들어 있다. 'this' 는 최상위로 올린 뒤
    // 자기 자신을 가리키게 되므로 내부 연결선만 남긴다.
    j.in_port.forEach(p => { p.line = (p.line || []).filter(l => l.from_obj_info.iid == j.iid); });
    j.out_port.forEach(p => { p.line = (p.line || []).filter(l => l.to_obj_info.iid == j.iid); });
    load_from_json(j, j.file_name);
    cpd_designer.saved_info = saved_info;

    tabs.length = 0;
    saved_tabs.forEach(t => tabs.push(t));
    activeTabId = saved_active_tab;
    renderTabs();
    restoreActiveTabToUI();
    update_tree();
    cpd_designer.adjust_pane(true);
    cpd_designer.on_model_changed(_root_model);
}
function strip_root_from_param_map(map, root_iid){
    const ret = {};
    Object.keys(map).forEach(key => {
        const [path, name] = JSON.parse(key);
        if(path.length > 1 && path[0] == root_iid)
            ret[paramKey(path.slice(1), name)] = map[key];
    });
    return ret;
}
function load_from_api_server(project, file_name, id = ''){
    project_name = project;
    document.all.project_name.value = project;
    send_post_ex(api_server_url + '/get_model_info',
        {project_name:project, file_name:file_name, uid:id }, (res)=>{
            console.log(res);
            if(res.result == 1){
                //cpd_designer.file_location = res.data[0][0].location || 'localhost';
                //cpd_designer.model_name = res.data[0][0].model_name;
                let row = res.data[0][0];
                let j = JSON.parse(row.json_data);
                load_from_json(j, file_name, id);
                // 같은 프로젝트·이름으로 저장하면 이 모델(uid)을 덮어쓴다
                cpd_designer.saved_info = {project_name:project, uid:row.uid,
                    model_name:_root_model.model_name, file_name:file_name};
                update_tree();
                
            }
        });
}
function load_from_server(project, file_name){
    project_name = project;
    let json = {};
    json['Type'] = 'req_m';
    json['Data'] = {};
    json['Data']['project_name'] = project;
    json['Data']['file_name'] = file_name;
    
    ws.on_data_callback['req_m'] = function(json){
        load_from_json(json.Data.content, file_name);
    }
    ws.send(JSON.stringify(json));

}

function load_from_json_text(json_txt, file_name = 'coupled.json'){
    load_from_json(JSON.parse(json_txt), file_name);    
}
function load_from_uri(json_uri){
    let xhttp = new XMLHttpRequest();
    let _this = this;
    xhttp.onreadystatechange = function () {
        if(xhttp.readyState == 4 && xhttp.status == 200){
            _this.load_from_json_text(this.responseText, json_uri);
        }
    }
    xhttp.open("GET",'cpd/' + json_uri, true);
    xhttp.send();
}
function load_from_local(file){
    if(file === undefined)
        return;
    let file_reader = new FileReader();
    file_reader.readAsText(file);
    file_reader.onload = function(){
        load_from_json_text(file_reader.result, file.name);
    }
}

// 외부연동 상태창(open_External_Panel / appendLogToPanel)은 scripts2/external_sim_api.js 로 옮겼다.

// ─────────────────────────────────────────────────────────────────────
// 시뮬레이션 상태 머신
//   idle             : 모델 없음
//   single_loading   : 단일 로드 중
//   single_loaded    : 단일 로드 완료 (재실행 가능)
//   single_running   : 단일 실행 중
//   parallel_loading : 병렬 로드 중
//   parallel_loaded  : 병렬 로드 완료 (재실행 가능)
//   parallel_running : 병렬 실행 중
// ─────────────────────────────────────────────────────────────────────
var _sim_mode          = 'idle';
var _loaded_project_name = null;
var _mr_parallel_state = null;
var _mr_done_count     = 0;
var _mr_total_count    = 0;

// 엔진으로 실제 전송한 JSON 기록 (Push JSON / Run JSON 다운로드용)
//   push : { project_name, mode, time, messages:[...] }  — Push 시 보낸 sim_ctl 메시지
//   run  : { project_name, mode, time, messages:[...] }  — Run 시 보낸 sim_ctl 메시지
// base_model.save() 는 in_param 을 참조로 담으므로, 전송한 문자열을 다시 파싱해 스냅샷으로 보관한다.
var _sent_json_log = { push: null, run: null };

/** 버튼 상태 일괄 설정 */
function _set_sim_buttons(state) {
    function dis(id, v) { var el = document.getElementById(id); if (el) el.disabled = v; }
    ['btn_sim_push','btn_sim_run','btn_sim_pause','btn_sim_stop','btn_sim_update','btn_multi_run']
        .forEach(function(id) { dis(id, true); });
    if (state === 'idle') {
        dis('btn_sim_push', false);
    } else if (state === 'loading') {
        dis('btn_sim_stop', false);
    } else if (state === 'loaded') {
        dis('btn_sim_push', false); dis('btn_sim_run', false);
        dis('btn_sim_update', false); dis('btn_multi_run', false);
    } else if (state === 'running') {
        dis('btn_sim_pause', false); dis('btn_sim_stop', false);
    }
}

/**
 * res_m 단일 핸들러 — _sim_mode에 따라 분기
 * 콜백을 덮어쓰지 않고 상태 변수로 동작을 제어한다.
 */
function _on_res_m(json) {
    var d = json.Data;
    if (d.info !== undefined) WebId = d.info;

    switch (_sim_mode) {
        case 'single_loading':
            if (d.load === 'ok') {
                _sim_mode   = 'single_loaded';
                ModelLoaded = true;
                _set_sim_buttons('loaded');
                console.log('[Single] 모델 로드 완료');
            }
            break;

        case 'single_running':
            if (d.stop !== undefined) {
                _sim_mode = 'single_loaded';   // 완료 후 재실행 가능
                _set_sim_buttons('loaded');
                console.log('[Single] 시뮬레이션 종료 — 재실행 가능');
            } else {
                var m = _root_model ? _root_model.get_model_by_id(d.iid, true) : null;
                if (m != null && m !== undefined) m.on_message_from_sim_server(d);
            }
            break;

        case 'parallel_loading':
            if (d.multi_load_ok === true) {
                _sim_mode = 'parallel_loaded';
                _set_sim_buttons('loaded');
                console.log('[Parallel] 로드 완료 —', d.count, '개 엔진 준비');
            }
            break;

        case 'parallel_running': {
            var run_id = (d.run_id !== undefined) ? d.run_id : -1;
            if (d.stop !== undefined) {
                if (run_id >= 0) {
                    _multirun_update_card(run_id, 'done');
                    _mr_mark_window_done(run_id);
                    _mr_done_count++;
                    if (_mr_done_count >= _mr_total_count) {
                        _sim_mode = 'parallel_loaded';   // 재실행 가능 — Push 불필요
                        _set_sim_buttons('loaded');
                        console.log('[Parallel] 전체 실행 완료 — 재실행 가능');
                    }
                }
            } else if (run_id >= 0) {
                _mr_route_result(run_id, d);
            } else {
                var m2 = _root_model ? _root_model.get_model_by_id(d.iid, true) : null;
                if (m2 != null && m2 !== undefined) m2.on_message_from_sim_server(d);
            }
            break;
        }
        default:
            break;
    }
}

/** model_init 단일 핸들러
 *  단일 로딩 중에만 _root_model에 init 전달.
 *  병렬 로딩 중 N개 엔진이 각각 전송하므로 무시한다. */
function _on_model_init(json) {
    if (_sim_mode !== 'single_loading' || !_root_model) return;
    var model = _root_model.get_model_by_id(json.Data.iid, true);
    if (model) model.on_init_from_sim_server(json.Data);
}

// 콜백 초기 1회 등록 — 이후 절대 덮어쓰지 않음
ws.on_data_callback['res_m']            = _on_res_m;
ws.on_data_callback['model_init']       = _on_model_init;
ws.on_data_callback['multi_run_status'] = function(resp) {
    var d = resp.Data || resp;
    _multirun_update_card(d.run_id, d.status);
};

// ─────────────────────────────────────────────────────────────────────
// 시뮬레이션 제어 함수
// ─────────────────────────────────────────────────────────────────────

/**
 * Push 전 공통 초기화:
 *   서버에 unload 전송 → 클라이언트 상태 리셋 → 결과창 정리
 * 실행 중이든 로드 상태든 항상 이 경로를 통해 초기화한다.
 */
function _sim_reset() {
    // unload is scoped to a project owned by this connection. "all" is not a
    // project name and can leave the previous engine loaded on the server.
    if (_loaded_project_name && ws.websocket && ws.websocket.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ Type: 'sim_ctl', Data: { project_name: _loaded_project_name, msg: 'unload' } }));
    }
    _loaded_project_name = null;
    _sim_mode          = 'idle';
    _mr_parallel_state = null;
    _mr_done_count     = 0;
    _mr_total_count    = 0;
    ModelLoaded        = false;
    if (typeof _mr_run_meta === 'object' && _mr_run_meta !== null) {
        for (var k in _mr_run_meta) {
            if (_mr_run_meta.hasOwnProperty(k)) _mr_destroy_run_windows(parseInt(k));
        }
        _mr_run_meta = {};
    }
    _sent_json_log.push = null;
    _sent_json_log.run  = null;
    _update_json_buttons();
    _set_sim_buttons('idle');
}

/**
 * sim_ctl 메시지를 엔진으로 전송하고, 보낸 그대로를 _sent_json_log[kind] 에 기록한다.
 * 소켓이 열려 있지 않으면 브라우저가 메시지를 버리므로, 보내지 못한 것을 보여주지 않도록 이전 기록도 지운다.
 */
function _sim_send_logged(kind, project_name, mode, msgs) {
    var is_open = ws.websocket && ws.websocket.readyState === WebSocket.OPEN;
    var texts = msgs.map(function(m) { return JSON.stringify(m); });
    texts.forEach(function(t) { ws.send(t); });
    if (!is_open) console.warn('[' + kind + '] 시뮬레이션 서버 미연결 — 전송 JSON 미기록');
    _sent_json_log[kind] = !is_open ? null : {
        project_name: project_name,
        mode:         mode,
        time:         new Date(),
        messages:     texts.map(function(t) { return JSON.parse(t); })
    };
    if (kind === 'push') _sent_json_log.run = null;   // 새로 로드하면 이전 Run 기록은 무효
    _update_json_buttons();
}

/** Push JSON / Run JSON 다운로드 버튼 활성화 갱신 */
function _update_json_buttons() {
    var bp = document.getElementById('btn_json_push');
    var br = document.getElementById('btn_json_run');
    if (bp) bp.disabled = !_sent_json_log.push;
    if (br) br.disabled = !_sent_json_log.run;
}

function _fmt_time(d, compact) {
    function p(n) { return (n < 10 ? '0' : '') + n; }
    var ymd = d.getFullYear() + (compact ? '' : '-') + p(d.getMonth() + 1) + (compact ? '' : '-') + p(d.getDate());
    var hms = p(d.getHours()) + (compact ? '' : ':') + p(d.getMinutes()) + (compact ? '' : ':') + p(d.getSeconds());
    return ymd + (compact ? '_' : ' ') + hms;
}

function _json_file_name(project_name, kind, time) {
    var prj = String(project_name || 'project').replace(/[\\\/:*?"<>|\s]+/g, '_');
    return prj + '_' + kind + '_' + _fmt_time(time, true) + '.json';
}

/**
 * 엔진으로 보낸 커플모델 JSON 에서 시뮬레이션에 쓰이는 정보만 남긴다 (Push/Run JSON 다운로드용).
 * 위치·색상·idx·포트 index·라인 user_offset·파라미터 desc 같은 화면 정보는 엔진이 읽지 않으므로 뺀다.
 *  - 모델: sim_engine::add_model / model_exec 가 읽는 필드만 남긴다.
 *    커플드(99)는 하위 models 로 바로 로드되므로 file_path/ip_port 를 쓰지 않는다.
 *  - 라인: sim_engine::add_couple 은 from_obj_info.iid 가 자기 iid 또는 "this" 인 라인만 등록한다.
 *    나머지는 상대편 포트에 같은 라인이 중복 저장된 것이라 뺀다.
 *  - in_param: 모델에 그대로 전달되며 model_cap 은 name/d_type/value 만 읽는다.
 * 원본에 없는 필드는 만들지 않는다 (예: in_param 이 없던 노드에 빈 배열을 넣지 않음).
 */
function _min_model_json(m) {
    function pick(src, keys) {
        var o = {};
        keys.forEach(function(k) { if (src && src[k] !== undefined) o[k] = src[k]; });
        return o;
    }
    function ports(list) {
        return list.map(function(p) {
            var o = pick(p, ['name']);
            o.line = (Array.isArray(p.line) ? p.line : []).filter(function(l) {
                var from = l && l.from_obj_info && l.from_obj_info.iid;
                return from === m.iid || from === 'this';
            }).map(function(l) {
                return { from_obj_info: pick(l.from_obj_info, ['iid', 'port_name']),
                         to_obj_info:   pick(l.to_obj_info,   ['iid', 'port_name']) };
            });
            return o;
        });
    }
    if (!m || typeof m !== 'object') return m;
    var o = pick(m, ['model_name', 'iid', 'uid', 'model_type', 'file_name']);
    if (m.model_type !== MODEL_TYPE.COUPLED) Object.assign(o, pick(m, ['file_path', 'ip_port', 'server_ip']));
    if (Array.isArray(m.models))   o.models   = m.models.map(_min_model_json);
    if (Array.isArray(m.in_port))  o.in_port  = ports(m.in_port);
    if (Array.isArray(m.out_port)) o.out_port = ports(m.out_port);
    if (Array.isArray(m.in_param)) o.in_param = m.in_param.map(function(p) { return pick(p, ['name', 'd_type', 'value']); });
    return o;
}

/**
 * 엔진으로 보낸 sim_ctl 메시지들을 시뮬레이션에 필요한 정보만 남긴 형태로 만든다.
 * 제어 필드(project_name, msg, start_t, end_t, count, param_sets ...)는 그대로 두고 json_data 만 줄여 맨 뒤에 둔다.
 * 메시지가 하나면 패킷 하나, 여러 개면(단일 모드 Run: param + run) 보낸 순서대로 배열로 돌려준다.
 */
function _min_sim_messages(messages) {
    var list = messages.map(function(packet) {
        var data = packet.Data || {}, out = {};
        Object.keys(data).forEach(function(k) { if (k !== 'json_data') out[k] = data[k]; });
        if (data.json_data !== undefined) out.json_data = _min_model_json(data.json_data);
        return { Type: packet.Type, Data: out };
    });
    return (list.length === 1) ? list[0] : list;
}

/** Push 시 엔진으로 보낸 sim_ctl 메시지를 시뮬레이션에 필요한 정보만 남겨 내려받는다. */
function download_push_json() {
    var rec = _sent_json_log.push;
    if (!rec) {
        alert('엔진으로 보낸 Push JSON이 없습니다.\n먼저 Push(시뮬레이션 서버에 올리기)를 수행해주세요.');
        return;
    }
    make_text_file(JSON.stringify(_min_sim_messages(rec.messages), null, 2), _json_file_name(rec.project_name, 'push', rec.time));
}

/**
 * Run 시 엔진으로 보낸 sim_ctl 메시지를 시뮬레이션에 필요한 정보만 남겨 내려받는다.
 * 병렬 Run(multi_run_loaded)은 모델을 싣지 않으므로 Push JSON 으로 먼저 로드한 엔진에서만 실행된다.
 */
function download_run_json() {
    var run = _sent_json_log.run;
    if (!run) {
        alert('엔진으로 보낸 Run JSON이 없습니다.\n먼저 Push 후 Run(실행)을 수행해주세요.');
        return;
    }
    make_text_file(JSON.stringify(_min_sim_messages(run.messages), null, 2), _json_file_name(run.project_name, 'run', run.time));
}

/** 서버 언로드 버튼에서 직접 호출 시 */
function unload_model_on_server() {
    _sim_reset();
}

/**
 * 탭/창을 닫을 때, 소켓이 아직 열려 있는 동안 서버에 unload 를 보내
 * 이 클라이언트가 띄운 모델(model_cap_*.exe)을 정리하게 한다.
 *
 * 왜 필요한가: /sim WebSocket 은 nginx 를 경유하는데, 브라우저가 사라져도
 * nginx 가 유휴 업스트림 연결을 오래(proxy_read_timeout 3600s) 붙들 수 있어
 * fDTSimServer 가 끊김을 늦게/못 감지한다. 그러면 서버측 disconnect 정리
 * (sim_del -> release -> KILL)가 트리거되지 않아 모델 프로세스가 계속 남는다.
 * 닫히기 직전에 여기서 직접 unload 를 보내면 그 체인을 즉시 태운다.
 *
 * best-effort 임에 유의: 탭 강제 종료/브라우저 크래시/OS 종료 시에는 이 이벤트가
 * 발생하지 않아 못 잡는다. 그 경우까지 확실히 하려면 서버측 WS heartbeat 가 필요하다.
 */
function _notify_unload_on_exit() {
    try {
        if (_loaded_project_name && typeof ws !== 'undefined' && ws && ws.websocket &&
            ws.websocket.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ Type: 'sim_ctl', Data: { project_name: _loaded_project_name, msg: 'unload' } }));
            _loaded_project_name = null;
        }
    } catch (e) { /* 페이지 종료 중이라 달리 처리할 것이 없다 */ }
}
window.addEventListener('pagehide', _notify_unload_on_exit);
window.addEventListener('beforeunload', _notify_unload_on_exit);

/**
 * Push 버튼 디스패처
 * 항상 _sim_reset()으로 기존 모델을 언로드한 뒤 새 load를 요청한다.
 * 탭이 있으면 병렬 로드, 없으면 단일 로드.
 */
function push_dispatch(project_name, file_name, start_t, end_t) {
    if (!project_name) { alert('프로젝트 명을 입력해주세요.'); return; }
    _sim_reset();
    _loaded_project_name = project_name;
    if (tabs && tabs.length > 0) {
        parallel_load_models(project_name, start_t, end_t);
    } else {
        load_model_on_server(project_name, file_name);
    }
}

/** 병렬 모델 로드 */
function parallel_load_models(project_name, start_t, end_t) {
    _loaded_project_name = project_name;
    saveUIToActiveTab();
    var payload = simulationParamPayload();
    var base_json = payload.json_data;
    var param_sets = payload.param_sets;

    _mr_parallel_state = {
        project_name: project_name,
        count:        param_sets.length,
        param_sets:   param_sets,
        base_json:    base_json,
        start_t:      start_t,
        end_t:        end_t
    };

    _multirun_init_panel(param_sets.length);
    _sim_mode = 'parallel_loading';
    _set_sim_buttons('loading');

    _sim_send_logged('push', project_name, 'parallel', [_multi_load_packet(project_name, payload, start_t, end_t)]);
    console.log('[MultiLoad] sent', param_sets.length, 'param sets');
}

// 병렬 Push/Run 패킷. 외부연동 상태창(REST)도 같은 함수로 만들어 Push/Run JSON 다운로드와 내용이 같다.
function _multi_load_packet(project_name, payload, start_t, end_t) {
    return {
        Type: 'sim_ctl',
        Data: {
            project_name: project_name,
            msg:          'multi_load',
            json_data:    payload.json_data,
            start_t:      parseFloat(start_t),
            end_t:        parseFloat(end_t),
            param_sets:   payload.param_sets
        }
    };
}

function _multi_run_packet(project_name, count, start_t, end_t) {
    return {
        Type: 'sim_ctl',
        Data: {
            project_name: project_name,
            msg:          'multi_run_loaded',
            count:        count,
            start_t:      parseFloat(start_t),
            end_t:        parseFloat(end_t)
        }
    };
}

/** 단일 모델 로드 */
function load_model_on_server(project_name) {
    _loaded_project_name = project_name;
    _sim_mode = 'single_loading';
    _set_sim_buttons('loading');
    _sim_send_logged('push', project_name, 'single', [{
        Type: 'sim_ctl',
        Data: { project_name: project_name, json_data: simulationParamPayload().json_data, msg: 'load' }
    }]);
}

/**
 * Run 버튼 디스패처
 * parallel_loaded → 병렬 실행 / single_loaded → 단일 실행
 */
function run_dispatch(project_name, start_t, end_t) {
    if (_sim_mode === 'parallel_loaded') {
        parallel_run_models(start_t, end_t);
    } else if (_sim_mode === 'single_loaded') {
        run_model_on_server(project_name, start_t, end_t);
    } else {
        console.warn('[run_dispatch] 실행 불가 상태:', _sim_mode);
    }
}

/**
 * 이미 로드된 병렬 엔진 실행
 * 완료 후 parallel_loaded 상태로 복귀하므로 재실행 시에도 동일 경로 사용
 */
function parallel_run_models(start_t, end_t) {
    if (!_mr_parallel_state) { alert('먼저 Push하여 모델을 로드해주세요.'); return; }
    var ps = _mr_parallel_state;

    // 이전 결과창 정리 후 재생성
    for (var k in _mr_run_meta) {
        if (_mr_run_meta.hasOwnProperty(k)) _mr_destroy_run_windows(parseInt(k));
    }
    _mr_run_meta    = {};
    _mr_done_count  = 0;
    _mr_total_count = ps.count;

    ps.param_sets.forEach(function(ps_item) {
        var rid = ps_item.run_id;
        _mr_run_meta[rid] = { paramLabel: 'param' + (rid + 1), printWins: [], graphWins: [] };
        _mr_create_run_windows(rid, 'param' + (rid + 1), ps.base_json);
    });

    _sim_mode = 'parallel_running';
    _set_sim_buttons('running');

    _sim_send_logged('run', ps.project_name, 'parallel',
        [_multi_run_packet(ps.project_name, ps.count, start_t || ps.start_t, end_t || ps.end_t)]);
    console.log('[MultiRunLoaded] sent for', ps.count, 'engines');
}

/** 단일 모델 실행 (완료 후 single_loaded로 복귀 → 재실행 가능) */
function run_model_on_server(projectname, sim_start_time, sim_end_time) {
    saveUIToActiveTab();
    _clear_single_run_results();
    // 파라미터 먼저 업데이트한 뒤 실행
    _sim_send_logged('run', projectname, 'single', [{
        Type: 'sim_ctl',
        Data: { project_name: projectname, json_data: simulationParamPayload().json_data, msg: 'param' }
    }, {
        Type: 'sim_ctl',
        Data: { project_name: projectname, msg: 'run',
                start_t: parseFloat(sim_start_time), end_t: parseFloat(sim_end_time) }
    }]);
    _sim_mode = 'single_running';
    _set_sim_buttons('running');
}

// A loaded engine does not emit model_init again on each Run. Clear visible
// outputs here so each run starts with an empty console and graph.
function _clear_single_run_results() {
    if (!_root_model) return;
    var clear_model = function(model) {
        if (!model) return;
        if (model.model_type >= MODEL_TYPE.EMBEDED_FUNC &&
            typeof model.on_init_from_sim_server === 'function') {
            model.on_init_from_sim_server({});
        }
        if (Array.isArray(model.models)) model.models.forEach(clear_model);
    };
    clear_model(_root_model);
}

/** 파라미터만 업데이트 (실행 없음) */
function update_model_on_server(project_name, file_name) {
    if (_sim_mode === 'parallel_loaded' || _sim_mode === 'parallel_running') {
        parallel_update_params();
        return;
    }
    ws.send(JSON.stringify({
        Type: 'sim_ctl',
        Data: { project_name: project_name, json_data: simulationParamPayload().json_data, msg: 'param' }
    }));
}
/**
 * 병렬 Push 상태의 파라미터 업데이트.
 * 엔진은 탭마다 하나씩 떠 있고, 프로젝트 이름으로 보낸 param 은 이 연결의 모든 병렬 엔진에 같은 값으로 적용된다.
 * 그래서 탭(param_set)마다 그 탭의 값을 넣은 json_data 를 만들어 <project>_param<run_id+1> 엔진으로 따로 보낸다.
 */
function parallel_update_params() {
    var ps = _mr_parallel_state;
    if (!ps) { alert('먼저 Push하여 모델을 로드해주세요.'); return; }
    saveUIToActiveTab();
    var payload = simulationParamPayload();
    var sets = payload.param_sets;
    // 탭 순서가 엔진 run_id 이므로, 탭 수가 바뀌면 어떤 탭이 어떤 엔진인지 맞출 수 없다.
    if (sets.length !== ps.count) {
        alert('Push 이후 파라미터 탭 수가 바뀌었습니다. (Push: ' + ps.count + '개, 현재: ' + sets.length + '개)\n' +
              '탭별 엔진을 다시 띄우려면 Push를 다시 해주세요.');
        return;
    }
    sets.forEach(function(set) {
        var json_data = JSON.parse(JSON.stringify(payload.json_data));
        _apply_param_overrides(json_data, set.overrides);
        ws.send(JSON.stringify({
            Type: 'sim_ctl',
            Data: { project_name: ps.project_name + '_param' + (set.run_id + 1), json_data: json_data, msg: 'param' }
        }));
    });
    ps.param_sets = sets;
    console.log('[ParamUpdate] sent to', sets.length, 'engines');
}
// 엔진(sim_manager.cpp apply_param_override)이 Push 때 param_set 을 적용하는 방식과 같다.
function _apply_param_overrides(node, overrides) {
    if (!node) return;
    if (node.model_name !== undefined && Array.isArray(node.in_param)) {
        node.in_param.forEach(function(p) {
            var key = node.model_name + '::' + p.name;
            if (Object.prototype.hasOwnProperty.call(overrides, key)) p.value = structuredClone(overrides[key]);
        });
    }
    if (Array.isArray(node.models)) node.models.forEach(function(child) { _apply_param_overrides(child, overrides); });
}

/** 실행 중인 시뮬레이션 정지 — 로드 상태로 복귀하여 재실행 가능 */
function stop_model_on_server(projectname) {
    ws.send(JSON.stringify({ Type: 'sim_ctl', Data: { project_name: projectname, msg: 'stop' } }));
    if (_sim_mode === 'parallel_running') _sim_mode = 'parallel_loaded';
    else if (_sim_mode === 'single_running') _sim_mode = 'single_loaded';
    _set_sim_buttons('loaded');
}

function get_model_on_server(atomic_name){

    let json = {};
    json['Type'] = 'getatomicmodel';
    json['Data'] = {};
    json['Data']['atomic_name'] = atomic_name;

    ws2.on_data_callback['atomic_txt'] = function(json){
        openEditorInNewWindow(atomic_name, json.Data.content);
    }
    ws2.send(JSON.stringify(json));
}

function set_model_on_server(atomic_name, param){
    let json = {};
    json['Type'] = 'setatomicmodel';
    json['Data'] = {};
    json['Data']['atomic_name'] =  atomic_name;
    json['Data']['msg'] = param;

    ws2.send(JSON.stringify(json));
}

function on_model_changed(obj){
    document.getElementById('btn_sim_save').disabled = false;
    document.getElementById('btn_sim_push').disabled = false;
    document.getElementById('btn_sim_update').disabled = false;
}

function clear_designer(){
    cpd_designer.clear_designer();
    cpd_designer.saved_info = null;
    document.getElementById('btn_sim_save').disabled = true;
    document.getElementById('btn_sim_push').disabled = true;
    document.getElementById('btn_sim_update').disabled = true;
    document.all.load_model_name.value = DEFAULT_MODEL_NAME;
    document.all.load_file_name.value = DEFAULT_FILE_NAME;
}
function add_keyevent_listener() {
    document.onkeydown = function(e){
        cpd_designer.on_keydown(e);
    }

    canvas.onmousewheel = function(e){
        cpd_designer.on_mousewheel(e);
    }

    canvas.onmousedown = function(e) {
        $(".contextmenu").hide();
        cpd_designer.on_mousedown(e);
        //if(e.buttons == 1){
        //    open_model_list_window(true);
        //}
    }

    canvas.onmousemove = function(e) {
        cpd_designer.on_mousemove(e);
    }

    canvas.onmouseup = function(e) {
        cpd_designer.on_mouseup(e);
    }

    canvas.onmouseout = function(e) {
        cpd_designer.on_mouseout(e);
    }

    canvas.ondblclick = function(e){
        cpd_designer.on_mousedbclick(e);
    }

    canvas.ondragenter = function(e){
        e.preventDefault();
        console.log('ondragenter');
        if(selected_model_data != null){
            var x = e.pageX - screenRect.x;
            var y = e.pageY - screenRect.y;
            x -= cpd_designer.canvas_offset.x;
            y -= cpd_designer.canvas_offset.y;
            x /= cpd_designer.scale_ratio.x;
            y /= cpd_designer.scale_ratio.y;


            add_model_tmp = add_model(selected_model_data, x, y);
            if(add_model_tmp != null && add_model_tmp.model_type !== undefined){
                add_model_tmp.selected = true;
            }
        }

    }

    canvas.ondragover = function(e){
        e.preventDefault();
        if(add_model_tmp != null && add_model_tmp.model_type !== undefined){
            cpd_designer.on_mousemove(e);
        }
     //   console.log('ondragover');
    }

    canvas.ondragleave = function(e){
        e.preventDefault();
        console.log('ondragleave');
        if(add_model_tmp != null){
            if(add_model_tmp.model_type !== undefined){
                add_model_tmp.selected = false;
                cpd_designer.delete_model(add_model_tmp);
            }
            else{
                cpd_designer.delete_port(add_model_tmp);
            }
            add_model_tmp = null;
        }
    }

    canvas.ondrop = function(e){
        e.preventDefault();
        console.log('ondragdrop', e);
        if(add_model_tmp != null){
            if(add_model_tmp.model_type !== undefined){
                add_model_tmp.selected = false;
                cpd_designer.adjust_pane();
                

            }
            add_model_tmp = null;
            
        }
        /*var d = e.dataTransfer.getData('data');
        var x = e.pageX - screenRect.x;
        var y = e.pageY - screenRect.y;
        x -= cpd_designer.canvas_offset.x;
        y -= cpd_designer.canvas_offset.y;
        x /= cpd_designer.scale_ratio.x;
        y /= cpd_designer.scale_ratio.y;


        add_model(d, x, y);*/
    }

    canvas.oncontextmenu = function(e){
        e.preventDefault();
        console.log('menu');
        cpd_designer.on_mousedown(e);
        if(_last_selected_obj != null){
            $(".contextmenu").css({
                "left":event.pageX + "px",
                "top":event.pageY + "px"
            }).show();
        }
    }

    window.addEventListener('resize', (e)=>{
        console.log('window resize');
        screenRect = canvas.getBoundingClientRect();
        cpd_designer.adjust_pane(true);
    });
}


function animate_loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ctx.fillStyle = 'rgba(40,40,40,1)';
    // ctx.fillStyle = #7da5d7;
    ctx.rect(0,0,canvas.width, canvas.height);
    // ctx.fill();
    cpd_designer.draw();
    
    requestAnimationFrame(() => {
        if(animate_state == 1)
            animate_loop();
    });

}
function add_project_list_option (parent,projectname) {
    let option = document.createElement("option");
    let project_name_node = document.createTextNode(projectname);
    option.setAttribute("value",projectname);
    option.appendChild(project_name_node);
    parent.appendChild(option);
}

function req_atomic_list(element_id) {
    console.log('req_atomic_list')
        send_post_ex(
            api_server_url  + '/get_atomic_list',
        //"http://localhost:8081/get_atomic_list", // api_server_url + "/get_project_list",
        {_:""}, 
        (res)=>{
            if(res.result == 1){
            let atomic_list_node = document.getElementById(element_id);
            atomic_list_node.innerHTML="";
            res.data[0].forEach((element)=>{
                add_atomic_list_option(atomic_list_node, element.project_name, element.file_name)
            })
            //document.getElementById(element_id).value = atomic_list_node;
            // req_list_models(project_name);
            }
        }
    );
}

function add_atomic_list_option (parent, project_name, file_name) {
    var option = document.createElement("option");
    option.text = project_name + "/" + file_name;
    option.value = project_name + "/" + file_name;
    parent.options.add(option);
}

// ─────────────────────────────────────────────
// 병렬 시뮬레이션 실행 및 결과창 관리
// ─────────────────────────────────────────────

// run_id → { paramLabel, printWins:[{iid, el}], graphWins:[{iid}] }
var _mr_run_meta = {};

/**
 * 현재 탭 목록(tabs)을 파라미터 세트로 변환해 서버에 병렬 실행 요청을 보낸다.
 * 각 run마다 독립 결과창(PRINT/GRAPH)을 미리 생성하고, res_m 수신 시 run_id로 라우팅한다.
 */
function run_parallel_simulations(project_name, start_t, end_t) {
    if (!project_name) { alert('프로젝트 명을 입력해주세요.'); return; }
    if (!tabs || tabs.length === 0) { alert('파라미터 탭이 없습니다.'); return; }

    // 방어적 초기화 — 어느 시점에 호출되어도 안전
    if (typeof _mr_run_meta !== 'object' || _mr_run_meta === null) {
        _mr_run_meta = {};
    }

    saveUIToActiveTab();

    // Push 버튼 비활성화 (실행 완료 시 재활성화)
    document.getElementById('btn_sim_push').disabled = true;

    var payload = simulationParamPayload();
    var base_json = payload.json_data;
    var param_sets = payload.param_sets;
    var _mr_total_count = param_sets.length;
    var _mr_done_count  = 0;

    // ── 기존 결과창 전부 제거 ────────────────────────────
    for (var k in _mr_run_meta) {
        if (_mr_run_meta.hasOwnProperty(k)) {
            _mr_destroy_run_windows(parseInt(k));
        }
    }
    _mr_run_meta = {}; // 객체 자체를 새로 교체해 깔끔히 초기화

    param_sets.forEach((ps) => {
        const rid        = ps.run_id;
        const paramLabel = 'param' + (rid + 1);          // "param1", "param2"...
        _mr_run_meta[rid] = { paramLabel, printWins: [], graphWins: [] };
        _mr_create_run_windows(rid, paramLabel, base_json);
    });

    // ── 상태 패널 초기화 ─────────────────────────────────
    _multirun_init_panel(param_sets.length);

    // ── 병렬 로드 중 model_init 간섭 차단 ───────────────
    // N개 엔진이 각각 model_init을 보내므로 _root_model 상태 덮어쓰기 방지
    ws.on_data_callback['model_init'] = function(_json) {
        // 병렬실행 중 N개 엔진의 model_init을 무시 — _root_model 상태 간섭 방지
    };

    // ── res_m 콜백 — run_id 기반 라우팅 ─────────────────
    ws.on_data_callback['res_m'] = function(json) {
        const d      = json.Data;
        const run_id = (d.run_id !== undefined) ? d.run_id : -1;

        if (d.stop !== undefined) {
            // 종료 처리
            if (run_id === -1) {
                // 단일실행 종료
                document.getElementById('btn_sim_run').disabled    = false;
                document.getElementById('btn_sim_pause').disabled  = false;
                document.getElementById('btn_sim_stop').disabled   = false;
                document.getElementById('btn_sim_push').disabled   = false;
                document.getElementById('btn_sim_update').disabled = false;
            } else {
                // 병렬실행 개별 run 종료
                _multirun_update_card(run_id, 'done');
                _mr_mark_window_done(run_id);
                _mr_done_count++;
                if (_mr_done_count >= _mr_total_count) {
                    // 모든 run 완료 → Push 버튼 재활성화
                    document.getElementById('btn_sim_push').disabled = false;
                }
            }
            return;
        }

        if (run_id === -1) {
            // 단일실행 — 기존 동작
            const model = _root_model.get_model_by_id(d.iid, true);
            if (model != null && model !== undefined)
                model.on_message_from_sim_server(d);
            return;
        }

        // 병렬실행 — run_id에 맞는 전용 창으로 데이터 라우팅
        _mr_route_result(run_id, d);
    };

    // ── multi_run_status 콜백 ────────────────────────────
    ws.on_data_callback['multi_run_status'] = function(resp) {
        const d = resp.Data || resp;
        _multirun_update_card(d.run_id, d.status);
    };

    ws.send(JSON.stringify({
        Type: 'sim_ctl',
        Data: {
            project_name: project_name,
            msg:          'multi_run',
            json_data:    base_json,
            start_t:      parseFloat(start_t),
            end_t:        parseFloat(end_t),
            param_sets:   param_sets
        }
    }));
    console.log('[MultiRun] sent', param_sets.length, 'param sets');
}

// ── run별 결과창 생성 ────────────────────────────────────
/**
 * base_json의 embedded 모델(PRINT, GRAPH_2D)을 순회해
 * run_id 전용 복제 창을 생성한다.
 */
function _mr_create_run_windows(run_id, paramLabel, base_json) {
    const meta = _mr_run_meta[run_id];

    function walk(node) {
        if (!node) return;
        const mt = node.model_type;
        if (mt === MODEL_TYPE.EMBEDED_FUNC_PRINT) {
            const win_id = 'mr_' + run_id + '_' + node.iid;
            _mr_add_print_window(win_id, paramLabel, node.model_name);
            meta.printWins.push({ orig_iid: node.iid, win_id });
        } else if (mt === MODEL_TYPE.EMBEDED_FUNC_GRAPH_2D) {
            const win_id = 'mr_' + run_id + '_' + node.iid;
            _mr_add_graph_window(win_id, paramLabel, node.model_name);
            meta.graphWins.push({ orig_iid: node.iid, win_id });
        }
        if (node.models) node.models.forEach(walk);
    }

    // base_json은 plain object이므로 model_type 숫자 비교
    function walkJson(node) {
        if (!node) return;
        if (node.model_type === MODEL_TYPE.EMBEDED_FUNC_PRINT) {
            const win_id = 'mr_' + run_id + '_' + node.iid;
            _mr_add_print_window(win_id, paramLabel, node.model_name);
            meta.printWins.push({ orig_iid: node.iid, win_id });
        } else if (node.model_type === MODEL_TYPE.EMBEDED_FUNC_GRAPH_2D) {
            const win_id = 'mr_' + run_id + '_' + node.iid;
            _mr_add_graph_window(win_id, paramLabel, node.model_name);
            meta.graphWins.push({ orig_iid: node.iid, win_id });
        }
        if (node.models) node.models.forEach(walkJson);
    }

    // 라이브 모델 트리 우선, 없으면 JSON fallback
    if (_root_model) {
        walk(_root_model);
    } else {
        walkJson(base_json);
    }
}

/** 병렬실행 공통 창 헤더 생성 헬퍼 */
function _mr_make_header(d1, paramLabel, model_name, typeLabel) {
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;'
        + 'background:#1a3a5c;color:#fff;padding:3px 8px;font-size:12px;'
        + 'border-radius:6px 6px 0 0;cursor:move;user-select:none;flex-shrink:0;';

    const title = document.createElement('span');
    title.innerHTML = '<b style="color:#4fc3f7;font-size:12px">[' + paramLabel + ']</b>'
        + '&nbsp;<span style="font-size:11px">' + typeLabel + '</span>'
        + ' <span style="font-size:10px;opacity:.7">' + model_name + '</span>';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '×';
    btn.style.cssText = 'background:transparent;color:#fff;border:none;font-size:14px;cursor:pointer;line-height:1;padding:0 2px;';
    btn.addEventListener('click', function() { d1.style.display = 'none'; });

    header.appendChild(title);
    header.appendChild(btn);
    return header;
}

/** 병렬실행 전용 PRINT 결과창 생성 */
function _mr_add_print_window(win_id, paramLabel, model_name) {
    if (document.getElementById(win_id + '_div')) return;

    const d1 = document.createElement('div');
    d1.id = win_id + '_div';
    d1.style.cssText = 'display:flex;flex-direction:column;position:absolute;'
        + 'left:' + (120 + Math.random() * 200) + 'px;'
        + 'top:'  + (100 + Math.random() * 150) + 'px;'
        + 'width:360px;height:280px;resize:both;overflow:hidden;'
        + 'z-index:1000;border-radius:6px;box-shadow:0 4px 18px #0008;';

    const header = _mr_make_header(d1, paramLabel, model_name, 'PRINT');

    const content = document.createElement('div');
    content.id = win_id + '_div_content';
    content.style.cssText = 'flex:1;min-height:0;background:#111;color:#4caf50;'
        + 'font-family:Consolas,monospace;font-size:12px;'
        + 'padding:6px;overflow:hidden;box-sizing:border-box;';

    d1.appendChild(header);
    d1.appendChild(content);
    document.body.appendChild(d1);
    _make_window_draggable(d1, header);
}

/** 병렬실행 전용 GRAPH 결과창 생성 */
function _mr_add_graph_window(win_id, paramLabel, model_name) {
    if (document.getElementById(win_id + '_div')) return;

    const d1 = document.createElement('div');
    d1.id = win_id + '_div';
    d1.style.cssText = 'display:flex;flex-direction:column;position:absolute;'
        + 'left:' + (120 + Math.random() * 200) + 'px;'
        + 'top:'  + (100 + Math.random() * 150) + 'px;'
        + 'width:360px;height:280px;resize:both;overflow:hidden;'
        + 'z-index:1000;border-radius:6px;box-shadow:0 4px 18px #0008;';

    const header = _mr_make_header(d1, paramLabel, model_name, 'GRAPH');

    const body = document.createElement('div');
    body.style.cssText = 'flex:1;min-height:0;background:#000;overflow:hidden;position:relative;';

    const graphDiv = document.createElement('div');
    graphDiv.id = win_id + '_div_graph';
    graphDiv.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = 'width:100%;height:100%;';
    graphDiv.appendChild(svg);
    body.appendChild(graphDiv);

    d1.appendChild(header);
    d1.appendChild(body);
    document.body.appendChild(d1);

    // 새 실행은 빈 그래프에서 시작 (같은 win_id 로 재생성되므로 이전 실행 데이터 제거)
    graph_dispose(win_id);

    setTimeout(function() {
        // 창이 그 사이 제거됐으면 생성하지 않음
        if (document.getElementById(win_id + '_div') !== d1) return;
        // 데모 데이터 대신 지금까지 수신된 결과로 초기 렌더링
        create_graph(win_id + '_div_graph', function() { return graph_series(win_id); });
        // body 크기 변경 시 그래프 업데이트 (add_resize_observer는 원본 구조 전용이므로 직접 등록)
        var gid = win_id + '_div_graph';
        var obs = new ResizeObserver(function() {
            if (line_graph[gid]) line_graph[gid].update();
        });
        obs.observe(body);
        d1._mr_resize_obs = obs;
    }, 200);
    _make_window_draggable(d1, header);
}

/** 드래그 이동 헬퍼 — header 엘리먼트를 직접 받아 이벤트 등록 */
function _make_window_draggable(el, header) {
    if (!header) return;
    let ox = 0, oy = 0, mx = 0, my = 0;
    header.addEventListener('mousedown', function(e) {
        // 닫기 버튼 클릭은 드래그 시작 안 함
        if (e.target.tagName === 'BUTTON') return;
        e.preventDefault();
        _window_z_index++;
        el.style.zIndex = _window_z_index;
        _selected_window = el;
        mx = e.clientX; my = e.clientY;
        document.onmousemove = function(e2) {
            ox = mx - e2.clientX; oy = my - e2.clientY;
            mx = e2.clientX;      my = e2.clientY;
            el.style.top  = (el.offsetTop  - oy) + 'px';
            el.style.left = (el.offsetLeft - ox) + 'px';
        };
        document.onmouseup = function() {
            document.onmousemove = null;
            document.onmouseup   = null;
        };
    });
}

/** run_id에 맞는 창으로 결과 데이터 라우팅 */
function _mr_route_result(run_id, d) {
    const meta = _mr_run_meta[run_id];
    if (!meta) return;

    // PRINT
    const pEntry = meta.printWins.find(w => w.orig_iid === d.iid);
    if (pEntry) {
        const el = document.getElementById(pEntry.win_id + '_div_content');
        if (el) {
            el.innerHTML += d.sim_time.toFixed(2) + '][' + d.src_port_name + '] ' + d.value + '<br>';
            el.scrollTop = el.scrollHeight;
        }
        return;
    }

    // GRAPH
    const gEntry = meta.graphWins.find(w => w.orig_iid === d.iid);
    if (gEntry) {
        graph_add_data(
            gEntry.win_id,
            d.src_port_name,
            Math.round(d.sim_time * 1e3) / 1e3,
            d.value
        );
    }
}

/** 실행 완료 시 창 헤더 색상 변경 (store: 결과창 묶음, 기본은 조합기 병렬실행용 _mr_run_meta) */
function _mr_mark_window_done(run_id, store) {
    const meta = (store || _mr_run_meta)[run_id];
    if (!meta) return;
    [...meta.printWins, ...meta.graphWins].forEach(w => {
        const win = document.getElementById(w.win_id + '_div');
        if (!win) return;
        const header = win.firstElementChild;
        if (header) header.style.background = '#1a4a1a'; // 완료 = 진한 초록
    });
}

/** run_id의 결과창 전부 제거 (store: 결과창 묶음, 기본은 _mr_run_meta) */
function _mr_destroy_run_windows(run_id, store) {
    store = store || _mr_run_meta;
    if (!store) return;
    var meta = store[run_id];
    if (!meta) return;
    var wins = (meta.printWins || []).concat(meta.graphWins || []);
    wins.forEach(function(w) {
        var el = document.getElementById(w.win_id + '_div');
        if (el) {
            if (el._mr_resize_obs) el._mr_resize_obs.disconnect();
            el.parentNode && el.parentNode.removeChild(el);
        }
    });
    (meta.graphWins || []).forEach(function(w) { graph_dispose(w.win_id); });
}

// ── 상태 패널 ────────────────────────────────────────────

/** 병렬실행 상태 패널 초기화 */
function _multirun_init_panel(n) {
    const panel = document.getElementById('multi_run_panel');
    const list  = document.getElementById('multi_run_status_list');
    if (!panel || !list) return;

    list.innerHTML = '';
    for (let i = 0; i < n; i++) {
        const card = document.createElement('div');
        card.id = 'mr_card_' + i;
        card.style.cssText = [
            'padding:4px 10px', 'border-radius:4px', 'border:1px solid #555',
            'background:#2b2b2b', 'color:#aaa', 'font-size:11px',
            'min-width:90px', 'text-align:center'
        ].join(';');
        card.innerHTML = '<b>param' + (i + 1) + '</b><br>'
            + '<span id="mr_status_' + i + '">대기중</span>';
        list.appendChild(card);
    }
    panel.style.display = 'block';
}

/** 상태 카드 갱신 */
function _multirun_update_card(run_id, status) {
    const card  = document.getElementById('mr_card_' + run_id);
    const label = document.getElementById('mr_status_' + run_id);
    if (!card || !label) return;

    const styleMap = {
        loading: { bg: '#2b2b2b', color: '#f0c040', text: '로딩 중...' },
        loaded:  { bg: '#1a3a1a', color: '#4caf50', text: '로드 완료'  },
        running: { bg: '#1a2a4a', color: '#4fc3f7', text: '실행 중'    },
        done:    { bg: '#1a4a1a', color: '#81c784', text: '완료 ✓'     },
        error:   { bg: '#3a1a1a', color: '#f44336', text: '오류'        }
    };
    const s = styleMap[status] || { bg: '#2b2b2b', color: '#aaa', text: status };
    card.style.background = s.bg;
    label.style.color     = s.color;
    label.textContent     = s.text;
}
