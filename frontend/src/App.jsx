import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import TestSuites from './pages/TestSuites'
import TestSuiteDetail from './pages/TestSuiteDetail'
import TestCases from './pages/TestCases'
import TestRuns from './pages/TestRuns'
import TestRunDetail from './pages/TestRunDetail'
import Reports from './pages/Reports'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:projectId" element={<ProjectDetail />} />
              <Route path="/projects/:projectId/suites" element={<TestSuites />} />
              <Route path="/projects/:projectId/suites/:suiteId" element={<TestSuiteDetail />} />
              <Route path="/projects/:projectId/cases" element={<TestCases />} />
              <Route path="/projects/:projectId/runs" element={<TestRuns />} />
              <Route path="/projects/:projectId/runs/:runId" element={<TestRunDetail />} />
              <Route path="/reports" element={<Reports />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
