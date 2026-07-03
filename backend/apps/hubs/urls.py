from django.urls import path

from .views import (
    ApproveActivationRequestView,
    HubActivationRequestListCreateView,
    HubBySchoolView,
    HubDetailView,
    RejectActivationRequestView,
)

urlpatterns = [
    path("hubs/activation-requests/", HubActivationRequestListCreateView.as_view(), name="hub-activation-request-list-create"),
    path("hubs/activation-requests/<uuid:request_id>/approve/", ApproveActivationRequestView.as_view(), name="hub-activation-request-approve"),
    path("hubs/activation-requests/<uuid:request_id>/reject/", RejectActivationRequestView.as_view(), name="hub-activation-request-reject"),
    path("hubs/by-school/<uuid:school_id>/", HubBySchoolView.as_view(), name="hub-by-school"),
    path("hubs/<uuid:hub_id>/", HubDetailView.as_view(), name="hub-detail"),
]
