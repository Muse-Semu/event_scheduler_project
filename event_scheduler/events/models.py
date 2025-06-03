
from django.contrib.auth.models import User
from django.db import models
from django.contrib.postgres.fields import ArrayField


class RecurrenceRule(models.Model):
    """
    Defines recurrence rules for events, including weekday selection.
    """
    FREQUENCY_CHOICES = (
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('MONTHLY', 'Monthly'),
        ('YEARLY', 'Yearly'),
    )
    WEEKDAY_CHOICES = (
        ('MON', 'Monday'),
        ('TUE', 'Tuesday'),
        ('WED', 'Wednesday'),
        ('THU', 'Thursday'),
        ('FRI', 'Friday'),
        ('SAT', 'Saturday'),
        ('SUN', 'Sunday'),
    )
    frequency = models.CharField(
        max_length=10,
        choices=FREQUENCY_CHOICES,
        help_text="Frequency of recurrence."
    )
    interval = models.PositiveIntegerField(
        default=1,
        help_text="Interval between occurrences."
    )
    end_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date when recurrence ends."
    )
    weekdays = ArrayField(
        models.CharField(max_length=3, choices=WEEKDAY_CHOICES),
        null=True,
        blank=True,
        help_text="Specific weekdays for WEEKLY recurrence (e.g., ['MON', 'WED'])."
    )

    def __str__(self):
        weekdays_str = f" on {', '.join(self.weekdays)}" if self.weekdays else ""
        return f"{self.frequency} every {self.interval} period(s){weekdays_str}, ends {self.end_date or 'never'}"

    class Meta:
        verbose_name = "recurrence rule"
        verbose_name_plural = "recurrence rules"


class Event(models.Model):
    """
    Represents a calendar event, either single or recurring.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="events",
        help_text="Owner of the event."
    )
    title = models.CharField(
        max_length=255,
        help_text="Event title."
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Optional event description."
    )
    location = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Optional event location."
    )
    start_time = models.DateTimeField(
        help_text="Event start date and time."
    )
    end_time = models.DateTimeField(
        help_text="Event end date and time."
    )
    is_recurring = models.BooleanField(
        default=False,
        help_text="Indicates if event is recurring."
    )
    recurrence_rule = models.OneToOneField(
        RecurrenceRule,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="event",
        help_text="Recurrence rule for recurring events."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.start_time})"

    class Meta:
        ordering = ["start_time"]
        verbose_name = "event"
        verbose_name_plural = "events"
