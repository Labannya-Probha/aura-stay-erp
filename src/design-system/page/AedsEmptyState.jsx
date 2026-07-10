export default function AedsEmptyState({
  title = "No data found",
  message = "There is nothing to show here yet.",
  action,
}) {
  return (
    <div className="aeds-card flex min-h-[220px] flex-col items-center justify-center p-8 text-center">
      <h3 className="text-lg font-black" style={{ color: "var(--tenant-text)" }}>{title}</h3>
      <p className="mt-2 max-w-md text-sm" style={{ color: "var(--tenant-text-muted)" }}>{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
