"""
route_detour
-------------------
sumolib 그래프 + A*로 위험구간을 반영한 경로를 계산하는 HYMS 원자모델.
경로를 두 가지로 계산해서 거리와 예상 소요시간을 함께 내보낸다.

  - 차단구간 (weight >= 1.0) : 두 경로 모두 절대 지나가지 않음
  - 병목구간 (0 < weight < 1):
      detour(우회)  — 병목구간 도로를 전혀 지나지 않는 최단 경로
      through(통과) — 병목구간을 신경 쓰지 않는 최단 경로 (차단만 피함),
                      병목구간 도로는 1/(1-weight)배 느리게 지나간다고 보고 시간 계산
  - recommended    — 두 경로 중 예상 소요시간이 짧은 쪽

역할 분리 (risk_weight 노드와 짝을 이룸):
  risk_weight 노드가 여러 재난 시뮬레이션의 위험지점을 모아서 지점별
  weight/radius까지 계산해주면, 이 노드는 그 결과 하나만 받아서
  "실제 경로 계산"만 전담한다 (심각도 판단 로직은 여기 없음).

입력 포트:
  weighted_risk_json — risk_weight 노드의 출력을 그대로 연결
      [{"lat":.., "lon":.., "weight":.., "radius":..}, ...]
      반경(radius, m) 안을 지나는 도로가 그 지점의 영향권 (아래 WeightedRiskContext)

필요 패키지: sumolib (pip install sumolib) — 다른 .py 파일 없이 이 파일 하나로 동작
  start_json / end_json (선택) — {"lat":.., "lon":..}
      값이 오면 그 이후부터 파라미터 기본값 대신 이 값을 씀

시작/도착 지점 기본값은 파라미터(start_lat/start_lon/end_lat/end_lon)로 고정.

소요시간: 도로별 제한속도(SUMO 도로망 speed)로 계산. mode=pedestrian이면
walk_speed_mps(기본 1.2m/s)와 제한속도 중 느린 쪽. 병목구간 도로는 1/(1-weight)배.
차량은 제한속도 × SPEED_FACTOR(0.6, 코드 상수)로 계산 — 도로망 제한속도가 OSM 도로종류별
SUMO 기본값(2차 100, 3차 80, 일반 50km/h)이라 실제보다 빠르고, 신호/교차로도 반영 안 돼서 보정.

출력:
  route_json     — 추천 경로 좌표 리스트 [{"lat":..,"lon":..}, ...] (JSON 문자열)
  route_distance — 추천 경로 총 거리(m)
  route_time     — 추천 경로 예상 소요시간(초)
  routes_json    — 두 경로 전체 (JSON 문자열)
      {"recommended": "detour" | "through",
       "detour":  {"available", "distance_m", "time_s", "coords"},
       "through": {"available", "distance_m", "time_s", "delay_s",
                   "bottleneck_m", "passes_bottleneck", "coords"},
       "blocked_edges": 차단 도로 수, "bottleneck_edges": 병목 도로 수}
      detour는 병목을 모두 피할 길이 없으면 available=false
      차단 때문에 경로가 아예 없으면 둘 다 available=false, recommended=null,
      route_json=[] / route_distance=0 / route_time=0
"""

import heapq
import itertools
import json
import math
import os
import sumolib
from CsModel import CsModel


# =====================================================================
# 경로 계산 도우미 — 원래 route_helpers.py / sumo_evac_routes.py에 있던 것 중
# 이 노드가 쓰는 부분만 옮겨옴. atomic_model_manager가 projects 아래의 .py를
# 전부 원자모델로 로드하려 해서(파일명 = 클래스명 필요) 도우미 파일을 따로 둘 수 없음.
# =====================================================================

def find_edge(net, x, y, mode, radius=50):
    """좌표 → 가장 가까운 도로 (반경 50m, 없으면 100m). mode에 맞는 도로 우선."""
    edges = net.getNeighboringEdges(x, y, radius)
    if not edges:
        edges = net.getNeighboringEdges(x, y, radius * 2)
    if not edges:
        return None
    if mode == "pedestrian":
        filtered = [(e, d) for e, d in edges if e.allows("pedestrian") or e.allows("passenger")]
    else:
        filtered = [(e, d) for e, d in edges if e.allows("passenger")]
    return min(filtered or edges, key=lambda e_d: e_d[1])[0]


