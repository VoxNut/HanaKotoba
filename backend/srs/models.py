from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class Card(models.Model):
    """SRS flashcard for vocabulary, kanji, grammar, or custom content"""
    CONTENT_CHOICES = [
        ('vocabulary', 'Vocabulary'),
        ('kanji', 'Kanji'),
        ('grammar', 'Grammar'),
        ('custom', 'Custom'),
    ]

    STATE_CHOICES = [
        ('new', 'New'),
        ('learning', 'Learning'),
        ('reviewing', 'Reviewing'),
        ('mastered', 'Mastered'),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='srs_cards')
    content_type = models.CharField(max_length=20, choices=CONTENT_CHOICES)
    object_id = models.IntegerField(null=True, blank=True)  # For kanji, vocabulary, grammar
    
    # Custom card fields
    front = models.TextField(blank=True)  # Question/prompt
    back = models.TextField(blank=True)   # Answer
    hint = models.TextField(blank=True)   # Optional hint
    tags = models.JSONField(default=list, blank=True)  # For organizing custom cards
    
    # SRS algorithm fields (SuperMemo SM-2)
    ease_factor = models.FloatField(default=2.5)
    interval = models.IntegerField(default=1)  # Days until next review
    repetitions = models.IntegerField(default=0)
    
    # Review tracking
    last_reviewed = models.DateTimeField(null=True, blank=True)
    next_review = models.DateTimeField(default=timezone.now)
    total_reviews = models.IntegerField(default=0)
    correct_reviews = models.IntegerField(default=0)
    
    # Card state
    state = models.CharField(
        max_length=20, choices=STATE_CHOICES, default='new')
    is_suspended = models.BooleanField(default=False)  # Suspend card
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'srs_cards'
        ordering = ['next_review']
        unique_together = ['user', 'content_type', 'object_id']

    def __str__(self):
        if self.content_type == 'custom':
            return f"{self.user.username} - Custom: {self.front[:30]}"
        return f"{self.user.username} - {self.content_type}:{self.object_id}"

    def calculate_next_interval(self, quality):
        """
        Calculate next review interval using SuperMemo SM-2 algorithm
        quality: 0-5 (0=complete blackout, 5=perfect response)
        """
        if quality < 3:
            # Failed review - reset to learning
            self.repetitions = 0
            self.interval = 1
            self.state = 'learning'
        else:
            # Successful review
            if self.repetitions == 0:
                self.interval = 1
                self.state = 'learning'
            elif self.repetitions == 1:
                self.interval = 6
                self.state = 'reviewing'
            else:
                self.interval = round(self.interval * self.ease_factor)
                if self.interval >= 21:
                    self.state = 'mastered'
                else:
                    self.state = 'reviewing'

            self.repetitions += 1

            # Update ease factor
            self.ease_factor = max(1.3, self.ease_factor +
                                   (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))

        # Set next review date
        self.last_reviewed = timezone.now()
        self.next_review = timezone.now() + timedelta(days=self.interval)
        self.save()

    @property
    def accuracy(self):
        """Calculate accuracy percentage"""
        if self.total_reviews == 0:
            return 0
        return (self.correct_reviews / self.total_reviews) * 100


class ReviewSession(models.Model):
    """Track individual review sessions"""
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='review_sessions')
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    cards_reviewed = models.IntegerField(default=0)
    cards_correct = models.IntegerField(default=0)
    cards_incorrect = models.IntegerField(default=0)
    total_time_seconds = models.IntegerField(default=0)

    class Meta:
        db_table = 'review_sessions'
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.user.username} - {self.started_at.strftime('%Y-%m-%d %H:%M')}"

    @property
    def accuracy(self):
        """Calculate session accuracy"""
        if self.cards_reviewed == 0:
            return 0
        return (self.cards_correct / self.cards_reviewed) * 100


class DailyRecommendation(models.Model):
    """Daily recommended study items"""
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='daily_recommendations')
    date = models.DateField(default=timezone.now)
    recommended_items = models.JSONField(default=list)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'daily_recommendations'
        ordering = ['-date']
        unique_together = ['user', 'date']

    def __str__(self):
        return f"{self.user.username} - {self.date}"
