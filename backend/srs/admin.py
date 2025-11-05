from django.contrib import admin
from .models import Card, ReviewSession, DailyRecommendation


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = ['user', 'content_type',
                    'object_id', 'state', 'next_review', 'interval']
    list_filter = ['state', 'content_type', 'next_review']
    search_fields = ['user__username']


@admin.register(ReviewSession)
class ReviewSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'started_at',
                    'cards_reviewed', 'accuracy', 'total_time_seconds']
    list_filter = ['started_at']
    search_fields = ['user__username']


@admin.register(DailyRecommendation)
class DailyRecommendationAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'completed', 'created_at']
    list_filter = ['date', 'completed']
    search_fields = ['user__username']
