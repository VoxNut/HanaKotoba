import openai
from django.conf import settings
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import KanjiRecognitionHistory, FlashcardSet
from .serializers import (
    KanjiRecognitionSerializer, FlashcardSetSerializer,
    KanjiRecognitionRequestSerializer, MnemonicGenerationRequestSerializer,
    PitchAccentRequestSerializer, FlashcardGenerationRequestSerializer
)

# Initialize OpenAI
openai.api_key = settings.OPENAI_API_KEY


class AIFeatureViewSet(viewsets.GenericViewSet):
    """ViewSet for AI-powered features"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = KanjiRecognitionRequestSerializer  # Default serializer for schema generation

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if getattr(self, 'swagger_fake_view', False):
            # Return a default serializer for schema generation
            return KanjiRecognitionRequestSerializer
        
        action_serializers = {
            'recognize_kanji': KanjiRecognitionRequestSerializer,
            'generate_mnemonic': MnemonicGenerationRequestSerializer,
            'generate_pitch_accent': PitchAccentRequestSerializer,
            'generate_flashcards': FlashcardGenerationRequestSerializer,
        }
        return action_serializers.get(self.action, KanjiRecognitionRequestSerializer)

    @action(detail=False, methods=['post'])
    def recognize_kanji(self, request):
        """Recognize kanji from handwriting drawing"""
        serializer = KanjiRecognitionRequestSerializer(data=request.data)

        if serializer.is_valid():
            drawing_data = serializer.validated_data['drawing_data']

            # TODO: Implement TensorFlow.js kanji recognition
            # For now, return a placeholder response
            # You'll need to integrate a kanji recognition model here

            recognition = KanjiRecognitionHistory.objects.create(
                user=request.user,
                drawing_data=drawing_data,
                recognized_kanji='日',  # Placeholder
                confidence_score=0.85  # Placeholder
            )

            return Response({
                'recognized_kanji': recognition.recognized_kanji,
                'confidence': recognition.confidence_score,
                'alternatives': [
                    {'kanji': '目', 'confidence': 0.12},
                    {'kanji': '月', 'confidence': 0.03},
                ]
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def generate_mnemonic(self, request):
        """Generate AI mnemonic story for a kanji"""
        serializer = MnemonicGenerationRequestSerializer(data=request.data)

        if serializer.is_valid():
            kanji = serializer.validated_data['kanji']
            meaning = serializer.validated_data.get('meaning', '')

            try:
                prompt = f"""Create a memorable and creative mnemonic story to help remember the Japanese kanji '{kanji}'.
The kanji means: {meaning if meaning else 'various meanings'}.

The story should:
1. Be vivid and easy to visualize
2. Connect the visual components of the kanji to the meaning
3. Be short (2-3 sentences)
4. Be memorable and fun

Mnemonic story:"""

                response = openai.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": "You are a helpful Japanese language learning assistant that creates memorable mnemonics."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=settings.OPENAI_MAX_TOKENS,
                    temperature=0.7
                )

                mnemonic = response.choices[0].message.content.strip()

                return Response({
                    'kanji': kanji,
                    'mnemonic': mnemonic
                })

            except Exception as e:
                return Response(
                    {'error': f'Failed to generate mnemonic: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def generate_pitch_accent(self, request):
        """Generate pitch accent for Japanese text"""
        serializer = PitchAccentRequestSerializer(data=request.data)

        if serializer.is_valid():
            text = serializer.validated_data['text']

            try:
                prompt = f"""For the following Japanese text, provide the pitch accent notation.
Use numbers to indicate pitch (0=low, 1=high) for each mora.

Japanese text: {text}

Provide the pitch accent pattern in this format:
Word: pitch pattern (e.g., こんにちは: 0-1-1-1-0)

Pitch accent:"""

                response = openai.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": "You are a Japanese phonetics expert. Provide accurate pitch accent patterns."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=settings.OPENAI_MAX_TOKENS,
                    temperature=0.3
                )

                pitch_accent = response.choices[0].message.content.strip()

                return Response({
                    'text': text,
                    'pitch_accent': pitch_accent
                })

            except Exception as e:
                return Response(
                    {'error': f'Failed to generate pitch accent: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def generate_flashcards(self, request):
        """Generate flashcards from input text"""
        serializer = FlashcardGenerationRequestSerializer(data=request.data)

        if serializer.is_valid():
            source_text = serializer.validated_data['source_text']
            title = serializer.validated_data.get(
                'title', 'Generated Flashcards')
            card_count = serializer.validated_data.get('card_count', 10)

            try:
                prompt = f"""Create {card_count} Japanese learning flashcards from the following text.
Each card should have:
- Front: A Japanese word or phrase from the text
- Back: English meaning and example sentence
- Notes: Grammar points or usage tips if relevant

Source text:
{source_text}

Format each card as JSON:
{{"front": "Japanese", "back": "English meaning", "notes": "Additional info"}}

Flashcards:"""

                response = openai.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": "You are a Japanese language teacher creating effective flashcards."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=settings.OPENAI_MAX_TOKENS * 2,
                    temperature=0.5
                )

                # Parse the response to extract flashcards
                cards_text = response.choices[0].message.content.strip()

                # Simple parsing - you may want to make this more robust
                import json
                import re

                # Try to extract JSON objects from the response
                json_pattern = r'\{[^}]+\}'
                matches = re.findall(json_pattern, cards_text)

                cards = []
                for match in matches[:card_count]:
                    try:
                        card = json.loads(match)
                        cards.append(card)
                    except:
                        continue

                # If parsing failed, create a simple format
                if not cards:
                    cards = [{
                        'front': 'Sample Card',
                        'back': 'Could not parse AI response',
                        'notes': cards_text[:200]
                    }]

                flashcard_set = FlashcardSet.objects.create(
                    user=request.user,
                    title=title,
                    source_text=source_text,
                    cards=cards
                )

                return Response(FlashcardSetSerializer(flashcard_set).data)

            except Exception as e:
                return Response(
                    {'error': f'Failed to generate flashcards: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FlashcardSetViewSet(viewsets.ModelViewSet):
    """ViewSet for managing flashcard sets"""
    serializer_class = FlashcardSetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return FlashcardSet.objects.filter(
                is_public=True
            ) | FlashcardSet.objects.filter(user=self.request.user)
        return FlashcardSet.objects.filter(is_public=True)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class KanjiRecognitionHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing kanji recognition history"""
    serializer_class = KanjiRecognitionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return KanjiRecognitionHistory.objects.filter(user=self.request.user)
