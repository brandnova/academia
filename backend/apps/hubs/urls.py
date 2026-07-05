from django.urls import path

from .views import (
    ApproveActivationRequestView,
    HubActivationRequestListCreateView,
    HubBySchoolView,
    HubDetailView,
    HubModeratorDetailView,
    HubModeratorListCreateView,
    HubRepresentativeDetailView,
    HubRepresentativeListCreateView,
    RejectActivationRequestView,
)

urlpatterns = [
    path("hubs/activation-requests/", HubActivationRequestListCreateView.as_view(), name="hub-activation-request-list-create"),
    path("hubs/activation-requests/<uuid:request_id>/approve/", ApproveActivationRequestView.as_view(), name="hub-activation-request-approve"),
    path("hubs/activation-requests/<uuid:request_id>/reject/", RejectActivationRequestView.as_view(), name="hub-activation-request-reject"),
    path("hubs/by-school/<uuid:school_id>/", HubBySchoolView.as_view(), name="hub-by-school"),
    path("hubs/<uuid:hub_id>/moderators/", HubModeratorListCreateView.as_view(), name="hub-moderator-list-create"),
    path("hubs/<uuid:hub_id>/moderators/<uuid:user_id>/", HubModeratorDetailView.as_view(), name="hub-moderator-detail"),
    path("hubs/<uuid:hub_id>/representatives/", HubRepresentativeListCreateView.as_view(), name="hub-representative-list-create"),
    path("hubs/<uuid:hub_id>/representatives/<uuid:user_id>/", HubRepresentativeDetailView.as_view(), name="hub-representative-detail"),
    path("hubs/<uuid:hub_id>/", HubDetailView.as_view(), name="hub-detail"),
]
