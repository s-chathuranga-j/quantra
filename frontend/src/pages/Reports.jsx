import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { getProjects } from '../api/projects'
import { getProjectSummary } from '../api/reports'
import StatusBadge from '../components/StatusBadge'

const PIE_COLORS = {
  passed: '#22c55e',
  failed: '#ef4444',
  pending: '#eab308',
  skipped: '#9ca3af',
  blocked: '#f97316',
}

export default function Reports() {
  const [searchParams] = useSearchParams()
  const initialProject = searchParams.get('project') || ''

  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(initialProject)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getProjects().then((res) => {
      setProjects(res.data)
      if (!initialProject && res.data.length > 0) {
        setSelectedProject(String(res.data[0].id))
      }
    })
  }, [])

  useEffect(() => {
    if (!selectedProject) return
    setLoading(true)
    setError('')
    getProjectSummary(selectedProject)
      .then((res) => setSummary(res.data))
      .catch(() => setError('Failed to load project summary'))
      .finally(() => setLoading(false))
  }, [selectedProject])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Test analytics and insights</p>
        </div>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="input-field w-64"
        >
          <option value="">Select a project</option>
          {projects.map((p) => (
            <option key={p.id} value={String(p.id)}>{p.name}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {!selectedProject && !loading && (
        <div className="card text-center py-16 text-gray-400">
          Select a project to view its reports
        </div>
      )}

      {summary && !loading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: 'Suites', value: summary.totals.suites, color: 'text-blue-600' },
              { label: 'Test Cases', value: summary.totals.test_cases, color: 'text-purple-600' },
              { label: 'Active Cases', value: summary.totals.active_cases, color: 'text-green-600' },
              { label: 'Test Runs', value: summary.totals.test_runs, color: 'text-indigo-600' },
              { label: 'Members', value: summary.totals.members, color: 'text-gray-700' },
            ].map((s) => (
              <div key={s.label} className="card text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart - Latest Run Executions */}
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Latest Run Results</h2>
              {summary.execution_pie_data?.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={summary.execution_pie_data}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {summary.execution_pie_data.map((entry) => (
                        <Cell key={entry.status} fill={PIE_COLORS[entry.status] || '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                  No execution data available yet
                </div>
              )}
            </div>

            {/* Priority Distribution */}
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Test Cases by Priority</h2>
              {Object.values(summary.priority_distribution).some(v => v > 0) ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={Object.entries(summary.priority_distribution).map(([k, v]) => ({
                      name: k.charAt(0).toUpperCase() + k.slice(1),
                      count: v,
                    }))}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Test Cases" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                  No test case data available yet
                </div>
              )}
            </div>
          </div>

          {/* Runs Over Time */}
          {summary.runs_data?.length > 0 && (
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Test Runs History</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={summary.runs_data} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    angle={-40}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="passed" fill="#22c55e" name="Passed" stackId="a" />
                  <Bar dataKey="failed" fill="#ef4444" name="Failed" stackId="a" />
                  <Bar dataKey="skipped" fill="#9ca3af" name="Skipped" stackId="a" />
                  <Bar dataKey="blocked" fill="#f97316" name="Blocked" stackId="a" />
                  <Bar dataKey="pending" fill="#eab308" name="Pending" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Summary Table */}
          {summary.summary_table?.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900">Test Run Summary</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Run Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Total</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Passed</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Failed</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Pass Rate</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.summary_table.map((row) => (
                      <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{row.name}</td>
                        <td className="py-3 px-4"><StatusBadge status={row.status} /></td>
                        <td className="py-3 px-4 text-gray-600">{row.total}</td>
                        <td className="py-3 px-4 text-green-600 font-medium">{row.passed}</td>
                        <td className="py-3 px-4 text-red-600 font-medium">{row.failed}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${row.pass_rate}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">{row.pass_rate}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-xs">{row.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
