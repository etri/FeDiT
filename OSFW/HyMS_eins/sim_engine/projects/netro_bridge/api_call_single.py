"""
api_call_single
-------------------
REST API 하나를 호출해서 응답(raw JSON 문자열)을 그대로 내보내는 범용 원자모델.
특정 API(산사태 등)에 종속되지 않음 — api_url/api_method만 바꾸면 어떤 REST API든 호출 가능.

용도: 다른 원자모델(예: api_call_timeseries)의 입력으로 이 노드의 출력을 연결해서
      "먼저 하나를 조회 → 그 결과로 다음 걸 조회" 체인을 구성하는 첫 단계로 쓴다.
      (물론 단독으로 print/graph에 연결해서 값만 확인하는 용도로도 쓸 수 있음)

동작:
  - poll_interval마다(또는 'trigger' 포트로 값이 오면 즉시) api_url을 호출
  - 응답 바디를 가공 없이 그대로 'response' 출력 포트(문자열)로 내보냄
  - 무엇을 어떻게 가공할지는 이 노드가 아니라, 이 출력을 받는 다음 노드가 결정한다
    (그래야 이 노드가 도메인에 상관없이 재사용 가능함)

파일 하나로 여러 인스턴스 재사용: 결합모델에서 이 파일을 노드로 여러 개 추가하고
각 노드마다 api_url 파라미터만 다르게 주면 됨 (teller_atomic의 TEL_SEED와 동일 패턴).
"""

import json
import requests
from CsModel import CsModel


class api_call_single(CsModel):

    # 예시 기본값일 뿐 — 실제 값은 결합모델 조합 시 in_param으로 노드마다 다르게 지정
    DEFAULT_API_URL = "https://genix.pohang-eum.kr/service/transp/traffic-stats"   # 포항 구룡포 교통센서 (GET)
    DEFAULT_API_METHOD = "GET"     # GET/POST
    DEFAULT_POLL_INTERVAL = 5.0    # 자동 호출 주기(초). 0 이하면 자동폴링 끔
    API_TIMEOUT_SEC = 10.0
    API_HEADERS = {
        "Content-Type": "application/json",
        # "Authorization": "Bearer <TOKEN>",   # TODO: 인증 필요하면 채우기
    }

    def __init__(self):
        self.MODEL_NAME = "api_call_single"

        self.add_inport('trigger', 0)          # 값이 오면 즉시 재호출 (선택)
        self.add_outport('response', "")       # 응답 원문(JSON 문자열) 그대로

        self.add_param('api_url', self.DEFAULT_API_URL)
        self.add_param('api_method', self.DEFAULT_API_METHOD)
        self.add_param('poll_interval', self.DEFAULT_POLL_INTERVAL)

        self.api_url = self.DEFAULT_API_URL
        self.api_method = self.DEFAULT_API_METHOD
        self.poll_interval = self.DEFAULT_POLL_INTERVAL

        self.VERSION = 1.0
        self.reset()

    def reset(self):
        self.last_value = ""
        self.has_new_result = False

    def set_param(self, port_name, port_value):
        if port_name == 'api_url':
            self.api_url = port_value
        elif port_name == 'api_method':
            self.api_method = port_value
        elif port_name == 'poll_interval':
            self.poll_interval = float(port_value)
        print(f"[api_call_single:{self.MODEL_NAME}] param set: {port_name}={port_value}")
        return True

    def _call(self):
        """API 호출 후 응답 바디(문자열)를 그대로 반환. 실패하면 None."""
        try:
            if self.api_method.upper() == "POST":
                resp = requests.post(self.api_url, headers=self.API_HEADERS, timeout=self.API_TIMEOUT_SEC)
            else:
                resp = requests.get(self.api_url, headers=self.API_HEADERS, timeout=self.API_TIMEOUT_SEC)
            resp.raise_for_status()
            # 한글 등 비ASCII 문자가 섞인 채로 엔진(model_cap_python.exe)을 거쳐
            # 다른 원자모델로 전달되면 중간에서 인코딩이 깨지는 문제가 있어서,
            # JSON으로 다시 파싱→ensure_ascii=True로 직렬화해 순수 ASCII로 통일한다.
            # (한글은 \uXXXX 이스케이프가 되고, 받는 쪽 json.loads()가 자동으로 복원함)
            try:
                return json.dumps(resp.json(), ensure_ascii=True)
            except ValueError:
                # 응답이 JSON이 아니면 원문 그대로 반환 (이 경우 비ASCII 있으면 여전히 위험할 수 있음)
                return resp.text
        except requests.exceptions.Timeout:
            print(f"[api_call_single] 타임아웃: {self.api_url}")
        except requests.exceptions.ConnectionError:
            print(f"[api_call_single] 연결 실패: {self.api_url}")
        except Exception as e:
            print(f"[api_call_single] 호출 실패: {e}")
        return None

    def _do_call(self, sim_time, trigger):
        result = self._call()
        if result is not None:
            self.last_value = result
            self.has_new_result = True
            preview = result[:120] + ('...' if len(result) > 120 else '')
            print(f"[api_call_single:{trigger}] t={sim_time} 응답 수신({len(result)}bytes): {preview}")
        else:
            print(f"[api_call_single:{trigger}] t={sim_time} 호출 실패")

    def ExtTransFn(self, sim_time, dt, src_model_name, port_name, port_value):
        if port_name == "trigger":
            self._do_call(sim_time, trigger="ext")
        return True

    def IntTransFn(self, sim_time, dt):
        self._do_call(sim_time, trigger="poll")
        return True

    def OutputFn(self, sim_time, dt):
        if self.has_new_result:
            self.set_outport_value('response', self.last_value)
            self.has_new_result = False
        return True

    def TimeAdvanceFn(self, sim_time):
        if self.poll_interval > 0:
            return self.poll_interval
        return self.Infinity


if __name__ == "__main__":
    m = api_call_single()
    m.IntTransFn(0.0, 0.0)
    m.OutputFn(0.0, 0.0)
    print("response:", m.OUT_PORT['response'].value[:200])
