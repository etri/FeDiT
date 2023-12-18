from django.apps import AppConfig


class SimDataConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'sim_data'
    verbose_name = '1. 변환 데이터'
    verbose_name_plural = verbose_name
