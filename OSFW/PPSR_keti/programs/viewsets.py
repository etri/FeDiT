from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet

from .models import *
from .serializers import *


class BaseViewSet(ModelViewSet):
    filterset_fields = '__all__'
    http_method_names = ['get', 'post', 'patch', 'delete']
    ordering_fields = '__all__'
    lookup_value_regex = '[^/]+'


class BaseReadOnlyViewSet(ReadOnlyModelViewSet):
    filterset_fields = '__all__'
    ordering_fields = '__all__'
    lookup_value_regex = '[^/]+'


class ProgramVS(BaseReadOnlyViewSet):
    queryset = Program.objects.filter(is_visible=True).order_by('title')
    serializer_class = ProgramSerializer


__all__ = [
    'ProgramVS',
]
