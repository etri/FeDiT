"""
route_viewer
-------------------
route_detour가 계산한 우회 경로와 risk_weight가 합친 위험구간(=병목구간)을
브라우저 지도(Leaflet)로 실시간 확인하는 HYMS 원자모델.

노드 구성 예:
  risk_weight  --weighted_risk_json--> route_detour --routes_json--> route_viewer (routes_json)
               --weighted_risk_json--------------------------------> route_viewer (weighted_risk_json)
  (routes_json 대신 route_json/route_distance만 연결해도 추천 경로 하나는 표시됨)

동작:
  - 첫 입력이 들어오면 이 프로세스 안에 작은 HTTP 서버를 띄운다 (기본 http://localhost:8890/).
    포트가 이미 쓰이고 있으면 +1씩 올려가며 최대 10개까지 시도하고, 실제 주소를 콘솔에 출력.
  - auto_open=1이면 서버가 뜰 때 브라우저를 한 번 자동으로 열어준다 (기본 0 — 콘솔에 찍힌
    주소로 직접 접속, 다른 PC에서는 http://<이 PC의 IP>:8890/).
  - 페이지는 1초마다 /data를 조회해서 지도를 갱신한다 (새로고침 없이, 확대/이동 상태 유지).
  - 지도 표시:
      파란 선        = 우회 경로 (병목구간을 피함)
      주황 점선      = 통과 경로 (병목구간을 지나감), 그중 병목 안 부분은 빨강
      굵은 선        = 두 경로 중 예상 소요시간이 짧은 추천 경로
      원(반경=radius) = 위험구간, 색 = 출처(hazard1~6 포트), weight(0~1)가 클수록 진하게
      굵은 점선 테두리 = 차단구간 (weight 1.0, 반경 안 도로 통행 불가)
      원에 마우스를 올리면 출처 · 값 · weight · 반경 표시, 패널에 출처별 개수
      초록/검정 마커  = 출발/도착 (경로의 처음/끝 좌표)
"""

import json
import threading
import webbrowser
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from CsModel import CsModel


