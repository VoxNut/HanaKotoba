from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    KanjiViewSet, VocabularyViewSet, KanjiMnemonicViewSet,
    UserVocabularyViewSet, UserKanjiViewSet
)

router = DefaultRouter()
router.register('kanji', KanjiViewSet, basename='kanji')
router.register('words', VocabularyViewSet, basename='vocabulary')
router.register('mnemonics', KanjiMnemonicViewSet, basename='mnemonic')
router.register('my-vocabulary', UserVocabularyViewSet,
                basename='user-vocabulary')
router.register('my-kanji', UserKanjiViewSet, basename='user-kanji')

urlpatterns = [
    path('', include(router.urls)),
]
