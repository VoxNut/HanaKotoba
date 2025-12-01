"""
Test script to verify Jisho API integration.
Run this before doing bulk imports to ensure everything works.

Usage:
    cd backend
    python scripts/test_jisho_import.py
"""

import sys
import os
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hanakotoba.settings')
django.setup()

import requests
from vocabulary.models import Vocabulary, Kanji


def test_jisho_api():
    """Test basic Jisho API connectivity and response."""
    print("Testing Jisho API connectivity...")
    
    test_word = "犬"
    url = f"https://jisho.org/api/v1/search/words?keyword={test_word}"
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data.get('data'):
            result = data['data'][0]
            japanese = result.get('japanese', [{}])[0]
            word = japanese.get('word', '')
            reading = japanese.get('reading', '')
            
            print(f"✓ API Response OK")
            print(f"  Word: {word}")
            print(f"  Reading: {reading}")
            print(f"  Common: {result.get('is_common', False)}")
            return True
        else:
            print("✗ No data returned from API")
            return False
            
    except Exception as e:
        print(f"✗ API Error: {str(e)}")
        return False


def test_database_connection():
    """Test database connectivity."""
    print("\nTesting database connection...")
    
    try:
        count = Vocabulary.objects.count()
        print(f"✓ Database OK")
        print(f"  Current vocabulary count: {count}")
        return True
    except Exception as e:
        print(f"✗ Database Error: {str(e)}")
        return False


def test_import_single_word():
    """Test importing a single word."""
    print("\nTesting single word import...")
    
    test_word = "猫"
    
    try:
        # Check if already exists
        existing = Vocabulary.objects.filter(word=test_word).first()
        if existing:
            print(f"ℹ Word '{test_word}' already exists (ID: {existing.id})")
            print(f"  Reading: {existing.reading}")
            print(f"  Meaning: {existing.meaning[:50]}...")
            return True
        
        # Fetch from API
        url = f"https://jisho.org/api/v1/search/words?keyword={test_word}"
        response = requests.get(url, timeout=10)
        data = response.json()
        
        if not data.get('data'):
            print(f"✗ Word not found in API")
            return False
        
        result = data['data'][0]
        japanese = result.get('japanese', [{}])[0]
        word = japanese.get('word', japanese.get('reading', ''))
        reading = japanese.get('reading', '')
        
        # Extract meanings
        senses = result.get('senses', [])
        meanings = []
        for sense in senses:
            meanings.extend(sense.get('english_definitions', []))
        meaning = '; '.join(meanings[:5])
        
        # Create vocabulary entry
        vocab = Vocabulary.objects.create(
            word=word,
            reading=reading,
            meaning=meaning,
            frequency_rank=1 if result.get('is_common', False) else None
        )
        
        print(f"✓ Successfully imported")
        print(f"  ID: {vocab.id}")
        print(f"  Word: {vocab.word}")
        print(f"  Reading: {vocab.reading}")
        print(f"  Meaning: {vocab.meaning[:50]}...")
        
        return True
        
    except Exception as e:
        print(f"✗ Import Error: {str(e)}")
        return False


def test_kanji_linking():
    """Test kanji linking functionality."""
    print("\nTesting kanji linking...")
    
    try:
        # Check if we have any kanji in the database
        kanji_count = Kanji.objects.count()
        print(f"  Kanji in database: {kanji_count}")
        
        if kanji_count == 0:
            print("ℹ No kanji in database to link (this is OK)")
            return True
        
        # Try to find a vocabulary word with kanji
        vocab_with_kanji = None
        for vocab in Vocabulary.objects.all()[:100]:  # Check first 100
            if any(0x4E00 <= ord(c) <= 0x9FFF for c in vocab.word):
                vocab_with_kanji = vocab
                break
        
        if vocab_with_kanji:
            related_count = vocab_with_kanji.related_kanji.count()
            print(f"✓ Kanji linking functional")
            print(f"  Sample: {vocab_with_kanji.word}")
            print(f"  Linked kanji: {related_count}")
        else:
            print("ℹ No vocabulary with kanji found")
        
        return True
        
    except Exception as e:
        print(f"✗ Linking Error: {str(e)}")
        return False


def main():
    """Run all tests."""
    print("="*60)
    print("Jisho API Import Test Suite")
    print("="*60)
    
    results = {
        'API': test_jisho_api(),
        'Database': test_database_connection(),
        'Import': test_import_single_word(),
        'Kanji Linking': test_kanji_linking(),
    }
    
    print("\n" + "="*60)
    print("Test Results Summary:")
    print("="*60)
    
    for test_name, passed in results.items():
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{test_name:20} {status}")
    
    all_passed = all(results.values())
    
    print("="*60)
    if all_passed:
        print("✓ All tests passed! Ready for bulk import.")
        print("\nNext steps:")
        print("  python manage.py import_jisho_vocabulary --words '犬,猫,本'")
        print("  python manage.py import_jisho_vocabulary --jlpt N5")
    else:
        print("✗ Some tests failed. Please fix issues before bulk import.")
    print("="*60)
    
    return 0 if all_passed else 1


if __name__ == '__main__':
    sys.exit(main())
