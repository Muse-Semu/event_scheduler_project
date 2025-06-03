from django.contrib import admin
from .models import Event
from .models import RecurrenceRule

admin.site.register(Event)
admin.site.register(RecurrenceRule)
