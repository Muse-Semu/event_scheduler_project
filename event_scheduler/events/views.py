# event_scheduler_project/events/views.py
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from datetime import datetime, timedelta
from dateutil import rrule
from dateutil.relativedelta import relativedelta
from .models import Event, RecurrenceRule
from .serializers import EventSerializer
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from .serializers import UserSerializer
from rest_framework.views import APIView


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class EventListCreateView(generics.ListCreateAPIView):
    """
    API view to list and create events for authenticated users.

    Supports filtering by date range and expands recurring events for calendar view.
    """
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        """
        Filter events by user and optional date range.

        Expands recurring events into instances within the date range.
        """
        user = self.request.user
        queryset = Event.objects.filter(user=user).order_by('start_time')

        # Get date range from query params
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if start_date and end_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            except ValueError:
                return queryset  # Invalid date format, return unfiltered

            # Initialize list for expanded events
            expanded_events = []
            for event in queryset:
                if event.is_recurring and event.recurrence_rule:
                    instances = self.expand_recurring_event(event, start_date, end_date)
                    expanded_events.extend(instances)
                elif event.start_time.date() >= start_date and event.start_time.date() <= end_date:
                    expanded_events.append(event)
            
            # Sort and filter expanded events
            expanded_events.sort(key=lambda x: x.start_time)
            return expanded_events
        return queryset

    def expand_recurring_event(self, event, start_date, end_date):
        """
        Expand a recurring event into instances within the date range.
        """
        rule = event.recurrence_rule
        frequency_map = {
            'DAILY': rrule.DAILY,
            'WEEKLY': rrule.WEEKLY,
            'MONTHLY': rrule.MONTHLY,
            'YEARLY': rrule.YEARLY
        }
        weekday_map = {
            'MON': rrule.MO,
            'TUE': rrule.TU,
            'WED': rrule.WE,
            'THU': rrule.TH,
            'FRI': rrule.FR,
            'SAT': rrule.SA,
            'SUN': rrule.SU
        }

        # Base rrule parameters
        rrule_kwargs = {
            'freq': frequency_map[rule.frequency],
            'dtstart': event.start_time,
            'interval': rule.interval,
            'until': rule.end_date if rule.end_date else end_date
        }

        # Handle WEEKLY weekdays
        if rule.frequency == 'WEEKLY' and rule.weekdays:
            rrule_kwargs['byweekday'] = [weekday_map[day] for day in rule.weekdays]

        # Handle MONTHLY relative-date patterns
        if rule.frequency == 'MONTHLY' and rule.weekday and rule.ordinal:
            rrule_kwargs['byweekday'] = weekday_map[rule.weekday]
            rrule_kwargs['bysetpos'] = rule.ordinal

        # Generate recurrence instances
        try:
            rr = rrule.rrule(**rrule_kwargs)
            duration = event.end_time - event.start_time
            instances = []

            for dt in rr:
                if dt.date() < start_date or dt.date() > end_date:
                    continue
                # Create a new Event instance (not saved to DB)
                instance = Event(
                    user=event.user,
                    title=event.title,
                    description=event.description,
                    location=event.location,
                    start_time=dt,
                    end_time=dt + duration,
                    is_recurring=False,  # Instances are not recurring
                    created_at=event.created_at,
                    updated_at=event.updated_at
                )
                instances.append(instance)
            return instances
        except ValueError:
            return []  # Invalid rrule, skip event

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)



class EventRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    """
    API view to retrieve and update events for authenticated users.
    
    Ensures users can only access their own events and applies the same validations
    as creation when updating events.
    """
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Restrict queryset to only events belonging to the requesting user."""
        return Event.objects.filter(user=self.request.user)
    
    def perform_update(self, serializer):
        """Ensure the user field remains unchanged when updating."""
        serializer.save(user=self.request.user)
        
    def update(self, request, *args, **kwargs):
        """Handle update with the same validations as creation."""
        # Get the existing event
        instance = self.get_object()
        
        # Validate the data using the same serializer as creation
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        
        # Check for valid date/time ranges
        start_time = serializer.validated_data.get('start_time', instance.start_time)
        end_time = serializer.validated_data.get('end_time', instance.end_time)
        
        if end_time <= start_time:
            return Response(
                {'error': 'End time must be after start time'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        
        
        # If updating a recurring event, handle recurrence rule validation
        is_recurring = serializer.validated_data.get('is_recurring', instance.is_recurring)
        recurrence_rule = serializer.validated_data.get('recurrence_rule', instance.recurrence_rule)
        
        if is_recurring and not recurrence_rule:
            return Response(
                {'error': 'Recurring events must have a recurrence rule'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Perform the update
        self.perform_update(serializer)
        return Response(serializer.data)  




class EventDeleteView(generics.DestroyAPIView):
    """
    API view to handle event deletion
    """
    queryset = Event.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = EventSerializer  # Add this line
    
    def get_queryset(self):
        return Event.objects.filter(user=self.request.user)
    
    def delete(self, request, *args, **kwargs):
        event = self.get_object()
        
        # Delete related recurrence rule first if it exists
        if event.recurrence_rule:
            event.recurrence_rule.delete()
        
        # Then delete the event
        event.delete()
        
        return Response(
            {'message': 'Event deleted successfully'},
            status=status.HTTP_200_OK
        )



class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {"message": "User created successfully"},
            status=status.HTTP_201_CREATED,
            headers=headers
        )





class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email
        })