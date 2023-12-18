from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include, re_path
from drf_yasg2 import openapi
from drf_yasg2.views import get_schema_view
from rest_framework import permissions

admin.site.site_header = 'KETI 데이터 처리 시스템'
admin.site.site_title = 'KETI 데이터 처리 시스템'
admin.site.index_title = '관리자 사이트'

schema_view = get_schema_view(
    openapi.Info(
        title='KETI 데이터 처리 시스템',
        default_version='1.0.0',
        description='KETI 데이터 처리 시스템',
        terms_of_service='https://keti.re.kr',
        contact=openapi.Contact(email='gadin.kang@gmail.com'),
        license=openapi.License(name='KETI'),
    ),
    validators=['flex', 'ssv'],
    public=True,
    permission_classes=(permissions.AllowAny,),
)

inner_urls = [
    path('admin/', admin.site.urls),
    path('auth/', include('web_auth.urls')),
    path('users/', include('users.urls')),
    path('programs/', include('programs.urls')),
]

if settings.IS_DEV_SERVER:  # 개발 서버일 때에만, Swagger 추가
    inner_urls += [
        path('swagger/', schema_view.with_ui('swagger', cache_timeout=None), name='schema-swagger-ui'),
        re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=None), name='schema-json'),
    ]

urlpatterns = [path('fanta/', include(inner_urls))] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