class route_viewer(CsModel):

    DEFAULT_PORT = 8890
    DEFAULT_AUTO_OPEN = 0      # 1이면 지도 서버가 뜰 때 이 모델이 도는 PC에서 브라우저 자동 열기
                               # (서버 배포 시 서버 화면에 열리거나 화면 없는 서버에서 멈출 수 있어 기본 끔)
    DEFAULT_POLL_INTERVAL = 2.0
    PORT_RETRY = 10

    def __init__(self):
        self.MODEL_NAME = "route_viewer"

        self.add_inport('route_json', "")          # route_detour의 route_json
        self.add_inport('weighted_risk_json', "")  # risk_weight의 weighted_risk_json
        self.add_inport('route_distance', 0.0)     # route_detour의 route_distance (선택)
        self.add_inport('routes_json', "")         # route_detour의 routes_json (우회/통과 두 경로)

        self.add_outport('viewer_url', "")         # 실제로 뜬 지도 주소 (서버 시작 시 한 번)

        self.add_param('port', self.DEFAULT_PORT)
        self.add_param('auto_open', self.DEFAULT_AUTO_OPEN)
        self.add_param('poll_interval', self.DEFAULT_POLL_INTERVAL)

        self.port = self.DEFAULT_PORT
        self.auto_open = self.DEFAULT_AUTO_OPEN
        self.poll_interval = self.DEFAULT_POLL_INTERVAL

        # HTTP 서버는 모델 등록(update) 때 인스턴스만 만들고 끝나는 경우가 있어
        # 생성자에서 띄우지 않고, 시뮬레이션 중 첫 호출 때 지연 시작한다.
        self.server = None
        self.url = ""
        self.url_sent = False
        self.lock = threading.Lock()

        self.VERSION = 1.1
        self.reset()

    def reset(self):
        with self.lock:
            self.state = {
                "route": [],        # [{"lat":..,"lon":..}, ...]
                "risks": [],        # [{"lat":..,"lon":..,"weight":..,"radius":..}, ...]
                "distance": 0.0,
                "routes": None,     # route_detour의 routes_json (있으면 두 경로 표시)
                "sim_time": 0.0,
                "version": 0,       # 값이 바뀔 때마다 +1 (페이지가 변경 감지용으로 씀)
            }

    def set_param(self, port_name, port_value):
        if port_name == 'port':
            self.port = int(float(port_value))
        elif port_name == 'auto_open':
            self.auto_open = int(float(port_value))
        elif port_name == 'poll_interval':
            self.poll_interval = float(port_value)
        print(f"[route_viewer:{self.MODEL_NAME}] param set: {port_name}={port_value}")
        return True

    @staticmethod
    def _normalize_to_str(value):
        """엔진이 str 대신 bytes로 넘길 수 있고, 그 bytes가 시스템 코드페이지
        (한국어 Windows는 CP949)일 수 있어 방어적으로 처리."""
        if isinstance(value, str):
            return value
        if isinstance(value, (bytes, bytearray)):
            for enc in ('utf-8', 'cp949', 'euc-kr'):
                try:
                    return value.decode(enc)
                except UnicodeDecodeError:
                    continue
            return value.decode('utf-8', errors='replace')
        return str(value)

    # ------------------------------------------------------------------
    # HTTP 서버
    # ------------------------------------------------------------------
    def _snapshot(self):
        with self.lock:
            return json.dumps(self.state, ensure_ascii=True)

    def _ensure_server(self):
        if self.server is not None:
            return
        viewer = self

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                if self.path.startswith('/data'):
                    body = viewer._snapshot().encode('utf-8')
                    ctype = 'application/json; charset=utf-8'
                elif self.path == '/' or self.path.startswith('/index'):
                    body = VIEWER_HTML.encode('utf-8')
                    ctype = 'text/html; charset=utf-8'
                else:
                    self.send_response(404)
                    self.end_headers()
                    return
                self.send_response(200)
                self.send_header('Content-Type', ctype)
                self.send_header('Cache-Control', 'no-store')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self.wfile.write(body)

            def log_message(self, fmt, *args):
                pass  # 1초마다 오는 /data 요청 로그로 콘솔이 도배되지 않게

        # Windows에서 SO_REUSEADDR를 켜면 다른 프로세스(이전 실행에서 남은
        # model_cap_python 등)가 잡고 있는 포트에도 중복 바인딩돼버려서 끈다.
        ThreadingHTTPServer.allow_reuse_address = False
        for p in range(self.port, self.port + self.PORT_RETRY):
            try:
                self.server = ThreadingHTTPServer(('0.0.0.0', p), Handler)
                break
            except OSError:
                continue
        if self.server is None:
            print(f"[route_viewer] 포트 {self.port}~{self.port + self.PORT_RETRY - 1} "
                  f"모두 사용 중이라 지도 서버를 못 띄움")
            self.server = False   # 매 틱마다 재시도하지 않도록 표시
            return

        t = threading.Thread(target=self.server.serve_forever, daemon=True)
        t.start()
        self.url = f"http://localhost:{self.server.server_address[1]}/"
        print(f"[route_viewer] 지도 서버 시작: {self.url}  (브라우저로 열어서 확인)")
        if self.auto_open:
            try:
                webbrowser.open(self.url)
            except Exception as e:
                print(f"[route_viewer] 브라우저 자동 열기 실패: {e}")

    # ------------------------------------------------------------------
    # DEVS 함수
    # ------------------------------------------------------------------
    def ExtTransFn(self, sim_time, dt, src_model_name, port_name, port_value):
        self._ensure_server()
        if port_name == 'route_distance':
            try:
                with self.lock:
                    self.state["distance"] = float(port_value)
                    self.state["sim_time"] = sim_time
                    self.state["version"] += 1
            except (TypeError, ValueError):
                pass
            return True

        port_value = self._normalize_to_str(port_value)
        if not port_value:
            return True
        try:
            data = json.loads(port_value)
        except Exception as e:
            print(f"[route_viewer] {port_name} 파싱 실패: {e}")
            return True

        with self.lock:
            if port_name == 'route_json':
                self.state["route"] = data if isinstance(data, list) else []
            elif port_name == 'weighted_risk_json':
                self.state["risks"] = data if isinstance(data, list) else []
            elif port_name == 'routes_json':
                self.state["routes"] = data if isinstance(data, dict) else None
            else:
                return True
            self.state["sim_time"] = sim_time
            self.state["version"] += 1
            n_route, n_risk = len(self.state["route"]), len(self.state["risks"])
        print(f"[route_viewer] t={sim_time} {port_name} 갱신 → 경로좌표={n_route}개 위험구간={n_risk}개")
        return True

    def IntTransFn(self, sim_time, dt):
        self._ensure_server()
        return True

    def OutputFn(self, sim_time, dt):
        if self.url and not self.url_sent:
            self.set_outport_value('viewer_url', self.url)
            self.url_sent = True
        return True

    def TimeAdvanceFn(self, sim_time):
        if self.poll_interval > 0:
            return self.poll_interval
        return self.Infinity


