export default function AedsEmptyState({
  title = 'No data found',
  message = 'There is nothing to show here yet.',
  action,
}) {
  return (
    <div className="aeds-card flex min-h-[220px] flex-col items-center justify-center p-4 text-center">
      <h3
        className="aeds-section-title text-xl font-semibold"
        style={{ color: 'var(--tenant-text)' }}
      >
        {title}
      </h3>
      <p
        className="mt-2 max-w-md text-sm font-medium"
        style={{ color: 'var(--tenant-text-muted)' }}
      >
        {message}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
