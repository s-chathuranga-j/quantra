import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getSuites, createSuite, deleteSuite } from '../api/tests'
import { getProject } from '../api/projects'

function CreateSuiteModal({ projectId, suites, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', parent: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        name: form.name,
        description: form.description,
        parent: form.parent || null,
      }
      const res = await createSuite(projectId, payload)
      onCreated(res.data)
    } catch (err) {
      setError(err.response?.data?.name?.[0] || 'Failed to create suite')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Test Suite</h2>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Suite Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
              placeholder="e.g. Authentication Tests"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field resize-none"
              rows={2}
              placeholder="Optional description..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent Suite (optional)</label>
            <select
              value={form.parent}
              onChange={(e) => setForm({ ...form, parent: e.target.value })}
              className="input-field"
            >
              <option value="">None (top-level)</option>
              {suites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating...' : 'Create Suite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TestSuites() {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)
  const [suites, setSuites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    Promise.all([getProject(projectId), getSuites(projectId)])
      .then(([projRes, suitesRes]) => {
        setProject(projRes.data)
        setSuites(suitesRes.data)
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false))
  }, [projectId])

  const handleDelete = async (suiteId, name) => {
    if (!confirm(`Delete suite "${name}"? All test cases inside will also be deleted.`)) return
    try {
      await deleteSuite(projectId, suiteId)
      setSuites(suites.filter((s) => s.id !== suiteId))
    } catch (err) {
      alert('Failed to delete suite')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const topLevel = suites.filter((s) => !s.parent)
  const children = suites.filter((s) => s.parent)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/projects" className="hover:text-indigo-600">Projects</Link>
            <span>/</span>
            <Link to={`/projects/${projectId}`} className="hover:text-indigo-600">
              {project?.name}
            </Link>
            <span>/</span>
            <span className="text-gray-900">Test Suites</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Test Suites</h1>
          <p className="text-gray-500 text-sm mt-1">{suites.length} suite{suites.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + New Suite
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>
      )}

      {suites.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No test suites yet</h3>
          <p className="text-gray-500 mb-4">Create suites to organize your test cases</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Create Suite</button>
        </div>
      ) : (
        <div className="space-y-3">
          {topLevel.map((suite) => {
            const suiteChildren = children.filter((c) => c.parent === suite.id)
            return (
              <div key={suite.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/projects/${projectId}/suites/${suite.id}`}
                        className="font-semibold text-gray-900 hover:text-indigo-600 block truncate"
                      >
                        {suite.name}
                      </Link>
                      {suite.description && (
                        <p className="text-sm text-gray-500 truncate">{suite.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {suite.test_case_count} test case{suite.test_case_count !== 1 ? 's' : ''}
                        {suiteChildren.length > 0 && ` · ${suiteChildren.length} sub-suite${suiteChildren.length !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      to={`/projects/${projectId}/suites/${suite.id}`}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      Open
                    </Link>
                    <button
                      onClick={() => handleDelete(suite.id, suite.name)}
                      className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Child suites */}
                {suiteChildren.length > 0 && (
                  <div className="mt-3 ml-13 pl-4 border-l-2 border-gray-100 space-y-2">
                    {suiteChildren.map((child) => (
                      <div key={child.id} className="flex items-center justify-between py-1">
                        <div>
                          <Link
                            to={`/projects/${projectId}/suites/${child.id}`}
                            className="text-sm font-medium text-gray-700 hover:text-indigo-600"
                          >
                            {child.name}
                          </Link>
                          <span className="text-xs text-gray-400 ml-2">
                            {child.test_case_count} case{child.test_case_count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDelete(child.id, child.name)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <CreateSuiteModal
          projectId={projectId}
          suites={suites}
          onClose={() => setShowModal(false)}
          onCreated={(s) => { setSuites([...suites, s]); setShowModal(false) }}
        />
      )}
    </div>
  )
}
