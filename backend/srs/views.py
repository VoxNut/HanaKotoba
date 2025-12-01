from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import Card, ReviewSession, DailyRecommendation
from .serializers import (
    CardSerializer, ReviewSessionSerializer,
    DailyRecommendationSerializer, CardReviewSerializer
)


class CardViewSet(viewsets.ModelViewSet):
    """ViewSet for SRS cards"""
    serializer_class = CardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Card.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def due_today(self, request):
        """Get cards due for review today"""
        cards = self.get_queryset().filter(next_review__lte=timezone.now())
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

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get SRS statistics"""
        queryset = self.get_queryset()
        return Response({
            'total': queryset.count(),
            'new': queryset.filter(state='new').count(),
            'learning': queryset.filter(state='learning').count(),
            'reviewing': queryset.filter(state='reviewing').count(),
            'mastered': queryset.filter(state='mastered').count(),
            'due_today': queryset.filter(next_review__lte=timezone.now()).count(),
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
