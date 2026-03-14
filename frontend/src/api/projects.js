import api from './axios'

export const getProjects = () => api.get('/projects/')

export const createProject = (data) => api.post('/projects/', data)

export const getProject = (id) => api.get(`/projects/${id}/`)

export const updateProject = (id, data) => api.put(`/projects/${id}/`, data)

export const deleteProject = (id) => api.delete(`/projects/${id}/`)

export const getProjectMembers = (projectId) =>
  api.get(`/projects/${projectId}/members/`)

export const addProjectMember = (projectId, data) =>
  api.post(`/projects/${projectId}/members/`, data)

export const removeProjectMember = (projectId, userId) =>
  api.delete(`/projects/${projectId}/members/${userId}/`)
