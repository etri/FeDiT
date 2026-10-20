"""
api_call_timeseries
-------------------
앞단 노드(예: api_call_single)가 'input_json' 포트로 보낸 JSON을 그대로 POST 바디로
넘겨서, 배열(시간대별 등) 형태의 응답을 받아 항목을 하나씩 순서대로 내보내는 범용 원자모델.
특정 API(산사태 등)에 종속되지 않음 — timeseries_url/필드명만 바꾸면 재사용 가능.

노드 구성 예:
  api_call_single (preset 조회) --response--> api_call_timeseries (input_json) --response--> print
                                                                    --response_json-->  (필요시 다른 모델로)

동작:
  1. 'input_json' 포트로 새 값이 오면 → 그 값을 그대로 timeseries_url에 POST
  2. 응답 JSON에서 response_list_field(기본 "results") 배열을 캐싱
  3. poll_interval마다 캐싱된 배열에서 다음 항목을 꺼내:
       - response_value_field(기본 "fs_min") 값 하나 → 'response' (숫자)
       - 항목 전체 → 'response_json' (문자열, 다음 노드에서 더 자세히 쓰고 싶을 때)
         항목이 dict면 "_t"(시간대 번호, 0부터)와 carry_fields로 지정한 응답 최상위 값도 첨부
  4. 배열 끝까지 가면 처음부터 반복 재생

입력이 한 번도 안 들어온 상태에서 테스트하고 싶으면 fallback_input_json 파라미터에
JSON 문자열을 직접 넣어두면 그걸로 자체 테스트 가능 (앞단 노드 연결 없이도 동작 확인용).
"""

import json
import requests
from CsModel import CsModel