# net 객체(id 기준)별 엣지 격자 색인 캐시 — sumolib의 getNeighboringEdges는 rtree 모듈이
# 없으면 매 호출마다 전체 엣지를 선형 탐색해서(위험지점 133개 × 엣지 6146개 ≈ 8초) 느리다.
_edge_grid_cache = {}
_GRID_CELL = 100.0   # m


def _get_edge_grid(net):
    """엣지 shape의 각 선분을 지나는 격자 칸 → [(edge_id, shape)] 색인 (net당 1회)."""
    key = id(net)
    grid = _edge_grid_cache.get(key)
    if grid is None:
        grid = {}
        for e in net.getEdges():
            shape = e.getShape(True)   # 교차로 중심까지 이어진 shape (getNeighboringEdges와 같은 기준)
            xs = [p[0] for p in shape]
            ys = [p[1] for p in shape]
            entry = (e.getID(), shape)
            for gx in range(int(min(xs) // _GRID_CELL), int(max(xs) // _GRID_CELL) + 1):
                for gy in range(int(min(ys) // _GRID_CELL), int(max(ys) // _GRID_CELL) + 1):
                    grid.setdefault((gx, gy), []).append(entry)
        _edge_grid_cache[key] = grid
    return grid


def _dist_point_polyline(px, py, shape):
    best = float("inf")
    for (ax, ay), (bx, by) in zip(shape, shape[1:]):
        dx, dy = bx - ax, by - ay
        L2 = dx * dx + dy * dy
        t = 0.0 if L2 == 0 else max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / L2))
        cx, cy = ax + t * dx - px, ay + t * dy - py
        d = cx * cx + cy * cy
        if d < best:
            best = d
    return math.sqrt(best)


def edges_within(net, x, y, r):
    """(x, y)에서 도로 shape까지의 거리가 r(m) 미만인 엣지 ID 집합 (격자 색인 사용)."""
    grid = _get_edge_grid(net)
    out, checked = set(), set()
    for gx in range(int((x - r) // _GRID_CELL), int((x + r) // _GRID_CELL) + 1):
        for gy in range(int((y - r) // _GRID_CELL), int((y + r) // _GRID_CELL) + 1):
            for eid, shape in grid.get((gx, gy), ()):
                if eid in checked:
                    continue
                checked.add(eid)
                if _dist_point_polyline(x, y, shape) < r:
                    out.add(eid)
    return out


class WeightedRiskContext:
    """위험지점마다 weight(0~1)와 radius(m)를 갖는다.
      - 도로(엣지 shape)가 어떤 위험지점의 반경 안을 지나면 그 엣지는 그 지점의 영향권
      - 여러 지점에 걸치면 그중 가장 큰 weight를 씀
      - weight >= 1.0 : 차단 (blocked), 0 < weight < 1 : 병목"""

    def __init__(self, net, points_xy, weights, radii):
        self.edge_weight = {}   # 영향권 안 엣지만: edge_id -> 최대 weight
        for (x, y), w, r in zip(points_xy, weights, radii):
            w = min(1.0, max(0.0, float(w)))
            if w <= 0 or r <= 0:
                continue
            for eid in edges_within(net, x, y, float(r)):
                if w > self.edge_weight.get(eid, 0.0):
                    self.edge_weight[eid] = w
        self.blocked = {eid for eid, w in self.edge_weight.items() if w >= 1.0}


def _edge_allows_mode(edge, mode):
    """find_edge()의 출발/도착 스냅과 같은 기준으로 중간 경로 엣지도 필터링."""
    if mode is None:
        return True
    if mode == "pedestrian":
        return edge.allows("pedestrian") or edge.allows("passenger")
    return edge.allows("passenger")


def astar_simple(net, start_edge, end_edge, blocked_edges=None, mode=None):
    """blocked_edges를 피하는 최단 거리 경로 (A*, 비용 = 도로 길이,
    휴리스틱 = 도착 도로 양 끝까지의 직선거리 → 최단 경로 보장). 엣지 ID 리스트 또는 None."""
    start_id = start_edge.getID()
    end_id = end_edge.getID()
    if start_id == end_id:
        return [start_id]

    blocked = blocked_edges or ()
    counter = itertools.count()
    end_targets = {n.getID(): n for n in (end_edge.getToNode(), end_edge.getFromNode())}
    end_coords = [n.getCoord() for n in end_targets.values()]

    def h(node):
        nx, ny = node.getCoord()
        return min(math.sqrt((nx - tx) ** 2 + (ny - ty) ** 2) for tx, ty in end_coords)

    dist, prev, visited, heap = {}, {}, set(), []
    for start_node in (start_edge.getToNode(), start_edge.getFromNode()):
        nid = start_node.getID()
        dist[nid] = 0.0
        prev[nid] = (None, start_id)
        heapq.heappush(heap, (h(start_node), next(counter), 0.0, nid, start_node))

    while heap:
        _, _, d, nid, node = heapq.heappop(heap)
        if nid in visited:
            continue
        visited.add(nid)

        if nid in end_targets:
            path = [end_id]
            cur = nid
            while prev[cur][0] is not None:
                path.append(prev[cur][1])
                cur = prev[cur][0]
            path.append(start_id)
            return list(reversed(path))

        for next_edge in node.getOutgoing():
            eid = next_edge.getID()
            if eid in blocked or not _edge_allows_mode(next_edge, mode):
                continue
            next_node = next_edge.getToNode()
            nnid = next_node.getID()
            if nnid in visited:
                continue
            nd = d + next_edge.getLength()
            if nd < dist.get(nnid, float("inf")):
                dist[nnid] = nd
                prev[nnid] = (nid, eid)
                heapq.heappush(heap, (nd + h(next_node), next(counter), nd, nnid, next_node))
    return None


def build_path_coords(net, edge_ids):
    """엣지 ID 목록 → (좌표 목록, 총 거리m, 지나간 엣지 집합). 첫 엣지(출발 엣지)는 제외."""
    coords = []
    seen_edges = set()
    total_dist = 0.0
    prev_end = None
    working_ids = list(edge_ids)[1:] if len(edge_ids) > 1 else list(edge_ids)
    for eid in working_ids:
        if eid in seen_edges:
            continue
        seen_edges.add(eid)
        try:
            e = net.getEdge(eid)
            shape = list(e.getShape())
            if prev_end and len(shape) >= 2:
                d_start = (shape[0][0] - prev_end[0]) ** 2 + (shape[0][1] - prev_end[1]) ** 2
                d_end = (shape[-1][0] - prev_end[0]) ** 2 + (shape[-1][1] - prev_end[1]) ** 2
                if d_end < d_start:
                    shape = list(reversed(shape))
            for x, y in shape:
                lon, lat = net.convertXY2LonLat(x, y)
                coords.append({"lat": round(lat, 6), "lon": round(lon, 6)})
            prev_end = shape[-1]
            total_dist += e.getLength()
        except Exception:
            pass
    if edge_ids:
        seen_edges.add(edge_ids[0])
    return coords, total_dist, seen_edges
# =====================================================================


class route_detour(CsModel):

    # 예시 기본값 — 실제 값은 결합모델 조합 시 in_param으로 지정
    # 상대경로는 이 .py 파일이 있는 폴더 기준으로 찾으므로(_ensure_net_loaded) 다른 PC/서버에
    # 이 폴더째 옮겨도 그대로 동작함. 다른 위치의 도로망을 쓰려면 절대경로로 지정.
    DEFAULT_NET_XML_PATH = "guryongpo.net.xml"
    DEFAULT_MODE = "vehicle"                     # "pedestrian" 아니면 차량 도로만 사용
    DEFAULT_START_LAT = 35.9800
    DEFAULT_START_LON = 129.5550
    DEFAULT_END_LAT = 35.9950
    DEFAULT_END_LON = 129.5650
    DEFAULT_POLL_INTERVAL = 1.0                  # 입력이 안 바뀐 틱은 계산을 건너뛰어 짧아도 부담 없음
    DEFAULT_WALK_SPEED_MPS = 1.2                 # 보행 속도 (mode=pedestrian일 때)
    SPEED_FACTOR = 0.6                           # 차량 속도 보정 배수 (제한속도 × 이 값)

    def __init__(self):
        self.MODEL_NAME = "route_detour"

        # risk_weight 노드의 출력(가중치 적용된 위험지점 리스트)을 연결
        self.add_inport('weighted_risk_json', "")

        # 시작/도착지 override 입력 포트 (선택 — 안 쓰면 파라미터 기본값 그대로 사용)
        self.add_inport('start_json', "")   # {"lat":.., "lon":..}
        self.add_inport('end_json', "")     # {"lat":.., "lon":..}

        self.add_outport('route_json', "")       # 추천 경로 좌표 리스트 (JSON 문자열)
        self.add_outport('route_distance', 0.0)  # 추천 경로 총 거리(m)
        self.add_outport('route_time', 0.0)      # 추천 경로 예상 소요시간(초)
        self.add_outport('routes_json', "")      # 우회/통과 두 경로 전체

        self.add_param('net_xml_path', self.DEFAULT_NET_XML_PATH)
        self.add_param('mode', self.DEFAULT_MODE)
        self.add_param('start_lat', self.DEFAULT_START_LAT)
        self.add_param('start_lon', self.DEFAULT_START_LON)
        self.add_param('end_lat', self.DEFAULT_END_LAT)
        self.add_param('end_lon', self.DEFAULT_END_LON)
        self.add_param('poll_interval', self.DEFAULT_POLL_INTERVAL)
        self.add_param('walk_speed_mps', self.DEFAULT_WALK_SPEED_MPS)

        self.net_xml_path = self.DEFAULT_NET_XML_PATH
        self.mode = self.DEFAULT_MODE
        self.start_lat = self.DEFAULT_START_LAT
        self.start_lon = self.DEFAULT_START_LON
        self.end_lat = self.DEFAULT_END_LAT
        self.end_lon = self.DEFAULT_END_LON
        self.poll_interval = self.DEFAULT_POLL_INTERVAL
        self.walk_speed_mps = self.DEFAULT_WALK_SPEED_MPS

        self.VERSION = 2.0
        self.reset()

    def reset(self):
        self.net = None   # 첫 poll 때 지연 로딩 (제일 무거운 작업이라 생성 시점엔 안 함)
        self.burning_xy = []      # [(x,y), ...] — SUMO 내부좌표
        self.point_weights = []   # burning_xy와 같은 길이, 지점별 가중치
        self.point_radii = []     # burning_xy와 같은 길이, 지점별 반경(m)
        self.has_new_result = False
        self.last_route_json = ""
        self.last_distance = 0.0
        self.last_time = 0.0
        self.last_routes_json = ""
        self.ctx = None           # 위험구간 판정 결과 캐시 (위험지점이 바뀔 때만 다시 계산)
        self.ctx_version = 0
        self.snap_cache = {}      # (lat, lon, mode) → 출발/도착 도로
        self.last_calc_key = None # 마지막으로 경로를 계산한 입력 (같으면 재계산 생략)

    def set_param(self, port_name, port_value):
        if port_name == 'net_xml_path':
            self.net_xml_path = port_value
        elif port_name == 'mode':
            self.mode = port_value
        elif port_name == 'start_lat':
            self.start_lat = float(port_value)
        elif port_name == 'start_lon':
            self.start_lon = float(port_value)
        elif port_name == 'end_lat':
            self.end_lat = float(port_value)
        elif port_name == 'end_lon':
            self.end_lon = float(port_value)
        elif port_name == 'poll_interval':
            self.poll_interval = float(port_value)
        elif port_name == 'walk_speed_mps':
            self.walk_speed_mps = float(port_value)
        print(f"[route_detour:{self.MODEL_NAME}] param set: {port_name}={port_value}")
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

    def _ensure_net_loaded(self):
        if self.net is None:
            # 결합모델 in_param에 상대경로("guryongpo.net.xml")가 들어오면 엔진 작업
            # 디렉토리 기준으론 못 찾고, sumolib가 URL로 해석해 'unknown url type' 에러가
            # 나므로 이 .py 파일이 있는 폴더 기준으로 풀어준다.
            path = self.net_xml_path
            if not os.path.isabs(path):
                path = os.path.join(os.path.dirname(os.path.abspath(__file__)), path)
            print(f"[route_detour] 도로망 로딩 중: {path}")
            self.net = sumolib.net.readNet(path)
            print(f"[route_detour] 도로망 로드 완료: 엣지 {len(self.net.getEdges())}개")

    def ExtTransFn(self, sim_time, dt, src_model_name, port_name, port_value):
        port_value = self._normalize_to_str(port_value)
        if not port_value:
            return True

        if port_name == 'start_json':
            try:
                d = json.loads(port_value)
                self.start_lat, self.start_lon = d['lat'], d['lon']
                print(f"[route_detour] 시작지점 갱신: {self.start_lat},{self.start_lon}")
            except Exception as e:
                print(f"[route_detour] start_json 파싱 실패: {e}")

        elif port_name == 'end_json':
            try:
                d = json.loads(port_value)
                self.end_lat, self.end_lon = d['lat'], d['lon']
                print(f"[route_detour] 도착지점 갱신: {self.end_lat},{self.end_lon}")
            except Exception as e:
                print(f"[route_detour] end_json 파싱 실패: {e}")

        elif port_name == 'weighted_risk_json':
            try:
                self._ensure_net_loaded()
                items = json.loads(port_value)
                xy, weights, radii = [], [], []
                for it in items:
                    lat, lon = it.get('lat'), it.get('lon')
                    if lat is None or lon is None:
                        continue
                    xy.append(self.net.convertLonLat2XY(lon, lat))
                    weights.append(it.get('weight', 1.0))
                    radii.append(it.get('radius', 100))
                if (xy, weights, radii) != (self.burning_xy, self.point_weights, self.point_radii):
                    self.burning_xy = xy
                    self.point_weights = weights
                    self.point_radii = radii
                    self.ctx = None
                    print(f"[route_detour] weighted_risk_json: 위험지점 {len(xy)}개 갱신")
            except Exception as e:
                print(f"[route_detour] weighted_risk_json 처리 실패: {e}")

        return True

    # ------------------------------------------------------------------
    # 경로 계산
    # ------------------------------------------------------------------
    def _snap(self, lat, lon):
        """좌표 → 가장 가까운 도로. find_edge가 매번 전체 도로를 훑어서(~50ms) 결과를 캐싱."""
        key = (lat, lon, self.mode)
        if key not in self.snap_cache:
            x, y = self.net.convertLonLat2XY(lon, lat)
            self.snap_cache[key] = find_edge(self.net, x, y, self.mode)
        return self.snap_cache[key]

    def _edge_speed(self, edge):
        speed = edge.getSpeed() or 13.89     # 제한속도 정보 없으면 50km/h
        if self.mode == "pedestrian":
            speed = min(speed, self.walk_speed_mps)
        else:
            speed *= self.SPEED_FACTOR
        return max(speed, 0.1)

    def _route_stats(self, edge_ids, ctx):
        """경로 → (좌표, 거리m, 예상시간s, 병목 통과 길이m, 병목 지연s).
        build_path_coords와 같게 첫 엣지(출발 엣지)는 거리/시간 계산에서 뺌."""
        coords, dist, _ = build_path_coords(self.net, edge_ids)
        working = list(edge_ids)[1:] if len(edge_ids) > 1 else list(edge_ids)
        time_s = bottleneck_m = delay_s = 0.0
        seen = set()
        for eid in working:
            if eid in seen:
                continue
            seen.add(eid)
            e = self.net.getEdge(eid)
            free = e.getLength() / self._edge_speed(e)
            w = ctx.edge_weight.get(eid, 0.0)
            t = free / (1.0 - w) if w < 1.0 else free
            time_s += t
            if w > 0:
                bottleneck_m += e.getLength()
                delay_s += t - free
        return coords, dist, time_s, bottleneck_m, delay_s

    def IntTransFn(self, sim_time, dt):
        try:
            self._ensure_net_loaded()

            start_edge = self._snap(self.start_lat, self.start_lon)
            end_edge = self._snap(self.end_lat, self.end_lon)

            if start_edge is None or end_edge is None:
                print("[route_detour] 시작/도착 지점 근처에서 도로를 못 찾음")
                return True

            if self.ctx is None:
                self.ctx = WeightedRiskContext(self.net, self.burning_xy,
                                               self.point_weights, self.point_radii)
                self.ctx_version += 1
            ctx = self.ctx
            # 위험구간/출발·도착/모드가 지난번과 같으면 경로도 같으므로 다시 계산하지 않음
            calc_key = (self.ctx_version, start_edge.getID(), end_edge.getID(),
                        self.mode, self.walk_speed_mps)
            if calc_key == self.last_calc_key:
                return True
            ends = {start_edge.getID(), end_edge.getID()}
            # 출발/도착 도로 자체가 차단·병목 구간 안이면 경로가 아예 안 나오므로 그 두 도로만 예외
            for e in (start_edge, end_edge):
                w = ctx.edge_weight.get(e.getID(), 0.0)
                if w > 0:
                    kind = '차단' if w >= 1.0 else '병목'
                    print(f"[route_detour] 경고: {'출발' if e is start_edge else '도착'} 지점 도로가 "
                          f"{kind}구간(weight {w}) 안에 있음 — 해당 도로만 통행 허용")
            blocked = set(ctx.blocked) - ends
            bottleneck = {eid for eid, w in ctx.edge_weight.items() if 0 < w < 1.0} - ends

            # 통과 경로: 차단만 피하는 최단 경로 / 우회 경로: 병목까지 모두 피하는 최단 경로
            through_ids = astar_simple(self.net, start_edge, end_edge,
                                       blocked_edges=blocked, mode=self.mode)
            if not through_ids:
                print(f"[route_detour] 경로를 못 찾음 (차단 도로 {len(blocked)}개 — "
                      f"차단구간이 출발지와 도착지 사이를 완전히 막았을 수 있음)")
                # 이전 경로가 그대로 남아 보이지 않도록 "경로 없음"을 내보냄
                self.last_route_json = "[]"
                self.last_distance = 0.0
                self.last_time = 0.0
                self.last_routes_json = json.dumps({
                    "recommended": None,
                    "detour": {"available": False},
                    "through": {"available": False},
                    "blocked_edges": len(blocked),
                    "bottleneck_edges": len(bottleneck),
                }, ensure_ascii=True)
                self.has_new_result = True
                self.last_calc_key = calc_key
                return True
            through = self._route_stats(through_ids, ctx)
            passes = through[3] > 0

            if passes:
                detour_ids = astar_simple(self.net, start_edge, end_edge,
                                          blocked_edges=blocked | bottleneck, mode=self.mode)
                detour = self._route_stats(detour_ids, ctx) if detour_ids else None
            else:
                detour = through   # 통과 경로가 병목을 안 지나면 두 경로는 같음

            def pack(stats, extra=False):
                if stats is None:
                    return {"available": False}
                coords, dist, t, bn_m, delay = stats
                d = {"available": True, "distance_m": round(dist, 1),
                     "time_s": round(t, 1), "coords": coords}
                if extra:
                    d.update({"delay_s": round(delay, 1), "bottleneck_m": round(bn_m, 1),
                              "passes_bottleneck": passes})
                return d

            recommended = "detour" if detour is not None and detour[2] <= through[2] else "through"
            best = detour if recommended == "detour" else through
            routes = {
                "recommended": recommended,
                "detour": pack(detour),
                "through": pack(through, extra=True),
                "blocked_edges": len(blocked),
                "bottleneck_edges": len(bottleneck),
            }
            self.last_route_json = json.dumps(best[0], ensure_ascii=True)
            self.last_distance = best[1]
            self.last_time = best[2]
            self.last_routes_json = json.dumps(routes, ensure_ascii=True)
            self.has_new_result = True
            self.last_calc_key = calc_key

            d_txt = (f"우회 {round(detour[1])}m/{round(detour[2])}s" if detour
                     else "우회 불가(병목을 모두 피할 길 없음)")
            print(f"[route_detour:poll] t={sim_time} 위험지점={len(self.burning_xy)}개 "
                  f"차단도로={len(blocked)}개 병목도로={len(bottleneck)}개 | {d_txt} | "
                  f"통과 {round(through[1])}m/{round(through[2])}s"
                  f"(병목 {round(through[3])}m, 지연 {round(through[4])}s) → 추천: "
                  f"{'우회' if recommended == 'detour' else '통과'}")
        except Exception as e:
            print(f"[route_detour] 경로 계산 실패: {e}")
        return True

    def OutputFn(self, sim_time, dt):
        if self.has_new_result:
            self.set_outport_value('route_json', self.last_route_json)
            self.set_outport_value('route_distance', self.last_distance)
            self.set_outport_value('route_time', self.last_time)
            self.set_outport_value('routes_json', self.last_routes_json)
            self.has_new_result = False
        return True

    def TimeAdvanceFn(self, sim_time):
        if self.poll_interval > 0:
            return self.poll_interval
        return self.Infinity


if __name__ == "__main__":
    m = route_detour()
    # risk_weight 노드가 내보낼 법한 형태로 가짜 데이터 구성 (가중치/반경 포함)
    fake_weighted = json.dumps([
        {"lat": 35.990, "lon": 129.560, "weight": 1.0, "radius": 150},
        {"lat": 35.985, "lon": 129.558, "weight": 0.5, "radius": 40},
    ])
    m.ExtTransFn(0.0, 0.0, "risk_weight", "weighted_risk_json", fake_weighted)
    m.IntTransFn(0.0, 0.0)
    m.OutputFn(0.0, 0.0)
    print("route_distance:", m.OUT_PORT['route_distance'].value)
    print("route_time:", m.OUT_PORT['route_time'].value)
