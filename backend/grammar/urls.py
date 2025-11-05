from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GrammarPointViewSet, UserGrammarViewSet

router = DefaultRouter()
router.register('points', GrammarPointViewSet, basename='grammar-point')
router.register('my-grammar', UserGrammarViewSet, basename='user-grammar')

urlpatterns = [
    path('', include(router.urls)),
]
