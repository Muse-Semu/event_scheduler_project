
from django.urls import path
from .views import EventListCreateView, EventRetrieveUpdateView


urlpatterns = [
    path('events/', EventListCreateView.as_view(), name='event-list-create'),
    path('events/<int:pk>/', EventRetrieveUpdateView.as_view(), name='event-retrieve-update'),

]
