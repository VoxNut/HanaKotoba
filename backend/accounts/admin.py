from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email',
                    'japanese_level', 'current_streak', 'created_at']
    list_filter = ['japanese_level', 'created_at']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Japanese Learning', {
            'fields': ('japanese_level', 'daily_goal')
        }),
        ('Statistics', {
            'fields': ('total_studied_days', 'current_streak', 'longest_streak', 'last_study_date')
        }),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'native_language', 'enable_notifications']
    list_filter = ['native_language', 'enable_notifications']
