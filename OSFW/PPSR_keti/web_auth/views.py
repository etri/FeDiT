import re

from django import forms
from django.contrib.auth import authenticate, views
from django.contrib.auth.forms import AuthenticationForm
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from users.models import User

MIN_USERNAME_LEN = 4
USER_NAME_PATTERN = re.compile(r"^[a-zA-Z0-9_\.]+$")


@api_view(['GET'])
def get_me(req: Request) -> Response:
    if not req.user.is_authenticated:
        return Response(None)

    user: User = req.user

    return Response({
        'username': user.username,
        'fullName': user.full_name,
        'department': user.department,
        'prefs': user.prefs,
        'authGroupNames': user.groups.values_list('name', flat=True)
    })


class LoginForm(AuthenticationForm):
    error_messages = {
        'inactive': '승인 대기 중이거나, 삭제된 계정입니다. 관리자에게 문의해주세요.',
        'invalid_login': '존재하지 않는 계정이거나, 비밀번호가 일치하지 않습니다.'
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['username'].label = '사용자 ID'

    def clean(self):
        username = self.cleaned_data.get('username')
        password = self.cleaned_data.get('password')

        if username is not None and password:
            self.user_cache = authenticate(self.request, username=username, password=password)
            if self.user_cache is None:
                try:
                    user_temp = User.objects.get(username=username)
                except User.DoesNotExist:
                    user_temp = None

                if user_temp is not None and user_temp.check_password(password):
                    self.confirm_login_allowed(user_temp)
                else:
                    raise forms.ValidationError(
                        self.error_messages['invalid_login'],
                        code='invalid_login',
                        params={'username': self.username_field.verbose_name},
                    )

        return self.cleaned_data


class LoginView(views.LoginView):
    form_class = LoginForm
    template_name = 'web_auth/login.html'
    extra_context = {
        'title': '로그인',
        'site_title': 'KETI 데이터 처리 시스템',
        'site_header': 'KETI 데이터 처리 시스템',
    }


class LogoutView(views.LogoutView):
    template_name = 'web_auth/logged_out.html'
    extra_context = {
        'title': '로그 아웃',
        'site_title': 'KETI 데이터 처리 시스템',
        'site_header': 'KETI 데이터 처리 시스템',
    }


__all__ = [
    'get_me',
    'LoginView',
    'LogoutView',
]
