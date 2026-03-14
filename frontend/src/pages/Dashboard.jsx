import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { getDashboardStats } from '../api/reports'
import StatusBadge from '../components/StatusBadge'

function StatCard({ title, value, subtitle, color }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${color || 'text-gray-900'}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getDashboardStats()
      .then((res) => setStats(res.data))
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your test management activity</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Projects"
          value={stats?.total_projects ?? 0}
          color="text-indigo-600"
        />
        <StatCard
          title="Test Suites"
          value={stats?.total_suites ?? 0}
          color="text-blue-600"
        />
        <StatCard
          title="Test Cases"
          value={stats?.total_test_cases ?? 0}
          color="text-purple-600"
        />
        <StatCard
          title="Test Runs"
          value={stats?.total_runs ?? 0}
          color="text-green-600"
        />
      </div>

      {/* Chart */}
      {stats?.chart_data?.length > 0 && (
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Test Run Results</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.chart_data} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
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
              <Bar dataKey="passed" fill="#22c55e" name="Passed" radius={[2, 2, 0, 0]} />
              <Bar dataKey="failed" fill="#ef4444" name="Failed" radius={[2, 2, 0, 0]} />
              <Bar dataKey="skipped" fill="#9ca3af" name="Skipped" radius={[2, 2, 0, 0]} />
              <Bar dataKey="blocked" fill="#f97316" name="Blocked" radius={[2, 2, 0, 0]} />
              <Bar dataKey="pending" fill="#eab308" name="Pending" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Runs */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Recent Test Runs</h2>
          <Link to="/projects" className="text-sm text-indigo-600 hover:text-indigo-700">
            View projects
          </Link>
        </div>
        {stats?.recent_runs?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 font-medium text-gray-500">Run Name</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-500">Project</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-500">Status</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-500">Pass / Fail</th>
                  <th className="text-left py-2 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_runs.map((run) => (
                  <tr key={run.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 pr-4 font-medium text-gray-900">
                      <Link
                        to={`/projects/${run.project_id}/runs/${run.id}`}
                        className="hover:text-indigo-600"
                      >
                        {run.name}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-gray-600">
                      <Link
                        to={`/projects/${run.project_id}`}
                        className="hover:text-indigo-600"
                      >
                        {run.project_name}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">
                      <StatusBadge status={run.status} />
                    </td>
                    <td className="py-2 pr-4 text-gray-600">
                      <span className="text-green-600 font-medium">{run.stats?.passed ?? 0}</span>
                      {' / '}
                      <span className="text-red-600 font-medium">{run.stats?.failed ?? 0}</span>
                      <span className="text-gray-400"> of {run.total}</span>
                    </td>
                    <td className="py-2 text-gray-400 text-xs">
                      {new Date(run.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-8">
            No test runs yet. Create a project to get started.
          </p>
        )}
      </div>
    </div>
  )
}
