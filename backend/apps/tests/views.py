from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.projects.models import Project
from apps.projects.views import get_project_or_403, is_project_admin
from .models import TestSuite, TestCase, TestRun, TestExecution
from .serializers import (
    TestSuiteSerializer, TestSuiteCreateSerializer, TestSuiteDetailSerializer,
    TestCaseSerializer, TestCaseCreateSerializer,
    TestRunSerializer, TestRunCreateSerializer,
    TestExecutionSerializer, TestExecutionUpdateSerializer,
)


# ---- Test Suites ----

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def suite_list_create(request, project_id):
    project, error = get_project_or_403(project_id, request.user)
    if error:
        return error

    if request.method == 'GET':
        suites = TestSuite.objects.filter(project=project)
        serializer = TestSuiteSerializer(suites, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = TestSuiteCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        suite = serializer.save(project=project, created_by=request.user)
        return Response(TestSuiteSerializer(suite).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def suite_detail(request, project_id, suite_id):
    project, error = get_project_or_403(project_id, request.user)
    if error:
        return error

    suite = get_object_or_404(TestSuite, pk=suite_id, project=project)

    if request.method == 'GET':
        serializer = TestSuiteDetailSerializer(suite)
        return Response(serializer.data)

    elif request.method in ('PUT', 'PATCH'):
        partial = request.method == 'PATCH'
        serializer = TestSuiteCreateSerializer(suite, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        suite = serializer.save()
        return Response(TestSuiteSerializer(suite).data)

    elif request.method == 'DELETE':
        suite.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---- Test Cases ----

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def case_list_create(request, suite_id):
    suite = get_object_or_404(TestSuite, pk=suite_id)
    project, error = get_project_or_403(suite.project_id, request.user)
    if error:
        return error

    if request.method == 'GET':
        cases = TestCase.objects.filter(suite=suite)
        serializer = TestCaseSerializer(cases, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = TestCaseCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        case = serializer.save(suite=suite, created_by=request.user)
        return Response(TestCaseSerializer(case).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def case_detail(request, suite_id, case_id):
    suite = get_object_or_404(TestSuite, pk=suite_id)
    project, error = get_project_or_403(suite.project_id, request.user)
    if error:
        return error

    case = get_object_or_404(TestCase, pk=case_id, suite=suite)

    if request.method == 'GET':
        serializer = TestCaseSerializer(case)
        return Response(serializer.data)

    elif request.method in ('PUT', 'PATCH'):
        partial = request.method == 'PATCH'
        serializer = TestCaseCreateSerializer(case, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        case = serializer.save()
        return Response(TestCaseSerializer(case).data)

    elif request.method == 'DELETE':
        case.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---- Test Runs ----

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def run_list_create(request, project_id):
    project, error = get_project_or_403(project_id, request.user)
    if error:
        return error

    if request.method == 'GET':
        runs = TestRun.objects.filter(project=project)
        serializer = TestRunSerializer(runs, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = TestRunCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        run = serializer.save(project=project, created_by=request.user)
        return Response(TestRunSerializer(run).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def run_detail(request, project_id, run_id):
    project, error = get_project_or_403(project_id, request.user)
    if error:
        return error

    run = get_object_or_404(TestRun, pk=run_id, project=project)

    if request.method == 'GET':
        serializer = TestRunSerializer(run)
        return Response(serializer.data)

    elif request.method in ('PUT', 'PATCH'):
        partial = request.method == 'PATCH'
        serializer = TestRunCreateSerializer(run, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        # Handle started_at and completed_at based on status changes
        new_status = serializer.validated_data.get('status', run.status)
        if new_status == 'in_progress' and not run.started_at:
            run.started_at = timezone.now()
        elif new_status in ('completed', 'aborted') and not run.completed_at:
            run.completed_at = timezone.now()
        run = serializer.save()
        return Response(TestRunSerializer(run).data)

    elif request.method == 'DELETE':
        run.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def run_add_cases(request, project_id, run_id):
    project, error = get_project_or_403(project_id, request.user)
    if error:
        return error

    run = get_object_or_404(TestRun, pk=run_id, project=project)

    suite_ids = request.data.get('suite_ids', [])
    case_ids = request.data.get('case_ids', [])

    added = 0

    # Add all test cases from the given suites
    if suite_ids:
        cases_from_suites = TestCase.objects.filter(
            suite__id__in=suite_ids,
            suite__project=project,
            status='active'
        )
        for case in cases_from_suites:
            _, created = TestExecution.objects.get_or_create(run=run, test_case=case)
            if created:
                added += 1

    # Add specific test cases
    if case_ids:
        cases = TestCase.objects.filter(id__in=case_ids, suite__project=project)
        for case in cases:
            _, created = TestExecution.objects.get_or_create(run=run, test_case=case)
            if created:
                added += 1

    return Response({'added': added, 'total': run.executions.count()})


# ---- Test Executions ----

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def execution_list(request, run_id):
    run = get_object_or_404(TestRun, pk=run_id)
    project, error = get_project_or_403(run.project_id, request.user)
    if error:
        return error

    executions = run.executions.select_related('test_case', 'executed_by').all()
    serializer = TestExecutionSerializer(executions, many=True)
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def execution_detail(request, run_id, execution_id):
    run = get_object_or_404(TestRun, pk=run_id)
    project, error = get_project_or_403(run.project_id, request.user)
    if error:
        return error

    execution = get_object_or_404(TestExecution, pk=execution_id, run=run)

    partial = request.method == 'PATCH'
    serializer = TestExecutionUpdateSerializer(execution, data=request.data, partial=partial)
    serializer.is_valid(raise_exception=True)

    new_status = serializer.validated_data.get('status', execution.status)
    if new_status != 'pending' and execution.status == 'pending':
        execution.executed_by = request.user
        execution.executed_at = timezone.now()
    elif new_status != 'pending':
        execution.executed_by = request.user
        execution.executed_at = timezone.now()

    execution = serializer.save()
    return Response(TestExecutionSerializer(execution).data)
