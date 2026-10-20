"""
risk_weight
-------------------
여러 재난 시뮬레이션(산사태/홍수/교통/... )의 위험지점을 받아서, 각 지점마다
weight(가중치)/radius(반경)를 계산해 하나로 합쳐 내보내는 HYMS 원자모델.

역할 분리:
  - 이 노드: "어떤 지점이 얼마나 위험한가"를 판단 (응답 해석 → 값 계산 → weight/radius)
  - route_detour 노드: 그 결과를 받아 실제 경로 계산만 담당
  → 새 시뮬레이션을 붙일 때 코드 수정 없이 포트별 파라미터 3개로 해결.

입력 포트 (6개까지 미리 만들어둠):
  hazard1_json ~ hazard6_json
  → 각각 다른 시뮬레이션 노드의 response / response_json을 연결

포트별 파라미터 (N = 1~6):
  hazardN_list  — 응답 JSON에서 위험지점 배열이 있는 경로 (예: "risk_zones", "data.data")
                  비워두면 risk_zones → features → data.data → data 순서로 자동 탐색
                  (응답 자체가 배열이면 그대로 사용)
                  각 위험지점의 좌표는 lat/lon, latitude/longitude, GeoJSON geometry 중
                  있는 것을 자동으로 찾음 (문자열 좌표도 숫자로 변환)
  hazardN_field — 위험지점에서 값을 꺼낼 경로 또는 계산식
                  경로: "fs", "details.depth_m", "hourly_depth_ft.3"
                  와일드카드: "lanes.*.speed_med_kmh" (여러 값 → min/max/avg/sum 안에서 사용)
                  시간대: "{t}" = api_call_timeseries가 붙여준 현재 시간대 번호(_t)
                  계산식: + - * / ( ), 비교(< > <= >= == !=), and/or/not, "a if 조건 else b",
                          함수 min max avg sum abs clamp(x,최소,최대)
                  예) "min(traffic_analysis.lanes.*.speed_med_kmh) * (1 - max(traffic_analysis.lanes.*.stopped_ratio))"
                  비워두면: 필드명으로 재난 종류 자동 판별 (KNOWN_FIELDS 참고)
  hazardN_rule  — 계산된 값에 적용할 규칙 (형식은 아래 규칙 설명 참고)
                  비워두면: field가 KNOWN_FIELDS의 필드면 그 기본 규칙, 아니면 default_rule
  default_rule  — 값이 없거나(필드 없음/계산 실패) 규칙을 모를 때 쓰는 "weight:radius"

출력:
  weighted_risk_json — [{"lat":.., "lon":.., "weight":.., "radius":..,
                          "source": "hazard2", "value": 1.2}, ...]
      source = 들어온 포트, value = rule에 넣은 값 (없으면 null)
  (route_detour의 입력으로 그대로 연결)
"""

import ast
import json
import re
from CsModel import CsModel


# =====================================================================
# 규칙 문자열 형식: "조건:weight:radius, 조건:weight:radius, ..., else:weight:radius"
#   - 조건은 "<0.6", "<=1.0", ">10", ">=3" 처럼 비교연산자+숫자
#   - 앞에서부터 차례로 검사해서 처음 맞는 것의 weight/radius를 씀
#   - 아무것도 안 맞으면 else 값 (else 생략 시 default_rule 값)
#   - weight는 0~1 (route_detour에서 반경 안 도로 비용 = 길이 / (1 - weight))
#       1.0 = 반경 안 도로 전체 차단, 0.5 = 2배 비용, 0.8 = 5배, 0.9 = 10배, 0 = 영향 없음
#   예) "<0.6:1.0:150, <1.0:0.5:80, else:0.2:40"
#       → 값<0.6이면 반경 150m 차단, 값<1.0이면 weight 0.5/80m, 나머지 0.2/40m
# =====================================================================

