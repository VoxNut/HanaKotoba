from rest_framework import serializers
from .models import GrammarPoint, UserGrammar


class GrammarPointSerializer(serializers.ModelSerializer):
    class Meta:
        model = GrammarPoint
        fields = '__all__'


class UserGrammarSerializer(serializers.ModelSerializer):
    grammar_details = GrammarPointSerializer(source='grammar', read_only=True)

    class Meta:
        model = UserGrammar
        fields = '__all__'
        read_only_fields = ['user', 'times_studied',
                            'times_correct', 'times_incorrect', 'last_studied']
