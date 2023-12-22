from django.urls import include, path
from rest_framework import routers
from dt.views import (
    metaView, user1View, exampleView, processorView, learningView, preProcessView, augmentModelView, augmentView, 
    unitView, vrfcView, codeView, userView, menuView, authView
)

router = routers.DefaultRouter()
router.register(r'meta', metaView.metaViewSet, basename='meta')
router.register(r'example', exampleView.exampleViewSet, basename='example')
router.register(r'processor', processorView.processorViewSet, basename='processor')
router.register(r'learning', learningView.learningViewSet, basename='learning')
router.register(r'preprocess', preProcessView.preProcessViewSet, basename='preprocess')
router.register(r'augmentModel', augmentModelView.augmentModelViewSet, basename='augmentModel')
router.register(r'augment', augmentView.augmentViewSet, basename='augment')
router.register(r'unit', unitView.unitViewSet, basename='unit')
router.register(r'vrfc', vrfcView.vrfcViewSet, basename='vrfc')
router.register(r'code', codeView.codeViewSet, basename='code')
router.register(r'user', userView.userViewSet, basename='user')
router.register(r'menu', menuView.menuViewSet, basename='menu')
router.register(r'auth', authView.authViewSet, basename='auth')
#router.register(r'sample/(?P<sample_seq>[0-9a-f\-]{32,})$', sampleView.sampleViewSet, basename='sample')

urlpatterns = [
   path('', include(router.urls)),      
   #path('user/', user1View.UserView.as_view(), name='user'),
]