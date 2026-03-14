from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.projects.models import Project
from apps.projects.views import get_project_or_403
from apps.tests.models import TestCase, TestRun, TestExecution, TestSuite


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    project_id = request.query_params.get('project_id')

    if project_id:
        project, error = get_project_or_403(project_id, request.user)
        if error:
            return error
        projects = Project.objects.filter(pk=project_id)
    else:
        if request.user.is_staff:
            projects = Project.objects.all()
        else:
            projects = Project.objects.filter(members__user=request.user).distinct()

    project_ids = list(projects.values_list('id', flat=True))

    total_projects = projects.count()
    total_suites = TestSuite.objects.filter(project_id__in=project_ids).count()
    total_test_cases = TestCase.objects.filter(suite__project_id__in=project_ids).count()
    total_runs = TestRun.objects.filter(project_id__in=project_ids).count()

    # Recent test runs with stats
    recent_runs = TestRun.objects.filter(project_id__in=project_ids).order_by('-created_at')[:10]
    recent_runs_data = []
    for run in recent_runs:
        execs = run.executions.all()
        stats = {s: execs.filter(status=s).count() for s, _ in TestExecution.STATUSES}
        recent_runs_data.append({
            'id': run.id,
            'name': run.name,
            'project_id': run.project_id,
            'project_name': run.project.name,
            'status': run.status,
            'created_at': run.created_at,
            'total': execs.count(),
            'stats': stats,
        })

    # Bar chart data: run results for last 10 runs
    chart_data = []
    for run in recent_runs:
        execs = run.executions.all()
        chart_data.append({
            'name': run.name[:20],
            'passed': execs.filter(status='passed').count(),
            'failed': execs.filter(status='failed').count(),
            'skipped': execs.filter(status='skipped').count(),
            'blocked': execs.filter(status='blocked').count(),
            'pending': execs.filter(status='pending').count(),
        })

    return Response({
        'total_projects': total_projects,
        'total_suites': total_suites,
        'total_test_cases': total_test_cases,
        'total_runs': total_runs,
        'recent_runs': recent_runs_data,
        'chart_data': chart_data,
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def project_summary(request, project_id):
    project, error = get_project_or_403(project_id, request.user)
    if error:
        return error

    suites = TestSuite.objects.filter(project=project)
    test_cases = TestCase.objects.filter(suite__project=project)
    test_runs = TestRun.objects.filter(project=project)

    # Test case priority distribution
    priority_distribution = {}
    for priority, _ in TestCase.PRIORITIES:
        priority_distribution[priority] = test_cases.filter(priority=priority).count()

    # Test run status distribution
    run_status_distribution = {}
    for s, _ in TestRun.STATUSES:
        run_status_distribution[s] = test_runs.filter(status=s).count()

    # Latest run execution results (pie chart data)
    latest_run = test_runs.first()
    execution_pie_data = []
    if latest_run:
        execs = latest_run.executions.all()
        for s, label in TestExecution.STATUSES:
            count = execs.filter(status=s).count()
            if count > 0:
                execution_pie_data.append({'name': label, 'value': count, 'status': s})

    # Runs over time (bar chart)
    runs_data = []
    for run in test_runs.order_by('created_at')[:20]:
        execs = run.executions.all()
        runs_data.append({
            'name': run.name[:20],
            'created_at': run.created_at.strftime('%Y-%m-%d'),
            'passed': execs.filter(status='passed').count(),
            'failed': execs.filter(status='failed').count(),
            'skipped': execs.filter(status='skipped').count(),
            'blocked': execs.filter(status='blocked').count(),
            'pending': execs.filter(status='pending').count(),
            'total': execs.count(),
            'status': run.status,
        })

    # Summary table - test runs
    summary_table = []
    for run in test_runs[:10]:
        execs = run.executions.all()
        total = execs.count()
        passed = execs.filter(status='passed').count()
        failed = execs.filter(status='failed').count()
        pass_rate = round((passed / total * 100) if total > 0 else 0, 1)
        summary_table.append({
            'id': run.id,
            'name': run.name,
            'status': run.status,
            'total': total,
            'passed': passed,
            'failed': failed,
            'pass_rate': pass_rate,
            'created_at': run.created_at.strftime('%Y-%m-%d %H:%M'),
        })

    return Response({
        'project': {
            'id': project.id,
            'name': project.name,
            'description': project.description,
        },
        'totals': {
            'suites': suites.count(),
            'test_cases': test_cases.count(),
            'active_cases': test_cases.filter(status='active').count(),
            'test_runs': test_runs.count(),
            'members': project.members.count(),
        },
        'priority_distribution': priority_distribution,
        'run_status_distribution': run_status_distribution,
        'execution_pie_data': execution_pie_data,
        'runs_data': runs_data,
        'summary_table': summary_table,
    })
