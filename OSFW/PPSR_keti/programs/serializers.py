from rest_framework.serializers import *

from .models import *


class _BaseSerializer(ModelSerializer):
    class Meta:
        update_readonly_fields = []
        fields = '__all__'


class ProgramSerializer(_BaseSerializer):
    class Meta(_BaseSerializer.Meta):
        model = Program
        fields = None
        exclude = [
            'content'
        ]


__all__ = [
    'ProgramSerializer'
]
