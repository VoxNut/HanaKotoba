from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class GrammarPoint(models.Model):
    """Japanese grammar points"""
    title = models.CharField(max_length=200)
    grammar_pattern = models.CharField(max_length=200)
    meaning = models.TextField()
    formation = models.TextField()
    usage_notes = models.TextField(blank=True)
    jlpt_level = models.CharField(
        max_length=2,
        choices=[('N5', 'N5'), ('N4', 'N4'), ('N3', 'N3'),
                 ('N2', 'N2'), ('N1', 'N1')],
        null=True, blank=True
    )
    examples = models.JSONField(default=list, blank=True)
    related_grammar = models.ManyToManyField(
        'self', blank=True, symmetrical=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.grammar_pattern})"

    class Meta:
        db_table = 'grammar_points'


class UserGrammar(models.Model):
    """Track user's grammar learning progress"""
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='learned_grammar')
    grammar = models.ForeignKey(
        GrammarPoint, on_delete=models.CASCADE, related_name='learners')

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
    notes = models.TextField(blank=True)
    last_studied = models.DateTimeField(null=True, blank=True)
    added_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.grammar.title}"

    class Meta:
        db_table = 'user_grammar'
        unique_together = ['user', 'grammar']
