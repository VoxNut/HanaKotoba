from django.contrib import admin
from .models import Kanji, Vocabulary, KanjiMnemonic, UserVocabulary, UserKanji


@admin.register(Kanji)
class KanjiAdmin(admin.ModelAdmin):
    list_display = ['character', 'meaning',
                    'jlpt_level', 'stroke_count', 'frequency_rank']
    list_filter = ['jlpt_level']
    search_fields = ['character', 'meaning', 'kun_reading', 'on_reading']


@admin.register(Vocabulary)
class VocabularyAdmin(admin.ModelAdmin):
    list_display = ['word', 'reading', 'meaning',
                    'jlpt_level', 'frequency_rank']
    list_filter = ['jlpt_level', 'part_of_speech']
    search_fields = ['word', 'reading', 'meaning']


@admin.register(KanjiMnemonic)
class KanjiMnemonicAdmin(admin.ModelAdmin):
    list_display = ['kanji', 'user', 'is_ai_generated',
                    'is_public', 'upvotes', 'created_at']
    list_filter = ['is_ai_generated', 'is_public', 'created_at']
    search_fields = ['story', 'kanji__character', 'user__username']


@admin.register(UserVocabulary)
class UserVocabularyAdmin(admin.ModelAdmin):
    list_display = ['user', 'vocabulary',
                    'proficiency_level', 'times_studied', 'last_studied']
    list_filter = ['proficiency_level', 'added_at']
    search_fields = ['user__username', 'vocabulary__word']


@admin.register(UserKanji)
class UserKanjiAdmin(admin.ModelAdmin):
    list_display = ['user', 'kanji', 'proficiency_level',
                    'can_recognize', 'can_write', 'last_studied']
    list_filter = ['proficiency_level', 'can_recognize', 'can_write']
    search_fields = ['user__username', 'kanji__character']
