import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getSuites, getCases } from '../api/tests'
import { getProject } from '../api/projects'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'

export default function TestCases() {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)
  const [suites, setSuites] = useState([])
  const [allCases, setAllCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSuite, setFilterSuite] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [projRes, suitesRes] = await Promise.all([
          getProject(projectId),
          getSuites(projectId),
        ])
        setProject(projRes.data)
        setSuites(suitesRes.data)

        // Fetch all cases for all suites
        const casesPromises = suitesRes.data.map((s) =>
          getCases(s.id).then((r) => r.data.map((c) => ({ ...c, suite_name: s.name })))
        )
        const casesArrays = await Promise.all(casesPromises)
        setAllCases(casesArrays.flat())
      } catch {
        setError('Failed to load test cases')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId])

  const filtered = allCases.filter((c) => {
    if (filterPriority && c.priority !== filterPriority) return false
    if (filterStatus && c.status !== filterStatus) return false
    if (filterSuite && String(c.suite) !== filterSuite) return false
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link to="/projects" className="hover:text-indigo-600">Projects</Link>
          <span>/</span>
          <Link to={`/projects/${projectId}`} className="hover:text-indigo-600">{project?.name}</Link>
          <span>/</span>
          <span className="text-gray-900">All Test Cases</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Test Cases</h1>
        <p className="text-gray-500 text-sm mt-1">{filtered.length} of {allCases.length} cases</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            placeholder="Search by title..."
          />
          <select value={filterSuite} onChange={(e) => setFilterSuite(e.target.value)} className="input-field">
            <option value="">All Suites</option>
            {suites.map((s) => (
              <option key={s.id} value={String(s.id)}>{s.name}</option>
            ))}
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="input-field">
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="deprecated">Deprecated</option>
          </select>
        </div>
      </div>

      {allCases.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No test cases yet.</p>
          <Link to={`/projects/${projectId}/suites`} className="text-indigo-600 hover:text-indigo-700 mt-2 inline-block">
            Go to Test Suites to add cases
          </Link>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Title</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Suite</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Priority</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tc) => (
                <tr key={tc.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{tc.title}</td>
                  <td className="py-3 px-4 text-gray-500">
                    <Link
                      to={`/projects/${projectId}/suites/${tc.suite}`}
                      className="hover:text-indigo-600"
                    >
                      {tc.suite_name}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <PriorityBadge priority={tc.priority} />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={tc.status} />
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {new Date(tc.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No test cases match the current filters
            </div>
          )}
        </div>
      )}
    </div>
  )
}
