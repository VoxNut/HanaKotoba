# Jisho API Vocabulary Import - Complete Setup Summary

## What Was Created

I've set up a complete solution for bulk importing vocabulary from Jisho.org into your HanaKotoba database:

### 1. **Django Management Commands** (2 commands)

#### Basic Import: `import_jisho_vocabulary`

- **Location**: `backend/vocabulary/management/commands/import_jisho_vocabulary.py`
- **Purpose**: Simple, reliable vocabulary import
- **Features**:
  - Import from file or word list
  - JLPT level presets (N5-N1)
  - Skip existing words
  - Rate limiting with configurable delay
  - Auto-links related kanji

#### Advanced Import: `import_jisho_advanced`

- **Location**: `backend/vocabulary/management/commands/import_jisho_advanced.py`
- **Purpose**: Advanced features for large imports
- **Features**:
  - Everything from basic import
  - Example sentence fetching (placeholder)
  - Audio URL scraping (placeholder)
  - Progress saving and resuming
  - Batch processing
  - Transaction safety

### 2. **Standalone Python Script**

#### Jisho Fetcher: `jisho_fetcher.py`

- **Location**: `backend/scripts/jisho_fetcher.py`
- **Purpose**: Fetch data without Django, export to JSON
- **Use Case**:
  - Pre-fetch data for review
  - Use outside Django
  - Create custom datasets

### 3. **Sample Data Files**

- `backend/scripts/sample_wordlist.txt` - 50 common N5 words
- `backend/scripts/jlpt_n5_comprehensive.txt` - 200+ comprehensive N5 vocabulary

### 4. **Documentation**

- `JISHO_IMPORT_GUIDE.md` - Comprehensive guide with examples
- `JISHO_QUICK_REFERENCE.md` - Quick command reference
- `README_JISHO_SETUP.md` - This summary document

### 5. **Test Script**

- `backend/scripts/test_jisho_import.py` - Test suite to verify everything works

---

## Quick Start Guide

### Step 1: Test the Setup

```bash
cd backend
python scripts/test_jisho_import.py
```

### Step 2: Import Sample Data

```bash
# Import 10 common words
python manage.py import_jisho_vocabulary --words "犬,猫,本,学校,先生,食べる,飲む,見る,行く,来る"
```

### Step 3: Import from File

```bash
# Import from sample word list
python manage.py import_jisho_vocabulary --file scripts/sample_wordlist.txt --skip-existing

# Import comprehensive N5 list
python manage.py import_jisho_vocabulary --file scripts/jlpt_n5_comprehensive.txt --skip-existing
```

### Step 4: Verify in Django Admin

```bash
python manage.py runserver
# Visit http://localhost:8000/admin/vocabulary/vocabulary/
```

---

## How It Works

### Data Flow

```
Jisho.org API
     ↓
Django Management Command
     ↓
Parse & Extract Data
     ↓
Save to Database (Vocabulary model)
     ↓
Auto-link Related Kanji
```

### API Endpoint Used

```
https://jisho.org/api/v1/words/{word}
```

This is the official Jisho API (same as `searchForPhrase` in unofficial-jisho-api).

### Data Extracted

- Word (kanji/kana)
- Reading (hiragana/katakana)
- Meaning (English definitions)
- Part of speech
- JLPT level
- Common word flag
- Related kanji (auto-linked)

---

## Common Use Cases

### 1. Build Core Vocabulary (N5)

```bash
python manage.py import_jisho_vocabulary \
  --file scripts/jlpt_n5_comprehensive.txt \
  --skip-existing \
  --delay 1.0
```

### 2. Import Custom Study List

```bash
# Create your_words.txt with your words
python manage.py import_jisho_vocabulary \
  --file your_words.txt \
  --skip-existing
```

### 3. Large Import with Progress Tracking

```bash
python manage.py import_jisho_advanced \
  --file large_wordlist.txt \
  --save-progress progress.json \
  --batch-size 20 \
  --delay 1.5
```

### 4. Export to JSON First (Review Before Import)

```bash
cd backend/scripts
python jisho_fetcher.py \
  --file wordlist.txt \
  --output review.json \
  --pretty
```

---

## File Structure

```
HanaKotoba/
├── JISHO_IMPORT_GUIDE.md          # Comprehensive documentation
├── JISHO_QUICK_REFERENCE.md       # Quick command reference
├── README_JISHO_SETUP.md          # This file
│
└── backend/
    ├── vocabulary/
    │   └── management/
    │       └── commands/
    │           ├── import_jisho_vocabulary.py      # Basic import
    │           └── import_jisho_advanced.py        # Advanced import
    │
    └── scripts/
        ├── sample_wordlist.txt                # 50 sample words
        ├── jlpt_n5_comprehensive.txt          # 200+ N5 words
        ├── jisho_fetcher.py                   # Standalone fetcher
        └── test_jisho_import.py               # Test suite
```

