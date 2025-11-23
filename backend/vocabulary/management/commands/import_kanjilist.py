import os
import json
from django.core.management.base import BaseCommand
from vocabulary.models import Kanji

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..', 'data'))
KANJILIST_PATH = os.path.join(DATA_DIR, 'kanjilist.json')
KANJI_JSON_DIR = os.path.join(DATA_DIR, 'kanji')
COMPOSITION_PATH = os.path.join(DATA_DIR, 'composition.json')
SEARCHLIST_PATH = os.path.join(DATA_DIR, 'searchlist.json')
KANJIVG_PATH = os.path.join(DATA_DIR, 'kanjivg.xml')
SVG_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..', 'frontend/public/svgs/kanji'))


def get_svg_path(kanji_char):
    # SVGs are expected to be named as <kanji>.svg in SVG_DIR
    filename = f"{kanji_char}.svg"
    path = os.path.join(SVG_DIR, filename)
    if os.path.exists(path):
        # Store relative path for frontend use
        return f"svgs/kanji/{filename}"
    # Fallback: no svg found
    return ""


def load_per_kanji_jsons():
    items = {}
    if not os.path.isdir(KANJI_JSON_DIR):
        return items
    for fname in os.listdir(KANJI_JSON_DIR):
        if not fname.endswith('.json'):
            continue
        path = os.path.join(KANJI_JSON_DIR, fname)
        try:
            with open(path, encoding='utf-8') as f:
                data = json.load(f)
                char = data.get('id') or data.get('kanji') or os.path.splitext(fname)[0]
                items[str(char)] = data
        except Exception:
            continue
    return items


def build_composition_map():
    # Build a mapping char -> [components]
    comp_map = {}
    if not os.path.exists(COMPOSITION_PATH):
        return comp_map
    try:
        with open(COMPOSITION_PATH, encoding='utf-8') as f:
            data = json.load(f)
    except Exception:
        return comp_map

    # data maps component -> {in:[], out:[]}
    for comp, rel in data.items():
        outs = rel.get('out', []) or []
        for target in outs:
            comp_map.setdefault(target, []).append(comp)
    return comp_map


def load_searchlist():
    if not os.path.exists(SEARCHLIST_PATH):
        return {}
    try:
        with open(SEARCHLIST_PATH, encoding='utf-8') as f:
            arr = json.load(f)
            # Expecting an array of objects with a 'kanji' key
            return {str(item.get('kanji')): item for item in arr if item.get('kanji')}
    except Exception:
        return {}


def load_kanjivg_map():
    """Parse `kanjivg.xml` and return a mapping {character: svg_text}.
    The returned svg_text is a complete `<svg>` string containing the <g> for the character.
    """
    mapping = {}
    if not os.path.exists(KANJIVG_PATH):
        return mapping
    try:
        import xml.etree.ElementTree as ET
        # Parse once
        tree = ET.parse(KANJIVG_PATH)
        root = tree.getroot()
        # kvg namespace
        kvg_ns = 'http://kanjivg.tagaini.net'
        for kanji in root.findall('kanji'):
            g = kanji.find('g')
            if g is None:
                continue
            # element attribute is namespaced
            ch = g.get(f'{{{kvg_ns}}}element') or g.get('kvg:element')
            if not ch:
                continue
            # convert g element back to string
            try:
                g_str = ET.tostring(g, encoding='unicode')
                full_svg = f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 109 109'>{g_str}</svg>"
                mapping[str(ch)] = full_svg
            except Exception:
                continue
    except Exception:
        return mapping
    return mapping


