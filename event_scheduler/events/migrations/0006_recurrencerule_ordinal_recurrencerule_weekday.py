# Generated by Django 5.0 on 2025-06-03 09:46

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0005_recurrencerule_weekdays'),
    ]

    operations = [
        migrations.AddField(
            model_name='recurrencerule',
            name='ordinal',
            field=models.PositiveSmallIntegerField(blank=True, choices=[(1, 'First'), (2, 'Second'), (3, 'Third'), (4, 'Fourth'), (5, 'Fifth')], help_text='Ordinal position for MONTHLY recurrence (e.g., 2 for second Friday).', null=True),
        ),
        migrations.AddField(
            model_name='recurrencerule',
            name='weekday',
            field=models.CharField(blank=True, choices=[('MON', 'Monday'), ('TUE', 'Tuesday'), ('WED', 'Wednesday'), ('THU', 'Thursday'), ('FRI', 'Friday'), ('SAT', 'Saturday'), ('SUN', 'Sunday')], help_text="Weekday for MONTHLY relative-date recurrence (e.g., 'FRI' for second Friday).", max_length=3, null=True),
        ),
    ]
