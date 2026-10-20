import os

from modules.visualization.media.public import WORKSPACE_KEY, RenderWorkspace


def limit_heap():
    """파일 매핑을 유지하면서 작업 프로세스의 익명 메모리 제한"""
    import resource

    try:
        megabytes = int(os.environ.get("FLOWCAST_RENDER_HEAP_MB", "2048"))
    except ValueError:
        raise ValueError("FLOWCAST_RENDER_HEAP_MB must be an integer.") from None
    if not 512 <= megabytes <= 65536:
        raise ValueError("FLOWCAST_RENDER_HEAP_MB must be between 512 and 65536.")
    maximum = megabytes * 1024 * 1024
    _, inherited = resource.getrlimit(resource.RLIMIT_DATA)
    if inherited != resource.RLIM_INFINITY:
        maximum = min(maximum, inherited)
    resource.setrlimit(resource.RLIMIT_DATA, (maximum, maximum))
    return maximum // (1024 * 1024)


def dispatch(path, request):
    """계산 프로세스에서 렌더링과 자료 처리 수행"""
    if not isinstance(request, dict):
        raise ValueError("Visualization request must be a JSON object.")
    if path != "/process":
        raise ValueError("Visualization worker path is unsupported.")
    operation, params = request.get("operation"), request.get("params", {})
    if not isinstance(operation, str) or not isinstance(params, dict):
        raise ValueError("Operation and object parameters are required.")
    if operation == "prepare_public_prediction":
        from modules.visualization.inputs.public import prepare_public_prediction

        return prepare_public_prediction(params)
    if operation == "render_public_prediction":
        from modules.visualization.rendering.prediction import render_public_prediction

        workspace = request.get(WORKSPACE_KEY)
        if workspace is not None and not isinstance(workspace, RenderWorkspace):
            raise ValueError("Animation workspace must be supplied by the render worker.")
        return render_public_prediction(params, workspace=workspace)
    from modules.visualization.scenes.processing import process

    return process(operation, params)
