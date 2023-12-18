from django.urls import re_path

from . import views

urlpatterns = [
    re_path(r'^accounts/me/$', views.get_me),
    re_path(r'^logout/$', views.LogoutView.as_view(), name='auth_logout'),
    re_path(r'^login/$', views.LoginView.as_view(), name='auth_login'),
]