VIEWER_HTML = r"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Route Viewer</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<style>
  html, body { margin: 0; height: 100%; font-family: "Malgun Gothic", sans-serif; background: #fff; }
  #map { position: absolute; inset: 0; }
  .panel {
    position: absolute; z-index: 1000; top: 10px; right: 10px;
    background: rgba(255,255,255,0.95); border-radius: 6px; padding: 10px 12px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.3); font-size: 13px; line-height: 1.6; min-width: 210px;
  }
  .panel h3 { margin: 0 0 4px; font-size: 14px; }
  .row { display: flex; justify-content: space-between; gap: 12px; }
  .row b { font-variant-numeric: tabular-nums; }
  .legend { margin-top: 6px; border-top: 1px solid #ddd; padding-top: 6px; }
  .sw { display: inline-block; width: 18px; height: 4px; vertical-align: middle; margin-right: 6px; }
  .dot { display: inline-block; width: 12px; height: 12px; border-radius: 50%; vertical-align: middle; margin-right: 6px; }
  .status { color: #888; font-size: 12px; }
  .note { color: #666; font-size: 12px; margin-top: 2px; }
  .status.err { color: #c00; }
  button { margin-top: 6px; font-size: 12px; }
  table.cmp { width: 100%; border-collapse: collapse; margin: 4px 0; font-variant-numeric: tabular-nums; }
  table.cmp th { font-weight: normal; color: #666; font-size: 12px; text-align: right; }
  table.cmp td { text-align: right; padding: 1px 0 1px 8px; white-space: nowrap; }
  table.cmp td:first-child, table.cmp th:first-child { text-align: left; padding-left: 0; }
  table.cmp tr.rec td { font-weight: 700; }
  .sw-dash { background: repeating-linear-gradient(90deg, #f08c00 0 5px, transparent 5px 8px); }
</style>
</head>
<body>
<div id="map"></div>
<div class="panel">
  <h3>우회 경로 / 위험구간</h3>
  <div class="row"><span>시뮬레이션 시간</span><b id="t">-</b></div>
  <div class="row"><span>위험구간 수</span><b id="nrisk">-</b></div>
  <table class="cmp">
    <tr><th></th><th>거리</th><th>예상 시간</th></tr>
    <tr id="row-detour"><td><span class="sw" style="background:#1f6feb"></span>우회</td><td id="d-dist">-</td><td id="d-time">-</td></tr>
    <tr id="row-through"><td><span class="sw sw-dash"></span>통과</td><td id="t-dist">-</td><td id="t-time">-</td></tr>
  </table>
  <div class="row"><span>통과 경로 병목 구간</span><b id="t-bn">-</b></div>
  <div class="row"><span>추천</span><b id="rec">-</b></div>
  <div class="legend">
    <div><span class="sw" style="background:#e5202a"></span>통과 경로 중 병목구간 안 부분</div>
    <div id="src-legend"></div>
    <div class="note">원 색 = 출처, 진할수록 weight 큼, <b>굵은 점선 테두리 = 차단</b>(weight 1.0)</div>
    <div><span class="dot" style="background:#2da44e"></span>출발 &nbsp;<span class="dot" style="background:#222"></span>도착</div>
  </div>
  <button id="fit">경로에 맞춰 보기</button>
  <div id="status" class="status">연결 중...</div>
</div>
<script>
const map = L.map('map').setView([35.99, 129.56], 14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19, attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const riskLayer = L.layerGroup().addTo(map);
const routeLayer = L.layerGroup().addTo(map);
let lastVersion = -1, fitted = false, lastBounds = null;

function distM(a, b) {
  const R = 6371000, toR = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toR, dLon = (b.lon - a.lon) * toR;
  const h = Math.sin(dLat/2)**2 + Math.cos(a.lat*toR) * Math.cos(b.lat*toR) * Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function inRisk(p, risks) {
  for (const r of risks) if (distM(p, r) <= (r.radius || 0)) return true;
  return false;
}
// 출처(risk_weight 입력 포트)별 색 — 경로 색(파랑/주황/빨강)과 겹치지 않게 고름
const SOURCE_COLORS = {
  hazard1: '#8c5a2b', hazard2: '#0b7285', hazard3: '#7048e8',
  hazard4: '#c2255c', hazard5: '#5c940d', hazard6: '#495057',
};
const srcColor = src => SOURCE_COLORS[src] || '#e5202a';

// weight는 0~1: 1.0 = 반경 안 도로 전체 차단 (route_detour 비용 = 길이 / (1 - weight))
// 색 = 출처, 진하기 = weight, 굵은 점선 테두리 = 차단
function riskStyle(w, src) {
  const c = srcColor(src);
  if (w >= 1) {
    return { color: c, weight: 3, dashArray: '7 5', opacity: 1, fillColor: c, fillOpacity: 0.45 };
  }
  const k = Math.max(0, Math.min(1, w));
  return { color: c, weight: 1.5, opacity: 0.4 + 0.5 * k, fillColor: c, fillOpacity: 0.08 + 0.3 * k };
}
function riskLabel(r) {
  const w = r.weight ?? 1;
  const head = `${r.source || '출처 없음'}` + (r.value != null ? ` · 값 ${r.value}` : '');
  if (w >= 1) return `${head}<br>차단 (weight 1.0) / 반경 ${r.radius}m`;
  const mult = w > 0 ? (1 / (1 - w)).toFixed(1) : '1.0';
  return `${head}<br>weight ${w} (비용 ${mult}배) / 반경 ${r.radius}m`;
}
function renderSourceLegend(risks) {
  const by = {};
  for (const r of risks) {
    const s = r.source || '출처 없음', w = r.weight ?? 1;
    by[s] = by[s] || { n: 0, blocked: 0, none: 0 };
    by[s].n += 1;
    if (w >= 1) by[s].blocked += 1;
    if (w <= 0 || !r.radius) by[s].none += 1;
  }
  document.getElementById('src-legend').innerHTML = Object.keys(by).sort().map(s => {
    const parts = [];
    if (by[s].blocked) parts.push(`차단 ${by[s].blocked}`);
    if (by[s].none) parts.push(`영향 없음 ${by[s].none}`);
    return `<div><span class="dot" style="background:${srcColor(s)}"></span>${s} — ${by[s].n}개` +
      (parts.length ? ` (${parts.join(', ')})` : '') + `</div>`;
  }).join('');
}

function fmtDist(m) { return m == null ? '-' : `${Math.round(m).toLocaleString()} m`; }
function fmtTime(sec) {
  if (sec == null) return '-';
  const m = Math.floor(sec / 60), s = Math.round(sec % 60);
  return m ? `${m}분 ${s}초` : `${s}초`;
}

// 경로 하나를 그림. markHits면 병목구간 안 부분을 빨강으로 (통과 경로용)
function drawRoute(route, risks, opt) {
  if (route.length < 2) return;
  const base = { color: opt.color, weight: opt.width, opacity: 0.9, dashArray: opt.dash };
  if (!opt.markHits) {
    L.polyline(route.map(p => [p.lat, p.lon]), base).bindTooltip(opt.label).addTo(routeLayer);
    return;
  }
  let seg = [route[0]], segHit = inRisk(route[0], risks);
  const flush = () => {
    if (seg.length < 2) return;
    L.polyline(seg.map(p => [p.lat, p.lon]),
      segHit ? { ...base, color: '#e5202a', dashArray: null, weight: opt.width + 2 } : base)
      .bindTooltip(opt.label).addTo(routeLayer);
  };
  for (let i = 1; i < route.length; i++) {
    const a = route[i-1], b = route[i];
    const hit = inRisk({ lat: (a.lat + b.lat) / 2, lon: (a.lon + b.lon) / 2 }, risks);
    if (hit !== segHit) { flush(); seg = [a]; segHit = hit; }
    seg.push(b);
  }
  flush();
}

function render(s) {
  riskLayer.clearLayers();
  routeLayer.clearLayers();
  const risks = (s.risks || []).filter(r => r.lat != null && r.lon != null);
  const bottlenecks = risks.filter(r => (r.weight ?? 1) > 0 && (r.weight ?? 1) < 1);
  const clean = arr => (arr || []).filter(p => p.lat != null && p.lon != null);
  const set = (id, v) => { document.getElementById(id).textContent = v; };

  for (const r of risks) {
    const w = r.weight ?? 1;
    if (w <= 0 || !r.radius) continue;   // weight 0 / 반경 0 = 영향 없음 (예: 소통 원활한 교통센서)
    L.circle([r.lat, r.lon], { radius: r.radius, ...riskStyle(w, r.source) })
      .bindTooltip(riskLabel(r)).addTo(riskLayer);
  }
  renderSourceLegend(risks);

  const R = s.routes;
  let detour = [], through = [];
  if (R) {
    const rec = R.recommended;
    detour = R.detour && R.detour.available ? clean(R.detour.coords) : [];
    through = R.through && R.through.available ? clean(R.through.coords) : [];
    const same = R.through && R.through.available && !R.through.passes_bottleneck;
    const drawT = () => drawRoute(through, bottlenecks, { color: '#f08c00', width: rec === 'through' ? 6 : 4,
                                  dash: '8 6', markHits: true, label: '통과 경로' });
    const drawD = () => drawRoute(detour, bottlenecks, { color: '#1f6feb', width: rec === 'detour' ? 6 : 4,
                                  dash: null, markHits: false, label: '우회 경로' });
    // 추천 경로를 나중에(위에) 그려서 겹칠 때 보이게
    if (same) { drawD(); }
    else if (rec === 'detour') { drawT(); drawD(); }
    else { drawD(); drawT(); }

    const none = !R.through.available;   // 차단 때문에 경로 자체가 없음
    set('d-dist', R.detour.available ? fmtDist(R.detour.distance_m) : '불가');
    set('d-time', R.detour.available ? fmtTime(R.detour.time_s) : (none ? '-' : '병목 회피 불가'));
    set('t-dist', none ? '불가' : fmtDist(R.through.distance_m));
    set('t-time', none ? '-' : fmtTime(R.through.time_s) + (R.through.delay_s ? ` (+${fmtTime(R.through.delay_s)})` : ''));
    set('t-bn', none ? '-' : R.through.passes_bottleneck ? fmtDist(R.through.bottleneck_m) : '없음 (두 경로 같음)');
    set('rec', none ? `경로 없음 (차단 도로 ${R.blocked_edges}개)` : rec === 'detour' ? '우회' : '통과');
    document.getElementById('row-detour').className = rec === 'detour' ? 'rec' : '';
    document.getElementById('row-through').className = rec === 'through' ? 'rec' : '';
  } else {
    // routes_json이 연결 안 된 경우: 추천 경로 하나만
    detour = clean(s.route);
    drawRoute(detour, bottlenecks, { color: '#1f6feb', width: 5, dash: null, markHits: true, label: '추천 경로' });
    set('d-dist', fmtDist(s.distance || null));
  }

  const any = detour.length >= 2 ? detour : through;
  if (any.length >= 2) {
    const st = any[0], en = any[any.length - 1];
    L.circleMarker([st.lat, st.lon], { radius: 8, color: '#fff', weight: 2, fillColor: '#2da44e', fillOpacity: 1 })
      .bindTooltip('출발').addTo(routeLayer);
    L.circleMarker([en.lat, en.lon], { radius: 8, color: '#fff', weight: 2, fillColor: '#222', fillOpacity: 1 })
      .bindTooltip('도착').addTo(routeLayer);
  }

  const pts = detour.concat(through).map(p => [p.lat, p.lon]).concat(risks.map(r => [r.lat, r.lon]));
  lastBounds = pts.length ? L.latLngBounds(pts) : null;
  if (!fitted && lastBounds) { map.fitBounds(lastBounds, { padding: [40, 40] }); fitted = true; }

  set('t', (s.sim_time ?? 0).toFixed(1));
  set('nrisk', risks.length);
}

document.getElementById('fit').onclick = () => { if (lastBounds) map.fitBounds(lastBounds, { padding: [40, 40] }); };

async function poll() {
  const st = document.getElementById('status');
  try {
    const res = await fetch('/data', { cache: 'no-store' });
    const s = await res.json();
    if (s.version !== lastVersion) { render(s); lastVersion = s.version; }
    st.textContent = `갱신 ${new Date().toLocaleTimeString()} (v${s.version})`;
    st.className = 'status';
  } catch (e) {
    st.textContent = '시뮬레이션 서버와 연결 끊김 (시뮬레이션이 종료됐을 수 있음)';
    st.className = 'status err';
  }
}
poll();
setInterval(poll, 1000);
</script>
</body>
</html>
"""


if __name__ == "__main__":
    import time
    m = route_viewer()
    fake_risk = json.dumps([
        {"lat": 35.990, "lon": 129.560, "weight": 1.0, "radius": 150},
        {"lat": 35.985, "lon": 129.558, "weight": 0.5, "radius": 40},
    ])
    fake_route = json.dumps([
        {"lat": 35.980, "lon": 129.555}, {"lat": 35.985, "lon": 129.557},
        {"lat": 35.989, "lon": 129.559}, {"lat": 35.995, "lon": 129.565},
    ])
    m.ExtTransFn(0.0, 0.0, "risk_weight", "weighted_risk_json", fake_risk)
    m.ExtTransFn(0.0, 0.0, "route_detour", "route_json", fake_route)
    m.ExtTransFn(0.0, 0.0, "route_detour", "route_distance", 2345.6)
    m.OutputFn(0.0, 0.0)
    print("viewer_url:", m.OUT_PORT['viewer_url'].value)
    print("Ctrl+C로 종료")
    while True:
        time.sleep(1)
