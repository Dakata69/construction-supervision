from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0019_alter_budgetexpense_unique_together'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='budgetexpense',
            unique_together=set(),
        ),
    ]
