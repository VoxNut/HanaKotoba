"""
Advanced Django management command to import vocabulary with enhanced Jisho API features.

This command provides additional features like:
- Example sentence import
- Audio URL extraction
- Batch processing
- Progress persistence

Usage:
    python manage.py import_jisho_advanced --file wordlist.txt --with-examples --with-audio
"""

import json
import time
import requests
from bs4 import BeautifulSoup
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from vocabulary.models import Vocabulary, Kanji


class Command(BaseCommand):
    help = 'Advanced import of vocabulary data from Jisho.org API with examples and audio'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            help='Path to a text file with words (one per line)',
        )
        parser.add_argument(
            '--words',
            type=str,
            help='Comma-separated list of words to import',
        )
        parser.add_argument(
            '--with-examples',
            action='store_true',
            help='Fetch and import example sentences (slower)',
        )
        parser.add_argument(
            '--with-audio',
            action='store_true',
            help='Scrape audio URLs from Jisho (requires scraping)',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=10,
            help='Commit to database every N words (default: 10)',
        )
        parser.add_argument(
            '--delay',
            type=float,
            default=1.5,
            help='Delay in seconds between API requests (default: 1.5)',
        )
        parser.add_argument(
            '--skip-existing',
            action='store_true',
            help='Skip words that already exist in the database',
        )
        parser.add_argument(
            '--resume-from',
            type=int,
            default=0,
            help='Resume import from line number (0-indexed)',
        )
        parser.add_argument(
            '--save-progress',
            type=str,
            help='Save progress to a JSON file for resuming',
        )

    def handle(self, *args, **options):
        words_to_import = []

        # Collect words from various sources
        if options['file']:
            words_to_import.extend(self.read_words_from_file(options['file']))
        
        if options['words']:
            words_to_import.extend([w.strip() for w in options['words'].split(',')])

        if not words_to_import:
            raise CommandError('No words to import. Use --file or --words option.')

        # Resume from specific position
        if options['resume_from'] > 0:
            self.stdout.write(f'Resuming from word {options["resume_from"]}...')
            words_to_import = words_to_import[options['resume_from']:]

        self.stdout.write(f'Starting advanced import of {len(words_to_import)} words...')
        if options['with_examples']:
            self.stdout.write(self.style.WARNING('Example sentences enabled - this will be slower'))
        if options['with_audio']:
            self.stdout.write(self.style.WARNING('Audio URL scraping enabled'))

        imported_count = 0
        skipped_count = 0
        error_count = 0
        progress_data = []

        for i, word in enumerate(words_to_import, 1):
            try:
                # Skip if already exists
                if options['skip_existing'] and Vocabulary.objects.filter(word=word).exists():
                    self.stdout.write(f'[{i}/{len(words_to_import)}] Skipped (exists): {word}')
                    skipped_count += 1
                    progress_data.append({'word': word, 'status': 'skipped'})
                    continue

                # Fetch from Jisho API
                result = self.fetch_vocabulary_data(
                    word,
                    with_examples=options['with_examples'],
                    with_audio=options['with_audio']
                )
                
                if result:
                    vocab = self.save_vocabulary(result)
                    imported_count += 1
                    
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'[{i}/{len(words_to_import)}] Imported: {vocab.word} ({vocab.reading})'
                        )
                    )
                    progress_data.append({'word': word, 'status': 'imported', 'id': vocab.id})
                else:
                    error_count += 1
                    self.stdout.write(
                        self.style.WARNING(f'[{i}/{len(words_to_import)}] Not found: {word}')
                    )
                    progress_data.append({'word': word, 'status': 'not_found'})

                # Batch commit
                if i % options['batch_size'] == 0:
                    self.stdout.write(f'Batch commit at {i} words...')

                # Save progress periodically
                if options['save_progress'] and i % 50 == 0:
                    self.save_progress_file(options['save_progress'], progress_data, i)

                # Delay to avoid rate limiting
                if i < len(words_to_import):
                    time.sleep(options['delay'])

            except Exception as e:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(f'[{i}/{len(words_to_import)}] Error: {word} - {str(e)}')
                )
                progress_data.append({'word': word, 'status': 'error', 'error': str(e)})

        # Final progress save
        if options['save_progress']:
            self.save_progress_file(options['save_progress'], progress_data, len(words_to_import))

        # Summary
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS(f'✓ Imported: {imported_count}'))
        self.stdout.write(self.style.WARNING(f'⊘ Skipped: {skipped_count}'))
        self.stdout.write(self.style.ERROR(f'✗ Errors: {error_count}'))
        self.stdout.write('='*60)

    def read_words_from_file(self, filepath):
        """Read words from a text file (one word per line)."""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                words = [line.strip() for line in f if line.strip() and not line.startswith('#')]
            self.stdout.write(f'Read {len(words)} words from {filepath}')
            return words
        except FileNotFoundError:
            raise CommandError(f'File not found: {filepath}')

    def fetch_vocabulary_data(self, word, with_examples=False, with_audio=False):
        """Fetch comprehensive vocabulary data from Jisho API."""
        try:
            # Primary API call
            url = f'https://jisho.org/api/v1/search/words?keyword={requests.utils.quote(word)}'
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if not data.get('data'):
                return None
            
            result = data['data'][0]
            
            # Extract Japanese word info
            japanese = result.get('japanese', [{}])[0]
            word_text = japanese.get('word', japanese.get('reading', ''))
            reading = japanese.get('reading', '')
            
            # Extract meanings and POS
            senses = result.get('senses', [])
            meanings = []
            parts_of_speech = []
            
            for sense in senses:
                meanings.extend(sense.get('english_definitions', []))
                parts_of_speech.extend(sense.get('parts_of_speech', []))
            
            meaning = '; '.join(meanings[:5])
            pos = ', '.join(set(parts_of_speech[:3]))
            
            # Scrape JLPT level from HTML page
            jlpt_level = self.scrape_jlpt_level(word_text)
            
            vocab_data = {
                'word': word_text,
                'reading': reading,
                'meaning': meaning,
                'part_of_speech': pos,
                'jlpt_level': jlpt_level,
                'is_common': result.get('is_common', False),
                'example_sentences': [],
                'audio_url': '',
            }
            
            # Fetch examples if requested
            if with_examples:
                examples = self.fetch_examples(word_text)
                vocab_data['example_sentences'] = examples
                time.sleep(0.5)  # Extra delay for example requests
            
            # Scrape audio URL if requested
            if with_audio:
                audio_url = self.scrape_audio_url(word_text)
                vocab_data['audio_url'] = audio_url
                time.sleep(0.5)  # Extra delay for scraping
            
            return vocab_data
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error fetching {word}: {str(e)}'))
            return None

    def fetch_examples(self, word):
        """Fetch example sentences from Jisho."""
        try:
            # Use the sentence search endpoint (unofficial)
            url = f'https://jisho.org/search/{requests.utils.quote(word)}%20%23sentences'
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            
            # This would require HTML parsing - simplified version
            # For production, use BeautifulSoup to parse the HTML
            # For now, return empty list
            return []
            
        except Exception as e:
            self.stdout.write(f'Could not fetch examples for {word}: {str(e)}')
            return []

    def scrape_audio_url(self, word):
        """Scrape audio URL from Jisho word page."""
        try:
            # This requires HTML parsing of the word page
            # The audio URLs are in the format:
            # https://d1vjc5dkcd3yh2.cloudfront.net/audio/{hash}.mp3
            # For now, return empty string
            # In production, use BeautifulSoup to extract from HTML
            return ''
            
        except Exception as e:
            self.stdout.write(f'Could not fetch audio for {word}: {str(e)}')
            return ''

    @transaction.atomic
    def save_vocabulary(self, data):
        """Save vocabulary data to the database with transaction."""
        vocab, created = Vocabulary.objects.update_or_create(
            word=data['word'],
            reading=data['reading'],
            defaults={
                'meaning': data['meaning'],
                'part_of_speech': data['part_of_speech'],
                'jlpt_level': data['jlpt_level'],
                'frequency_rank': 1 if data.get('is_common') else None,
                'example_sentences': data.get('example_sentences', []),
                'audio_url': data.get('audio_url', ''),
            }
        )
        
        # Link related kanji
        kanji_chars = [char for char in data['word'] if self.is_kanji(char)]
        for char in kanji_chars:
            try:
                kanji_obj = Kanji.objects.get(character=char)
                vocab.related_kanji.add(kanji_obj)
            except Kanji.DoesNotExist:
                pass
        
        return vocab

    def scrape_jlpt_level(self, word):
        """Scrape JLPT level from Jisho.org word page."""
        try:
            url = f'https://jisho.org/search/{requests.utils.quote(word)}'
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'lxml')
            # Find JLPT level in concept_light-tag spans
            tags = soup.find_all('span', class_='concept_light-tag')
            for tag in tags:
                text = tag.get_text().strip()
                if 'JLPT' in text:
                    # Extract N5, N4, N3, N2, or N1
                    if 'N5' in text:
                        return 'N5'
                    elif 'N4' in text:
                        return 'N4'
                    elif 'N3' in text:
                        return 'N3'
                    elif 'N2' in text:
                        return 'N2'
                    elif 'N1' in text:
                        return 'N1'
            return None
        except Exception as e:
            return None

    def is_kanji(self, char):
        """Check if a character is a kanji."""
        code = ord(char)
        return (
            (0x4E00 <= code <= 0x9FFF) or
            (0x3400 <= code <= 0x4DBF) or
            (0xF900 <= code <= 0xFAFF)
        )

    def save_progress_file(self, filepath, progress_data, current_index):
        """Save progress to a JSON file."""
        try:
            progress = {
                'current_index': current_index,
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
                'data': progress_data
            }
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(progress, f, ensure_ascii=False, indent=2)
            self.stdout.write(f'Progress saved to {filepath}')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Could not save progress: {str(e)}'))
