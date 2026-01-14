import openai
import requests
import re
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
from .models import KanjiRecognitionHistory, FlashcardSet, KanaLeaderboardScore
from .serializers import (
    KanjiRecognitionSerializer, FlashcardSetSerializer,
    KanjiRecognitionRequestSerializer, MnemonicGenerationRequestSerializer,
    PitchAccentRequestSerializer, FlashcardGenerationRequestSerializer,
    TranslationRequestSerializer, KanaLeaderboardScoreSerializer,
    KanaScoreSubmitSerializer
)
from .pitch_accent_service import get_pitch_accent_service
from vocabulary.models import Kanji, KanjiMnemonic

# Initialize OpenAI (optional, for premium features)
if settings.OPENAI_API_KEY:
    openai.api_key = settings.OPENAI_API_KEY

# Initialize Google Gemini (primary AI for mnemonics)
if GEMINI_AVAILABLE and hasattr(settings, 'GEMINI_API_KEY') and settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

# Hugging Face NLLB language codes
NLLB_LANGUAGE_CODES = {
    'japanese': 'jpn_Jpan',
    'english': 'eng_Latn',
}


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
            'translate': TranslationRequestSerializer,
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

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def analyze_pitch_accent(self, request):
        """
        Analyze pitch accent for Japanese text using Fugashi (MeCab).
        
        This endpoint uses local morphological analysis with the Kanjium
        pitch accent dictionary - no external API calls required.
        """
        serializer = PitchAccentRequestSerializer(data=request.data)

        if serializer.is_valid():
            text = serializer.validated_data['text']

            try:
                service = get_pitch_accent_service()
                words = service.analyze(text)

                return Response({
                    'text': text,
                    'words': words
                })

            except Exception as e:
                return Response(
                    {'error': f'Failed to analyze pitch accent: {str(e)}'},
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

    @action(detail=False, methods=['post'])
    def translate(self, request):
        """Translate text between Japanese and English using MyMemory API (free)"""
        serializer = TranslationRequestSerializer(data=request.data)

        if serializer.is_valid():
            text = serializer.validated_data['text']
            source_lang = serializer.validated_data['source_lang']
            target_lang = serializer.validated_data['target_lang']

            if not text.strip():
                return Response({
                    'translated_text': '',
                    'alternatives': [],
                    'source_language': source_lang,
                    'target_language': target_lang,
                })

            try:
                # Use MyMemory Translation API (free, no API key required)
                # https://mymemory.translated.net/doc/spec.php
                
                # Language codes for MyMemory
                lang_codes = {
                    'japanese': 'ja',
                    'english': 'en',
                }
                
                src_code = lang_codes.get(source_lang, 'ja')
                tgt_code = lang_codes.get(target_lang, 'en')
                langpair = f"{src_code}|{tgt_code}"
                
                # MyMemory API endpoint
                api_url = "https://api.mymemory.translated.net/get"
                
                params = {
                    'q': text,
                    'langpair': langpair,
                }
                
                response = requests.get(api_url, params=params, timeout=30)
                
                # Debug: Log response for troubleshooting
                print(f"MyMemory API Response Status: {response.status_code}")
                print(f"MyMemory API Response: {response.text[:500] if response.text else 'Empty'}")
                
                if not response.ok:
                    return Response(
                        {'error': f'Translation service error: HTTP {response.status_code}'},
                        status=status.HTTP_502_BAD_GATEWAY
                    )
                
                data = response.json()
                
                if data.get('responseStatus') != 200:
                    error_msg = data.get('responseDetails', 'Translation failed')
                    return Response(
                        {'error': f'Translation error: {error_msg}'},
                        status=status.HTTP_502_BAD_GATEWAY
                    )
                
                main_translation = data.get('responseData', {}).get('translatedText', '')
                
                if not main_translation:
                    return Response(
                        {'error': 'No translation returned'},
                        status=status.HTTP_502_BAD_GATEWAY
                    )
                
                # Get alternative translations from matches if available
                alternatives = []
                matches = data.get('matches', [])
                for match in matches[:3]:
                    alt_text = match.get('translation', '')
                    if alt_text and alt_text != main_translation and alt_text not in alternatives:
                        alternatives.append(alt_text)
                
                # Also generate simple alternatives
                generated_alts = self._generate_translation_alternatives(main_translation, target_lang)
                for alt in generated_alts:
                    if alt not in alternatives:
                        alternatives.append(alt)
                
                alternatives = alternatives[:3]  # Limit to 3
                
                return Response({
                    'translated_text': main_translation,
                    'alternatives': alternatives,
                    'source_language': source_lang,
                    'target_language': target_lang,
                })

            except requests.exceptions.Timeout:
                return Response(
                    {'error': 'Translation request timed out. Please try again.'},
                    status=status.HTTP_504_GATEWAY_TIMEOUT
                )
            except requests.exceptions.RequestException as e:
                return Response(
                    {'error': f'Translation service error: {str(e)}'},
                    status=status.HTTP_502_BAD_GATEWAY
                )
            except Exception as e:
                return Response(
                    {'error': f'Translation failed: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _generate_translation_alternatives(self, text: str, target_lang: str) -> list:
        """Generate simple alternative phrasings for the translation"""
        alternatives = []
        
        if target_lang == 'english':
            # English variations
            substitutions = [
                (r'is looking at', 'gazes at'),
                (r'is looking out', 'gazes out'),
                (r'is watching', 'watches'),
                (r'^The ', 'A '),
                (r'^A ', 'The '),
            ]
            for pattern, replacement in substitutions:
                if re.search(pattern, text, re.IGNORECASE):
                    variation = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
                    if variation != text and variation not in alternatives:
                        alternatives.append(variation)
        else:
            # Japanese variations (politeness levels)
            substitutions = [
                (r'です。$', 'だ。'),
                (r'ます。$', 'る。'),
                (r'だ。$', 'です。'),
                (r'ている。$', 'てる。'),
            ]
            for pattern, replacement in substitutions:
                if re.search(pattern, text):
                    variation = re.sub(pattern, replacement, text)
                    if variation != text and variation not in alternatives:
                        alternatives.append(variation)
        
        return alternatives[:3]  # Limit to 3 alternatives


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


class KanaLeaderboardViewSet(viewsets.GenericViewSet):
    """ViewSet for Kana Practice leaderboard"""
    serializer_class = KanaLeaderboardScoreSerializer
    permission_classes = [permissions.AllowAny]  # Allow viewing without auth
    
    def get_queryset(self):
        queryset = KanaLeaderboardScore.objects.all()
        
        # Filter by kana type
        kana_type = self.request.query_params.get('kana_type')
        if kana_type in ['hiragana', 'katakana']:
            queryset = queryset.filter(kana_type=kana_type)
        
        # Filter by variant_key (GoKana style - can be combo like "monographs+diacritics")
        variant_key = self.request.query_params.get('variant_key')
        if variant_key:
            queryset = queryset.filter(variant_key=variant_key)
        
        # Filter by month (for monthly reset)
        from django.utils import timezone
        
        month_filter = self.request.query_params.get('month', 'current')
        if month_filter == 'current':
            # Get first day of current month
            now = timezone.now()
            first_day = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            queryset = queryset.filter(created_at__gte=first_day)
        
        return queryset.order_by('time_seconds', '-accuracy', '-created_at')
    
    def list(self, request):
        """Get leaderboard scores with filters"""
        queryset = self.get_queryset()[:100]  # Limit to top 100
        serializer = self.get_serializer(queryset, many=True)
        
        # Add rank numbers
        data = serializer.data
        for i, score in enumerate(data):
            score['rank'] = i + 1
        
        return Response({
            'scores': data,
            'filters': {
                'kana_type': request.query_params.get('kana_type', 'all'),
                'variant_key': request.query_params.get('variant_key', 'monographs'),
                'month': request.query_params.get('month', 'current'),
            }
        })
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def submit(self, request):
        """Submit a new score to the leaderboard"""
        serializer = KanaScoreSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # Calculate score: (correct * 10) + (accuracy bonus) + (streak bonus) - (time penalty)
        base_score = data['correct_answers'] * 10
        accuracy_bonus = int(data['accuracy'] * 0.5)  # Up to 50 bonus for 100% accuracy
        streak_bonus = data['best_streak'] * 2
        time_penalty = min(data['time_seconds'] // 10, 50)  # Max 50 point penalty
        calculated_score = max(0, base_score + accuracy_bonus + streak_bonus - time_penalty)
        
        # Create the score
        score = KanaLeaderboardScore.objects.create(
            user=request.user,
            display_name=data['display_name'].upper()[:5],
            kana_type=data['kana_type'],
            variant_key=data['variant_key'],
            time_seconds=data['time_seconds'],
            accuracy=data['accuracy'],
            score=calculated_score,
            correct_answers=data['correct_answers'],
            wrong_answers=data['wrong_answers'],
            best_streak=data['best_streak'],
            session_length=data['session_length'],
        )
        
        # Get rank of this score (for the current month)
        from django.utils import timezone
        now = timezone.now()
        first_day = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        rank = KanaLeaderboardScore.objects.filter(
            kana_type=score.kana_type,
            variant_key=score.variant_key,
            created_at__gte=first_day,
            time_seconds__lt=score.time_seconds
        ).count() + 1
        
        # Also count same time but higher accuracy
        same_time_better = KanaLeaderboardScore.objects.filter(
            kana_type=score.kana_type,
            variant_key=score.variant_key,
            created_at__gte=first_day,
            time_seconds=score.time_seconds,
            accuracy__gt=score.accuracy
        ).count()
        rank += same_time_better
        
        response_serializer = KanaLeaderboardScoreSerializer(score)
        response_data = response_serializer.data
        response_data['rank'] = rank
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def my_scores(self, request):
        """Get current user's scores"""
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        scores = KanaLeaderboardScore.objects.filter(user=request.user).order_by('-created_at')[:50]
        serializer = self.get_serializer(scores, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_best(self, request):
        """Get current user's best score for each category"""
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        best_scores = []
        # Get all unique combinations the user has played
        user_combinations = KanaLeaderboardScore.objects.filter(
            user=request.user
        ).values('kana_type', 'variant_key').distinct()
        
        for combo in user_combinations:
            score = KanaLeaderboardScore.objects.filter(
                user=request.user,
                kana_type=combo['kana_type'],
                variant_key=combo['variant_key']
            ).order_by('time_seconds', '-accuracy').first()
            if score:
                serializer = self.get_serializer(score)
                data = serializer.data
                data['category'] = f"{combo['kana_type']}_{combo['variant_key']}"
                best_scores.append(data)
        
        return Response(best_scores)
