from rest_framework import viewsets, filters, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models, NotSupportedError
import json
import logging
from .models import Kanji, Vocabulary, KanjiMnemonic, UserVocabulary, UserKanji
from .serializers import (
    KanjiSerializer, KanjiPreviewSerializer, VocabularySerializer,
    KanjiMnemonicSerializer, UserVocabularySerializer, UserKanjiSerializer
)

logger = logging.getLogger(__name__)


class KanjiListPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


class KanjiViewSet(viewsets.ModelViewSet):
    """ViewSet for Kanji management

    Notes:
    - Use a lightweight serializer for list operations to avoid returning `svg_data` and other large fields.
    - Provide a dedicated `svg` action to fetch SVG content on demand.
    """
    queryset = Kanji.objects.all()
    serializer_class = KanjiSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = KanjiListPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['jlpt_level', 'stroke_count']
    search_fields = ['character', 'meaning', 'kun_reading', 'on_reading']
    ordering_fields = ['frequency_rank', 'stroke_count', 'created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        # For list operations, avoid loading `svg_data` and `examples` to minimize DB transfer.
        if self.action in ('list',):
            return qs.only('id', 'character', 'meaning', 'kun_reading', 'on_reading', 'jlpt_level', 'stroke_count', 'radical', 'frequency_rank')
        return qs

    def get_serializer_class(self):
        # Use preview serializer on list to keep payloads small
        if self.action == 'list':
            return KanjiPreviewSerializer
        return KanjiSerializer

    # Cache SVG responses for an hour to reduce DB hits and repeated rendering
    @action(detail=True, methods=['get'])
    @method_decorator(cache_page(60 * 60))
    def svg(self, request, pk=None):
        kanji = self.get_object()
        svg = kanji.svg_data or ''
        if not svg:
            return Response({'detail': 'SVG not available for this kanji.'}, status=status.HTTP_404_NOT_FOUND)
        # Return raw SVG with correct content type so frontend can embed it directly
        return HttpResponse(svg, content_type='image/svg+xml')

    @action(detail=True, methods=['get'])
    def mnemonics(self, request, pk=None):
        """Get all mnemonics for a kanji"""
        kanji = self.get_object()
        if request.user.is_authenticated:
            # Show user's mnemonics and public ones
            mnemonics = kanji.mnemonics.filter(
                models.Q(is_public=True) | models.Q(user=request.user)
            ).order_by('-created_at')
        else:
            # Only show public mnemonics for anonymous users
            mnemonics = kanji.mnemonics.filter(is_public=True).order_by('-created_at')
        serializer = KanjiMnemonicSerializer(mnemonics, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def graph(self, request, pk=None):
        """Get graph data for kanji decomposition/composition"""
        kanji = self.get_object()

        try:
            # helper functions
            def extract_char(component):
                if isinstance(component, dict):
                    return component.get('component') or component.get('character') or None
                return component

            def find_nodes(components):
                """Recursively find all component kanji"""
                result = []
                for comp in components or []:
                    char = extract_char(comp)
                    if not char:
                        continue
                    if char not in result:
                        result.append(char)
                for comp in components or []:
                    char = extract_char(comp)
                    if not char:
                        continue
                    try:
                        comp_kanji = Kanji.objects.get(character=char)
                        if comp_kanji.composition:
                            sub_comps = find_nodes(comp_kanji.composition)
                            for sub in sub_comps:
                                if sub not in result:
                                    result.append(sub)
                    except Kanji.DoesNotExist:
                        pass
                return result

            # Initialize collections early to avoid NameError during graph generation
            in_links = []
            out_links = []

            # In-links: direct decomposition links
            in_components = kanji.composition or []
            for comp in in_components:
                c = extract_char(comp)
                if c and c != kanji.character:
                    in_links.append({'source': c, 'target': kanji.character})

            # Recursively find nodes for incoming decomposition graph
            in_node_list = find_nodes(in_components)

            # Add direct in-links from recursive nodes (component -> composed)
            for end in in_node_list:
                try:
                    end_kanji = Kanji.objects.get(character=end)
                    for start in end_kanji.composition or []:
                        start_char = extract_char(start)
                        if start_char and start_char != end:
                            in_links.append({'source': start_char, 'target': end})
                except Kanji.DoesNotExist:
                    pass

            # Out-links: find kanji where this kanji appears in their composition
            for k in Kanji.objects.all():
                if not k.composition:
                    continue
                comp = k.composition
                # Simple list of characters
                if isinstance(comp, (list, tuple)) and any((extract_char(c) == kanji.character) for c in comp if c is not None):
                    out_links.append(k.character)
                    continue
                # Attempt to parse JSON/text stored composition
                try:
                    parsed = json.loads(comp) if isinstance(comp, str) else comp
                    if isinstance(parsed, (list, tuple)) and any((extract_char(c) == kanji.character) for c in parsed if c is not None):
                        out_links.append(k.character)
                        continue
                except Exception:
                    # ignore parse errors
                    pass
                if kanji.character in str(comp):
                    out_links.append(k.character)

            # Build nodes and links payload
            out_links_payload = [{'source': kanji.character, 'target': out} for out in out_links]
            all_characters = set([kanji.character] + in_node_list + list(out_links))
            nodes_data = []
            for char in all_characters:
                try:
                    k = Kanji.objects.get(character=char)
                    nodes_data.append({
                        'id': char,
                        'data': {
                            'character': k.character,
                            'meaning': k.meaning,
                            'jlpt_level': k.jlpt_level,
                            'stroke_count': k.stroke_count
                        }
                    })
                except Kanji.DoesNotExist:
                    nodes_data.append({
                        'id': char,
                        'data': {'character': char}
                    })

            all_links = in_links + out_links_payload
            # deduplicate
            unique_links = []
            seen = set()
            for link in all_links:
                key = (link['source'], link['target'])
                if key not in seen:
                    unique_links.append(link)
                    seen.add(key)

            with_out_links = {'nodes': nodes_data, 'links': unique_links}
            no_out_links = {
                'nodes': [n for n in nodes_data if n['id'] in ([kanji.character] + in_node_list)],
                'links': [l for l in unique_links if l['target'] != kanji.character or l['source'] in in_node_list]
            }

            return Response({'withOutLinks': with_out_links, 'noOutLinks': no_out_links})
        except Exception as exc:
            logger.exception("Kanji graph generation failed for %s", kanji.character)
            return Response({'detail': 'Error generating graph', 'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def related(self, request, pk=None):
        """Get related kanji based on shared components"""
        kanji = self.get_object()
        component_chars = set()

        # Extract component characters from kanji composition
        if kanji.composition:
            try:
                comp_list = json.loads(kanji.composition)
                if isinstance(comp_list, (list, tuple)):
                    for comp in comp_list:
                        char = extract_char(comp)
                        if char:
                            component_chars.add(char)
            except (json.JSONDecodeError, TypeError):
                pass  # Ignore invalid composition formats

        # Find kanji that share these components
        related_kanji = Kanji.objects.filter(
            models.Q(composition__contains=kanji.character) | models.Q(composition__contains=list(component_chars))
        ).exclude(id=kanji.id).distinct()

        serializer = KanjiPreviewSerializer(related_kanji, many=True)
        return Response(serializer.data)


class VocabularyViewSet(viewsets.ModelViewSet):
    """ViewSet for Vocabulary management"""
    queryset = Vocabulary.objects.all()
    serializer_class = VocabularySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['jlpt_level']
    search_fields = ['word', 'reading', 'meaning']
    ordering_fields = ['frequency_rank', 'created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        pos_category = self.request.query_params.get('part_of_speech', None)
        
        if pos_category:
            # Map categories to their variations
            pos_mappings = {
                'Noun': ['Noun', 'Pronoun', 'demonstrative pronoun', 'interrogative pronoun', 'temporal pronoun', 'no-adjective', 'adverbial noun'],
                'Verb': ['Verb', 'Godan verb', 'Ichidan verb', 'Suru verb', 'Kuru verb', 'Transitive verb', 'Intransitive verb', 'auxiliary verb'],
                'Adjective': ['Adjective', 'I-adjective', 'Na-adjective', 'No-adjective', 'demonstrative adjective', 'pre-noun adjectival'],
                'Adverb': ['Adverb', 'adverb taking the particle to', 'temporal adverb'],
                'Expression': ['Expression', 'Expressions'],
                'Counter': ['Counter'],
                'Pronoun': ['Pronoun', 'demonstrative pronoun', 'interrogative pronoun', 'temporal pronoun'],
                'Prefix': ['Prefix'],
                'Suffix': ['Suffix'],
                'Conjunction': ['Conjunction'],
                'Interjection': ['Interjection'],
                'Particle': ['Particle'],
            }
            
            # Get the variations for the selected category
            variations = pos_mappings.get(pos_category, [pos_category])
            
            # Filter using case-insensitive contains for any of the variations
            from django.db.models import Q
            query = Q()
            for variation in variations:
                query |= Q(part_of_speech__icontains=variation)
            queryset = queryset.filter(query)
        
        return queryset


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