# 자동 판별용 — hazardN_field를 비워두면 위험지점에 이 필드가 있는지로 재난 종류를
# 판별하고, hazardN_rule을 비워두면 여기 기본 규칙을 씀. (필드명, 기본 규칙)
KNOWN_FIELDS = (
    # 산사태: fs = 안전율(Factor of Safety). 낮을수록 위험함(1.0 미만이면 불안정).
    ('fs', "<0.6:1.0:150, <1.0:0.5:80, else:0.2:40"),
    # 홍수: 침수 지속시간(시간). 길수록 위험함.
    ('hours_flooded', ">10:1.0:150, >3:0.5:80, else:0.2:40"),
    # 대기질(추정) — 농도값. 정확한 단위/임계값 확인 전 임시값.
    ('conc', ">50:0.7:100, else:0.2:50"),
)
# 값이 없거나 모르는 종류의 위험지점 — 기본값으로 처리 (죽지 않고 일단 반영은 됨)
DEFAULT_RULE = "0.2:50"

# hazardN_list를 비워뒀을 때 위험지점 배열을 찾는 순서
AUTO_LIST_PATHS = ('risk_zones', 'features', 'data.data', 'data')

_OPS = {
    '<=': lambda v, t: v <= t,
    '>=': lambda v, t: v >= t,
    '<': lambda v, t: v < t,
    '>': lambda v, t: v > t,
}


class _Missing(Exception):
    """값이 없거나 숫자가 아니어서 계산할 수 없음 → default_rule 적용"""


_MISSING = object()


# ---------------------------------------------------------------------
# 규칙 파싱
# ---------------------------------------------------------------------
def _weight_radius(w, r):
    w, r = float(w), float(r)
    if not 0.0 <= w <= 1.0:
        raise ValueError(f"weight {w}는 0~1 사이여야 함 (1.0 = 반경 안 전체 차단)")
    if r < 0:
        raise ValueError(f"radius {r}는 0 이상이어야 함")
    return w, r


def parse_default_rule(text):
    """"weight:radius" → (weight, radius)"""
    w, r = text.strip().split(':')
    return _weight_radius(w, r)


def parse_rule(text):
    """규칙 문자열 → ([(op, 임계값, weight, radius), ...], else값 또는 None).
    형식이 틀리면 ValueError."""
    conds, else_val = [], None
    for part in text.split(','):
        part = part.strip()
        if not part:
            continue
        cond, w, r = [s.strip() for s in part.split(':')]
        if cond.lower() == 'else':
            else_val = _weight_radius(w, r)
            continue
        op = next((o for o in ('<=', '>=', '<', '>') if cond.startswith(o)), None)
        if op is None:
            raise ValueError(f"조건 '{cond}'은 <, <=, >, >= 중 하나로 시작해야 함")
        conds.append((op, float(cond[len(op):])) + _weight_radius(w, r))
    return conds, else_val


KNOWN_RULES = {field: parse_rule(text) for field, text in KNOWN_FIELDS}


def apply_rule(value, rule, default):
    conds, else_val = rule
    for op, threshold, w, r in conds:
        if _OPS[op](value, threshold):
            return w, r
    return else_val if else_val is not None else default


# ---------------------------------------------------------------------
# JSON 경로
# ---------------------------------------------------------------------
def get_nested(obj, path):
    """'a.b.0.c' 형태 경로로 중첩 값을 찾는다. 없으면 _MISSING."""
    cur = obj
    for part in path.split('.'):
        try:
            if isinstance(cur, list):
                cur = cur[int(part)]
            elif isinstance(cur, dict):
                cur = cur[part]
            else:
                return _MISSING
        except (KeyError, IndexError, ValueError, TypeError):
            return _MISSING
    return cur


def _get_wild(obj, parts):
    """'*'가 들어간 경로 → 찾은 값들의 리스트 (없는 건 건너뜀)"""
    if not parts:
        return [obj]
    head, rest = parts[0], parts[1:]
    if head == '*':
        children = obj.values() if isinstance(obj, dict) else obj if isinstance(obj, list) else []
        out = []
        for c in children:
            out.extend(_get_wild(c, rest))
        return out
    nxt = get_nested(obj, head)
    return [] if nxt is _MISSING else _get_wild(nxt, rest)


