from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class Card(models.Model):
    """SRS Card for any learning item"""
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='srs_cards')

    # Content can be vocabulary, kanji, or grammar
    content_type = models.CharField(
        max_length=20,
        choices=[
            ('vocabulary', 'Vocabulary'),
            ('kanji', 'Kanji'),
            ('grammar', 'Grammar'),
        ]
    )
    object_id = models.IntegerField()  # ID of the vocabulary/kanji/grammar item

    # SRS algorithm parameters (based on SuperMemo SM-2)
    ease_factor = models.FloatField(default=2.5)  # Easiness factor
    interval = models.IntegerField(default=1)  # Days until next review
    repetitions = models.IntegerField(
        default=0)  # Number of successful reviews

    # Review tracking
    last_reviewed = models.DateTimeField(null=True, blank=True)
    next_review = models.DateTimeField(default=timezone.now)

    # Statistics
    total_reviews = models.IntegerField(default=0)
    correct_reviews = models.IntegerField(default=0)

    # State
    state = models.CharField(
        max_length=20,
        choices=[
            ('new', 'New'),
            ('learning', 'Learning'),
            ('reviewing', 'Reviewing'),
            ('mastered', 'Mastered'),
        ],
        default='new'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.content_type} #{self.object_id}"

    def calculate_next_interval(self, quality):
        """
        Calculate next review interval based on SuperMemo SM-2 algorithm
        quality: 0-5 (0: total blackout, 5: perfect response)
        """
        if quality < 3:
            # Incorrect response - restart
            self.repetitions = 0
            self.interval = 1
            self.state = 'learning'
        else:
            # Correct response
            if self.repetitions == 0:
                self.interval = 1
            elif self.repetitions == 1:
                self.interval = 6
            else:
                self.interval = int(self.interval * self.ease_factor)

            self.repetitions += 1

            # Update ease factor
            self.ease_factor = max(
                1.3, self.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))

            # Update state based on repetitions
            if self.repetitions >= 8:
                self.state = 'mastered'
            elif self.repetitions >= 3:
                self.state = 'reviewing'
            else:
                self.state = 'learning'

        self.last_reviewed = timezone.now()
        self.next_review = timezone.now() + timedelta(days=self.interval)
        self.save()

    class Meta:
        db_table = 'srs_cards'
        unique_together = ['user', 'content_type', 'object_id']
        ordering = ['next_review']


class ReviewSession(models.Model):
    """Track review sessions"""
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='review_sessions')
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    cards_reviewed = models.IntegerField(default=0)
    cards_correct = models.IntegerField(default=0)
    cards_incorrect = models.IntegerField(default=0)

    total_time_seconds = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user.username} - {self.started_at.date()}"

    @property
    def accuracy(self):
        if self.cards_reviewed == 0:
            return 0
        return (self.cards_correct / self.cards_reviewed) * 100

    class Meta:
        db_table = 'review_sessions'
        ordering = ['-started_at']


class DailyRecommendation(models.Model):
    """Daily recommended items for users"""
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='daily_recommendations')
    date = models.DateField(default=timezone.now)

    recommended_items = models.JSONField(
        default=list)  # List of {type, id, reason}
    completed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.date}"

    class Meta:
        db_table = 'daily_recommendations'
        unique_together = ['user', 'date']
        ordering = ['-date']
