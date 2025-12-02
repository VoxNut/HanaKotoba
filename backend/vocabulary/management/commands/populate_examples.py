"""
Django management command to populate example sentences for existing vocabulary.

Usage:
    python manage.py populate_examples --limit 50
    python manage.py populate_examples --all
    python manage.py populate_examples --jlpt N5
"""

import time
import subprocess
import json
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
        """Fetch example sentences using unofficial-jisho-api via Node.js."""
        try:
            # Create a Node.js script to fetch examples
            node_script = f"""
const JishoAPI = require('unofficial-jisho-api');
const jisho = new JishoAPI();

jisho.searchForExamples('{word}').then(result => {{
    const examples = [];
    for (let i = 0; i < Math.min(3, result.results.length); i++) {{
        const example = result.results[i];
        examples.push({{
            kanji: example.kanji,
            kana: example.kana,
            english: example.english
        }});
    }}
    console.log(JSON.stringify(examples));
}}).catch(err => {{
    console.error('Error:', err.message);
    process.exit(1);
}});
"""
            
            # Run Node.js script
            result = subprocess.run(
                ['node', '-e', node_script],
                capture_output=True,
                text=True,
                encoding='utf-8',
                timeout=10
            )
            
            if result.returncode != 0:
                return []
            
            # Parse the JSON output
            output = result.stdout.strip() if result.stdout else '[]'
            examples_data = json.loads(output)
            examples = []
            
            for ex in examples_data[:2]:  # Return up to 2 examples
                japanese = ex.get('kanji', '') or ex.get('kana', '')
                english = ex.get('english', '')
                
                if japanese and english:
                    examples.append({
                        'japanese': japanese,
                        'english': english
                    })
            
            return examples
            
        except subprocess.TimeoutExpired:
            self.stdout.write(f'Timeout fetching examples for {word}')
            return []
        except json.JSONDecodeError:
            self.stdout.write(f'Invalid JSON response for {word}')
            return []
        except Exception as e:
            self.stdout.write(f'Error fetching examples for {word}: {str(e)}')
            return []
