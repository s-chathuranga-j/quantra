from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Project, ProjectMember
from apps.users.serializers import UserBasicSerializer


class ProjectMemberSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), write_only=True, source='user'
    )

    class Meta:
        model = ProjectMember
        fields = ('id', 'user', 'user_id', 'role', 'joined_at')
        read_only_fields = ('id', 'joined_at')


class ProjectSerializer(serializers.ModelSerializer):
    created_by = UserBasicSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    test_case_count = serializers.SerializerMethodField()
    suite_count = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = (
            'id', 'name', 'description', 'created_by',
            'created_at', 'updated_at', 'member_count',
            'test_case_count', 'suite_count', 'user_role'
        )
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')

    def get_member_count(self, obj):
        return obj.members.count()

    def get_test_case_count(self, obj):
        from apps.tests.models import TestCase
        return TestCase.objects.filter(suite__project=obj).count()

    def get_suite_count(self, obj):
        return obj.suites.count()

    def get_user_role(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            membership = obj.members.filter(user=request.user).first()
            if membership:
                return membership.role
        return None


class ProjectCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ('id', 'name', 'description')
        read_only_fields = ('id',)

    def create(self, validated_data):
        request = self.context.get('request')
        project = Project.objects.create(created_by=request.user, **validated_data)
        # Auto-add creator as admin
        ProjectMember.objects.create(project=project, user=request.user, role='admin')
        return project
