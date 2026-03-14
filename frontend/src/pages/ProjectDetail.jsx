import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getProject, getProjectMembers, addProjectMember, removeProjectMember, deleteProject } from '../api/projects'
import { getUsers } from '../api/auth'
import StatusBadge from '../components/StatusBadge'

function AddMemberModal({ projectId, onClose, onAdded }) {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [role, setRole] = useState('tester')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  const searchUsers = async (q) => {
    setSearching(true)
    try {
      const res = await getUsers(q)
      setUsers(res.data)
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    searchUsers('')
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedUser) return
    setLoading(true)
    setError('')
    try {
      const res = await addProjectMember(projectId, { user_id: selectedUser.id, role })
      onAdded(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Member</h2>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Users</label>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); searchUsers(e.target.value) }}
              className="input-field"
              placeholder="Search by username..."
            />
            {users.length > 0 && (
              <div className="border border-gray-200 rounded-lg mt-1 max-h-40 overflow-y-auto">
                {users.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={`px-3 py-2 cursor-pointer text-sm hover:bg-gray-50 ${
                      selectedUser?.id === u.id ? 'bg-indigo-50 text-indigo-700' : ''
                    }`}
                  >
                    <span className="font-medium">{u.username}</span>
                    {u.email && <span className="text-gray-400 ml-2">{u.email}</span>}
                  </div>
                ))}
              </div>
            )}
            {selectedUser && (
              <p className="text-xs text-indigo-600 mt-1">
                Selected: {selectedUser.username}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input-field"
            >
              <option value="admin">Admin</option>
              <option value="tester">Tester</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading || !selectedUser} className="btn-primary">
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProjectDetail() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [members, setMembers] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [showAddMember, setShowAddMember] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      getProject(projectId),
      getProjectMembers(projectId),
    ])
      .then(([projRes, membersRes]) => {
        setProject(projRes.data)
        setMembers(membersRes.data)
      })
      .catch(() => setError('Failed to load project'))
      .finally(() => setLoading(false))
  }, [projectId])

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member from the project?')) return
    try {
      await removeProjectMember(projectId, userId)
      setMembers(members.filter((m) => m.user.id !== userId))
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to remove member')
    }
  }

  const handleDeleteProject = async () => {
    if (!confirm(`Delete project "${project.name}"? This cannot be undone.`)) return
    try {
      await deleteProject(projectId)
      navigate('/projects')
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete project')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error || 'Project not found'}</div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/projects" className="hover:text-indigo-600">Projects</Link>
            <span>/</span>
            <span className="text-gray-900">{project.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          {project.description && (
            <p className="text-gray-500 mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {project.user_role === 'admin' && (
            <button onClick={handleDeleteProject} className="btn-danger text-sm">
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Members', value: members.length, to: null },
          { label: 'Test Suites', value: project.suite_count, to: `/projects/${projectId}/suites` },
          { label: 'Test Cases', value: project.test_case_count, to: `/projects/${projectId}/cases` },
        ].map((stat) => (
          <div key={stat.label} className="card text-center">
            <p className="text-2xl font-bold text-indigo-600">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to={`/projects/${projectId}/suites`}
          className="card hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Test Suites</p>
            <p className="text-sm text-gray-500">Organize test cases</p>
          </div>
        </Link>
        <Link
          to={`/projects/${projectId}/runs`}
          className="card hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Test Runs</p>
            <p className="text-sm text-gray-500">Execute and track tests</p>
          </div>
        </Link>
        <Link
          to={`/reports?project=${projectId}`}
          className="card hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Reports</p>
            <p className="text-sm text-gray-500">View test analytics</p>
          </div>
        </Link>
      </div>

      {/* Members */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Members</h2>
          {project.user_role === 'admin' && (
            <button onClick={() => setShowAddMember(true)} className="btn-primary text-sm py-1.5 px-3">
              + Add Member
            </button>
          )}
        </div>
        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 text-sm font-medium">
                    {member.user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{member.user.username}</p>
                  {member.user.email && (
                    <p className="text-xs text-gray-400">{member.user.email}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">
                  {member.role}
                </span>
                {project.user_role === 'admin' && (
                  <button
                    onClick={() => handleRemoveMember(member.user.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove member"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAddMember && (
        <AddMemberModal
          projectId={projectId}
          onClose={() => setShowAddMember(false)}
          onAdded={(m) => { setMembers([...members, m]); setShowAddMember(false) }}
        />
      )}
    </div>
  )
}