def _to_num(v):
    if isinstance(v, bool):
        return float(v)
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, str):
        try:
            return float(v)
        except ValueError:
            pass
    raise _Missing()


# ---------------------------------------------------------------------
# field 계산식 — ast로 파싱해서 허용된 노드/함수만 계산 (eval 사용 안 함)
# ---------------------------------------------------------------------
_PATH_RE = re.compile(r'(?<![\w.])([A-Za-z_][A-Za-z0-9_]*(?:\.(?:[A-Za-z0-9_]+|\*))*)(?![\w.])')
_KEYWORDS = {'and', 'or', 'not', 'if', 'else', 'True', 'False'}


def _agg_values(args):
    vals = []
    for a in args:
        if isinstance(a, list):
            for v in a:
                try:
                    vals.append(_to_num(v))
                except _Missing:
                    continue      # 와일드카드 중 숫자 아닌 값은 건너뜀
        else:
            vals.append(a)
    if not vals:
        raise _Missing()
    return vals


_FUNCS = {
    'min': lambda *a: min(_agg_values(a)),
    'max': lambda *a: max(_agg_values(a)),
    'sum': lambda *a: sum(_agg_values(a)),
    'avg': lambda *a: (lambda v: sum(v) / len(v))(_agg_values(a)),
    'abs': lambda x: abs(x),
    'clamp': lambda x, lo, hi: max(lo, min(hi, x)),
}
_BINOPS = {
    ast.Add: lambda a, b: a + b, ast.Sub: lambda a, b: a - b,
    ast.Mult: lambda a, b: a * b, ast.Div: lambda a, b: a / b,
    ast.Mod: lambda a, b: a % b, ast.Pow: lambda a, b: a ** b,
}
_CMPOPS = {
    ast.Lt: lambda a, b: a < b, ast.LtE: lambda a, b: a <= b,
    ast.Gt: lambda a, b: a > b, ast.GtE: lambda a, b: a >= b,
    ast.Eq: lambda a, b: a == b, ast.NotEq: lambda a, b: a != b,
}


def _substitute(expr, t, on_path):
    """{t}를 시간대 번호로, 경로 토큰을 변수 이름으로 바꾼 식을 돌려준다."""
    if '{t}' in expr:
        if t is None:
            raise _Missing()   # 시간대 번호가 없는 입력인데 {t}를 쓴 경우
        expr = expr.replace('{t}', str(int(t)))

    def repl(m):
        tok = m.group(1)
        is_call = expr[m.end():].lstrip().startswith('(')
        if tok in _KEYWORDS or (tok in _FUNCS and is_call):
            return tok
        return on_path(tok)   # 함수 이름과 같은 JSON 키(예: "max")도 괄호가 없으면 경로로 취급
    return _PATH_RE.sub(repl, expr)


def _check_node(node):
    allowed = (ast.Expression, ast.BinOp, ast.UnaryOp, ast.BoolOp, ast.Compare, ast.IfExp,
               ast.Call, ast.Name, ast.Constant, ast.Load,
               ast.operator, ast.unaryop, ast.boolop, ast.cmpop)
    for n in ast.walk(node):
        if not isinstance(n, allowed):
            raise ValueError(f"허용되지 않는 표현: {type(n).__name__}")
        if isinstance(n, ast.BinOp) and type(n.op) not in _BINOPS:
            raise ValueError("허용되지 않는 연산자")
        if isinstance(n, ast.Compare) and any(type(o) not in _CMPOPS for o in n.ops):
            raise ValueError("허용되지 않는 비교 연산자")
        if isinstance(n, ast.Call):
            if not isinstance(n.func, ast.Name) or n.func.id not in _FUNCS or n.keywords:
                raise ValueError(f"허용되지 않는 함수 (가능: {', '.join(_FUNCS)})")
        if isinstance(n, ast.Constant) and not isinstance(n.value, (int, float)):
            raise ValueError("숫자 외의 상수는 쓸 수 없음")


