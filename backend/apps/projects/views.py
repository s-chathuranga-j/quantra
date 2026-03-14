from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Project, ProjectMember
from .serializers import ProjectSerializer, ProjectCreateSerializer, ProjectMemberSerializer


def get_project_or_403(project_id, user):
    project = get_object_or_404(Project, pk=project_id)
    if not project.members.filter(user=user).exists() and not user.is_staff:
        return None, Response({'detail': 'Not a member of this project.'}, status=status.HTTP_403_FORBIDDEN)
    return project, None


def is_project_admin(project, user):
    if user.is_staff:
        return True
    membership = project.members.filter(user=user).first()
    return membership and membership.role == 'admin'


class ProjectListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProjectCreateSerializer
        return ProjectSerializer

    def get_queryset(self):
        if self.request.user.is_staff:
            return Project.objects.all()
        return Project.objects.filter(members__user=self.request.user).distinct()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def create(self, request, *args, **kwargs):
        serializer = ProjectCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        project = serializer.save()
        return Response(ProjectSerializer(project, context={'request': request}).data, status=status.HTTP_201_CREATED)


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProjectSerializer

    def get_object(self):
        project = get_object_or_404(Project, pk=self.kwargs['pk'])
        if not project.members.filter(user=self.request.user).exists() and not self.request.user.is_staff:
            self.permission_denied(self.request)
        return project

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def update(self, request, *args, **kwargs):
        project = self.get_object()
        if not is_project_admin(project, request.user):
            return Response({'detail': 'Only admins can update the project.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        project = self.get_object()
        if not is_project_admin(project, request.user):
            return Response({'detail': 'Only admins can delete the project.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def project_members_view(request, pk):
    project, error = get_project_or_403(pk, request.user)
    if error:
        return error

    if request.method == 'GET':
        members = project.members.all()
        serializer = ProjectMemberSerializer(members, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        if not is_project_admin(project, request.user):
            return Response({'detail': 'Only admins can add members.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = ProjectMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        role = serializer.validated_data.get('role', 'tester')
        member, created = ProjectMember.objects.get_or_create(
            project=project, user=user,
            defaults={'role': role}
        )
        if not created:
            member.role = role
            member.save()
        return Response(ProjectMemberSerializer(member).data, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def remove_member_view(request, pk, user_id):
    project, error = get_project_or_403(pk, request.user)
    if error:
        return error

    if not is_project_admin(project, request.user):
        return Response({'detail': 'Only admins can remove members.'}, status=status.HTTP_403_FORBIDDEN)

    member = get_object_or_404(ProjectMember, project=project, user_id=user_id)
    # Prevent removing the last admin
    if member.role == 'admin' and project.members.filter(role='admin').count() <= 1:
        return Response({'detail': 'Cannot remove the last admin.'}, status=status.HTTP_400_BAD_REQUEST)
    member.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
