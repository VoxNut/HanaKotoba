# Quick Reference: Jisho API Vocabulary Import

## Fast Start (3 Commands)

### 1. Basic Import - Specific Words

```bash
cd backend
python manage.py import_jisho_vocabulary --words "犬,猫,本,学校,先生"
```

### 2. Import from File

```bash
python manage.py import_jisho_vocabulary --file scripts/sample_wordlist.txt
```

### 3. Import JLPT Level

```bash
python manage.py import_jisho_vocabulary --jlpt N5 --skip-existing
```

---

## All Commands at a Glance

### Basic Import Command

```bash
# Single word
python manage.py import_jisho_vocabulary --words "犬"

# Multiple words
python manage.py import_jisho_vocabulary --words "犬,猫,本"

# From file
python manage.py import_jisho_vocabulary --file wordlist.txt

# JLPT level
python manage.py import_jisho_vocabulary --jlpt N5

# Skip existing entries
python manage.py import_jisho_vocabulary --file wordlist.txt --skip-existing

# Limit number
python manage.py import_jisho_vocabulary --file wordlist.txt --limit 50

# Adjust delay
python manage.py import_jisho_vocabulary --file wordlist.txt --delay 2.0
```

### Advanced Import Command

```bash
# With example sentences
python manage.py import_jisho_advanced --file wordlist.txt --with-examples

# With audio URLs
python manage.py import_jisho_advanced --file wordlist.txt --with-audio

# Save progress for resuming
python manage.py import_jisho_advanced --file large_list.txt --save-progress progress.json

# Resume from specific position
python manage.py import_jisho_advanced --file large_list.txt --resume-from 500

# Batch processing
python manage.py import_jisho_advanced --file wordlist.txt --batch-size 20
```

### Standalone Fetcher Script

```bash
cd backend/scripts

# Fetch to JSON
python jisho_fetcher.py --words "犬,猫,本" --output vocab.json

# From file to JSON
python jisho_fetcher.py --file wordlist.txt --output vocab.json --pretty

# Quiet mode
python jisho_fetcher.py --file wordlist.txt --output vocab.json --quiet
```

---

## Common Workflows

### Import 100 N5 Words

```bash
python manage.py import_jisho_vocabulary \
  --jlpt N5 \
  --limit 100 \
  --skip-existing \
  --delay 1.0
```

### Resume Large Import

```bash
# First run (stopped at word 500)
python manage.py import_jisho_advanced \
  --file large_list.txt \
  --save-progress progress.json

# Resume from where it stopped
python manage.py import_jisho_advanced \
  --file large_list.txt \
  --resume-from 500
```

### Import with All Features

```bash
python manage.py import_jisho_advanced \
  --file wordlist.txt \
  --with-examples \
  --with-audio \
  --batch-size 10 \
  --delay 2.0 \
  --skip-existing \
  --save-progress progress.json
```

---

## File Format Examples

### Simple Word List (`wordlist.txt`)

```
犬
猫
本
学校
先生
```

### With Comments

```
# JLPT N5 Animals
犬
猫
魚

# JLPT N5 School
学校
先生
学生
```

---

## Docker Commands

```bash
# Basic import in Docker
docker-compose exec backend python manage.py import_jisho_vocabulary --words "犬,猫,本"

# From file in Docker
docker-compose exec backend python manage.py import_jisho_vocabulary --file scripts/sample_wordlist.txt

# Advanced import in Docker
docker-compose exec backend python manage.py import_jisho_advanced --file scripts/sample_wordlist.txt --with-examples
```

---

## Verification Commands

### Check Database

```bash
# Django shell
python manage.py shell

# In shell:
from vocabulary.models import Vocabulary
print(Vocabulary.objects.count())  # Total count
print(Vocabulary.objects.filter(jlpt_level='N5').count())  # N5 words
```

### View Recent Imports

```python
# In Django shell
from vocabulary.models import Vocabulary
recent = Vocabulary.objects.order_by('-created_at')[:10]
for v in recent:
    print(f"{v.word} ({v.reading}) - {v.meaning[:50]}")
```

---

## Troubleshooting

| Problem         | Solution                                    |
| --------------- | ------------------------------------------- |
| Rate limiting   | Increase `--delay` to 2.0 or higher         |
| File not found  | Use full path or check current directory    |
| Duplicates      | Add `--skip-existing` flag                  |
| Network timeout | Check internet connection, retry            |
| Memory issues   | Use smaller batch sizes with `--batch-size` |

---

## API Response Example

```json
{
  "word": "犬",
  "reading": "いぬ",
  "meaning": "dog",
  "part_of_speech": "Noun",
  "jlpt_level": "N5",
  "is_common": true
}
```

---

## Performance Tips

1. **Start small**: Test with 10-20 words first
2. **Use skip-existing**: Avoid re-importing
3. **Appropriate delay**: 1.0-2.0 seconds is safe
4. **Batch processing**: Use `--batch-size` for large imports
5. **Save progress**: Use `--save-progress` for large lists

---

## Next Steps After Import

1. ✓ Verify imports in Django admin
2. ✓ Check kanji relationships
3. ✓ Review JLPT levels
4. ✓ Test vocabulary in frontend
5. ✓ Add to SRS system
