from rest_framework import serializers
from .models import KanjiRecognitionHistory, FlashcardSet, KanaLeaderboardScore


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


class TranslationRequestSerializer(serializers.Serializer):
    """Serializer for translation request"""
    text = serializers.CharField(max_length=5000)
    source_lang = serializers.ChoiceField(
        choices=['japanese', 'english'],
        required=True
    )
    target_lang = serializers.ChoiceField(
        choices=['japanese', 'english'],
        required=True
    )


class TranslationResponseSerializer(serializers.Serializer):
    """Serializer for translation response"""
    translated_text = serializers.CharField()
    alternatives = serializers.ListField(child=serializers.CharField())
    source_language = serializers.CharField()
    target_language = serializers.CharField()


class KanaLeaderboardScoreSerializer(serializers.ModelSerializer):
    """Serializer for leaderboard scores"""
    username = serializers.CharField(source='user.username', read_only=True)
    time_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = KanaLeaderboardScore
        fields = [
            'id', 'display_name', 'username', 'kana_type', 'variant_key',
            'time_seconds', 'time_formatted', 'accuracy', 'score',
            'correct_answers', 'wrong_answers', 'best_streak',
            'session_length', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']
    
    def get_time_formatted(self, obj):
        mins = obj.time_seconds // 60
        secs = obj.time_seconds % 60
        return f"{mins:02d}:{secs:02d}"


class KanaScoreSubmitSerializer(serializers.Serializer):
    """Serializer for submitting a new score"""
    display_name = serializers.CharField(max_length=5, min_length=1)
    kana_type = serializers.ChoiceField(choices=['hiragana', 'katakana', 'both'])
    variant_key = serializers.CharField(max_length=50)  # e.g., "monographs", "monographs+diacritics"
    time_seconds = serializers.IntegerField(min_value=1)
    accuracy = serializers.IntegerField(min_value=0, max_value=100)
    correct_answers = serializers.IntegerField(min_value=0)
    wrong_answers = serializers.IntegerField(min_value=0)
    best_streak = serializers.IntegerField(min_value=0)
    session_length = serializers.IntegerField(min_value=1)
    
    def validate_variant_key(self, value):
        """Validate that variant_key contains valid variants"""
        valid_variants = {'monographs', 'diacritics', 'digraphs'}
        parts = value.split('+')
        for part in parts:
            if part not in valid_variants:
                raise serializers.ValidationError(f"Invalid variant: {part}")
        return value


# ==================== Manga OCR Serializers ====================

class MangaTextBoxSerializer(serializers.Serializer):
    """Serializer for a single text box in a manga page"""
    id = serializers.CharField()
    text = serializers.CharField()
    x = serializers.FloatField()  # Percentage from left
    y = serializers.FloatField()  # Percentage from top
    width = serializers.FloatField()
    height = serializers.FloatField()
    confidence = serializers.FloatField()
    vertical = serializers.BooleanField()


class MangaProcessRequestSerializer(serializers.Serializer):
    """Serializer for manga image processing request"""
    image = serializers.CharField(help_text="Base64 encoded image data")
    filename = serializers.CharField(max_length=255, required=False, default="manga.jpg")


class EnrichedTextBoxSerializer(serializers.Serializer):
    """Serializer for text box with additional linguistic data"""
    id = serializers.CharField()
    text = serializers.CharField()
    x = serializers.FloatField()
    y = serializers.FloatField()
    width = serializers.FloatField()
    height = serializers.FloatField()
    confidence = serializers.FloatField()
    vertical = serializers.BooleanField()
    lines = serializers.ListField(child=serializers.CharField(), required=False)
    font_size = serializers.FloatField(required=False)
    # Enhanced data
    tokens = serializers.ListField(child=serializers.DictField(), required=False)
    pitch_accent = serializers.ListField(child=serializers.DictField(), required=False)
    translation = serializers.CharField(required=False, allow_blank=True)


class MangaPageResponseSerializer(serializers.Serializer):
    """Serializer for processed manga page response"""
    page_id = serializers.CharField()
    text_boxes = EnrichedTextBoxSerializer(many=True)
    raw_text = serializers.CharField()
    img_width = serializers.IntegerField(required=False)
    img_height = serializers.IntegerField(required=False)
