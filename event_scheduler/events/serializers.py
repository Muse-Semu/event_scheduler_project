
from rest_framework import serializers
from django.utils import timezone
from .models import Event, RecurrenceRule


class RecurrenceRuleSerializer(serializers.ModelSerializer):
    """
    Serializes recurrence rules for events.

    Validates end_date and interval.
    """
    class Meta:
        model = RecurrenceRule
        fields = ['frequency', 'interval', 'end_date']

    def validate_end_date(self, value):
        """
        Ensure end_date is in the future if provided.

        Args:
            value: The end_date value.

        Raises:
            serializers.ValidationError: If end_date is before today.

        Returns:
            The validated end_date.
        """
        if value and value < timezone.now().date():
            raise serializers.ValidationError("End date cannot be in the past.")
        return value

    def validate_interval(self, value):
        """
        Ensure interval is positive.

        Args:
            value: The interval value.

        Raises:
            serializers.ValidationError: If interval is not positive.

        Returns:
            The validated interval.
        """
        if value <= 0:
            raise serializers.ValidationError("Interval must be positive.")
        return value


class EventSerializer(serializers.ModelSerializer):
    """
    Serializes events, including location and recurrence.

    Validates time, location, and recurrence constraints.
    """
    recurrence_rule = RecurrenceRuleSerializer(required=False, allow_null=True)

    class Meta:
        model = Event
        fields = ['id', 'title', 'description', 'location', 'start_time', 'end_time', 'is_recurring', 'recurrence_rule']
        read_only_fields = ['id']

    def validate(self, data):
        """
        Validate event data, including recurrence rules.

        Args:
            data (dict): Input data to validate.

        Raises:
            serializers.ValidationError: If start_time is past, end_time <= start_time,
                                        recurrence_rule is inconsistent, or end_date < start_time.date().

        Returns:
            dict: Validated data.
        """
        # Time validations
        if data['start_time'] < timezone.now():
            raise serializers.ValidationError({"start_time": "Start time cannot be in the past."})
        if data['end_time'] <= data['start_time']:
            raise serializers.ValidationError({"end_time": "End time must be after start time."})

        # Recurrence validations
        is_recurring = data.get('is_recurring', False)
        recurrence_rule = data.get('recurrence_rule')

        if is_recurring and not recurrence_rule:
            raise serializers.ValidationError({"recurrence_rule": "Required for recurring events."})
        if not is_recurring and recurrence_rule:
            raise serializers.ValidationError({"recurrence_rule": "Not allowed for non-recurring events."})

        # Ensure end_date is after or equal to start_time.date() for recurring events
        if is_recurring and recurrence_rule and recurrence_rule.get('end_date'):
            end_date = recurrence_rule['end_date']
            start_date = data['start_time'].date()
            if end_date < start_date:
                raise serializers.ValidationError({
                    "recurrence_rule": {"end_date": "End date cannot be before the event's start date."}
                })

        return data

    def create(self, validated_data):
        """
        Create an event with an optional recurrence rule.

        Args:
            validated_data (dict): Validated data for the event.

        Returns:
            Event: Created event instance.
        """
        recurrence_rule_data = validated_data.pop('recurrence_rule', None)
        event = Event(**validated_data)
        if recurrence_rule_data:
            recurrence_rule = RecurrenceRule.objects.create(**recurrence_rule_data)
            event.recurrence_rule = recurrence_rule
        event.save()
        return event
