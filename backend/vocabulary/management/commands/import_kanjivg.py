"""
Import Kanji decomposition data (KanjiVG / preprocessed JSON) into Kanji.composition

Usage:
  python manage.py import_kanjivg --dir /path/to/kanjivg-json
  or
  python manage.py import_kanjivg --file /path/to/mapping.json

Expected input formats:
- Directory of per-kanji JSON files. Each file may be named by the kanji character
  (e.g. `木.json`) or by codepoint. Each file should contain at least:
    {
      "character": "木",
      "composition": ["木"]
    }

- Single JSON file mapping characters to composition arrays:
    {
      "木": ["木"],
      "本": ["木","一"]
    }

If a kanji from the data does not exist in the `Kanji` table, it will be skipped
and a warning printed. This command only writes the `composition` field.
"""
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from vocabulary.models import Kanji
import json
from pathlib import Path
from typing import Dict, Any


class Command(BaseCommand):
    help = 'Import Kanji decomposition data (KanjiVG preprocessed JSON) into Kanji.composition'

    def add_arguments(self, parser):
        parser.add_argument('--dir', help='Directory containing per-kanji JSON files')
        parser.add_argument('--file', help='Single JSON mapping file (character -> composition)')
        parser.add_argument('--dry-run', action='store_true', help='Show changes without saving')
        parser.add_argument('--create-missing', action='store_true', help='Create missing Kanji rows in the DB with minimal data')

    def handle(self, *args, **options):
        dir_path = options.get('dir')
        file_path = options.get('file')
        dry_run = options.get('dry_run', False)
        create_missing = options.get('create_missing', False)

        if not dir_path and not file_path:
            raise CommandError('Specify either --dir or --file')

        mapping: Dict[str, Any] = {}

        if file_path:
            p = Path(file_path)
            if not p.exists():
                raise CommandError(f'File not found: {file_path}')
            data = json.loads(p.read_text(encoding='utf-8'))
            # If file already maps char -> composition
            if all(isinstance(v, list) for v in data.values()):
                mapping = data
            else:
                # Maybe list of objects
                for item in data:
                    ch = item.get('character') or item.get('kanji')
                    comp = item.get('composition') or item.get('components') or item.get('decomposition')
                    if ch and comp:
                        mapping[ch] = comp

        if dir_path:
            p = Path(dir_path)
            if not p.exists() or not p.is_dir():
                raise CommandError(f'Directory not found: {dir_path}')
            for f in p.iterdir():
                if f.is_file() and f.suffix.lower() in ('.json',):
                    try:
                        data = json.loads(f.read_text(encoding='utf-8'))
                        ch = data.get('character') or data.get('kanji') or None
                        comp = data.get('composition') or data.get('components') or data.get('decomposition')
                        if not ch:
                            # try filename as character
                            try:
                                ch = f.stem
                            except Exception:
                                ch = None
                        if ch and comp:
                            mapping[ch] = comp
                    except Exception as e:
                        self.stdout.write(self.style.WARNING(f'Failed to parse {f.name}: {e}'))

        if not mapping:
            raise CommandError('No composition data found in provided input')

        total = 0
        updated = 0
        created_count = 0

        for ch, comp in mapping.items():
            total += 1
            try:
                kanji = Kanji.objects.filter(character=ch).first()
                if not kanji:
                    if create_missing:
                        if dry_run:
                            self.stdout.write(self.style.WARNING(f'Would create Kanji in DB: {ch}'))
                            created_count += 1
                            continue
                        # create minimal Kanji row
                        try:
                            kanji = Kanji.objects.create(
                                character=ch,
                                meaning="",
                                kun_reading="",
                                on_reading="",
                                jlpt_level=None,
                                stroke_count=0,
                                radical="",
                                frequency_rank=None,
                                examples=[],
                                composition=comp,
                            )
                            created_count += 1
                            continue
                        except Exception as ce:
                            self.stdout.write(self.style.ERROR(f'Failed to create Kanji {ch}: {ce}'))
                            continue
                    else:
                        self.stdout.write(self.style.WARNING(f'Kanji not found in DB: {ch} (skipped)'))
                        continue

                if dry_run:
                    self.stdout.write(f'Would update {ch}: composition={comp}')
                    updated += 1
                    continue

                with transaction.atomic():
                    kanji.composition = comp
                    kanji.save(update_fields=['composition', 'updated_at'])
                    updated += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error updating {ch}: {e}'))

        # Print created count if any
        if created_count:
            self.stdout.write(self.style.SUCCESS(f'Processed {total} entries, updated {updated} kanji, created {created_count} kanji'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Processed {total} entries, updated {updated} kanji'))
