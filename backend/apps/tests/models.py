from django.db import models
from django.contrib.auth.models import User
from apps.projects.models import Project


class TestSuite(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='suites')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    parent = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children'
    )
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.project.name} / {self.name}"

    class Meta:
        ordering = ['name']


class TestCase(models.Model):
    PRIORITIES = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('critical', 'Critical')]
    STATUSES = [('active', 'Active'), ('deprecated', 'Deprecated')]

    suite = models.ForeignKey(TestSuite, on_delete=models.CASCADE, related_name='test_cases')
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    preconditions = models.TextField(blank=True)
    steps = models.TextField(blank=True)
    expected_result = models.TextField(blank=True)
    priority = models.CharField(max_length=20, choices=PRIORITIES, default='medium')
    status = models.CharField(max_length=20, choices=STATUSES, default='active')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['title']


class TestRun(models.Model):
    STATUSES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('aborted', 'Aborted'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='test_runs')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUSES, default='pending')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_runs')
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.project.name} / {self.name}"

    class Meta:
        ordering = ['-created_at']


class TestExecution(models.Model):
    STATUSES = [
        ('pending', 'Pending'),
        ('passed', 'Passed'),
        ('failed', 'Failed'),
        ('skipped', 'Skipped'),
        ('blocked', 'Blocked'),
    ]

    run = models.ForeignKey(TestRun, on_delete=models.CASCADE, related_name='executions')
    test_case = models.ForeignKey(TestCase, on_delete=models.CASCADE, related_name='executions')
    status = models.CharField(max_length=20, choices=STATUSES, default='pending')
    notes = models.TextField(blank=True)
    executed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='executed_tests'
    )
    executed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.run.name} / {self.test_case.title} ({self.status})"

    class Meta:
        ordering = ['test_case__title']
