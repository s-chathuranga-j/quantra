from django.urls import path
from .views import (
    suite_list_create, suite_detail,
    case_list_create, case_detail,
    run_list_create, run_detail, run_add_cases,
    execution_list, execution_detail,
)

urlpatterns = [
    # Test Suites
    path('projects/<int:project_id>/suites/', suite_list_create, name='suite-list'),
    path('projects/<int:project_id>/suites/<int:suite_id>/', suite_detail, name='suite-detail'),

    # Test Cases
    path('suites/<int:suite_id>/cases/', case_list_create, name='case-list'),
    path('suites/<int:suite_id>/cases/<int:case_id>/', case_detail, name='case-detail'),

    # Test Runs
    path('projects/<int:project_id>/runs/', run_list_create, name='run-list'),
    path('projects/<int:project_id>/runs/<int:run_id>/', run_detail, name='run-detail'),
    path('projects/<int:project_id>/runs/<int:run_id>/add_cases/', run_add_cases, name='run-add-cases'),

    # Executions
    path('runs/<int:run_id>/executions/', execution_list, name='execution-list'),
    path('runs/<int:run_id>/executions/<int:execution_id>/', execution_detail, name='execution-detail'),
]
