from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AIFeatureViewSet, FlashcardSetViewSet, KanjiRecognitionHistoryViewSet, KanaLeaderboardViewSet, MangaOCRViewSet

router = DefaultRouter()
router.register('features', AIFeatureViewSet, basename='ai-feature')
router.register('flashcard-sets', FlashcardSetViewSet,
                basename='flashcard-set')
router.register('recognition-history',
                KanjiRecognitionHistoryViewSet, basename='recognition-history')
router.register('leaderboard', KanaLeaderboardViewSet, basename='leaderboard')
router.register('manga', MangaOCRViewSet, basename='manga-ocr')

urlpatterns = [
    path('', include(router.urls)),
]
