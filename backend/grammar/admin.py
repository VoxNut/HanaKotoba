from django.contrib import admin
from .models import GrammarPoint, UserGrammar


@admin.register(GrammarPoint)
class GrammarPointAdmin(admin.ModelAdmin):
    list_display = ['title', 'grammar_pattern', 'jlpt_level', 'created_at']
    list_filter = ['jlpt_level']
    search_fields = ['title', 'grammar_pattern', 'meaning']


@admin.register(UserGrammar)
class UserGrammarAdmin(admin.ModelAdmin):
    list_display = ['user', 'grammar', 'proficiency_level',
                    'times_studied', 'last_studied']
    list_filter = ['proficiency_level']
