from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Kanji(models.Model):
    """Kanji character model"""
    character = models.CharField(max_length=1, unique=True)
    meaning = models.TextField()
    kun_reading = models.CharField(max_length=200, blank=True)
    on_reading = models.CharField(max_length=200, blank=True)
    jlpt_level = models.CharField(
        max_length=2,
        choices=[('N5', 'N5'), ('N4', 'N4'), ('N3', 'N3'),
                 ('N2', 'N2'), ('N1', 'N1')],
        null=True, blank=True
    )
    stroke_count = models.IntegerField(default=0)
    radical = models.CharField(max_length=10, blank=True)
    frequency_rank = models.IntegerField(null=True, blank=True)
    examples = models.JSONField(
        default=list, blank=True)  # List of example words
    # Store raw SVG XML content for embedding
    svg_data = models.TextField(blank=True, help_text="Raw SVG content (SVG XML) for this Kanji")
    # Optional FileField left for forward compatibility; we will not write files to MEDIA_ROOT by default
    svg_file = models.FileField(upload_to='kanji_svgs/', null=True, blank=True, help_text="Optional uploaded SVG file for this Kanji")
    # Composition stores a decomposition of the kanji into components.
    # Expected format: list of component identifiers or objects, e.g.
    # ['木', '本'] or [{"component":"木","type":"radical"}, ...]
    composition = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.character} - {self.meaning[:30]}"

    class Meta:
        db_table = 'kanji'
        ordering = ['frequency_rank']


class Vocabulary(models.Model):
    """Vocabulary word model"""
    word = models.CharField(max_length=100)
    reading = models.CharField(max_length=100)
    meaning = models.TextField()
    part_of_speech = models.CharField(max_length=50, blank=True)
    jlpt_level = models.CharField(
        max_length=2,
        choices=[('N5', 'N5'), ('N4', 'N4'), ('N3', 'N3'),
                 ('N2', 'N2'), ('N1', 'N1')],
        null=True, blank=True
    )
    frequency_rank = models.IntegerField(null=True, blank=True)
    example_sentences = models.JSONField(default=list, blank=True)
    related_kanji = models.ManyToManyField(
        Kanji, related_name='vocabulary', blank=True)
    pitch_accent = models.CharField(max_length=50, blank=True)
    audio_url = models.URLField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.word} ({self.reading}) - {self.meaning[:30]}"

    class Meta:
        db_table = 'vocabulary'
        ordering = ['frequency_rank']


class KanjiMnemonic(models.Model):
    """User-generated or AI-generated mnemonics for kanji"""
    kanji = models.ForeignKey(
        Kanji, on_delete=models.CASCADE, related_name='mnemonics')
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='kanji_mnemonics')
    story = models.TextField()
    is_ai_generated = models.BooleanField(default=False)
    upvotes = models.IntegerField(default=0)
    is_public = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Mnemonic for {self.kanji.character} by {self.user.username}"

    class Meta:
        db_table = 'kanji_mnemonics'
        unique_together = ['kanji', 'user']


class UserVocabulary(models.Model):
    """Track user's vocabulary learning progress"""
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='learned_vocabulary')
    vocabulary = models.ForeignKey(
        Vocabulary, on_delete=models.CASCADE, related_name='learners')

    proficiency_level = models.CharField(
        max_length=20,
        choices=[
            ('learning', 'Learning'),
            ('reviewing', 'Reviewing'),
            ('mastered', 'Mastered'),
        ],
        default='learning'
    )

    times_studied = models.IntegerField(default=0)
    times_correct = models.IntegerField(default=0)
    times_incorrect = models.IntegerField(default=0)
    last_studied = models.DateTimeField(null=True, blank=True)
    added_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.vocabulary.word}"

    @property
    def accuracy(self):
        if self.times_studied == 0:
            return 0
        return (self.times_correct / self.times_studied) * 100

    class Meta:
        db_table = 'user_vocabulary'
        unique_together = ['user', 'vocabulary']


class UserKanji(models.Model):
    """Track user's kanji learning progress"""
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='learned_kanji')
    kanji = models.ForeignKey(
        Kanji, on_delete=models.CASCADE, related_name='learners')

    proficiency_level = models.CharField(
        max_length=20,
        choices=[
            ('learning', 'Learning'),
            ('reviewing', 'Reviewing'),
            ('mastered', 'Mastered'),
        ],
        default='learning'
    )

    times_studied = models.IntegerField(default=0)
    times_correct = models.IntegerField(default=0)
    times_incorrect = models.IntegerField(default=0)
    can_recognize = models.BooleanField(default=False)
    can_write = models.BooleanField(default=False)
    last_studied = models.DateTimeField(null=True, blank=True)
    added_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.kanji.character}"

    @property
    def accuracy(self):
        if self.times_studied == 0:
            return 0
        return (self.times_correct / self.times_studied) * 100

    class Meta:
        db_table = 'user_kanji'
        unique_together = ['user', 'kanji']
