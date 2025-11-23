from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('vocabulary', '0004_add_svg_data_file'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='kanji',
            name='svg',
        ),
    ]
