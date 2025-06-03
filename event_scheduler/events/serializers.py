
from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from dateutil.relativedelta import relativedelta
from .models import Event, RecurrenceRule


class RecurrenceRuleSerializer(serializers.ModelSerializer):
    """
    Serializes recurrence rules for events.

    Validates frequency, interval, end_date, and weekdays for recurrence patterns.
    """
    class Meta:
        model = RecurrenceRule
        fields = ['frequency', 'interval', 'end_date', 'weekdays']

    def validate_frequency(self, value):
        """
        Ensure frequency is valid.

        Args:
            value: Frequency value.

        Raises:
            ValidationError: If frequency is invalid.

        Returns:
            Validated frequency.
        """
        valid_frequencies = [choice[0] for choice in RecurrenceRule.FREQUENCY_CHOICES]
        if value not in valid_frequencies:
            raise serializers.ValidationError(f"Frequency must be one of {valid_frequencies}.")
        return value

    def validate_interval(self, value):
        """
        Ensure interval is positive and reasonable (≤ 100).

        Args:
            value: Interval value.

        Raises:
            ValidationError: If interval is invalid.

        Returns:
            Validated interval.
        """
        if value <= 0:
            raise serializers.ValidationError("Interval must be a positive integer.")
        if value > 100:
            raise serializers.ValidationError("Interval cannot exceed 100 to prevent excessive recurrences.")
        return value

    def validate_end_date(self, value):
        """
        Ensure end_date is in the future if provided.

        Args:
            value: End_date value.

        Raises:
            ValidationError: If end_date is past.

        Returns:
            Validated end_date.
        """
        if value and value < timezone.now().date():
            raise serializers.ValidationError("End date cannot be in the past.")
        return value

    def validate_weekdays(self, value):
        """
        Ensure weekdays are valid and unique.

        Args:
            value: List of weekday abbreviations.

        Raises:
            ValidationError: If invalid or duplicate weekdays.

        Returns:
            Validated weekdays.
        """
        if value:
            valid_days = [choice[0] for choice in RecurrenceRule.WEEKDAY_CHOICES]
            invalid_days = [d for d in value if d not in valid_days]
            if invalid_days:
                raise serializers.ValidationError(f"Invalid weekdays: {invalid_days}. Must be one of {valid_days}.")
            if len(set(value)) != len(value):
                raise serializers.ValidationError("Duplicate weekdays are not allowed.")
        return value

    def validate(self, data):
        """
        Ensure weekdays are only used with WEEKLY frequency.

        Args:
            data: Recurrence rule data.

        Raises:
            ValidationError: If weekdays used with non-WEEKLY frequency.

        Returns:
            Validated data.
        """
        frequency = data.get('frequency')
        weekdays = data.get('weekdays')
        if weekdays and frequency != 'WEEKLY':
            raise serializers.ValidationError({
                "weekdays": "Weekdays can only be specified for WEEKLY frequency."
            })
        return data


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
        Validate event data, including weekday-based recurrence rules.

        Args:
            data: Input data.

        Raises:
            ValidationError: If validations fail.

        Returns:
            Validated data.
        """
        # Time validations
        if data['start_time'] < timezone.now():
            raise serializers.ValidationError({"start_time": "Start time must be in the future."})
        if data['end_time'] <= data['start_time']:
            raise serializers.ValidationError({"end_time": "End time must be after start time."})

        # Recurrence validations
        is_recurring = data.get('is_recurring', False)
        recurrence_rule = data.get('recurrence_rule')

        if is_recurring and not recurrence_rule:
            raise serializers.ValidationError({"recurrence_rule": "Required for recurring events."})
        if not is_recurring and recurrence_rule:
            raise serializers.ValidationError({"recurrence_rule": "Not allowed for non-recurring events."})

        if is_recurring and recurrence_rule:
            end_date = recurrence_rule.get('end_date')
            start_date = data['start_time'].date()
            frequency = recurrence_rule.get('frequency')
            interval = recurrence_rule.get('interval', 1)
            weekdays = recurrence_rule.get('weekdays')

            # Ensure end_date is after or equal to start_time.date()
            if end_date and end_date < start_date:
                raise serializers.ValidationError({
                    "recurrence_rule": {"end_date": "End date cannot be before the event's start date."}
                })

            # Ensure duration supports at least one recurrence
            if end_date:
                min_duration = None
                error_msg = f"End date must allow at least one recurrence for {frequency} every {interval} {'period' if interval == 1 else 'periods'}."
                if frequency == 'DAILY':
                    min_duration = start_date + timedelta(days=interval)
                elif frequency == 'WEEKLY':
                    min_duration = start_date + timedelta(days=interval * 7)
                    if weekdays:
                        # Require at least one week for weekday-specific events
                        if end_date < start_date + timedelta(days=7):
                            raise serializers.ValidationError({
                                "recurrence_rule": {
                                    "end_date": f"{error_msg} Minimum date: {start_date + timedelta(days=7)}."
                                }
                            })
                elif frequency == 'MONTHLY':
                    min_duration = start_date + relativedelta(months=interval)
                elif frequency == 'YEARLY':
                    min_duration = start_date + relativedelta(years=interval)

                if min_duration and end_date < min_duration:
                    raise serializers.ValidationError({
                        "recurrence_rule": {"end_date": f"{error_msg} Minimum date: {min_duration}."}
                    })

        return data

    def create(self, validated_data):
        """
        Create an event with an optional recurrence rule.

        Args:
            validated_data: Validated data.

        Returns:
            Created Event instance.
        """
        recurrence_rule_data = validated_data.pop('recurrence_rule', None)
        event = Event(**validated_data)
        if recurrence_rule_data:
            recurrence_rule = RecurrenceRule.objects.create(**recurrence_rule_data)
            event.recurrence_rule = recurrence_rule
        event.save()
        return event
