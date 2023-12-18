from rest_framework.routers import SimpleRouter

from .viewsets import *

router = SimpleRouter()

router.register('', ProgramVS, basename='Program')

urlpatterns = router.urls

__all__ = [
    'urlpatterns'
]
