import openai
# Trigger reload
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    genai = None

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
from vocabulary.models import Kanji, KanjiMnemonic

# Initialize OpenAI (optional, for premium features)
if settings.OPENAI_API_KEY:
    openai.api_key = settings.OPENAI_API_KEY

# Initialize Google Gemini (primary AI for mnemonics)
if GEMINI_AVAILABLE and hasattr(settings, 'GEMINI_API_KEY') and settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)


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
        """Generate AI mnemonic story for a kanji using Gemini API"""
        serializer = MnemonicGenerationRequestSerializer(data=request.data)

        if serializer.is_valid():
            kanji_char = serializer.validated_data['kanji']
            meaning = serializer.validated_data.get('meaning', '')

            try:
                # Try to get kanji data from database for richer context
                kanji_data = None
                try:
                    kanji_obj = Kanji.objects.get(character=kanji_char)
                    kanji_data = {
                        'character': kanji_obj.character,
                        'meaning': kanji_obj.meaning,
                        'kun_reading': kanji_obj.kun_reading,
                        'on_reading': kanji_obj.on_reading,
                        'radical': kanji_obj.radical,
                        'stroke_count': kanji_obj.stroke_count
                    }
                except Kanji.DoesNotExist:
                    kanji_data = {
                        'character': kanji_char,
                        'meaning': meaning,
                        'kun_reading': '',
                        'on_reading': '',
                        'radical': '',
                        'stroke_count': 0
                    }

                # Check if Gemini package is installed
                if not GEMINI_AVAILABLE:
                    print(f"DEBUG: GEMINI_AVAILABLE = {GEMINI_AVAILABLE}")
                    return Response(
                        {'error': 'Gemini AI package not installed. Run: pip install google-generativeai'},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE
                    )

                # Check if Gemini API is configured
                if not hasattr(settings, 'GEMINI_API_KEY') or not settings.GEMINI_API_KEY:
                    print(f"DEBUG: hasattr(settings, 'GEMINI_API_KEY') = {hasattr(settings, 'GEMINI_API_KEY')}")
                    print(f"DEBUG: settings.GEMINI_API_KEY = {settings.GEMINI_API_KEY[:20] if hasattr(settings, 'GEMINI_API_KEY') and settings.GEMINI_API_KEY else 'EMPTY'}")
                    return Response(
                        {'error': 'Gemini API key not configured. Please add GEMINI_API_KEY to your .env file. Get free key at: https://aistudio.google.com/app/apikey'},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE
                    )

                # Generate mnemonic using Gemini
                model = genai.GenerativeModel(settings.GEMINI_MODEL)
                
                # Build context-rich prompt
                prompt = f"""Create a vivid, memorable mnemonic story to help remember the kanji "{kanji_data['character']}" which means "{kanji_data['meaning']}".

"""
                
                if kanji_data['kun_reading']:
                    prompt += f"Kun reading: {kanji_data['kun_reading']}\n"
                if kanji_data['on_reading']:
                    prompt += f"On reading: {kanji_data['on_reading']}\n"
                if kanji_data['radical']:
                    prompt += f"Radical: {kanji_data['radical']}\n"
                
                prompt += f"""
Create a mnemonic that:
1. Is visual and imaginative (paint a picture in the mind)
2. Connects the shape/components of the kanji to its meaning
3. Is fun, quirky, or humorous if possible
4. Is 2-4 sentences long (under 100 words)
5. Uses simple, memorable imagery

Just return the mnemonic story directly, no extra formatting or labels."""

                response = model.generate_content(prompt)
                mnemonic_text = response.text.strip()

                # Save mnemonic to database if user is authenticated
                if kanji_data and Kanji.objects.filter(character=kanji_char).exists():
                    kanji_obj = Kanji.objects.get(character=kanji_char)
                    KanjiMnemonic.objects.update_or_create(
                        user=request.user,
                        kanji=kanji_obj,
                        defaults={
                            'story': mnemonic_text,
                            'is_ai_generated': True
                        }
                    )

                return Response({
                    'kanji': kanji_char,
                    'mnemonic': mnemonic_text,
                    'saved': True
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
