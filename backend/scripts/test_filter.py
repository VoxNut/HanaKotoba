import os
import sys

# Add backend directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hanakotoba.settings')

import django
django.setup()

from vocabulary.models import Vocabulary
from django.db.models import Q

# Test Verb category filter
print("Testing Verb category filter...")
query = Q()
variations = ['Verb', 'Godan verb', 'Ichidan verb', 'Suru verb', 'Kuru verb', 'Transitive verb', 'Intransitive verb']
for v in variations:
    query |= Q(part_of_speech__icontains=v)

verbs = Vocabulary.objects.filter(query)
print(f"Total verbs found: {verbs.count()}")
print("\nFirst 5 verbs:")
for w in verbs[:5]:
    print(f"  {w.word} ({w.reading}) - {w.part_of_speech}")

# Test Noun category filter
print("\n\nTesting Noun category filter...")
query = Q()
variations = ['Noun', 'Pronoun', 'demonstrative pronoun', 'interrogative pronoun']
for v in variations:
    query |= Q(part_of_speech__icontains=v)

nouns = Vocabulary.objects.filter(query)
print(f"Total nouns found: {nouns.count()}")
print("\nFirst 5 nouns:")
for w in nouns[:5]:
    print(f"  {w.word} ({w.reading}) - {w.part_of_speech}")

# Test Adjective category filter
print("\n\nTesting Adjective category filter...")
query = Q()
variations = ['Adjective', 'I-adjective', 'Na-adjective', 'No-adjective']
for v in variations:
    query |= Q(part_of_speech__icontains=v)

adjectives = Vocabulary.objects.filter(query)
print(f"Total adjectives found: {adjectives.count()}")
print("\nFirst 5 adjectives:")
for w in adjectives[:5]:
    print(f"  {w.word} ({w.reading}) - {w.part_of_speech}")