def validate_field(expr):
    """파라미터로 들어온 field 식이 올바른지 미리 검사 (틀리면 ValueError)."""
    names = []
    try:
        e = _substitute(expr, 0, lambda tok: names.append(tok) or f'__v{len(names) - 1}')
        tree = ast.parse(e, mode='eval')
    except SyntaxError as ex:
        raise ValueError(f"식 문법 오류: {ex.msg}")
    _check_node(tree)
    call_names = {id(n.func) for n in ast.walk(tree) if isinstance(n, ast.Call)}
    for n in ast.walk(tree):
        if isinstance(n, ast.Name) and not (n.id.startswith('__v') or id(n) in call_names):
            raise ValueError(f"알 수 없는 이름: {n.id}")


def _eval(node, env):
    if isinstance(node, ast.Expression):
        return _eval(node.body, env)
    if isinstance(node, ast.Constant):
        return float(node.value)
    if isinstance(node, ast.Name):
        v = env[node.id]
        return v if isinstance(v, list) else _to_num(v)
    if isinstance(node, ast.Call):
        args = [_eval(a, env) for a in node.args]
        if node.func.id not in ('min', 'max', 'sum', 'avg') and any(isinstance(a, list) for a in args):
            raise ValueError(f"{node.func.id}()에는 '*' 경로를 바로 넣을 수 없음 (min/max/avg/sum으로 감싸기)")
        return float(_FUNCS[node.func.id](*args))
    if isinstance(node, ast.IfExp):
        return _eval(node.body, env) if _eval(node.test, env) else _eval(node.orelse, env)
    if isinstance(node, ast.BoolOp):
        vals = [_eval(v, env) for v in node.values]
        if isinstance(node.op, ast.And):
            return float(all(vals))
        return float(any(vals))
    vals = []
    if isinstance(node, ast.BinOp):
        a, b = _eval(node.left, env), _eval(node.right, env)
        vals = [a, b]
    elif isinstance(node, ast.UnaryOp):
        a = _eval(node.operand, env)
        vals = [a]
    elif isinstance(node, ast.Compare):
        vals = [_eval(node.left, env)] + [_eval(c, env) for c in node.comparators]
    if any(isinstance(v, list) for v in vals):
        raise ValueError("'*' 경로는 min/max/avg/sum 안에서만 쓸 수 있음")
    if isinstance(node, ast.BinOp):
        try:
            return float(_BINOPS[type(node.op)](*vals))
        except ZeroDivisionError:
            raise _Missing()
    if isinstance(node, ast.UnaryOp):
        if isinstance(node.op, ast.Not):
            return float(not vals[0])
        return -vals[0] if isinstance(node.op, ast.USub) else vals[0]
    if isinstance(node, ast.Compare):
        for op, a, b in zip(node.ops, vals, vals[1:]):
            if not _CMPOPS[type(op)](a, b):
                return 0.0
        return 1.0
    raise ValueError(f"허용되지 않는 표현: {type(node).__name__}")


def evaluate_field(expr, zone, t):
    """위험지점(zone) 하나에 field 식을 계산해서 숫자 하나를 돌려준다.
    값이 없거나 숫자가 아니면 _Missing."""
    env = {}

    def bind(tok):
        name = f'__v{len(env)}'
        parts = tok.split('.')
        if '*' in parts:
            env[name] = _get_wild(zone, parts)
        else:
            v = get_nested(zone, tok)
            if v is _MISSING or v is None:
                raise _Missing()
            env[name] = v
        return name

    tree = ast.parse(_substitute(expr, t, bind), mode='eval')
    return _eval(tree, env)


def compute_zone(zone, field, rule, default, t=None):
    """위험지점 하나(dict)를 보고 (weight, radius_m, value)를 반환한다.
    field: 경로/계산식 (빈 문자열이면 KNOWN_FIELDS로 자동 판별)
    rule: parse_rule 결과 (None이면 field에 맞는 KNOWN_RULES, 그것도 없으면 default)
    default: (weight, radius), t: 시간대 번호 (없으면 None)
    value: rule에 넣은 값 (값이 없거나 계산 실패면 None)"""
    if not field:
        field = next((f for f, _ in KNOWN_FIELDS if f in zone), '')
        if not field:
            return default + (None,)
    try:
        value = evaluate_field(field, zone, t)
    except Exception:
        # 값 없음(_Missing)/계산 불가 — 한 지점 때문에 시뮬레이션이 죽지 않게 기본값 처리
        return default + (None,)
    if rule is None:
        rule = KNOWN_RULES.get(field)
        if rule is None:
            return default + (value,)
    return apply_rule(value, rule, default) + (value,)


