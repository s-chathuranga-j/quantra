import React from 'react'

const statusConfig = {
  // Test execution statuses
  pending: { label: 'Pending', classes: 'bg-yellow-100 text-yellow-800' },
  passed: { label: 'Passed', classes: 'bg-green-100 text-green-800' },
  failed: { label: 'Failed', classes: 'bg-red-100 text-red-800' },
  skipped: { label: 'Skipped', classes: 'bg-gray-100 text-gray-600' },
  blocked: { label: 'Blocked', classes: 'bg-orange-100 text-orange-800' },
  // Test run statuses
  in_progress: { label: 'In Progress', classes: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', classes: 'bg-green-100 text-green-800' },
  aborted: { label: 'Aborted', classes: 'bg-red-100 text-red-800' },
  // Test case statuses
  active: { label: 'Active', classes: 'bg-green-100 text-green-800' },
  deprecated: { label: 'Deprecated', classes: 'bg-gray-100 text-gray-600' },
}

export default function StatusBadge({ status, size = 'sm' }) {
  const config = statusConfig[status] || { label: status, classes: 'bg-gray-100 text-gray-600' }
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${sizeClass} ${config.classes}`}>
      {config.label}
    </span>
  )
}
