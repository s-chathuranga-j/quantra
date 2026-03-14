from django.urls import path
from .views import dashboard_stats, project_summary

urlpatterns = [
    path('dashboard/', dashboard_stats, name='reports-dashboard'),
    path('projects/<int:project_id>/summary/', project_summary, name='reports-project-summary'),
]
