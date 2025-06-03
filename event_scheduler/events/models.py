from django.db import models
from django.contrib.auth.models import User


class Event(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    location = models.CharField(max_length=200, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['start_time']
        verbose_name_plural = 'Events'

    def __str__(self) -> str:
        """
        Returns a string representation of the event.

        Returns:
            str: The event title and start time in a readable format.
        """
        return f"{self.title} ({self.start_time})"

    class Meta:
        """Metadata for the Event model."""
        ordering = ["start_time"]
        verbose_name = "event"
        verbose_name_plural = "events"
