
from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from dateutil.relativedelta import relativedelta
from .models import Event, RecurrenceRule
from django.contrib.auth.models import User


class RecurrenceRuleSerializer(serializers.ModelSerializer):
    """
    Serializes recurrence rules for events.

    Validates frequency, interval, end_date, weekdays, and relative-date patterns.
    """
    class Meta:
        model = RecurrenceRule
        fields = ['frequency', 'interval', 'end_date', 'weekdays', 'weekday', 'ordinal']

    def validate_frequency(self, value):
        valid_frequencies = [choice[0] for choice in RecurrenceRule.FREQUENCY_CHOICES]
        if value not in valid_frequencies:
            raise serializers.ValidationError(f"Frequency must be one of {valid_frequencies}.")
        return value

    def validate_interval(self, value):
        if value <= 0:
            raise serializers.ValidationError("Interval must be a positive integer.")
        if value > 100:
            raise serializers.ValidationError("Interval cannot exceed 100 to prevent excessive recurrences.")
        return value

    def validate_end_date(self, value):
        if value and value < timezone.now().date():
            raise serializers.ValidationError("End date cannot be in the past.")
        return value

    def validate_weekdays(self, value):
        if value:
            valid_days = [choice[0] for choice in RecurrenceRule.WEEKDAY_CHOICES]
            invalid_days = [d for d in value if d not in valid_days]
            if invalid_days:
                raise serializers.ValidationError(f"Invalid weekdays: {invalid_days}. Must be one of {valid_days}.")
            if len(set(value)) != len(value):
                raise serializers.ValidationError("Duplicate weekdays are not allowed.")
        return value

    def validate_weekday(self, value):
        if value:
            valid_days = [choice[0] for choice in RecurrenceRule.WEEKDAY_CHOICES]
            if value not in valid_days:
                raise serializers.ValidationError(f"Weekday must be one of {valid_days}.")
        return value

    def validate_ordinal(self, value):
        if value:
            valid_ordinals = [choice[0] for choice in RecurrenceRule.ORDINAL_CHOICES]
            if value not in valid_ordinals:
                raise serializers.ValidationError(f"Ordinal must be one of {valid_ordinals}.")
        return value

    def validate(self, data):
        frequency = data.get('frequency')
        weekdays = data.get('weekdays')
        weekday = data.get('weekday')
        ordinal = data.get('ordinal')

        # Weekdays for WEEKLY only
        if weekdays and frequency != 'WEEKLY':
            raise serializers.ValidationError({
                "weekdays": "Weekdays can only be specified for WEEKLY frequency."
            })

        # Weekday and ordinal for MONTHLY only
        if (weekday or ordinal) and frequency != 'MONTHLY':
            raise serializers.ValidationError({
                "weekday": "Weekday and ordinal can only be specified for MONTHLY frequency."
            })

        # Both weekday and ordinal required together
        if bool(weekday) != bool(ordinal):
            raise serializers.ValidationError({
                "weekday": "Both weekday and ordinal must be provided for MONTHLY relative-date patterns.",
                "ordinal": "Both weekday and ordinal must be provided for MONTHLY relative-date patterns."
            })

        # No mixing weekdays with relative-date patterns
        if weekdays and (weekday or ordinal):
            raise serializers.ValidationError({
                "weekdays": "Cannot specify weekdays with weekday/ordinal for MONTHLY recurrence."
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
            weekday = recurrence_rule.get('weekday')
            ordinal = recurrence_rule.get('ordinal')

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
                        if end_date < start_date + timedelta(days=7):
                            raise serializers.ValidationError({
                                "recurrence_rule": {
                                    "end_date": f"{error_msg} Minimum date: {start_date + timedelta(days=7)}."
                                }
                            })
                elif frequency == 'MONTHLY':
                    min_duration = start_date + relativedelta(months=interval)
                    if weekday and ordinal:
                        # Require at least one month for relative-date patterns
                        if end_date < start_date + relativedelta(months=1):
                            raise serializers.ValidationError({
                                "recurrence_rule": {
                                    "end_date": f"{error_msg} Minimum date: {start_date + relativedelta(months=1)}."
                                }
                            })
                elif frequency == 'YEARLY':
                    min_duration = start_date + relativedelta(years=interval)

                if min_duration and end_date < min_duration:
                    raise serializers.ValidationError({
                        "recurrence_rule": {"end_date": f"{error_msg} Minimum date: {min_duration}."}
                    })

        return data

    def create(self, validated_data):
        recurrence_rule_data = validated_data.pop('recurrence_rule', None)
        event = Event.objects.create(**validated_data)
        
        if recurrence_rule_data:
            self.create_or_update_recurrence_rule(event, recurrence_rule_data)
            
        return event

    def update(self, instance, validated_data):
        recurrence_rule_data = validated_data.pop('recurrence_rule', None)
        
        # Update event fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Handle recurrence rule
        if recurrence_rule_data is not None:
            self.create_or_update_recurrence_rule(instance, recurrence_rule_data)
        elif instance.is_recurring:
            # If is_recurring is True but no recurrence_rule provided, keep existing rule
            pass
        else:
            # If not recurring, remove any existing rule
            if instance.recurrence_rule:
                instance.recurrence_rule.delete()
                instance.recurrence_rule = None
        
        instance.save()
        return instance

    def create_or_update_recurrence_rule(self, event, recurrence_rule_data):
        if event.recurrence_rule:
            # Update existing rule
            rule_serializer = RecurrenceRuleSerializer(
                instance=event.recurrence_rule,
                data=recurrence_rule_data
            )
        else:
            # Create new rule
            rule_serializer = RecurrenceRuleSerializer(
                data=recurrence_rule_data
            )
        
        rule_serializer.is_valid(raise_exception=True)
        recurrence_rule = rule_serializer.save()
        event.recurrence_rule = recurrence_rule
        event.save()



class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'email']
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True}
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data['email']
        )
        return user