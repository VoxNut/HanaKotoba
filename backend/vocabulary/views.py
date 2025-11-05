from rest_framework import viewsets, filters, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Kanji, Vocabulary, KanjiMnemonic, UserVocabulary, UserKanji
from .serializers import (
    KanjiSerializer, VocabularySerializer, KanjiMnemonicSerializer,
    UserVocabularySerializer, UserKanjiSerializer
)


class KanjiViewSet(viewsets.ModelViewSet):
    """ViewSet for Kanji management"""
    queryset = Kanji.objects.all()
    serializer_class = KanjiSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['jlpt_level', 'stroke_count']
    search_fields = ['character', 'meaning', 'kun_reading', 'on_reading']
    ordering_fields = ['frequency_rank', 'stroke_count', 'created_at']

    @action(detail=True, methods=['get'])
    def mnemonics(self, request, pk=None):
        """Get all mnemonics for a kanji"""
        kanji = self.get_object()
        mnemonics = kanji.mnemonics.filter(
            is_public=True) | kanji.mnemonics.filter(user=request.user)
        serializer = KanjiMnemonicSerializer(mnemonics, many=True)
        return Response(serializer.data)


class VocabularyViewSet(viewsets.ModelViewSet):
    """ViewSet for Vocabulary management"""
    queryset = Vocabulary.objects.all()
    serializer_class = VocabularySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['jlpt_level', 'part_of_speech']
    search_fields = ['word', 'reading', 'meaning']
    ordering_fields = ['frequency_rank', 'created_at']


class KanjiMnemonicViewSet(viewsets.ModelViewSet):
    """ViewSet for Kanji Mnemonics"""
    queryset = KanjiMnemonic.objects.all()
    serializer_class = KanjiMnemonicSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return KanjiMnemonic.objects.filter(
                is_public=True
            ) | KanjiMnemonic.objects.filter(user=self.request.user)
        return KanjiMnemonic.objects.filter(is_public=True)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def upvote(self, request, pk=None):
        """Upvote a mnemonic"""
        mnemonic = self.get_object()
        mnemonic.upvotes += 1
        mnemonic.save()
        return Response({'upvotes': mnemonic.upvotes})


class UserVocabularyViewSet(viewsets.ModelViewSet):
    """ViewSet for user's vocabulary progress"""
    serializer_class = UserVocabularySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserVocabulary.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get vocabulary learning statistics"""
        queryset = self.get_queryset()
        return Response({
            'total': queryset.count(),
            'learning': queryset.filter(proficiency_level='learning').count(),
            'reviewing': queryset.filter(proficiency_level='reviewing').count(),
            'mastered': queryset.filter(proficiency_level='mastered').count(),
        })


class UserKanjiViewSet(viewsets.ModelViewSet):
    """ViewSet for user's kanji progress"""
    serializer_class = UserKanjiSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserKanji.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get kanji learning statistics"""
        queryset = self.get_queryset()
        return Response({
            'total': queryset.count(),
            'learning': queryset.filter(proficiency_level='learning').count(),
            'reviewing': queryset.filter(proficiency_level='reviewing').count(),
            'mastered': queryset.filter(proficiency_level='mastered').count(),
            'can_recognize': queryset.filter(can_recognize=True).count(),
            'can_write': queryset.filter(can_write=True).count(),
        })