---

## Integration with Your App

### Current Database Models Used

**Vocabulary Model** (`vocabulary/models.py`):

```python
- word: CharField (Japanese word)
- reading: CharField (kana reading)
- meaning: TextField (English meaning)
- part_of_speech: CharField
- jlpt_level: CharField (N5/N4/N3/N2/N1)
- frequency_rank: IntegerField
- example_sentences: JSONField (for future use)
- related_kanji: ManyToManyField(Kanji)
- audio_url: URLField (for future use)
```

**Kanji Model** (`vocabulary/models.py`):

- Automatically linked when vocabulary contains kanji characters

### Future Enhancements

The advanced command includes placeholders for:

1. **Example Sentences**: Scrape from Jisho's sentence search
2. **Audio URLs**: Extract audio file URLs from Jisho pages
3. **Pitch Accent**: Could be added from external sources

To implement these, you would need:

```bash
pip install beautifulsoup4 lxml
```

Then enhance the scraping methods in `import_jisho_advanced.py`.

---

## API Rate Limiting

### Recommended Settings

- **Delay**: 1.0-2.0 seconds between requests
- **Batch Size**: 10-20 words per transaction
- **Total**: Stay under ~1000 words per session

### Jisho.org API Terms

- Permission granted for scraping (see unofficial-jisho-api docs)
- Official API (`searchForPhrase`) has no explicit rate limit
- Be respectful: use appropriate delays

---

## Troubleshooting

### Common Issues

| Issue                         | Solution                            |
| ----------------------------- | ----------------------------------- |
| ModuleNotFoundError: requests | Run `pip install requests`          |
| No words imported             | Check file encoding (must be UTF-8) |
| Rate limiting errors          | Increase `--delay` parameter        |
| Kanji not linking             | Run kanji import first              |
| Database locked               | Close other Django processes        |

### Debug Commands

```bash
# Check vocabulary count
python manage.py shell -c "from vocabulary.models import Vocabulary; print(Vocabulary.objects.count())"

# Check JLPT N5 count
python manage.py shell -c "from vocabulary.models import Vocabulary; print(Vocabulary.objects.filter(jlpt_level='N5').count())"

# View recent imports
python manage.py shell
>>> from vocabulary.models import Vocabulary
>>> for v in Vocabulary.objects.order_by('-created_at')[:5]:
...     print(f"{v.word} ({v.reading})")
```

---

## Next Steps

### Immediate Actions

1. ✅ Run test suite: `python scripts/test_jisho_import.py`
2. ✅ Import sample data: `python manage.py import_jisho_vocabulary --file scripts/sample_wordlist.txt`
3. ✅ Verify in admin panel
4. ✅ Test in frontend

### Future Enhancements

- [ ] Add BeautifulSoup for example sentence scraping
- [ ] Implement audio URL extraction
- [ ] Add pitch accent data integration
- [ ] Create vocabulary export command
- [ ] Add duplicate detection improvements
- [ ] Implement batch update for existing entries

### Integration with Frontend

Once vocabulary is imported, update your frontend:

- Fetch from `/api/vocabulary/` endpoint
- Display in vocabulary lists
- Use in flashcard system
- Integrate with SRS

---

## Resources

### Documentation Files

- **Full Guide**: `JISHO_IMPORT_GUIDE.md`
- **Quick Reference**: `JISHO_QUICK_REFERENCE.md`
- **This Summary**: `README_JISHO_SETUP.md`

### External Links

- [Jisho.org](https://jisho.org/)
- [Unofficial Jisho API Docs](https://mistval.github.io/unofficial-jisho-api/)
- [Official Jisho API Discussion](https://jisho.org/forum/54fefc1f6e73340b1f160000-is-there-any-kind-of-search-api)

### Support

- Check Django logs for errors
- Review command source code for customization
- Test API responses manually at: https://jisho.org/api/v1/words/犬

---

## Summary

You now have a complete solution for bulk importing vocabulary from Jisho.org:

✅ **2 Django management commands** (basic + advanced)  
✅ **1 standalone Python script** (for JSON export)  
✅ **Sample word lists** (50 + 200+ words)  
✅ **Comprehensive documentation** (3 guides)  
✅ **Test suite** (verify everything works)

**Ready to start?** Run the test suite and import your first words! 🎉
