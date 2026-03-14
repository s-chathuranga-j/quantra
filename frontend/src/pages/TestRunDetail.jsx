import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getRun, getExecutions, updateExecution, updateRun, getSuites, addCasesToRun } from '../api/tests'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'

const EXECUTION_STATUSES = ['pending', 'passed', 'failed', 'skipped', 'blocked']

const statusColors = {
  passed: 'text-green-600',
  failed: 'text-red-600',
  skipped: 'text-gray-500',
  blocked: 'text-orange-500',
  pending: 'text-yellow-600',
}

function AddCasesModal({ projectId, runId, onClose, onAdded }) {
  const [suites, setSuites] = useState([])
  const [selectedSuites, setSelectedSuites] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    getSuites(projectId)
      .then((res) => setSuites(res.data))
      .finally(() => setFetching(false))
  }, [projectId])

  const toggleSuite = (id) => {
    setSelectedSuites((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handleAdd = async () => {
    if (selectedSuites.length === 0) return
    setLoading(true)
    try {
      const res = await addCasesToRun(projectId, runId, { suite_ids: selectedSuites })
      onAdded(res.data.added)
    } catch (err) {
      alert('Failed to add test cases')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Test Cases to Run</h2>
        <p className="text-sm text-gray-500 mb-4">Select suites to add all their active test cases:</p>
        {fetching ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : suites.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No test suites found. Create suites with test cases first.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
            {suites.map((suite) => (
              <label key={suite.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedSuites.includes(suite.id)}
                  onChange={() => toggleSuite(suite.id)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">{suite.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{suite.test_case_count} cases</span>
                </div>
              </label>
            ))}
          </div>
        )}
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleAdd}
            disabled={loading || selectedSuites.length === 0}
            className="btn-primary"
          >
            {loading ? 'Adding...' : `Add Cases from ${selectedSuites.length} Suite${selectedSuites.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TestRunDetail() {
  const { projectId, runId } = useParams()
  const [run, setRun] = useState(null)
  const [executions, setExecutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})
  const [error, setError] = useState('')
  const [showAddCases, setShowAddCases] = useState(false)
  const [localEdits, setLocalEdits] = useState({})

  const loadData = useCallback(async () => {
    try {
      const [runRes, execRes] = await Promise.all([
        getRun(projectId, runId),
        getExecutions(runId),
      ])
      setRun(runRes.data)
      setExecutions(execRes.data)
    } catch {
      setError('Failed to load run data')
    } finally {
      setLoading(false)
    }
  }, [projectId, runId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleStatusChange = (execId, status) => {
    setLocalEdits((prev) => ({
      ...prev,
      [execId]: { ...prev[execId], status },
    }))
  }

  const handleNotesChange = (execId, notes) => {
    setLocalEdits((prev) => ({
      ...prev,
      [execId]: { ...prev[execId], notes },
    }))
  }

  const handleSave = async (exec) => {
    const edits = localEdits[exec.id]
    if (!edits) return
    setSaving((prev) => ({ ...prev, [exec.id]: true }))
    try {
      const res = await updateExecution(runId, exec.id, edits)
      setExecutions((prev) => prev.map((e) => (e.id === exec.id ? res.data : e)))
      setLocalEdits((prev) => {
        const next = { ...prev }
        delete next[exec.id]
        return next
      })
    } catch {
      alert('Failed to save')
    } finally {
      setSaving((prev) => ({ ...prev, [exec.id]: false }))
    }
  }

  const handleRunStatusChange = async (newStatus) => {
    try {
      const res = await updateRun(projectId, runId, { status: newStatus })
      setRun(res.data)
    } catch {
      alert('Failed to update run status')
    }
  }

  const handleCasesAdded = async (count) => {
    setShowAddCases(false)
    await loadData()
    if (count > 0) {
      alert(`Added ${count} test case${count !== 1 ? 's' : ''} to the run`)
    } else {
      alert('No new cases added (already included or no active cases in selected suites)')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error || !run) {
    return <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>
  }

  const total = executions.length
  const stats = {}
  EXECUTION_STATUSES.forEach((s) => {
    stats[s] = executions.filter((e) => {
      const edit = localEdits[e.id]
      return (edit?.status || e.status) === s
    }).length
  })
  const completed = total - stats.pending
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link to="/projects" className="hover:text-indigo-600">Projects</Link>
          <span>/</span>
          <Link to={`/projects/${projectId}`} className="hover:text-indigo-600">{run.project}</Link>
          <span>/</span>
          <Link to={`/projects/${projectId}/runs`} className="hover:text-indigo-600">Runs</Link>
          <span>/</span>
          <span className="text-gray-900">{run.name}</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{run.name}</h1>
              <StatusBadge status={run.status} size="md" />
            </div>
            {run.description && (
              <p className="text-gray-500 mt-1">{run.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            {run.status === 'pending' && (
              <button
                onClick={() => handleRunStatusChange('in_progress')}
                className="btn-primary text-sm"
              >
                Start Run
              </button>
            )}
            {run.status === 'in_progress' && (
              <button
                onClick={() => handleRunStatusChange('completed')}
                className="btn-primary text-sm bg-green-600 hover:bg-green-700"
              >
                Complete Run
              </button>
            )}
            <button
              onClick={() => setShowAddCases(true)}
              className="btn-secondary text-sm"
            >
              + Add Cases
            </button>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium text-gray-900">{total} Total</span>
            {EXECUTION_STATUSES.map((s) => (
              stats[s] > 0 && (
                <span key={s} className={`font-medium ${statusColors[s]}`}>
                  {stats[s]} {s}
                </span>
              )
            ))}
          </div>
          <span className="text-sm font-medium text-gray-700">{progress}%</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex">
          {total > 0 && (
            <>
              <div className="bg-green-500 h-full transition-all" style={{ width: `${(stats.passed / total) * 100}%` }} />
              <div className="bg-red-500 h-full transition-all" style={{ width: `${(stats.failed / total) * 100}%` }} />
              <div className="bg-orange-500 h-full transition-all" style={{ width: `${(stats.blocked / total) * 100}%` }} />
              <div className="bg-gray-400 h-full transition-all" style={{ width: `${(stats.skipped / total) * 100}%` }} />
            </>
          )}
        </div>
        <div className="flex gap-4 mt-2 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>Passed</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full inline-block"></span>Failed</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-500 rounded-full inline-block"></span>Blocked</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-400 rounded-full inline-block"></span>Skipped</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-400 rounded-full inline-block"></span>Pending</span>
        </div>
      </div>

      {/* Executions */}
      {executions.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 mb-4">No test cases in this run yet</p>
          <button onClick={() => setShowAddCases(true)} className="btn-primary">
            Add Test Cases
          </button>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-base font-semibold text-gray-900">Test Executions</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {executions.map((exec) => {
              const edit = localEdits[exec.id] || {}
              const currentStatus = edit.status !== undefined ? edit.status : exec.status
              const currentNotes = edit.notes !== undefined ? edit.notes : exec.notes
              const hasChanges = Object.keys(localEdits[exec.id] || {}).length > 0

              return (
                <div key={exec.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 truncate">
                          {exec.test_case?.title}
                        </p>
                        <PriorityBadge priority={exec.test_case?.priority} />
                      </div>
                      {exec.test_case?.steps && (
                        <p className="text-xs text-gray-400 truncate">{exec.test_case.steps.split('\n')[0]}</p>
                      )}
                      {exec.executed_by && (
                        <p className="text-xs text-gray-400 mt-1">
                          by {exec.executed_by.username} at {new Date(exec.executed_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-start gap-3 flex-shrink-0">
                      <select
                        value={currentStatus}
                        onChange={(e) => handleStatusChange(exec.id, e.target.value)}
                        className={`text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium ${statusColors[currentStatus] || ''}`}
                      >
                        {EXECUTION_STATUSES.map((s) => (
                          <option key={s} value={s} className="text-gray-900">
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-3">
                    <textarea
                      value={currentNotes}
                      onChange={(e) => handleNotesChange(exec.id, e.target.value)}
                      className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={2}
                      placeholder="Add notes (bugs, observations, links...)..."
                    />
                    <button
                      onClick={() => handleSave(exec)}
                      disabled={!hasChanges || saving[exec.id]}
                      className={`self-end btn-primary text-sm py-2 px-4 ${!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {saving[exec.id] ? '...' : 'Save'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showAddCases && (
        <AddCasesModal
          projectId={projectId}
          runId={runId}
          onClose={() => setShowAddCases(false)}
          onAdded={handleCasesAdded}
        />
      )}
    </div>
  )
}
