from rest_framework import serializers
from django.utils import timezone
from .models import Event


class EventSerializer(serializers.ModelSerializer):
    """
    Serializer for the Event model, handling single-occurrence event creation.

    Validates that start_time is in the future and end_time is after start_time.
    """
    class Meta:
        model = Event
        fields = ['id', 'title', 'description', 'start_time', 'end_time']
        read_only_fields = ['id']

    def validate(self, data):
        """
        Validate event data.

        Args:
            data (dict): The input data to validate.

        Raises:
            serializers.ValidationError: If start_time is in the past or end_time is not after start_time.

        Returns:
            dict: Validated data.
        """
        if data['start_time'] < timezone.now():
            raise serializers.ValidationError({"start_time": "Start time cannot be in the past."})
        if data['end_time'] <= data['start_time']:
            raise serializers.ValidationError({"end_time": "End time must be after start time."})
        return data
