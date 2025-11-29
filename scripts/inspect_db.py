import sqlite3, json
conn = sqlite3.connect('backend/db.sqlite3')
cur = conn.cursor()
row = cur.execute('select id, character, examples, composition, svg_data from kanji where id=2282').fetchone()
if row:
    id_, char, examples, composition, svg = row
    print('id:', id_)
    print('char:', char)
    print('examples:', examples)
    print('composition:', composition)
    print('svg_data present:', bool(svg))
else:
    print('no row')
conn.close()
