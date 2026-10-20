"""공개 작업의 외부 클라이언트 조립과 연결 수명 관리"""

from modules.infrastructure.renderer.client import RendererClient
from modules.infrastructure.triton.prediction import TritonPredictionClient


class PublicServices:
    def __init__(self, settings, client=None):
        self.settings = settings
        self.owns_client = client is None
        if client is None:
            import httpx

            client = httpx.Client(timeout=settings.request_timeout, follow_redirects=False, trust_env=False)
        self.client = client
        self.model = TritonPredictionClient(settings, client)
        self.renderer = RendererClient(settings, client)

    def fork(self, cancel_event, deadline):
        """요청별 추론 취소가 다른 요청의 연결에 영향을 주지 않도록 격리"""
        services = PublicServices(self.settings)
        services.model.cancel_event = cancel_event
        services.model.cancel_deadline = deadline
        return services

    def close(self):
        self.client.close()

    def renderer_health(self):
        return self.renderer.renderer_health()

    def predict_payload(self, run_id, payload, output_file, *, input_file="input.npz"):
        return self.model.predict_payload(run_id, payload, output_file, input_file=input_file)

    def prepare_public_prediction(self, input_path, output_path, input_kind, wind=None, options=None):
        return self.renderer.prepare_public_prediction(input_path, output_path, input_kind, wind, options)

    def render_public_prediction(self, input_path, options):
        return self.renderer.render_public_prediction(input_path, options)
