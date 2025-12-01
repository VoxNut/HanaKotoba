"""
Django management command to populate example sentences for existing vocabulary.

Usage:
    python manage.py populate_examples --limit 50
    python manage.py populate_examples --all
    python manage.py populate_examples --jlpt N5
"""

import time
import requests
from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand, CommandError
from vocabulary.models import Vocabulary


class Command(BaseCommand):
    help = 'Populate example sentences for existing vocabulary from Jisho.org'

    def add_arguments(self, parser):
        parser.add_argument(
            '--all',
            action='store_true',
            help='Update all vocabulary entries',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=None,
            help='Maximum number of words to update',
        )
        parser.add_argument(
            '--jlpt',
            type=str,
            choices=['N5', 'N4', 'N3', 'N2', 'N1'],
            help='Update only words of a specific JLPT level',
        )
        parser.add_argument(
            '--delay',
            type=float,
            default=2.0,
            help='Delay in seconds between requests (default: 2.0)',
        )
        parser.add_argument(
            '--skip-existing',
            action='store_true',
            help='Skip words that already have example sentences',
        )

    def handle(self, *args, **options):
        # Build queryset
        queryset = Vocabulary.objects.all()

        if options['jlpt']:
            queryset = queryset.filter(jlpt_level=options['jlpt'])

        if options['skip_existing']:
            queryset = queryset.filter(example_sentences__isnull=True) | queryset.filter(example_sentences=[])

        if options['limit']:
            queryset = queryset[:options['limit']]

        if not queryset.exists():
            self.stdout.write(self.style.WARNING('No vocabulary to update'))
            return

        total = queryset.count()
        self.stdout.write(f'Starting to populate examples for {total} words...\n')

        updated_count = 0
        skipped_count = 0
        error_count = 0

        for i, vocab in enumerate(queryset, 1):
            try:
                # Skip if already has examples
                if options['skip_existing'] and vocab.example_sentences:
                    self.stdout.write(f'[{i}/{total}] Skipped (has examples): {vocab.word}')
                    skipped_count += 1
                    continue

                # Scrape example sentences
                examples = self.scrape_example_sentences(vocab.word)

                if examples:
                    vocab.example_sentences = examples
                    vocab.save()
                    updated_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'[{i}/{total}] Updated: {vocab.word} ({len(examples)} examples)'
                        )
                    )
                else:
                    skipped_count += 1
                    self.stdout.write(
                        self.style.WARNING(
                            f'[{i}/{total}] No examples found: {vocab.word}'
                        )
                    )

                # Delay to avoid rate limiting
                if i < total:
                    time.sleep(options['delay'])

            except Exception as e:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(
                        f'[{i}/{total}] Error updating {vocab.word}: {str(e)}'
                    )
                )

        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS(f'Updated: {updated_count}'))
        self.stdout.write(self.style.WARNING(f'Skipped: {skipped_count}'))
        self.stdout.write(self.style.ERROR(f'Errors: {error_count}'))
        self.stdout.write('='*50)

    def scrape_example_sentences(self, word):
        """Scrape example sentences from Jisho.org."""
        try:
            url = f'https://jisho.org/search/{requests.utils.quote(word)}%23sentences'
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'lxml')
            examples = []

            # Find sentence entries (li elements with class='sentence')
            sentence_items = soup.find_all('li', class_='sentence')
            
            for item in sentence_items[:3]:  # Get up to 3 examples
                try:
                    # Find the sentence content div
                    content_div = item.find('div', class_='sentence_content')
                    if not content_div:
                        continue

                    # Get Japanese text from unlinked spans (excludes furigana)
                    japanese_parts = []
                    for span in content_div.find_all('span', class_='unlinked'):
                        japanese_parts.append(span.get_text())
                    japanese_text = ''.join(japanese_parts).strip()

                    # Get English translation
                    english_div = item.find('div', class_='english_sentence')
                    if not english_div:
                        continue
                    
                    english_span = english_div.find('span', class_='english')
                    if not english_span:
                        continue
                    
                    english = english_span.get_text(strip=True)

                    if japanese_text and english:
                        examples.append({
                            'japanese': japanese_text,
                            'english': english
                        })
                except Exception as e:
                    continue

            return examples[:2]  # Return up to 2 examples
        except Exception as e:
            self.stdout.write(f'Error scraping examples for {word}: {str(e)}')
            return []
