import React from 'react'

export default function GlobalLoader({ show = true, label = 'Loading...' }) {
  if (!show) return null

  return (
    <div className="aura-loader-overlay" role="status" aria-live="polite" aria-label={label}>
      <div className="aura-spinner" />
    </div>
  )
}
