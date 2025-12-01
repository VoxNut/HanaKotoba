from rest_framework import serializers
from .models import Card, ReviewSession, DailyRecommendation
from vocabulary.models import Kanji, Vocabulary
from vocabulary.serializers import KanjiSerializer, VocabularySerializer
from grammar.models import GrammarPoint
from grammar.serializers import GrammarPointSerializer


class CardSerializer(serializers.ModelSerializer):
    accuracy = serializers.SerializerMethodField()
    kanji = serializers.SerializerMethodField()
    vocabulary = serializers.SerializerMethodField()
    grammar = serializers.SerializerMethodField()

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

    def get_kanji(self, obj):
        if obj.content_type == 'kanji' and obj.object_id:
            try:
                kanji = Kanji.objects.get(id=obj.object_id)
                return KanjiSerializer(kanji).data
            except Kanji.DoesNotExist:
                return None
        return None

    def get_vocabulary(self, obj):
        if obj.content_type == 'vocabulary' and obj.object_id:
            try:
                vocab = Vocabulary.objects.get(id=obj.object_id)
                return VocabularySerializer(vocab).data
            except Vocabulary.DoesNotExist:
                return None
        return None

    def get_grammar(self, obj):
        if obj.content_type == 'grammar' and obj.object_id:
            try:
                grammar = GrammarPoint.objects.get(id=obj.object_id)
                return GrammarPointSerializer(grammar).data
            except GrammarPoint.DoesNotExist:
                return None
        return None


class CustomCardCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating custom cards"""
    class Meta:
        model = Card
        fields = ['front', 'back', 'hint', 'tags']

    def validate(self, data):
        if not data.get('front') or not data.get('back'):
            raise serializers.ValidationError(
                "Both front and back are required for custom cards")
        return data


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
