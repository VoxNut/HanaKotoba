from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model for Japanese learners"""
    email = models.EmailField(unique=True)
    japanese_level = models.CharField(
        max_length=10,
        choices=[
            ('N5', 'Beginner (N5)'),
            ('N4', 'Elementary (N4)'),
            ('N3', 'Intermediate (N3)'),
            ('N2', 'Advanced (N2)'),
            ('N1', 'Expert (N1)'),
        ],
        default='N5'
    )
    daily_goal = models.IntegerField(
        default=20, help_text="Number of items to review daily")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Learning statistics
    total_studied_days = models.IntegerField(default=0)
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_study_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.username

    class Meta:
        db_table = 'users'


class UserProfile(models.Model):
    """Extended user profile for learning preferences"""
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True)
    native_language = models.CharField(max_length=50, default='English')
    learning_goals = models.TextField(blank=True)
    enable_notifications = models.BooleanField(default=True)
    enable_daily_reminders = models.BooleanField(default=True)
    preferred_study_time = models.TimeField(null=True, blank=True)

    # Preferences
    show_romaji = models.BooleanField(default=True)
    show_furigana = models.BooleanField(default=True)
    auto_play_audio = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username}'s profile"

    class Meta:
        db_table = 'user_profiles'
