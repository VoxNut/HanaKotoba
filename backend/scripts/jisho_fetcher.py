"""
Standalone Python script to fetch vocabulary from Jisho API and export to JSON.
Can be used independently or imported into Django.

Requirements:
    pip install requests beautifulsoup4

Usage:
    python jisho_fetcher.py --words "犬,猫,本" --output vocab_data.json
    python jisho_fetcher.py --file wordlist.txt --output vocab_data.json
"""

import argparse
import json
import time
import sys
from typing import List, Dict, Optional
import requests


class JishoFetcher:
    """Fetch vocabulary data from Jisho.org API."""
    
    BASE_API_URL = 'https://jisho.org/api/v1/search/words'
    BASE_URL = 'https://jisho.org'
    
    def __init__(self, delay: float = 1.0):
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def search_word(self, word: str) -> Optional[Dict]:
        """
        Search for a word using the official Jisho API.
        
        Args:
            word: Japanese word to search for
            
        Returns:
            Dictionary with word data or None if not found
        """
        try:
            url = f'{self.BASE_API_URL}?keyword={requests.utils.quote(word)}'
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if not data.get('data'):
                return None
            
            return self._parse_api_response(data['data'][0])
            
        except Exception as e:
            print(f'Error searching for {word}: {str(e)}', file=sys.stderr)
            return None
    
    def _parse_api_response(self, result: Dict) -> Dict:
        """Parse the API response into a cleaner format."""
        # Extract Japanese word info
        japanese_entries = result.get('japanese', [{}])
        primary = japanese_entries[0]
        
        word = primary.get('word', primary.get('reading', ''))
        reading = primary.get('reading', '')
        
        # Get alternative forms
        alternatives = []
        for entry in japanese_entries[1:]:
            alt_word = entry.get('word', '')
            alt_reading = entry.get('reading', '')
            if alt_word or alt_reading:
                alternatives.append({
                    'word': alt_word,
                    'reading': alt_reading
                })
        
        # Extract meanings
        senses = result.get('senses', [])
        meanings = []
        all_pos = set()
        
        for sense in senses:
            definitions = sense.get('english_definitions', [])
            pos = sense.get('parts_of_speech', [])
            tags = sense.get('tags', [])
            
            meanings.append({
                'definitions': definitions,
                'parts_of_speech': pos,
                'tags': tags,
                'see_also': sense.get('see_also', []),
                'info': sense.get('info', [])
            })
            all_pos.update(pos)
        
        # Extract JLPT level
        jlpt_level = None
        wanikani_level = None
        for tag in result.get('tags', []):
            if tag.startswith('jlpt-'):
                jlpt_level = tag.replace('jlpt-', '').upper()
            elif tag.startswith('wanikani'):
                wanikani_level = tag
        
        # Build final data structure
        return {
            'word': word,
            'reading': reading,
            'alternatives': alternatives,
            'meanings': meanings,
            'parts_of_speech': list(all_pos),
            'jlpt_level': jlpt_level,
            'wanikani_level': wanikani_level,
            'is_common': result.get('is_common', False),
            'tags': result.get('tags', []),
            'attribution': result.get('attribution', {})
        }
    
    def search_kanji(self, kanji: str) -> Optional[Dict]:
        """
        Search for kanji information (requires scraping).
        Note: This is a placeholder - full implementation requires BeautifulSoup.
        """
        # For full implementation, scrape https://jisho.org/search/{kanji}%23kanji
        return None
    
    def fetch_multiple(self, words: List[str], verbose: bool = True) -> List[Dict]:
        """
        Fetch data for multiple words with progress reporting.
        
        Args:
            words: List of Japanese words
            verbose: Print progress messages
            
        Returns:
            List of word data dictionaries
        """
        results = []
        total = len(words)
        
        for i, word in enumerate(words, 1):
            if verbose:
                print(f'[{i}/{total}] Fetching: {word}', file=sys.stderr)
            
            data = self.search_word(word)
            
            if data:
                results.append(data)
                if verbose:
                    print(f'  ✓ Found: {data["word"]} ({data["reading"]})', file=sys.stderr)
            else:
                if verbose:
                    print(f'  ✗ Not found', file=sys.stderr)
            
            # Delay between requests
            if i < total:
                time.sleep(self.delay)
        
        return results


def read_words_from_file(filepath: str) -> List[str]:
    """Read words from a text file (one per line)."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            words = [line.strip() for line in f if line.strip() and not line.startswith('#')]
        return words
    except Exception as e:
        print(f'Error reading file: {str(e)}', file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description='Fetch vocabulary data from Jisho.org API'
    )
    parser.add_argument(
        '--words',
        type=str,
        help='Comma-separated list of words to fetch'
    )
    parser.add_argument(
        '--file',
        type=str,
        help='Path to text file with words (one per line)'
    )
    parser.add_argument(
        '--output',
        type=str,
        default='jisho_vocab.json',
        help='Output JSON file (default: jisho_vocab.json)'
    )
    parser.add_argument(
        '--delay',
        type=float,
        default=1.0,
        help='Delay between API requests in seconds (default: 1.0)'
    )
    parser.add_argument(
        '--pretty',
        action='store_true',
        help='Pretty-print JSON output'
    )
    parser.add_argument(
        '--quiet',
        action='store_true',
        help='Suppress progress messages'
    )
    
    args = parser.parse_args()
    
    # Collect words
    words = []
    if args.words:
        words.extend([w.strip() for w in args.words.split(',')])
    if args.file:
        words.extend(read_words_from_file(args.file))
    
    if not words:
        print('Error: No words specified. Use --words or --file', file=sys.stderr)
        sys.exit(1)
    
    # Fetch data
    fetcher = JishoFetcher(delay=args.delay)
    results = fetcher.fetch_multiple(words, verbose=not args.quiet)
    
    # Save to JSON
    try:
        with open(args.output, 'w', encoding='utf-8') as f:
            if args.pretty:
                json.dump(results, f, ensure_ascii=False, indent=2)
            else:
                json.dump(results, f, ensure_ascii=False)
        
        print(f'\n✓ Saved {len(results)} words to {args.output}', file=sys.stderr)
        print(f'  Total words processed: {len(words)}', file=sys.stderr)
        print(f'  Successfully fetched: {len(results)}', file=sys.stderr)
        print(f'  Not found: {len(words) - len(results)}', file=sys.stderr)
        
    except Exception as e:
        print(f'Error saving output: {str(e)}', file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
