from django.apps import AppConfig


class ProgramsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'programs'
    verbose_name = '2. 프로그램'
    verbose_name_plural = verbose_name


__all__ = [
    'ProgramsConfig'
]