def compute_weight_and_radius(zone, field, rule, default, t=None):
    """compute_zone에서 값을 뺀 (weight, radius_m)."""
    return compute_zone(zone, field, rule, default, t)[:2]


# ---------------------------------------------------------------------
# 응답 JSON → 위험지점 리스트
# ---------------------------------------------------------------------
def _normalize_zone(item):
    """위험지점 하나 → lat/lon(숫자)가 채워진 dict. 좌표를 못 찾으면 None."""
    if not isinstance(item, dict):
        return None
    geom = item.get('geometry')
    if isinstance(geom, dict) and isinstance(item.get('properties'), dict):
        z = dict(item['properties'])        # GeoJSON Feature — 속성을 바로 경로로 쓸 수 있게 펼침
        coords = geom.get('coordinates')
        if isinstance(coords, list) and len(coords) >= 2:
            z.setdefault('lon', coords[0])
            z.setdefault('lat', coords[1])
    else:
        z = dict(item)
    for lat_key, lon_key in (('lat', 'lon'), ('latitude', 'longitude')):
        if lat_key in z and lon_key in z:
            try:
                z['lat'], z['lon'] = float(z[lat_key]), float(z[lon_key])
                return z
            except (TypeError, ValueError):
                return None
    return None


def extract_zones(data, list_path=''):
    """응답 JSON에서 위험지점 배열을 찾아 좌표가 있는 것만 돌려준다 (죽지 않음)."""
    if list_path:
        arr = get_nested(data, list_path)
    elif isinstance(data, list):
        arr = data
    else:
        arr = next((v for v in (get_nested(data, p) for p in AUTO_LIST_PATHS)
                    if isinstance(v, list)), [])
    if not isinstance(arr, list):
        return []
    return [z for z in (_normalize_zone(it) for it in arr) if z is not None]
# =====================================================================


