from rest_framework import viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import GrammarPoint, UserGrammar
from .serializers import GrammarPointSerializer, UserGrammarSerializer


class GrammarPointViewSet(viewsets.ModelViewSet):
    queryset = GrammarPoint.objects.all()
    serializer_class = GrammarPointSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['jlpt_level']


class UserGrammarViewSet(viewsets.ModelViewSet):
    serializer_class = UserGrammarSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserGrammar.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
