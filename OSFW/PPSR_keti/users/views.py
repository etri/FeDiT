from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response


@api_view(["GET"])
def status(req: Request) -> Response:
    headers = {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
    }

    if req.user.is_authenticated:
        groups = [g.name() for g in req.user.groups.all()]

        return Response({
            'name': req.user.display_text,
            'group': groups,
        }, headers=headers)

    return Response(None, headers=headers)


__all__ = [
    'status'
]
