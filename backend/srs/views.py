from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import Card, ReviewSession, DailyRecommendation
from .serializers import (
    CardSerializer, ReviewSessionSerializer,
    DailyRecommendationSerializer, CardReviewSerializer,
    CustomCardCreateSerializer
)


class CardViewSet(viewsets.ModelViewSet):
    """ViewSet for SRS cards"""
    serializer_class = CardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Card.objects.filter(user=self.request.user)
        
        # Filter by suspended status
        include_suspended = self.request.query_params.get('include_suspended', 'false')
        if include_suspended.lower() != 'true':
            queryset = queryset.filter(is_suspended=False)
        
        # Filter by content type
        content_type = self.request.query_params.get('content_type')
        if content_type:
            queryset = queryset.filter(content_type=content_type)
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def due_today(self, request):
        """Get cards due for review today"""
        cards = self.get_queryset().filter(
            next_review__lte=timezone.now(),
            is_suspended=False
        )
        serializer = self.get_serializer(cards, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """Review a card and update SRS parameters"""
        card = self.get_object()
        serializer = CardReviewSerializer(data=request.data)

        if serializer.is_valid():
            quality = serializer.validated_data['quality']
            card.total_reviews += 1

            if quality >= 3:
                card.correct_reviews += 1

            card.calculate_next_interval(quality)

            return Response({
                'next_review': card.next_review,
                'interval': card.interval,
                'state': card.state
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """Suspend a card (stops it from appearing in reviews)"""
        card = self.get_object()
        card.is_suspended = True
        card.save()
        return Response({'message': 'Card suspended successfully'})

    @action(detail=True, methods=['post'])
    def unsuspend(self, request, pk=None):
        """Unsuspend a card"""
        card = self.get_object()
        card.is_suspended = False
        card.save()
        return Response({'message': 'Card unsuspended successfully'})

    @action(detail=True, methods=['post'])
    def reset_progress(self, request, pk=None):
        """Reset card progress (useful for testing)"""
        card = self.get_object()
        card.ease_factor = 2.5
        card.interval = 1
        card.repetitions = 0
        card.last_reviewed = None
        card.next_review = timezone.now()
        card.total_reviews = 0
        card.correct_reviews = 0
        card.state = 'new'
        card.save()
        return Response({'message': 'Card progress reset successfully'})

    @action(detail=False, methods=['post'])
    def reset_all_due_dates(self, request):
        """Reset all cards to be due now (for testing reviews)"""
        cards = self.get_queryset()
        cards.update(next_review=timezone.now())
        return Response({
            'message': f'Reset {cards.count()} cards to be due now',
            'count': cards.count()
        })

    @action(detail=False, methods=['post'])
    def add_kanji(self, request):
        """Add a kanji to SRS flashcards"""
        kanji_id = request.data.get('kanji_id')
        if not kanji_id:
            return Response(
                {'error': 'kanji_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if card already exists
        existing_card = Card.objects.filter(
            user=request.user,
            content_type='kanji',
            object_id=kanji_id
        ).first()

        if existing_card:
            return Response(
                {'message': 'Kanji already in flashcards', 'card_id': existing_card.id},
                status=status.HTTP_200_OK
            )

        # Create new card
        card = Card.objects.create(
            user=request.user,
            content_type='kanji',
            object_id=kanji_id
        )

        serializer = self.get_serializer(card)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='check_kanji/(?P<kanji_id>[^/.]+)')
    def check_kanji(self, request, kanji_id=None):
        """Check if a kanji is already in the user's flashcard deck"""
        if not kanji_id:
            return Response(
                {'error': 'kanji_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        exists = Card.objects.filter(
            user=request.user,
            content_type='kanji',
            object_id=kanji_id
        ).exists()

        return Response({'exists': exists})

    @action(detail=False, methods=['post'])
    def check_vocabulary_batch(self, request):
        """Check which vocabulary words from a list are already in the user's flashcard deck"""
        vocab_ids = request.data.get('vocabulary_ids', [])
        if not vocab_ids:
            return Response({'saved_ids': []})

        saved_cards = Card.objects.filter(
            user=request.user,
            content_type='vocabulary',
            object_id__in=vocab_ids
        ).values_list('object_id', flat=True)

        return Response({'saved_ids': list(saved_cards)})

    @action(detail=False, methods=['post'])
    def add_vocabulary(self, request):
        """Add a vocabulary word to SRS flashcards"""
        vocab_id = request.data.get('vocabulary_id')
        if not vocab_id:
            return Response(
                {'error': 'vocabulary_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if card already exists
        existing_card = Card.objects.filter(
            user=request.user,
            content_type='vocabulary',
            object_id=vocab_id
        ).first()

        if existing_card:
            return Response(
                {'message': 'Vocabulary already in flashcards', 'card_id': existing_card.id},
                status=status.HTTP_200_OK
            )

        # Create new card
        card = Card.objects.create(
            user=request.user,
            content_type='vocabulary',
            object_id=vocab_id
        )

        serializer = self.get_serializer(card)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def add_grammar(self, request):
        """Add a grammar point to SRS flashcards"""
        grammar_id = request.data.get('grammar_id')
        if not grammar_id:
            return Response(
                {'error': 'grammar_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if card already exists
        existing_card = Card.objects.filter(
            user=request.user,
            content_type='grammar',
            object_id=grammar_id
        ).first()

        if existing_card:
            return Response(
                {'message': 'Grammar point already in flashcards', 'card_id': existing_card.id},
                status=status.HTTP_200_OK
            )

        # Create new card
        card = Card.objects.create(
            user=request.user,
            content_type='grammar',
            object_id=grammar_id
        )

        serializer = self.get_serializer(card)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def create_custom(self, request):
        """Create a custom flashcard"""
        serializer = CustomCardCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            card = Card.objects.create(
                user=request.user,
                content_type='custom',
                **serializer.validated_data
            )
            return Response(
                CardSerializer(card).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get SRS statistics"""
        queryset = self.get_queryset().filter(is_suspended=False)
        return Response({
            'total': queryset.count(),
            'new': queryset.filter(state='new').count(),
            'learning': queryset.filter(state='learning').count(),
            'reviewing': queryset.filter(state='reviewing').count(),
            'mastered': queryset.filter(state='mastered').count(),
            'due_today': queryset.filter(next_review__lte=timezone.now()).count(),
            'suspended': Card.objects.filter(user=request.user, is_suspended=True).count(),
            'by_type': {
                'kanji': queryset.filter(content_type='kanji').count(),
                'vocabulary': queryset.filter(content_type='vocabulary').count(),
                'grammar': queryset.filter(content_type='grammar').count(),
                'custom': queryset.filter(content_type='custom').count(),
            }
        })


class ReviewSessionViewSet(viewsets.ModelViewSet):
    """ViewSet for review sessions"""
    serializer_class = ReviewSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ReviewSession.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def end_session(self, request, pk=None):
        """End a review session"""
        session = self.get_object()
        session.ended_at = timezone.now()
        session.save()

        serializer = self.get_serializer(session)
        return Response(serializer.data)


class DailyRecommendationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for daily recommendations"""
    serializer_class = DailyRecommendationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DailyRecommendation.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's recommendations"""
        today = timezone.now().date()
        recommendation, created = DailyRecommendation.objects.get_or_create(
            user=request.user,
            date=today
        )

        if created or not recommendation.recommended_items:
            # Generate recommendations
            recommendation.recommended_items = self._generate_recommendations(
                request.user)
            recommendation.save()

        serializer = self.get_serializer(recommendation)
        return Response(serializer.data)

    def _generate_recommendations(self, user):
        """Generate daily recommendations for the user"""
        # This is a simplified version - you can make it more sophisticated
        recommendations = []

        # Get due cards
        due_cards = Card.objects.filter(
            user=user,
            next_review__lte=timezone.now()
        )[:user.daily_goal]

        for card in due_cards:
            recommendations.append({
                'type': card.content_type,
                'id': card.object_id,
                'reason': 'Due for review'
            })

        return recommendations
