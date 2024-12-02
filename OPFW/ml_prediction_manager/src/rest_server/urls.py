from django.urls import path
from . import views

app_name = 'rest_server'

urlpatterns = [

    path('get_images/', views.get_images, name='get_images'),

    path('start_container/', views.start_container, name='start_container'),
    path('switchContainer/', views.switchContainer, name='switchContainer'),

    path('get_containers/', views.get_containers, name='get_containers'),
    path('delete_image/', views.delete_image, name='delete_image'),
    path('delete_container/', views.delete_container, name='delete_container'),

    path('upload_image/', views.upload_image, name='upload_image'),

    path('open_jupyter_page/', views.open_jupyter_page, name='open_jupyter_page'),
    # path('open_tensorboard_page/', views.open_tensorboard_page, name='open_tensorboard_page'),    

    path('is_docker_run/', views.is_docker_run, name='is_docker_run'),

    path('change_cont_name/', views.change_cont_name, name='change_cont_name'),

    path('my_ip/', views.my_ip, name='my_ip'),


]