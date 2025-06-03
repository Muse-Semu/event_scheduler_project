
from django.urls import path
from .views import EventListCreateView, EventRetrieveUpdateView, EventDeleteView


urlpatterns = [
    path('events/', EventListCreateView.as_view(), name='event-list-create'),
    path('events/<int:pk>/', EventRetrieveUpdateView.as_view(), name='event-retrieve-update'),
    path('events/delete/<int:pk>/', EventDeleteView.as_view(), name='event-delete'),
]
