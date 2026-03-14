from django.contrib import admin
from .models import TestSuite, TestCase, TestRun, TestExecution


@admin.register(TestSuite)
class TestSuiteAdmin(admin.ModelAdmin):
    list_display = ('name', 'project', 'created_by', 'created_at')
    list_filter = ('project',)
    search_fields = ('name', 'project__name')


@admin.register(TestCase)
class TestCaseAdmin(admin.ModelAdmin):
    list_display = ('title', 'suite', 'priority', 'status', 'created_by', 'created_at')
    list_filter = ('priority', 'status', 'suite__project')
    search_fields = ('title',)


@admin.register(TestRun)
class TestRunAdmin(admin.ModelAdmin):
    list_display = ('name', 'project', 'status', 'created_by', 'created_at')
    list_filter = ('status', 'project')
    search_fields = ('name',)


@admin.register(TestExecution)
class TestExecutionAdmin(admin.ModelAdmin):
    list_display = ('test_case', 'run', 'status', 'executed_by', 'executed_at')
    list_filter = ('status',)
