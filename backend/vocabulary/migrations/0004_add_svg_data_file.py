from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('vocabulary', '0003_kanji_svg'),
    ]

    operations = [
        migrations.AddField(
            model_name='kanji',
            name='svg_data',
            field=models.TextField(blank=True, help_text='Raw SVG content (SVG XML) for this Kanji'),
        ),
        migrations.AddField(
            model_name='kanji',
            name='svg_file',
            field=models.FileField(blank=True, null=True, upload_to='kanji_svgs/', help_text='Optional uploaded SVG file for this Kanji'),
        ),
    ]
