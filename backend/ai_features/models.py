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
