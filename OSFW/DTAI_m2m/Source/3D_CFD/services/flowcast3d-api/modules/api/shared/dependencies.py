"""공개 요청에 필요한 애플리케이션 의존성 조회"""

from modules.application.prediction import StatelessWorkflow
from modules.settings.public import PublicSettings


def request_workflow(request):
    """시작 전에도 본문 검증을 제공하고 실제 처리는 준비 상태 확인"""
    workflow = getattr(request.app.state, "prediction_workflow", None)
    if workflow is not None:
        return workflow
    return StatelessWorkflow(getattr(request.app.state, "settings", None) or PublicSettings(), None)