class api_call_timeseries(CsModel):

    # 예시 기본값일 뿐 — 실제 값은 결합모델 조합 시 in_param으로 노드마다 다르게 지정
    # 이 노드는 항상 POST로 호출하므로 기본 주소를 두지 않음 (반드시 파라미터로 지정)
    DEFAULT_TIMESERIES_URL = ""
    DEFAULT_RESPONSE_LIST_FIELD = "results"    # 응답 JSON에서 배열이 들어있는 키 (중첩이면 "a.b" 처럼 점으로)
    DEFAULT_RESPONSE_VALUE_FIELD = "fs_min"    # 배열 각 항목에서 뽑을 키 (중첩이면 "a.b" 처럼 점으로,
                                                # 배열 인덱스는 숫자로: 예 "risk_zones.0.lat")
    DEFAULT_POLL_INTERVAL = 2.0
    DEFAULT_FALLBACK_INPUT_JSON = ""           # 비워두면: 앞단 입력 없이는 대기만 함
    DEFAULT_FORWARD_FIELDS = ""                # 비워두면: 받은 JSON을 통째로 전달
                                                # "time_slots,rain_per_hour" 처럼 콤마로 나열하면
                                                # 그 키들만 골라서 POST 바디로 보냄 (나머지는 버림)
    DEFAULT_CARRY_FIELDS = ""                  # 응답 최상위(또는 "a.b" 경로)의 값 중 각 항목에 같이 실어 보낼 키
                                                # 예: 홍수처럼 results(시간대)와 risk_zones(위험지점)가
                                                # 따로 있을 때 "risk_zones" → 매 시간대 항목에 risk_zones 첨부
    API_TIMEOUT_SEC = 20.0
    API_HEADERS = {
        "Content-Type": "application/json",
        # "Authorization": "Bearer <TOKEN>",
    }

    def __init__(self):
        self.MODEL_NAME = "api_call_timeseries"

        self.add_inport('input_json', "")       # 앞단 노드(api_call_single 등)의 response를 연결
        self.add_outport('response', 0.0)       # 배열 중 현재 항목의 값 하나 (숫자)
        self.add_outport('response_json', "")   # 배열 중 현재 항목 전체 (JSON 문자열)

        self.add_param('timeseries_url', self.DEFAULT_TIMESERIES_URL)
        self.add_param('response_list_field', self.DEFAULT_RESPONSE_LIST_FIELD)
        self.add_param('response_value_field', self.DEFAULT_RESPONSE_VALUE_FIELD)
        self.add_param('poll_interval', self.DEFAULT_POLL_INTERVAL)
        self.add_param('fallback_input_json', self.DEFAULT_FALLBACK_INPUT_JSON)
        self.add_param('forward_fields', self.DEFAULT_FORWARD_FIELDS)
        self.add_param('carry_fields', self.DEFAULT_CARRY_FIELDS)

        self.timeseries_url = self.DEFAULT_TIMESERIES_URL
        self.response_list_field = self.DEFAULT_RESPONSE_LIST_FIELD
        self.response_value_field = self.DEFAULT_RESPONSE_VALUE_FIELD
        self.poll_interval = self.DEFAULT_POLL_INTERVAL
        self.fallback_input_json = self.DEFAULT_FALLBACK_INPUT_JSON
        self.forward_fields = self.DEFAULT_FORWARD_FIELDS
        self.carry_fields = self.DEFAULT_CARRY_FIELDS

        self.VERSION = 1.1
        self.reset()

    def reset(self):
        self.last_value = 0.0
        self.last_item_json = ""
        self.has_new_result = False
        self.cached_results = None     # POST 응답의 배열 캐시
        self.cached_carry = {}         # carry_fields로 지정한 값들 (매 항목에 첨부)
        self.result_idx = 0
        self.pending_input = None      # 새로 들어왔지만 아직 처리 안 한 input_json
        self.last_processed_input = None  # 마지막으로 실제 조회에 썼던 input (중복 재조회 방지용)

    def set_param(self, port_name, port_value):
        if port_name == 'timeseries_url':
            self.timeseries_url = port_value
        elif port_name == 'response_list_field':
            self.response_list_field = port_value
        elif port_name == 'response_value_field':
            self.response_value_field = port_value
        elif port_name == 'poll_interval':
            self.poll_interval = float(port_value)
        elif port_name == 'fallback_input_json':
            self.fallback_input_json = port_value
        elif port_name == 'forward_fields':
            self.forward_fields = port_value
        elif port_name == 'carry_fields':
            self.carry_fields = port_value
        print(f"[api_call_timeseries:{self.MODEL_NAME}] param set: {port_name}={port_value}")
        return True

    @staticmethod
    def _get_nested(obj, path, default=None):
        """'a.b.c' 형태의 점(.) 경로로 중첩된 JSON 값을 찾는다.
        경로의 각 조각이 숫자면 리스트 인덱스로, 아니면 딕셔너리 키로 취급한다.
        (예: "details.fs_min", "risk_zones.0.lat")
        점이 없는 단순 키("fs_min")는 예전처럼 그냥 딕셔너리 키 조회와 동일하게 동작함."""
        if not path:
            return default
        cur = obj
        for part in path.split('.'):
            try:
                if isinstance(cur, list):
                    cur = cur[int(part)]
                elif isinstance(cur, dict):
                    cur = cur[part]
                else:
                    return default
            except (KeyError, IndexError, ValueError, TypeError):
                return default
        return cur

    @staticmethod
    def _normalize_to_str(value):
        """엔진이 str 대신 bytes로 넘길 수 있고, 그 bytes가 UTF-8이 아니라
        시스템 코드페이지(한국어 Windows는 CP949)일 수 있어 방어적으로 처리."""
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

    def _fetch_and_cache(self, input_json_str, source):
        """앞단에서 받은(또는 fallback) JSON을 그대로 POST 바디로 보내고 결과를 캐싱."""
        if not self.timeseries_url:
            print("[api_call_timeseries] timeseries_url 파라미터가 비어 있음 — "
                  "POST로 호출할 시뮬레이션 API 주소를 지정하세요")
            return False
        try:
            input_json_str = self._normalize_to_str(input_json_str)
            print(f"[api_call_timeseries] ### 이번 조회에 쓴 입력 출처: {source} ### "
                  f"타입/미리보기: {type(input_json_str).__name__} / {input_json_str[:80]!r}")
            body = json.loads(input_json_str) if input_json_str else {}

            # forward_fields가 채워져 있으면 그 키들만 골라서 보낸다 (나머지는 버림).
            # 비어있으면 지금까지처럼 받은 걸 통째로 전달 (상대 API가 관대하게
            # 알 수 없는 필드를 무시해주는 경우엔 이대로도 되지만, 깐깐한 API면
            # 이 파라미터로 필요한 것만 걸러서 보내야 함).
            if self.forward_fields:
                keys = [k.strip() for k in self.forward_fields.split(',') if k.strip()]
                filtered = {k: body[k] for k in keys if k in body}
                missing = [k for k in keys if k not in body]
                if missing:
                    print(f"[api_call_timeseries] 경고: forward_fields에 지정한 "
                          f"{missing} 가 입력 JSON에 없음 (무시됨)")
                body = filtered
                print(f"[api_call_timeseries] forward_fields 적용됨 → 보낼 키: {list(body.keys())}")

            resp = requests.post(self.timeseries_url, json=body,
                                  headers=self.API_HEADERS, timeout=self.API_TIMEOUT_SEC)
            resp.raise_for_status()
            data = resp.json()
            self.cached_results = self._get_nested(data, self.response_list_field, []) or []
            self.cached_carry = {}
            for key in [k.strip() for k in (self.carry_fields or "").split(',') if k.strip()]:
                value = self._get_nested(data, key, None)
                if value is None:
                    print(f"[api_call_timeseries] 경고: carry_fields의 '{key}'가 응답에 없음 (무시됨)")
                else:
                    self.cached_carry[key.split('.')[-1]] = value
            self.result_idx = 0
            print(f"[api_call_timeseries] {self.timeseries_url} 조회 성공: "
                  f"{len(self.cached_results)}개 항목 캐싱됨"
                  + (f", 첨부 필드 {list(self.cached_carry)}" if self.cached_carry else ""))
            return True
        except requests.exceptions.Timeout:
            print(f"[api_call_timeseries] 타임아웃: {self.timeseries_url}")
        except requests.exceptions.ConnectionError:
            print(f"[api_call_timeseries] 연결 실패: {self.timeseries_url}")
        except Exception as e:
            print(f"[api_call_timeseries] 조회 실패: {e}")
        return False

    def ExtTransFn(self, sim_time, dt, src_model_name, port_name, port_value):
        # 앞단 노드(api_call_single 등)가 보낸 JSON을 받아둔다 (바로 호출하지 않고
        # 다음 IntTransFn 틱에서 처리 — poll_interval 흐름과 일관되게 하기 위함)
        if port_name == "input_json" and port_value:
            self.pending_input = port_value
        return True

    def IntTransFn(self, sim_time, dt):
        if self.pending_input is not None:
            # 앞단 노드(api_call_single 등)가 자기 poll 주기마다 계속 같은 값을
            # 반복해서 보낼 수 있다. 매번 다시 조회하면 result_idx가 계속 0으로
            # 리셋되어 "시간대별로 순서대로 재생"이 안 되니, 직전에 이미 처리한
            # 것과 내용이 같으면 재조회하지 않고 그냥 넘어간다.
            if self.pending_input != self.last_processed_input:
                self._fetch_and_cache(self.pending_input, source="ext_input(연결된 앞단 노드)")
                self.last_processed_input = self.pending_input
            self.pending_input = None
        elif self.cached_results is None and self.fallback_input_json:
            # 앞단 연결 없이 단독 테스트할 때만 사용됨
            self._fetch_and_cache(self.fallback_input_json, source="fallback_input_json(파라미터)")

        if self.cached_results:
            if self.result_idx >= len(self.cached_results):
                self.result_idx = 0  # 끝까지 다 썼으면 처음부터 반복 재생

            item = self.cached_results[self.result_idx]
            value = self._get_nested(item, self.response_value_field, 0.0)
            if value is None:
                value = 0.0
            self.last_value = value
            if isinstance(item, dict):
                # _t: 이 항목의 시간대 번호(0부터) — 다음 노드에서 "hourly_depth_ft.{t}"처럼
                # 시간대별 배열의 현재 값을 꺼낼 때 씀. carry_fields 값도 같이 첨부.
                item = dict(item, _t=self.result_idx, **self.cached_carry)
            self.last_item_json = json.dumps(item, ensure_ascii=True)  # 엔진 중계 시 인코딩 깨짐 방지
            self.has_new_result = True
            print(f"[api_call_timeseries:poll] t={sim_time} idx={self.result_idx} "
                  f"{self.response_value_field}={value}")
            self.result_idx += 1
        return True

    def OutputFn(self, sim_time, dt):
        if self.has_new_result:
            self.set_outport_value('response', self.last_value)
            self.set_outport_value('response_json', self.last_item_json)
            self.has_new_result = False
        return True

    def TimeAdvanceFn(self, sim_time):
        if self.poll_interval > 0:
            return self.poll_interval
        return self.Infinity


if __name__ == "__main__":
    import sys
    # 단독 테스트: python api_call_timeseries.py <POST할 URL> '<입력 JSON>'
    if len(sys.argv) < 3:
        print("사용법: python api_call_timeseries.py <timeseries_url> '<입력 JSON>'")
        sys.exit(1)

    m = api_call_timeseries()
    m.set_param('timeseries_url', sys.argv[1])
    m.set_param('fallback_input_json', sys.argv[2])
    m.IntTransFn(0.0, 0.0)
    m.OutputFn(0.0, 0.0)
    print("1차:", m.OUT_PORT['response'].value)
    m.IntTransFn(1.0, 0.0)
    m.OutputFn(1.0, 0.0)
    print("2차:", m.OUT_PORT['response'].value)
