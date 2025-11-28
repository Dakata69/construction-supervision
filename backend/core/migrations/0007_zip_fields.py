from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0006_act'),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='zip_file',
            field=models.FileField(blank=True, null=True, upload_to='documents/zip/'),
        ),
        migrations.AddField(
            model_name='act',
            name='zip_file',
            field=models.FileField(blank=True, null=True, upload_to='acts/%Y/%m/%d/'),
        ),
    ]
