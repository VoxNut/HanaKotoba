"""
Django management command to bulk import vocabulary from Jisho API.

Usage:
    python manage.py import_jisho_vocabulary --file wordlist.txt
    python manage.py import_jisho_vocabulary --words 犬,猫,本
    python manage.py import_jisho_vocabulary --jlpt N5
"""

import time
import requests
import subprocess
import json
from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand, CommandError
from vocabulary.models import Vocabulary, Kanji


class Command(BaseCommand):
    help = 'Import vocabulary data from Jisho.org API'

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
            '--jlpt',
            type=str,
            choices=['N5', 'N4', 'N3', 'N2', 'N1'],
            help='Import common words for a specific JLPT level',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=None,
            help='Maximum number of words to import',
        )
        parser.add_argument(
            '--delay',
            type=float,
            default=1.0,
            help='Delay in seconds between API requests (default: 1.0)',
        )
        parser.add_argument(
            '--skip-existing',
            action='store_true',
            help='Skip words that already exist in the database',
        )

    def handle(self, *args, **options):
        words_to_import = []

        # Collect words from various sources
        if options['file']:
            words_to_import.extend(self.read_words_from_file(options['file']))
        
        if options['words']:
            words_to_import.extend([w.strip() for w in options['words'].split(',')])
        
        if options['jlpt']:
            words_to_import.extend(self.get_jlpt_words(options['jlpt']))

        if not words_to_import:
            raise CommandError(
                'No words to import. Use --file, --words, or --jlpt option.'
            )

        # Apply limit if specified
        if options['limit']:
            words_to_import = words_to_import[:options['limit']]

        self.stdout.write(f'Starting import of {len(words_to_import)} words...\n')

        imported_count = 0
        skipped_count = 0
        error_count = 0

        for i, word in enumerate(words_to_import, 1):
            try:
                # Skip if already exists
                if options['skip_existing'] and Vocabulary.objects.filter(word=word).exists():
                    self.stdout.write(f'[{i}/{len(words_to_import)}] Skipped (exists): {word}')
                    skipped_count += 1
                    continue

                # Fetch from Jisho API
                result = self.fetch_from_jisho(word)
                
                if result:
                    self.save_vocabulary(result)
                    imported_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'[{i}/{len(words_to_import)}] Imported: {word} ({result["reading"]})'
                        )
                    )
                else:
                    error_count += 1
                    self.stdout.write(
                        self.style.WARNING(
                            f'[{i}/{len(words_to_import)}] Not found: {word}'
                        )
                    )

                # Delay to avoid rate limiting
                if i < len(words_to_import):
                    time.sleep(options['delay'])

            except Exception as e:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(
                        f'[{i}/{len(words_to_import)}] Error importing {word}: {str(e)}'
                    )
                )

        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS(f'Imported: {imported_count}'))
        self.stdout.write(self.style.WARNING(f'Skipped: {skipped_count}'))
        self.stdout.write(self.style.ERROR(f'Errors: {error_count}'))
        self.stdout.write('='*50)

    def read_words_from_file(self, filepath):
        """Read words from a text file (one word per line)."""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                words = [line.strip() for line in f if line.strip() and not line.strip().startswith('#')]
            self.stdout.write(f'Read {len(words)} words from {filepath}')
            return words
        except FileNotFoundError:
            raise CommandError(f'File not found: {filepath}')
        except Exception as e:
            raise CommandError(f'Error reading file: {str(e)}')

    def get_jlpt_words(self, level):
        """Get a list of common words for the specified JLPT level."""
        # Common words for each JLPT level (sample - you can expand this)
        jlpt_words = {
            'N5': ['私', '本', '犬', '猫', '食べる', '飲む', '見る', '聞く', '話す', '書く',
                   '読む', '行く', '来る', 'する', '水', '火', '木', '金', '土', '日',
                   '月', '年', '時間', '今', '明日', '昨日', '朝', '昼', '夜', '学校',
                   '先生', '学生', '友達', '家', '部屋', '大きい', '小さい', '新しい', '古い', '良い'],
            'N4': ['会社', '仕事', '生活', '料理', '野菜', '肉', '魚', '果物', '天気', '季節',
                   '春', '夏', '秋', '冬', '暑い', '寒い', '暖かい', '涼しい', '楽しい', '悲しい',
                   '嬉しい', '怒る', '笑う', '泣く', '始める', '終わる', '働く', '休む', '歩く', '走る'],
            'N3': ['政治', '経済', '社会', '文化', '歴史', '科学', '技術', '自然', '環境', '問題',
                   '意見', '考え', '経験', '能力', '努力', '成功', '失敗', '困難', '簡単', '複雑'],
            'N2': ['現象', '傾向', '影響', '効果', '原因', '結果', '理由', '根拠', '方法', '手段',
                   '過程', '段階', '基準', '条件', '状況', '場合', '立場', '役割', '責任', '義務'],
            'N1': ['概念', '理論', '仮説', '法則', '原理', '本質', '側面', '観点', '視点', '見解',
                   '解釈', '認識', '意識', '思想', '哲学', '倫理', '価値', '規範', '体系', '構造'],
        }
        
        words = jlpt_words.get(level, [])
        self.stdout.write(f'Selected {len(words)} words for JLPT {level}')
        return words

    def fetch_from_jisho(self, word):
        """Fetch word data from Jisho.org official API."""
        try:
            url = f'https://jisho.org/api/v1/search/words?keyword={requests.utils.quote(word)}'
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if not data.get('data'):
                return None
            
            # Get the first (most relevant) result
            result = data['data'][0]
            
            # Extract Japanese word info
            japanese = result.get('japanese', [{}])[0]
            word_text = japanese.get('word', japanese.get('reading', ''))
            reading = japanese.get('reading', '')
            
            # Extract English meanings
            senses = result.get('senses', [])
            meanings = []
            parts_of_speech = []
            
            for sense in senses:
                meanings.extend(sense.get('english_definitions', []))
                parts_of_speech.extend(sense.get('parts_of_speech', []))
            
            meaning = '; '.join(meanings[:5])  # Limit to first 5 meanings
            pos = ', '.join(set(parts_of_speech[:3]))  # Limit to first 3 unique POS
            
            # Extract JLPT level by scraping the HTML page
            jlpt_level = self.scrape_jlpt_level(word)
            
            # Scrape example sentences
            example_sentences = self.scrape_example_sentences(word)
            
            # Check if it's a common word
            is_common = result.get('is_common', False)
            
            return {
                'word': word_text,
                'reading': reading,
                'meaning': meaning,
                'part_of_speech': pos,
                'jlpt_level': jlpt_level,
                'is_common': is_common,
                'example_sentences': example_sentences,
                'raw_data': result,
            }
            
        except requests.RequestException as e:
            self.stdout.write(self.style.ERROR(f'API request failed for {word}: {str(e)}'))
            return None
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error processing {word}: {str(e)}'))
            return None

    def save_vocabulary(self, data):
        """Save vocabulary data to the database."""
        # Create or update vocabulary entry
        vocab, created = Vocabulary.objects.update_or_create(
            word=data['word'],
            reading=data['reading'],
            defaults={
                'meaning': data['meaning'],
                'part_of_speech': data['part_of_speech'],
                'jlpt_level': data['jlpt_level'],
                'frequency_rank': 1 if data.get('is_common') else None,
                'example_sentences': data.get('example_sentences', []),
            }
        )
        
        # Link related kanji
        kanji_chars = [char for char in data['word'] if self.is_kanji(char)]
        for char in kanji_chars:
            try:
                kanji_obj = Kanji.objects.get(character=char)
                vocab.related_kanji.add(kanji_obj)
            except Kanji.DoesNotExist:
                pass  # Skip if kanji doesn't exist in DB
        
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
            return []
        except json.JSONDecodeError:
            return []
        except Exception as e:
            return []

    def is_kanji(self, char):
        """Check if a character is a kanji."""
        code = ord(char)
        # Common kanji Unicode ranges
        return (
            (0x4E00 <= code <= 0x9FFF) or  # CJK Unified Ideographs
            (0x3400 <= code <= 0x4DBF) or  # CJK Extension A
            (0xF900 <= code <= 0xFAFF)     # CJK Compatibility Ideographs
        )