class risk_weight(CsModel):

    HAZARD_PORTS = tuple(f'hazard{i}_json' for i in range(1, 7))  # 넉넉히 6개
    DEFAULT_POLL_INTERVAL = 2.0

    def __init__(self):
        self.MODEL_NAME = "risk_weight"

        for p in self.HAZARD_PORTS:
            self.add_inport(p, "")

        self.add_outport('weighted_risk_json', "")

        self.add_param('poll_interval', self.DEFAULT_POLL_INTERVAL)
        self.poll_interval = self.DEFAULT_POLL_INTERVAL

        # 포트별 list/field/rule — 비워두면 자동
        self.port_list = {}
        self.port_field = {}
        self.port_rule = {}
        for i in range(1, len(self.HAZARD_PORTS) + 1):
            self.add_param(f'hazard{i}_list', "")
            self.add_param(f'hazard{i}_field', "")
            self.add_param(f'hazard{i}_rule', "")
            port = f'hazard{i}_json'
            self.port_list[port] = ""
            self.port_field[port] = ""
            self.port_rule[port] = None
        self.add_param('default_rule', DEFAULT_RULE)
        self.default = parse_default_rule(DEFAULT_RULE)

        self.VERSION = 1.3
        self.reset()

    def reset(self):
        self.source_zones = {p: [] for p in self.HAZARD_PORTS}
        self.source_t = {p: None for p in self.HAZARD_PORTS}   # 입력에 붙어온 시간대 번호(_t)
        self.source_raw = {p: None for p in self.HAZARD_PORTS}  # list 파라미터가 바뀌면 다시 뽑기 위해 보관
        self.has_new_result = False
        self.last_output = "[]"

    def set_param(self, port_name, port_value):
        if port_name == 'poll_interval':
            self.poll_interval = float(port_value)
        elif port_name == 'default_rule' or (
                port_name.startswith('hazard') and port_name.endswith(('_list', '_field', '_rule'))):
            # 형식이 틀리면 기존 값을 그대로 유지 (시뮬레이션이 죽지 않게)
            text = self._normalize_to_str(port_value).strip()
            try:
                if port_name == 'default_rule':
                    self.default = parse_default_rule(text)
                else:
                    base, kind = port_name.rsplit('_', 1)     # "hazard2", "field"
                    port = f'{base}_json'
                    if port not in self.port_field:
                        raise ValueError(f"없는 포트: {port}")
                    if kind == 'list':
                        self.port_list[port] = text
                        if self.source_raw[port] is not None:
                            self.source_zones[port] = extract_zones(self.source_raw[port], text)
                    elif kind == 'field':
                        if text:
                            validate_field(text)
                        self.port_field[port] = text
                    else:
                        self.port_rule[port] = parse_rule(text) if text else None
            except Exception as e:
                print(f"[risk_weight] {port_name} 형식 오류로 기존 값 유지: {text!r} ({e})")
                return True
        print(f"[risk_weight:{self.MODEL_NAME}] param set: {port_name}={port_value}")
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

    def ExtTransFn(self, sim_time, dt, src_model_name, port_name, port_value):
        port_value = self._normalize_to_str(port_value)
        if port_name in self.source_zones and port_value:
            try:
                d = json.loads(port_value)
                self.source_raw[port_name] = d
                self.source_t[port_name] = d.get('_t') if isinstance(d, dict) else None
                zones = extract_zones(d, self.port_list[port_name])
                self.source_zones[port_name] = zones
                t = self.source_t[port_name]
                print(f"[risk_weight] {port_name}: 위험지점 {len(zones)}개 갱신"
                      + (f" (시간대 t={t})" if t is not None else ""))
            except Exception as e:
                print(f"[risk_weight] {port_name} 파싱 실패: {e}")
        return True

    def IntTransFn(self, sim_time, dt):
        combined = []
        for port, zones in self.source_zones.items():
            field, rule, t = self.port_field[port], self.port_rule[port], self.source_t[port]
            source = port[:-len('_json')]            # "hazard2" — 어느 포트(시뮬레이션)에서 왔는지
            for z in zones:
                weight, radius, value = compute_zone(z, field, rule, self.default, t)
                combined.append({"lat": z['lat'], "lon": z['lon'], "weight": weight, "radius": radius,
                                 "source": source,
                                 "value": None if value is None else round(value, 4)})

        self.last_output = json.dumps(combined, ensure_ascii=True)
        self.has_new_result = True
        print(f"[risk_weight:poll] t={sim_time} 합쳐진 위험지점={len(combined)}개")
        return True

    def OutputFn(self, sim_time, dt):
        if self.has_new_result:
            self.set_outport_value('weighted_risk_json', self.last_output)
            self.has_new_result = False
        return True

    def TimeAdvanceFn(self, sim_time):
        if self.poll_interval > 0:
            return self.poll_interval
        return self.Infinity


if __name__ == "__main__":
    m = risk_weight()
    fake_landslide = json.dumps({"risk_zones": [{"lat": 35.99, "lon": 129.56, "fs": 0.4}]})
    fake_flood = json.dumps({"_t": 1, "risk_zones": [{"lat": 35.98, "lon": 129.55, "hourly_depth_ft": [0, 1.2]}]})
    m.set_param('hazard2_field', 'hourly_depth_ft.{t}')
    m.set_param('hazard2_rule', '>1.0:1.0:100, >0.5:0.6:80, >0:0.3:50, else:0:0')
    m.ExtTransFn(0.0, 0.0, "a", "hazard1_json", fake_landslide)
    m.ExtTransFn(0.0, 0.0, "b", "hazard2_json", fake_flood)
    m.IntTransFn(0.0, 0.0)
    m.OutputFn(0.0, 0.0)
    print("weighted_risk_json:", m.OUT_PORT['weighted_risk_json'].value)
