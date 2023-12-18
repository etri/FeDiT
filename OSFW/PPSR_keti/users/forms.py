from django.forms import ModelForm

from .models import *


class UserForm(ModelForm):
    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'full_name',
            'department',
            'employ_number',
            'groups',
        ]


__all__ = [
    'UserForm',
]
