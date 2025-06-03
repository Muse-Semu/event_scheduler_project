from django.shortcuts import render

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Event
from .serializers import EventSerializer


class EventListCreateView(generics.ListCreateAPIView):
    """
    API view to list and create single-occurrence events for authenticated users.

    GET: Returns a paginated list of events owned by the authenticated user.
    POST: Creates a new event for the authenticated user.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = EventSerializer
    queryset = Event.objects.all()

    def get_queryset(self):
        """
        Filter events to those owned by the authenticated user.

        Returns:
            QuerySet: Events belonging to the current user.
        """
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        """
        Save the event with the authenticated user as the owner.

        Args:
            serializer: The validated serializer instance.
        """
        serializer.save(user=self.request.user)