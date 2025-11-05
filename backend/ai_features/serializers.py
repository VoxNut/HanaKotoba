from rest_framework import serializers
from .models import KanjiRecognitionHistory, FlashcardSet


class KanjiRecognitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = KanjiRecognitionHistory
        fields = '__all__'
        read_only_fields = ['user', 'recognized_kanji',
                            'confidence_score', 'was_correct']


class FlashcardSetSerializer(serializers.ModelSerializer):
    card_count = serializers.SerializerMethodField()

    class Meta:
        model = FlashcardSet
        fields = '__all__'
        read_only_fields = ['user', 'cards']

    def get_card_count(self, obj):
        return len(obj.cards)


class KanjiRecognitionRequestSerializer(serializers.Serializer):
    """Serializer for kanji recognition request"""
    drawing_data = serializers.JSONField()


class MnemonicGenerationRequestSerializer(serializers.Serializer):
    """Serializer for mnemonic generation request"""
    kanji = serializers.CharField(max_length=1)
    meaning = serializers.CharField(max_length=500, required=False)


class PitchAccentRequestSerializer(serializers.Serializer):
    """Serializer for pitch accent generation request"""
    text = serializers.CharField(max_length=1000)


class FlashcardGenerationRequestSerializer(serializers.Serializer):
    """Serializer for flashcard generation request"""
    source_text = serializers.CharField(max_length=5000)
    title = serializers.CharField(max_length=200, required=False)
    card_count = serializers.IntegerField(
        min_value=1, max_value=50, default=10)
