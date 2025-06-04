
from django.urls import path
from .views import EventListCreateView, EventRetrieveUpdateView, EventDeleteView, RegisterView, CurrentUserView


urlpatterns = [
    path('events/', EventListCreateView.as_view(), name='event-list-create'),
    path('events/<int:pk>/', EventRetrieveUpdateView.as_view(), name='event-retrieve-update'),
    path('events/delete/<int:pk>/', EventDeleteView.as_view(), name='event-delete'),
    path('register/', RegisterView.as_view(), name='register'),
    path('current-user/', CurrentUserView.as_view(), name='current-user'),
]