class Command(BaseCommand):
    help = "Import Kanji data from data folder and associate SVGs"

    def handle(self, *args, **options):
        # Load sources
        kanji_list = []
        if os.path.exists(KANJILIST_PATH):
            with open(KANJILIST_PATH, encoding='utf-8') as f:
                kanji_list = json.load(f)

        per_kanji = load_per_kanji_jsons()
        comp_map = build_composition_map()
        search_map = load_searchlist()
        kanjivg_map = load_kanjivg_map()

        # Build a set of characters to process (union of sources)
        chars = set()
        for e in kanji_list:
            k = e.get('kanji')
            if k:
                chars.add(k)
        chars.update(per_kanji.keys())
        chars.update(search_map.keys())

        created_count = 0
        updated_count = 0

        for char in sorted(chars):
            # Baseline entry from kanjilist
            entry = next((e for e in kanji_list if e.get('kanji') == char), {})
            pkj = per_kanji.get(char, {})
            s_entry = search_map.get(char, {})

            # meaning: prefer jishoData -> kanjialive -> kanjilist
            meaning = ''
            try:
                meaning = (pkj.get('jishoData') or {}).get('meaning') or (pkj.get('kanjialiveData') or {}).get('kanji', {}).get('meaning', {}).get('english')
            except Exception:
                meaning = None
            if not meaning:
                meaning = entry.get('meaning') or s_entry.get('meaning') or ''

            # readings
            kun = ''
            on = ''
            if pkj.get('jishoData'):
                try:
                    kun = ','.join(pkj.get('jishoData', {}).get('kunyomi') or [])
                    on = ','.join(pkj.get('jishoData', {}).get('onyomi') or [])
                except Exception:
                    kun = entry.get('kunyomi', '')
                    on = entry.get('onyomi', '')
            else:
                kun = entry.get('kunyomi', '') or (pkj.get('kanjialiveData') or {}).get('kunyomi') or ''
                on = entry.get('onyomi', '') or (pkj.get('kanjialiveData') or {}).get('onyomi') or ''

            # stroke count
            stroke_count = entry.get('strokes') or entry.get('stroke_count') or 0
            try:
                if pkj.get('jishoData') and pkj.get('jishoData').get('strokeCount'):
                    stroke_count = pkj.get('jishoData').get('strokeCount')
                elif pkj.get('kanjialiveData') and (pkj.get('kanjialiveData') or {}).get('kanji', {}).get('strokes', {}).get('count'):
                    stroke_count = (pkj.get('kanjialiveData') or {}).get('kanji', {}).get('strokes', {}).get('count')
                elif pkj.get('kanjialiveData') and (pkj.get('kanjialiveData') or {}).get('kstroke'):
                    stroke_count = (pkj.get('kanjialiveData') or {}).get('kstroke')
            except Exception:
                pass

            # radical and frequency
            radical = entry.get('radical') or (pkj.get('jishoData') or {}).get('radical', {}).get('symbol') or (pkj.get('kanjialiveData') or {}).get('radical', {}).get('character', '')
            frequency = entry.get('frequency') or None
            if not frequency:
                try:
                    freq = pkj.get('jishoData', {}).get('newspaperFrequencyRank')
                    if freq:
                        frequency = int(freq)
                except Exception:
                    frequency = None

            # examples: combine sources into a simple list of strings
            examples = []
            try:
                kl_examples = entry.get('examples') or []
                for ex in kl_examples:
                    if isinstance(ex, dict):
                        examples.append(ex.get('japanese') or ex.get('word') or json.dumps(ex, ensure_ascii=False))
                    else:
                        examples.append(str(ex))
            except Exception:
                pass
            try:
                kj_examples = (pkj.get('kanjialiveData') or {}).get('examples') or []
                for ex in kj_examples:
                    jp = ex.get('japanese')
                    eng = ex.get('meaning', {}).get('english') if ex.get('meaning') else None
                    if jp and eng:
                        examples.append(f"{jp} — {eng}")
                    elif jp:
                        examples.append(jp)
            except Exception:
                pass
            try:
                jisho_k_ex = pkj.get('jishoData', {}).get('kunyomiExamples') or pkj.get('jishoData', {}).get('onyomiExamples') or []
                for ex in jisho_k_ex:
                    examples.append(ex.get('example') or ex.get('reading') or '')
            except Exception:
                pass

            # composition: from composition.json mapping (components that make this char)
            composition = entry.get('composition') or pkj.get('composition') or comp_map.get(char, [])

            defaults = {
                'meaning': meaning or '',
                'kun_reading': kun or '',
                'on_reading': on or '',
                'jlpt_level': entry.get('jlpt', None) or (pkj.get('jishoData') or {}).get('jlptLevel') or None,
                'stroke_count': stroke_count or 0,
                'radical': radical or '',
                'frequency_rank': frequency,
                'examples': examples,
                'composition': composition or [],
                'svg_data': kanjivg_map.get(char) or '',
            }

            obj, created = Kanji.objects.update_or_create(character=char, defaults=defaults)
            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(self.style.SUCCESS(f"Kanji import complete. Created: {created_count}, Updated: {updated_count}, Total processed: {len(chars)}"))
