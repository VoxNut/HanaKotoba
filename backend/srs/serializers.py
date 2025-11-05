from rest_framework import serializers
from .models import Card, ReviewSession, DailyRecommendation


class CardSerializer(serializers.ModelSerializer):
    accuracy = serializers.SerializerMethodField()

    class Meta:
        model = Card
        fields = '__all__'
        read_only_fields = [
            'user', 'ease_factor', 'interval', 'repetitions',
            'last_reviewed', 'next_review', 'total_reviews',
            'correct_reviews', 'state'
        ]

    def get_accuracy(self, obj):
        if obj.total_reviews == 0:
            return 0
        return (obj.correct_reviews / obj.total_reviews) * 100


class ReviewSessionSerializer(serializers.ModelSerializer):
    accuracy = serializers.ReadOnlyField()

    class Meta:
        model = ReviewSession
        fields = '__all__'
        read_only_fields = ['user', 'started_at']


class DailyRecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyRecommendation
        fields = '__all__'
        read_only_fields = ['user', 'date', 'recommended_items']


class CardReviewSerializer(serializers.Serializer):
    """Serializer for reviewing a card"""
    quality = serializers.IntegerField(min_value=0, max_value=5)
    time_spent_seconds = serializers.IntegerField(min_value=0)
