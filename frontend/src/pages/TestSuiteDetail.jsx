import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getSuite, createCase, deleteCase } from '../api/tests'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'

function CreateCaseModal({ suiteId, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    preconditions: '',
    steps: '',
    expected_result: '',
    priority: 'medium',
    status: 'active',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await createCase(suiteId, form)
      onCreated(res.data)
    } catch (err) {
      setError(err.response?.data?.title?.[0] || 'Failed to create test case')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Test Case</h2>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-field"
              placeholder="e.g. Verify login with valid credentials"
              required
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="input-field"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input-field"
              >
                <option value="active">Active</option>
                <option value="deprecated">Deprecated</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field resize-none"
              rows={2}
              placeholder="Brief description..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preconditions</label>
            <textarea
              value={form.preconditions}
              onChange={(e) => setForm({ ...form, preconditions: e.target.value })}
              className="input-field resize-none"
              rows={2}
              placeholder="Requirements before test execution..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Test Steps</label>
            <textarea
              value={form.steps}
              onChange={(e) => setForm({ ...form, steps: e.target.value })}
              className="input-field resize-none"
              rows={4}
              placeholder="1. Navigate to login page&#10;2. Enter valid credentials&#10;3. Click Login button"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Result</label>
            <textarea
              value={form.expected_result}
              onChange={(e) => setForm({ ...form, expected_result: e.target.value })}
              className="input-field resize-none"
              rows={2}
              placeholder="User should be redirected to the dashboard..."
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating...' : 'Create Test Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TestSuiteDetail() {
  const { projectId, suiteId } = useParams()
  const [suite, setSuite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [expandedCase, setExpandedCase] = useState(null)

  useEffect(() => {
    getSuite(projectId, suiteId)
      .then((res) => setSuite(res.data))
      .catch(() => setError('Failed to load suite'))
      .finally(() => setLoading(false))
  }, [projectId, suiteId])

  const handleDeleteCase = async (caseId, title) => {
    if (!confirm(`Delete test case "${title}"?`)) return
    try {
      await deleteCase(suiteId, caseId)
      setSuite({
        ...suite,
        test_cases: suite.test_cases.filter((c) => c.id !== caseId),
      })
    } catch (err) {
      alert('Failed to delete test case')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error || !suite) {
    return <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link to="/projects" className="hover:text-indigo-600">Projects</Link>
          <span>/</span>
          <Link to={`/projects/${projectId}`} className="hover:text-indigo-600">{suite.project}</Link>
          <span>/</span>
          <Link to={`/projects/${projectId}/suites`} className="hover:text-indigo-600">Suites</Link>
          <span>/</span>
          <span className="text-gray-900">{suite.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{suite.name}</h1>
            {suite.description && <p className="text-gray-500 mt-1">{suite.description}</p>}
            <p className="text-sm text-gray-400 mt-1">
              {suite.test_case_count} test case{suite.test_case_count !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + New Test Case
          </button>
        </div>
      </div>

      {/* Child suites */}
      {suite.children?.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Sub-Suites</h2>
          <div className="space-y-2">
            {suite.children.map((child) => (
              <Link
                key={child.id}
                to={`/projects/${projectId}/suites/${child.id}`}
                className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50"
              >
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-sm font-medium text-gray-700">{child.name}</span>
                <span className="text-xs text-gray-400">{child.test_case_count} cases</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Test Cases */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Test Cases</h2>
        {suite.test_cases?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No test cases in this suite yet</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Add Test Case
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {suite.test_cases?.map((tc) => (
              <div key={tc.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedCase(expandedCase === tc.id ? null : tc.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <svg
                      className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${expandedCase === tc.id ? 'rotate-90' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-medium text-gray-900 truncate">{tc.title}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <PriorityBadge priority={tc.priority} />
                    <StatusBadge status={tc.status} />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteCase(tc.id, tc.title) }}
                      className="text-gray-400 hover:text-red-500 transition-colors ml-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {expandedCase === tc.id && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-3 text-sm">
                    {tc.description && (
                      <div>
                        <p className="font-medium text-gray-700 mb-1">Description</p>
                        <p className="text-gray-600 whitespace-pre-line">{tc.description}</p>
                      </div>
                    )}
                    {tc.preconditions && (
                      <div>
                        <p className="font-medium text-gray-700 mb-1">Preconditions</p>
                        <p className="text-gray-600 whitespace-pre-line">{tc.preconditions}</p>
                      </div>
                    )}
                    {tc.steps && (
                      <div>
                        <p className="font-medium text-gray-700 mb-1">Steps</p>
                        <p className="text-gray-600 whitespace-pre-line">{tc.steps}</p>
                      </div>
                    )}
                    {tc.expected_result && (
                      <div>
                        <p className="font-medium text-gray-700 mb-1">Expected Result</p>
                        <p className="text-gray-600 whitespace-pre-line">{tc.expected_result}</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-400">
                      Created by {tc.created_by?.username} on {new Date(tc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <CreateCaseModal
          suiteId={suiteId}
          onClose={() => setShowModal(false)}
          onCreated={(tc) => {
            setSuite({ ...suite, test_cases: [...(suite.test_cases || []), tc], test_case_count: suite.test_case_count + 1 })
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}
