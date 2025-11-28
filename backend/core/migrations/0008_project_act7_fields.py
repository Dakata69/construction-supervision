from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_zip_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='act7_date',
            field=models.DateField(blank=True, null=True, verbose_name='Act 7 Date'),
        ),
        migrations.AddField(
            model_name='project',
            name='consultant_name',
            field=models.CharField(blank=True, default='', max_length=200, verbose_name='Consultant'),
        ),
        migrations.AddField(
            model_name='project',
            name='representative_builder',
            field=models.CharField(blank=True, default='', max_length=200, verbose_name='Representative Builder'),
        ),
        migrations.AddField(
            model_name='project',
            name='supervisor_name_text',
            field=models.CharField(blank=True, default='', max_length=200, verbose_name='Supervisor (Text)'),
        ),
        migrations.AddField(
            model_name='project',
            name='designer_name',
            field=models.CharField(blank=True, default='', max_length=200, verbose_name='Designer'),
        ),
        migrations.AddField(
            model_name='project',
            name='level_from',
            field=models.CharField(blank=True, default='', max_length=50, verbose_name='Level From'),
        ),
        migrations.AddField(
            model_name='project',
            name='level_to',
            field=models.CharField(blank=True, default='', max_length=50, verbose_name='Level To'),
        ),
        migrations.AddField(
            model_name='project',
            name='work_description',
            field=models.TextField(blank=True, default='', verbose_name='Work Description'),
        ),
        migrations.AddField(
            model_name='project',
            name='execution',
            field=models.TextField(blank=True, default='', verbose_name='Execution Next'),
        ),
    ]
