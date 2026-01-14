from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class KanjiRecognitionHistory(models.Model):
    """Track kanji recognition attempts"""
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='kanji_recognitions')
    drawing_data = models.JSONField()  # Canvas drawing data
    recognized_kanji = models.CharField(max_length=10, blank=True)
    confidence_score = models.FloatField(default=0.0)
    was_correct = models.BooleanField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.recognized_kanji or 'Unknown'}"

    class Meta:
        db_table = 'kanji_recognition_history'
        ordering = ['-created_at']


class FlashcardSet(models.Model):
    """AI-generated flashcard sets"""
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='flashcard_sets')
    title = models.CharField(max_length=200)
    source_text = models.TextField()
    cards = models.JSONField(default=list)  # List of {front, back, notes}
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} by {self.user.username}"

    class Meta:
        db_table = 'flashcard_sets'
        ordering = ['-created_at']


class KanaLeaderboardScore(models.Model):
    """Leaderboard scores for Kana Practice Game"""
    
    KANA_TYPE_CHOICES = [
        ('hiragana', 'Hiragana'),
        ('katakana', 'Katakana'),
        ('both', 'Both'),
    ]
    
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='kana_scores')
    display_name = models.CharField(max_length=5)  # 5-character display name like HYDEH
    kana_type = models.CharField(max_length=10, choices=KANA_TYPE_CHOICES)
    # Variant key: combination of selected variants like "monographs", "monographs+diacritics", etc.
    variant_key = models.CharField(max_length=50, default='monographs')
    time_seconds = models.IntegerField()  # Time in seconds
    accuracy = models.IntegerField()  # Accuracy percentage (0-100)
    score = models.IntegerField()  # Total score
    correct_answers = models.IntegerField()
    wrong_answers = models.IntegerField()
    best_streak = models.IntegerField()
    session_length = models.IntegerField()  # Number of characters in session
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.display_name} - {self.kana_type}/{self.variant_key} - {self.time_seconds}s - {self.accuracy}%"
    
    class Meta:
        db_table = 'kana_leaderboard_scores'
        ordering = ['time_seconds', '-accuracy', '-created_at']  # Fastest time, then highest accuracy
        indexes = [
            models.Index(fields=['kana_type', 'variant_key', 'time_seconds']),
            models.Index(fields=['created_at']),
        ]
