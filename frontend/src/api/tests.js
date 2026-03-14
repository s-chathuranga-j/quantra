import api from './axios'

// Test Suites
export const getSuites = (projectId) =>
  api.get(`/projects/${projectId}/suites/`)

export const createSuite = (projectId, data) =>
  api.post(`/projects/${projectId}/suites/`, data)

export const getSuite = (projectId, suiteId) =>
  api.get(`/projects/${projectId}/suites/${suiteId}/`)

export const updateSuite = (projectId, suiteId, data) =>
  api.put(`/projects/${projectId}/suites/${suiteId}/`, data)

export const deleteSuite = (projectId, suiteId) =>
  api.delete(`/projects/${projectId}/suites/${suiteId}/`)

// Test Cases
export const getCases = (suiteId) =>
  api.get(`/suites/${suiteId}/cases/`)

export const createCase = (suiteId, data) =>
  api.post(`/suites/${suiteId}/cases/`, data)

export const getCase = (suiteId, caseId) =>
  api.get(`/suites/${suiteId}/cases/${caseId}/`)

export const updateCase = (suiteId, caseId, data) =>
  api.put(`/suites/${suiteId}/cases/${caseId}/`, data)

export const deleteCase = (suiteId, caseId) =>
  api.delete(`/suites/${suiteId}/cases/${caseId}/`)

// Test Runs
export const getRuns = (projectId) =>
  api.get(`/projects/${projectId}/runs/`)

export const createRun = (projectId, data) =>
  api.post(`/projects/${projectId}/runs/`, data)

export const getRun = (projectId, runId) =>
  api.get(`/projects/${projectId}/runs/${runId}/`)

export const updateRun = (projectId, runId, data) =>
  api.patch(`/projects/${projectId}/runs/${runId}/`, data)

export const deleteRun = (projectId, runId) =>
  api.delete(`/projects/${projectId}/runs/${runId}/`)

export const addCasesToRun = (projectId, runId, data) =>
  api.post(`/projects/${projectId}/runs/${runId}/add_cases/`, data)

// Executions
export const getExecutions = (runId) =>
  api.get(`/runs/${runId}/executions/`)

export const updateExecution = (runId, executionId, data) =>
  api.patch(`/runs/${runId}/executions/${executionId}/`, data)
