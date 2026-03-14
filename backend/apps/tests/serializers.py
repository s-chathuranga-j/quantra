from rest_framework import serializers
from django.contrib.auth.models import User
from .models import TestSuite, TestCase, TestRun, TestExecution
from apps.users.serializers import UserBasicSerializer


class TestCaseSerializer(serializers.ModelSerializer):
    created_by = UserBasicSerializer(read_only=True)

    class Meta:
        model = TestCase
        fields = (
            'id', 'suite', 'title', 'description', 'preconditions',
            'steps', 'expected_result', 'priority', 'status',
            'created_by', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at', 'suite')


class TestCaseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestCase
        fields = (
            'id', 'title', 'description', 'preconditions',
            'steps', 'expected_result', 'priority', 'status'
        )
        read_only_fields = ('id',)


class TestSuiteSerializer(serializers.ModelSerializer):
    created_by = UserBasicSerializer(read_only=True)
    test_case_count = serializers.SerializerMethodField()
    children_count = serializers.SerializerMethodField()

    class Meta:
        model = TestSuite
        fields = (
            'id', 'project', 'name', 'description', 'parent',
            'created_by', 'created_at', 'test_case_count', 'children_count'
        )
        read_only_fields = ('id', 'created_by', 'created_at', 'project')

    def get_test_case_count(self, obj):
        return obj.test_cases.count()

    def get_children_count(self, obj):
        return obj.children.count()


class TestSuiteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestSuite
        fields = ('id', 'name', 'description', 'parent')
        read_only_fields = ('id',)


class TestSuiteDetailSerializer(serializers.ModelSerializer):
    created_by = UserBasicSerializer(read_only=True)
    test_cases = TestCaseSerializer(many=True, read_only=True)
    children = serializers.SerializerMethodField()
    test_case_count = serializers.SerializerMethodField()

    class Meta:
        model = TestSuite
        fields = (
            'id', 'project', 'name', 'description', 'parent',
            'created_by', 'created_at', 'test_cases', 'children', 'test_case_count'
        )
        read_only_fields = ('id', 'created_by', 'created_at', 'project')

    def get_children(self, obj):
        return TestSuiteSerializer(obj.children.all(), many=True).data

    def get_test_case_count(self, obj):
        return obj.test_cases.count()


class TestExecutionSerializer(serializers.ModelSerializer):
    test_case = TestCaseSerializer(read_only=True)
    executed_by = UserBasicSerializer(read_only=True)

    class Meta:
        model = TestExecution
        fields = (
            'id', 'run', 'test_case', 'status', 'notes',
            'executed_by', 'executed_at'
        )
        read_only_fields = ('id', 'run', 'test_case', 'executed_by')


class TestExecutionUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestExecution
        fields = ('status', 'notes')


class TestRunSerializer(serializers.ModelSerializer):
    created_by = UserBasicSerializer(read_only=True)
    execution_stats = serializers.SerializerMethodField()
    total_cases = serializers.SerializerMethodField()

    class Meta:
        model = TestRun
        fields = (
            'id', 'project', 'name', 'description', 'status',
            'created_by', 'created_at', 'started_at', 'completed_at',
            'execution_stats', 'total_cases'
        )
        read_only_fields = ('id', 'created_by', 'created_at', 'project')

    def get_execution_stats(self, obj):
        execs = obj.executions.all()
        stats = {}
        for status, _ in TestExecution.STATUSES:
            stats[status] = execs.filter(status=status).count()
        return stats

    def get_total_cases(self, obj):
        return obj.executions.count()


class TestRunCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestRun
        fields = ('id', 'name', 'description', 'status')
        read_only_fields = ('id',)
