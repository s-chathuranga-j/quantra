import api from './axios'

export const getDashboardStats = (projectId) => {
  const params = projectId ? `?project_id=${projectId}` : ''
  return api.get(`/reports/dashboard/${params}`)
}

export const getProjectSummary = (projectId) =>
  api.get(`/reports/projects/${projectId}/summary/`)
