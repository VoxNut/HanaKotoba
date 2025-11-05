"""
Management command to import sample kanji data
This uses a curated list of common JLPT kanji
"""
from django.core.management.base import BaseCommand
from vocabulary.models import Kanji


class Command(BaseCommand):
    help = 'Import sample kanji data for testing'

    def handle(self, *args, **options):
        sample_kanji = [
            # N5 Kanji (80 characters)
            {'character': '一', 'meaning': 'one', 'kun_reading': 'ひと、ひとつ', 'on_reading': 'イチ、イツ', 'jlpt_level': 'N5', 'stroke_count': 1, 'radical': '一', 'frequency_rank': 2},
            {'character': '二', 'meaning': 'two', 'kun_reading': 'ふた、ふたつ', 'on_reading': 'ニ', 'jlpt_level': 'N5', 'stroke_count': 2, 'radical': '二', 'frequency_rank': 9},
            {'character': '三', 'meaning': 'three', 'kun_reading': 'み、みつ、みっつ', 'on_reading': 'サン', 'jlpt_level': 'N5', 'stroke_count': 3, 'radical': '一', 'frequency_rank': 14},
            {'character': '四', 'meaning': 'four', 'kun_reading': 'よ、よつ、よっつ、よん', 'on_reading': 'シ', 'jlpt_level': 'N5', 'stroke_count': 5, 'radical': '囗', 'frequency_rank': 19},
            {'character': '五', 'meaning': 'five', 'kun_reading': 'いつ、いつつ', 'on_reading': 'ゴ', 'jlpt_level': 'N5', 'stroke_count': 4, 'radical': '二', 'frequency_rank': 23},
            {'character': '六', 'meaning': 'six', 'kun_reading': 'む、むつ、むっつ、むい', 'on_reading': 'ロク', 'jlpt_level': 'N5', 'stroke_count': 4, 'radical': '八', 'frequency_rank': 27},
            {'character': '七', 'meaning': 'seven', 'kun_reading': 'なな、ななつ、なの', 'on_reading': 'シチ', 'jlpt_level': 'N5', 'stroke_count': 2, 'radical': '一', 'frequency_rank': 30},
            {'character': '八', 'meaning': 'eight', 'kun_reading': 'や、やつ、やっつ、よう', 'on_reading': 'ハチ', 'jlpt_level': 'N5', 'stroke_count': 2, 'radical': '八', 'frequency_rank': 25},
            {'character': '九', 'meaning': 'nine', 'kun_reading': 'ここの、ここのつ', 'on_reading': 'キュウ、ク', 'jlpt_level': 'N5', 'stroke_count': 2, 'radical': '乙', 'frequency_rank': 33},
            {'character': '十', 'meaning': 'ten', 'kun_reading': 'とお、と', 'on_reading': 'ジュウ、ジッ', 'jlpt_level': 'N5', 'stroke_count': 2, 'radical': '十', 'frequency_rank': 5},
            
            {'character': '日', 'meaning': 'sun, day', 'kun_reading': 'ひ、び、か', 'on_reading': 'ニチ、ジツ', 'jlpt_level': 'N5', 'stroke_count': 4, 'radical': '日', 'frequency_rank': 1},
            {'character': '月', 'meaning': 'moon, month', 'kun_reading': 'つき', 'on_reading': 'ゲツ、ガツ', 'jlpt_level': 'N5', 'stroke_count': 4, 'radical': '月', 'frequency_rank': 16},
            {'character': '火', 'meaning': 'fire', 'kun_reading': 'ひ、ほ', 'on_reading': 'カ', 'jlpt_level': 'N5', 'stroke_count': 4, 'radical': '火', 'frequency_rank': 142},
            {'character': '水', 'meaning': 'water', 'kun_reading': 'みず', 'on_reading': 'スイ', 'jlpt_level': 'N5', 'stroke_count': 4, 'radical': '水', 'frequency_rank': 151},
            {'character': '木', 'meaning': 'tree, wood', 'kun_reading': 'き、こ', 'on_reading': 'モク、ボク', 'jlpt_level': 'N5', 'stroke_count': 4, 'radical': '木', 'frequency_rank': 124},
            {'character': '金', 'meaning': 'gold, money', 'kun_reading': 'かね、かな', 'on_reading': 'キン、コン', 'jlpt_level': 'N5', 'stroke_count': 8, 'radical': '金', 'frequency_rank': 73},
            {'character': '土', 'meaning': 'soil, earth', 'kun_reading': 'つち', 'on_reading': 'ド、ト', 'jlpt_level': 'N5', 'stroke_count': 3, 'radical': '土', 'frequency_rank': 165},
            
            {'character': '人', 'meaning': 'person', 'kun_reading': 'ひと', 'on_reading': 'ジン、ニン', 'jlpt_level': 'N5', 'stroke_count': 2, 'radical': '人', 'frequency_rank': 3},
            {'character': '口', 'meaning': 'mouth', 'kun_reading': 'くち', 'on_reading': 'コウ、ク', 'jlpt_level': 'N5', 'stroke_count': 3, 'radical': '口', 'frequency_rank': 155},
            {'character': '目', 'meaning': 'eye', 'kun_reading': 'め、ま', 'on_reading': 'モク、ボク', 'jlpt_level': 'N5', 'stroke_count': 5, 'radical': '目', 'frequency_rank': 82},
            {'character': '耳', 'meaning': 'ear', 'kun_reading': 'みみ', 'on_reading': 'ジ', 'jlpt_level': 'N5', 'stroke_count': 6, 'radical': '耳', 'frequency_rank': 678},
            {'character': '手', 'meaning': 'hand', 'kun_reading': 'て、た', 'on_reading': 'シュ', 'jlpt_level': 'N5', 'stroke_count': 4, 'radical': '手', 'frequency_rank': 35},
            {'character': '足', 'meaning': 'foot, leg', 'kun_reading': 'あし、たりる、たす', 'on_reading': 'ソク', 'jlpt_level': 'N5', 'stroke_count': 7, 'radical': '足', 'frequency_rank': 230},
            {'character': '心', 'meaning': 'heart, mind', 'kun_reading': 'こころ', 'on_reading': 'シン', 'jlpt_level': 'N5', 'stroke_count': 4, 'radical': '心', 'frequency_rank': 148},
            
            {'character': '大', 'meaning': 'big, large', 'kun_reading': 'おお、おおきい、おおいに', 'on_reading': 'ダイ、タイ', 'jlpt_level': 'N5', 'stroke_count': 3, 'radical': '大', 'frequency_rank': 8},
            {'character': '小', 'meaning': 'small, little', 'kun_reading': 'ちいさい、こ、お', 'on_reading': 'ショウ', 'jlpt_level': 'N5', 'stroke_count': 3, 'radical': '小', 'frequency_rank': 20},
            {'character': '高', 'meaning': 'tall, high, expensive', 'kun_reading': 'たかい、たか、たかまる、たかめる', 'on_reading': 'コウ', 'jlpt_level': 'N5', 'stroke_count': 10, 'radical': '高', 'frequency_rank': 34},
            {'character': '長', 'meaning': 'long, leader', 'kun_reading': 'ながい、おさ', 'on_reading': 'チョウ', 'jlpt_level': 'N5', 'stroke_count': 8, 'radical': '長', 'frequency_rank': 28},
            {'character': '新', 'meaning': 'new', 'kun_reading': 'あたらしい、あらた、にい', 'on_reading': 'シン', 'jlpt_level': 'N5', 'stroke_count': 13, 'radical': '斤', 'frequency_rank': 24},
            {'character': '古', 'meaning': 'old', 'kun_reading': 'ふるい、ふる', 'on_reading': 'コ', 'jlpt_level': 'N5', 'stroke_count': 5, 'radical': '口', 'frequency_rank': 326},
            
            {'character': '上', 'meaning': 'up, above, top', 'kun_reading': 'うえ、うわ、かみ、あげる、あがる、のぼる', 'on_reading': 'ジョウ、ショウ', 'jlpt_level': 'N5', 'stroke_count': 3, 'radical': '一', 'frequency_rank': 10},
            {'character': '下', 'meaning': 'down, below, under', 'kun_reading': 'した、しも、もと、さげる、さがる、くだる、おろす', 'on_reading': 'カ、ゲ', 'jlpt_level': 'N5', 'stroke_count': 3, 'radical': '一', 'frequency_rank': 11},
            {'character': '中', 'meaning': 'inside, middle, center', 'kun_reading': 'なか、うち', 'on_reading': 'チュウ', 'jlpt_level': 'N5', 'stroke_count': 4, 'radical': '丨', 'frequency_rank': 6},
            {'character': '外', 'meaning': 'outside', 'kun_reading': 'そと、ほか、はずす、はずれる', 'on_reading': 'ガイ、ゲ', 'jlpt_level': 'N5', 'stroke_count': 5, 'radical': '夕', 'frequency_rank': 46},
            {'character': '前', 'meaning': 'in front, before', 'kun_reading': 'まえ', 'on_reading': 'ゼン', 'jlpt_level': 'N5', 'stroke_count': 9, 'radical': '刀', 'frequency_rank': 12},
            {'character': '後', 'meaning': 'behind, after', 'kun_reading': 'あと、うしろ、のち、おくれる', 'on_reading': 'ゴ、コウ', 'jlpt_level': 'N5', 'stroke_count': 9, 'radical': '彳', 'frequency_rank': 29},
            {'character': '左', 'meaning': 'left', 'kun_reading': 'ひだり', 'on_reading': 'サ', 'jlpt_level': 'N5', 'stroke_count': 5, 'radical': '工', 'frequency_rank': 367},
            {'character': '右', 'meaning': 'right', 'kun_reading': 'みぎ', 'on_reading': 'ウ、ユウ', 'jlpt_level': 'N5', 'stroke_count': 5, 'radical': '口', 'frequency_rank': 188},
            
            {'character': '国', 'meaning': 'country', 'kun_reading': 'くに', 'on_reading': 'コク', 'jlpt_level': 'N5', 'stroke_count': 8, 'radical': '囗', 'frequency_rank': 4},
            {'character': '学', 'meaning': 'study, learning', 'kun_reading': 'まなぶ', 'on_reading': 'ガク', 'jlpt_level': 'N5', 'stroke_count': 8, 'radical': '子', 'frequency_rank': 13},
            {'character': '生', 'meaning': 'life, birth, student', 'kun_reading': 'いきる、いかす、いける、うまれる、うむ、はえる、はやす、き、なま', 'on_reading': 'セイ、ショウ', 'jlpt_level': 'N5', 'stroke_count': 5, 'radical': '生', 'frequency_rank': 7},
            {'character': '先', 'meaning': 'before, previous, ahead', 'kun_reading': 'さき', 'on_reading': 'セン', 'jlpt_level': 'N5', 'stroke_count': 6, 'radical': '儿', 'frequency_rank': 31},
            {'character': '年', 'meaning': 'year', 'kun_reading': 'とし', 'on_reading': 'ネン', 'jlpt_level': 'N5', 'stroke_count': 6, 'radical': '干', 'frequency_rank': 15},
            {'character': '時', 'meaning': 'time, hour', 'kun_reading': 'とき', 'on_reading': 'ジ', 'jlpt_level': 'N5', 'stroke_count': 10, 'radical': '日', 'frequency_rank': 17},
            {'character': '分', 'meaning': 'part, minute, understand', 'kun_reading': 'わける、わかる、わかれる、わかつ', 'on_reading': 'ブン、フン、ブ', 'jlpt_level': 'N5', 'stroke_count': 4, 'radical': '刀', 'frequency_rank': 18},
            
            {'character': '山', 'meaning': 'mountain', 'kun_reading': 'やま', 'on_reading': 'サン', 'jlpt_level': 'N5', 'stroke_count': 3, 'radical': '山', 'frequency_rank': 95},
            {'character': '川', 'meaning': 'river', 'kun_reading': 'かわ', 'on_reading': 'セン', 'jlpt_level': 'N5', 'stroke_count': 3, 'radical': '川', 'frequency_rank': 100},
            {'character': '天', 'meaning': 'heaven, sky', 'kun_reading': 'あめ、あま', 'on_reading': 'テン', 'jlpt_level': 'N5', 'stroke_count': 4, 'radical': '大', 'frequency_rank': 103},
            {'character': '雨', 'meaning': 'rain', 'kun_reading': 'あめ、あま', 'on_reading': 'ウ', 'jlpt_level': 'N5', 'stroke_count': 8, 'radical': '雨', 'frequency_rank': 574},
            {'character': '気', 'meaning': 'spirit, mind, air', 'kun_reading': '', 'on_reading': 'キ、ケ', 'jlpt_level': 'N5', 'stroke_count': 6, 'radical': '气', 'frequency_rank': 21},
            
            # N4 Kanji (sample)
            {'character': '話', 'meaning': 'talk, story', 'kun_reading': 'はなす、はなし', 'on_reading': 'ワ', 'jlpt_level': 'N4', 'stroke_count': 13, 'radical': '言', 'frequency_rank': 42},
            {'character': '聞', 'meaning': 'hear, ask', 'kun_reading': 'きく、きこえる', 'on_reading': 'ブン、モン', 'jlpt_level': 'N4', 'stroke_count': 14, 'radical': '耳', 'frequency_rank': 77},
            {'character': '読', 'meaning': 'read', 'kun_reading': 'よむ', 'on_reading': 'ドク、トク', 'jlpt_level': 'N4', 'stroke_count': 14, 'radical': '言', 'frequency_rank': 196},
            {'character': '書', 'meaning': 'write', 'kun_reading': 'かく', 'on_reading': 'ショ', 'jlpt_level': 'N4', 'stroke_count': 10, 'radical': '曰', 'frequency_rank': 91},
            {'character': '見', 'meaning': 'see, look', 'kun_reading': 'みる、みえる、みせる', 'on_reading': 'ケン', 'jlpt_level': 'N4', 'stroke_count': 7, 'radical': '見', 'frequency_rank': 22},
            {'character': '行', 'meaning': 'go, line', 'kun_reading': 'いく、ゆく、おこなう', 'on_reading': 'コウ、ギョウ、アン', 'jlpt_level': 'N4', 'stroke_count': 6, 'radical': '行', 'frequency_rank': 26},
            {'character': '来', 'meaning': 'come', 'kun_reading': 'くる、きたる、きたす', 'on_reading': 'ライ', 'jlpt_level': 'N4', 'stroke_count': 7, 'radical': '人', 'frequency_rank': 32},
            {'character': '食', 'meaning': 'eat, food', 'kun_reading': 'たべる、くう、くらう', 'on_reading': 'ショク、ジキ', 'jlpt_level': 'N4', 'stroke_count': 9, 'radical': '食', 'frequency_rank': 83},
            {'character': '飲', 'meaning': 'drink', 'kun_reading': 'のむ', 'on_reading': 'イン', 'jlpt_level': 'N4', 'stroke_count': 12, 'radical': '食', 'frequency_rank': 645},
            
            # N3 Kanji (sample)
            {'character': '私', 'meaning': 'private, I, me', 'kun_reading': 'わたくし、わたし', 'on_reading': 'シ', 'jlpt_level': 'N3', 'stroke_count': 7, 'radical': '禾', 'frequency_rank': 80},
            {'character': '会', 'meaning': 'meeting, association', 'kun_reading': 'あう、あわせる', 'on_reading': 'カイ、エ', 'jlpt_level': 'N3', 'stroke_count': 6, 'radical': '人', 'frequency_rank': 36},
            {'character': '社', 'meaning': 'company, society', 'kun_reading': 'やしろ', 'on_reading': 'シャ', 'jlpt_level': 'N3', 'stroke_count': 7, 'radical': '示', 'frequency_rank': 39},
            {'character': '同', 'meaning': 'same', 'kun_reading': 'おなじ', 'on_reading': 'ドウ', 'jlpt_level': 'N3', 'stroke_count': 6, 'radical': '口', 'frequency_rank': 44},
            {'character': '発', 'meaning': 'depart, emit', 'kun_reading': 'はっする、たつ', 'on_reading': 'ハツ、ホツ', 'jlpt_level': 'N3', 'stroke_count': 9, 'radical': '癶', 'frequency_rank': 45},
        ]

        created_count = 0
        updated_count = 0

        for kanji_data in sample_kanji:
            kanji, created = Kanji.objects.update_or_create(
                character=kanji_data['character'],
                defaults=kanji_data
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully imported {created_count} new kanji and updated {updated_count} existing kanji'
            )
        )
