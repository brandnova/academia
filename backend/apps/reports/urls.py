from django.urls import path

from .views import RejectReportView, ReportListCreateView, ResolveReportView

urlpatterns = [
    path("reports/", ReportListCreateView.as_view(), name="report-list-create"),
    path("reports/<uuid:report_id>/resolve/", ResolveReportView.as_view(), name="report-resolve"),
    path("reports/<uuid:report_id>/reject/", RejectReportView.as_view(), name="report-reject"),
]
