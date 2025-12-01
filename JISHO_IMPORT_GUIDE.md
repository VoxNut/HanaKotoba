# Jisho API Vocabulary Import Guide

This guide explains how to bulk import vocabulary into your HanaKotoba database using the Jisho.org API.

## Overview

The `import_jisho_vocabulary` management command fetches vocabulary data from Jisho.org's official API and saves it to your database. It supports multiple import methods and includes features like rate limiting, duplicate detection, and error handling.

## Prerequisites

- Django backend running
- `requests` library installed (already in requirements.txt)
- Internet connection to access Jisho.org API

## Usage Methods

### 1. Import from a Text File

Create a text file with one word per line:

```bash
cd backend
python manage.py import_jisho_vocabulary --file scripts/sample_wordlist.txt
```

### 2. Import Specific Words

Import a comma-separated list of words:

```bash
python manage.py import_jisho_vocabulary --words "犬,猫,本,学校,先生"
```

### 3. Import JLPT Level Words

Import common words for a specific JLPT level:

```bash
python manage.py import_jisho_vocabulary --jlpt N5
python manage.py import_jisho_vocabulary --jlpt N4
python manage.py import_jisho_vocabulary --jlpt N3
```

## Advanced Options

### Limit Number of Imports

```bash
python manage.py import_jisho_vocabulary --file wordlist.txt --limit 50
```

### Skip Existing Words

Avoid re-importing words already in the database:

```bash
python manage.py import_jisho_vocabulary --file wordlist.txt --skip-existing
```

### Adjust API Delay

Change the delay between API requests (default: 1 second):

```bash
# Faster (use cautiously to avoid rate limiting)
python manage.py import_jisho_vocabulary --file wordlist.txt --delay 0.5

# Slower (more polite to Jisho servers)
python manage.py import_jisho_vocabulary --file wordlist.txt --delay 2.0
```

### Combined Options

```bash
python manage.py import_jisho_vocabulary \
  --file wordlist.txt \
  --limit 100 \
  --delay 1.5 \
  --skip-existing
```

## What Gets Imported

For each word, the command imports:

- **Word**: Japanese word (kanji/kana)
- **Reading**: Hiragana/katakana reading
- **Meaning**: English definitions (up to 5)
- **Part of Speech**: Grammatical category
- **JLPT Level**: If tagged on Jisho
- **Related Kanji**: Automatically links to existing Kanji in your database

## API Details

The command uses the official Jisho.org API:

- Endpoint: `https://jisho.org/api/v1/words/{word}`
- No API key required
- Be respectful with request rates (default 1 second delay)

## Example Output

```
Starting import of 50 words...

[1/50] Imported: 犬 (いぬ)
[2/50] Imported: 猫 (ねこ)
[3/50] Skipped (exists): 本
[4/50] Imported: 学校 (がっこう)
...
==================================================
Imported: 45
Skipped: 3
Errors: 2
==================================================
```

## Creating Custom Word Lists

### Format Requirements

- One word per line
- UTF-8 encoding
- Both kanji and kana acceptable
- Empty lines are ignored

### Example `my_words.txt`:

```
桜
寿司
温泉
富士山
新幹線
```

### Import:

```bash
python manage.py import_jisho_vocabulary --file my_words.txt
```

## Troubleshooting

### "No words to import" Error

Make sure you specify at least one source:

```bash
python manage.py import_jisho_vocabulary --words "犬,猫"
```

### "File not found" Error

Check the file path is correct (relative to backend directory):

```bash
# Correct
python manage.py import_jisho_vocabulary --file scripts/sample_wordlist.txt

# Incorrect (if running from backend/)
python manage.py import_jisho_vocabulary --file ../scripts/sample_wordlist.txt
```

### Rate Limiting

If you get rate limited, increase the delay:

```bash
python manage.py import_jisho_vocabulary --file wordlist.txt --delay 2.0
```

### Network Errors

- Check your internet connection
- Verify Jisho.org is accessible
- Try increasing the timeout in the code if needed

## Extending the Word Lists

### JLPT Lists

The built-in JLPT lists contain sample words. To expand them:

1. Edit `backend/vocabulary/management/commands/import_jisho_vocabulary.py`
2. Find the `get_jlpt_words()` method
3. Add more words to the appropriate level

### Creating Comprehensive Lists

You can find comprehensive JLPT word lists from:

- JLPT official resources
- Anki decks (export as text)
- Online JLPT study sites
- WaniKani vocabulary exports

## Best Practices

1. **Start Small**: Test with a small list first
2. **Use Skip-Existing**: Avoid duplicates with `--skip-existing`
3. **Respect Rate Limits**: Use appropriate delays (1-2 seconds)
4. **Review Imports**: Check the database after importing
5. **Backup First**: Always backup your database before bulk imports

## Next Steps

After importing vocabulary:

1. **Verify Data**: Check the Django admin panel
2. **Link Kanji**: Ensure kanji relationships are correct
3. **Add Audio**: Consider fetching audio URLs from Jisho
4. **Generate Examples**: Import example sentences if needed

## Using with Docker

If running in Docker:

```bash
docker-compose exec backend python manage.py import_jisho_vocabulary --words "犬,猫,本"
```

## Alternative: Direct API Usage

For custom integrations, you can also use the Jisho API directly:

```python
import requests

response = requests.get('https://jisho.org/api/v1/words/犬')
data = response.json()
```

See the unofficial-jisho-api documentation for more advanced features like:

- Kanji search
- Example sentences
- Phrase scraping
- HTML parsing

## Support

For issues or questions:

- Check Django logs
- Review the command source code
- Test API responses manually
- Check Jisho.org status
