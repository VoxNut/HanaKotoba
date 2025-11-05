from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CardViewSet, ReviewSessionViewSet, DailyRecommendationViewSet

router = DefaultRouter()
router.register('cards', CardViewSet, basename='card')
router.register('sessions', ReviewSessionViewSet, basename='session')
router.register('recommendations', DailyRecommendationViewSet,
                basename='recommendation')

urlpatterns = [
    path('', include(router.urls)),
]
