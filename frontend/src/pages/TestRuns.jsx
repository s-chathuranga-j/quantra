import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getRuns, createRun, deleteRun } from '../api/tests'
import { getProject } from '../api/projects'
import StatusBadge from '../components/StatusBadge'

function CreateRunModal({ projectId, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await createRun(projectId, form)
      onCreated(res.data)
    } catch (err) {
      setError(err.response?.data?.name?.[0] || 'Failed to create run')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Test Run</h2>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Run Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
              placeholder="e.g. Sprint 5 Regression"
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
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating...' : 'Create Run'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TestRuns() {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    Promise.all([getProject(projectId), getRuns(projectId)])
      .then(([projRes, runsRes]) => {
        setProject(projRes.data)
        setRuns(runsRes.data)
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false))
  }, [projectId])

  const handleDelete = async (runId, name) => {
    if (!confirm(`Delete test run "${name}"?`)) return
    try {
      await deleteRun(projectId, runId)
      setRuns(runs.filter((r) => r.id !== runId))
    } catch {
      alert('Failed to delete run')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/projects" className="hover:text-indigo-600">Projects</Link>
            <span>/</span>
            <Link to={`/projects/${projectId}`} className="hover:text-indigo-600">{project?.name}</Link>
            <span>/</span>
            <span className="text-gray-900">Test Runs</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Test Runs</h1>
          <p className="text-gray-500 text-sm mt-1">{runs.length} run{runs.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + New Run
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>
      )}

      {runs.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No test runs yet</h3>
          <p className="text-gray-500 mb-4">Create a run to start executing test cases</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Create Test Run</button>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => {
            const total = run.total_cases
            const stats = run.execution_stats || {}
            const passed = stats.passed || 0
            const failed = stats.failed || 0
            const completed = total - (stats.pending || 0)
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0

            return (
              <div key={run.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        to={`/projects/${projectId}/runs/${run.id}`}
                        className="font-semibold text-gray-900 hover:text-indigo-600"
                      >
                        {run.name}
                      </Link>
                      <StatusBadge status={run.status} />
                    </div>
                    {run.description && (
                      <p className="text-sm text-gray-500 mb-2">{run.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{total} cases</span>
                      <span className="text-green-600">{passed} passed</span>
                      <span className="text-red-500">{failed} failed</span>
                      <span>{new Date(run.created_at).toLocaleDateString()}</span>
                    </div>
                    {total > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{completed}/{total}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      to={`/projects/${projectId}/runs/${run.id}`}
                      className="btn-secondary text-sm py-1.5 px-3"
                    >
                      Open
                    </Link>
                    <button
                      onClick={() => handleDelete(run.id, run.name)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <CreateRunModal
          projectId={projectId}
          onClose={() => setShowModal(false)}
          onCreated={(r) => { setRuns([r, ...runs]); setShowModal(false) }}
        />
      )}
    </div>
  )
}
