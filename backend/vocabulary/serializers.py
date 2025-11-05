from rest_framework import serializers
from .models import Kanji, Vocabulary, KanjiMnemonic, UserVocabulary, UserKanji


class KanjiSerializer(serializers.ModelSerializer):
    class Meta:
        model = Kanji
        fields = '__all__'


class VocabularySerializer(serializers.ModelSerializer):
    related_kanji = KanjiSerializer(many=True, read_only=True)

    class Meta:
        model = Vocabulary
        fields = '__all__'


class KanjiMnemonicSerializer(serializers.ModelSerializer):
    kanji_character = serializers.CharField(
        source='kanji.character', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = KanjiMnemonic
        fields = [
            'id', 'kanji', 'kanji_character', 'user', 'username',
            'story', 'is_ai_generated', 'upvotes', 'is_public',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'is_ai_generated', 'upvotes']


class UserVocabularySerializer(serializers.ModelSerializer):
    vocabulary_details = VocabularySerializer(
        source='vocabulary', read_only=True)
    accuracy = serializers.ReadOnlyField()

    class Meta:
        model = UserVocabulary
        fields = [
            'id', 'vocabulary', 'vocabulary_details', 'proficiency_level',
            'times_studied', 'times_correct', 'times_incorrect',
            'accuracy', 'last_studied', 'added_at'
        ]
        read_only_fields = [
            'times_studied', 'times_correct', 'times_incorrect',
            'last_studied', 'added_at'
        ]


class UserKanjiSerializer(serializers.ModelSerializer):
    kanji_details = KanjiSerializer(source='kanji', read_only=True)
    accuracy = serializers.ReadOnlyField()

    class Meta:
        model = UserKanji
        fields = [
            'id', 'kanji', 'kanji_details', 'proficiency_level',
            'times_studied', 'times_correct', 'times_incorrect',
            'can_recognize', 'can_write', 'accuracy',
            'last_studied', 'added_at'
        ]
        read_only_fields = [
            'times_studied', 'times_correct', 'times_incorrect',
            'last_studied', 'added_at'
        ]
