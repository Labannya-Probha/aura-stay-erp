import { AlertTriangle, CheckCircle2, ChevronDown, CircleDashed, XCircle } from 'lucide-react'
import { useState } from 'react'

export type ReportHealthCheck = {
  key?: string
  label: string
  status: 'passed' | 'warning' | 'failed' | 'unknown'
  detail?: string
}

export default function ReportHealthPanel({ checks = [] }: { checks?: ReportHealthCheck[] }) {
  const [expanded, setExpanded] = useState(false)

  const safeChecks =
    checks.length > 0
      ? checks
      : [
          { label: 'Dataset validation', status: 'unknown' as const, detail: 'Not supplied' },
          { label: 'Ledger reconciliation', status: 'unknown' as const, detail: 'Not supplied' },
          { label: 'Mapping completeness', status: 'unknown' as const, detail: 'Not supplied' },
          { label: 'Approval control', status: 'unknown' as const, detail: 'Not supplied' },
          { label: 'Snapshot integrity', status: 'unknown' as const, detail: 'Not supplied' },
        ]

  const passed = safeChecks.filter((item) => item.status === 'passed').length
  const failed = safeChecks.filter((item) => item.status === 'failed').length
  const warnings = safeChecks.filter((item) => item.status === 'warning').length

  const summary =
    failed > 0
      ? `${failed} failed`
      : warnings > 0
        ? `${warnings} need review`
        : passed === safeChecks.length
          ? 'All controls passed'
          : `${passed}/${safeChecks.length} verified`

  return (
    <section className="report-health-panel no-print">
      <button
        type="button"
        className="report-health-panel__summary"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <span className="report-health-panel__title">
          {failed > 0 ? (
            <XCircle size={16} />
          ) : warnings > 0 ? (
            <AlertTriangle size={16} />
          ) : passed === safeChecks.length ? (
            <CheckCircle2 size={16} />
          ) : (
            <CircleDashed size={16} />
          )}
          <span>
            <strong>Report health</strong>
            <small>{summary}</small>
          </span>
        </span>
        <ChevronDown size={15} className={expanded ? 'is-rotated' : ''} />
      </button>

      {expanded ? (
        <div className="report-health-panel__checks">
          {safeChecks.map((check, index) => {
            const Icon =
              check.status === 'passed'
                ? CheckCircle2
                : check.status === 'warning'
                  ? AlertTriangle
                  : check.status === 'failed'
                    ? XCircle
                    : CircleDashed
            return (
              <div key={check.key || `${check.label}-${index}`} data-status={check.status}>
                <Icon size={15} />
                <span>
                  <strong>{check.label}</strong>
                  {check.detail ? <small>{check.detail}</small> : null}
                </span>
              </div>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
