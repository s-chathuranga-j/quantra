import React from 'react'

const priorityConfig = {
  low: { label: 'Low', classes: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Medium', classes: 'bg-blue-100 text-blue-700' },
  high: { label: 'High', classes: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Critical', classes: 'bg-red-100 text-red-700' },
}

export default function PriorityBadge({ priority, size = 'sm' }) {
  const config = priorityConfig[priority] || { label: priority, classes: 'bg-gray-100 text-gray-600' }
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${sizeClass} ${config.classes}`}>
      {config.label}
    </span>
  )
}
