from django.contrib import admin
from .models import KanjiRecognitionHistory, FlashcardSet


@admin.register(KanjiRecognitionHistory)
class KanjiRecognitionHistoryAdmin(admin.ModelAdmin):
    list_display = ['user', 'recognized_kanji',
                    'confidence_score', 'was_correct', 'created_at']
    list_filter = ['was_correct', 'created_at']
    search_fields = ['user__username', 'recognized_kanji']


@admin.register(FlashcardSet)
class FlashcardSetAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'is_public', 'created_at']
    list_filter = ['is_public', 'created_at']
    search_fields = ['title', 'user__username']
