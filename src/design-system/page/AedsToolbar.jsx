export default function AedsToolbar({ left, right, children }) {
  return (
    <div className="aeds-card flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        {left || children}
      </div>

      {right && <div className="flex shrink-0 flex-wrap items-center gap-2">{right}</div>}
    </div>
  )
}
