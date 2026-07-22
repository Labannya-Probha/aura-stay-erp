import { Clock3, UserRound } from 'lucide-react'

function formatDate(value) {
  if (!value) return 'Not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default function AuditInfoCard({ terminal }) {
  if (!terminal?.id) return null
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4" aria-labelledby="terminal-audit-title">
      <h3 id="terminal-audit-title" className="text-sm font-semibold text-slate-900">Audit information</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Item icon={UserRound} label="Created by" value={terminal.created_by_name || terminal.created_by || 'System'} />
        <Item icon={Clock3} label="Created at" value={formatDate(terminal.created_at)} />
        <Item icon={UserRound} label="Last updated by" value={terminal.updated_by_name || terminal.updated_by || 'System'} />
        <Item icon={Clock3} label="Last updated at" value={formatDate(terminal.updated_at)} />
      </div>
    </section>
  )
}

function Item({ icon: Icon, label, value }) {
  return <div className="flex gap-2.5"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"/><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-0.5 text-sm text-slate-800">{value}</p></div></div>
}
