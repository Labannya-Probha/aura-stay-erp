import {
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  FileCheck2,
  History,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react'
import { useMemo, useState } from 'react'

type ApprovalStep = {
  key?: string
  label?: string
  status?: string
  actorName?: string
  completedAt?: string
}

type ReportVersion = {
  id?: string
  version?: string | number
  label?: string
  status?: string
  generatedAt?: string
}

type Props = {
  status?: string
  approvalSteps?: ApprovalStep[]
  versions?: ReportVersion[]
  activeVersion?: string | number | null
  snapshotId?: string | null
  locked?: boolean
  onVersionChange?: (version: ReportVersion) => void
  onOpenHistory?: () => void
}

function tone(status?: string) {
  const normalized = String(status || '').toLowerCase()
  if (/approved|posted|complete|passed/.test(normalized)) return 'success'
  if (/locked|final/.test(normalized)) return 'locked'
  if (/reject|fail|error|invalid/.test(normalized)) return 'danger'
  if (/review|pending|submitted|running|validating/.test(normalized)) return 'warning'
  return 'neutral'
}

function formatTime(value?: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function ReportGovernanceBar({
  status = 'Draft',
  approvalSteps = [],
  versions = [],
  activeVersion,
  snapshotId,
  locked = false,
  onVersionChange,
  onOpenHistory,
}: Props) {
  const [versionsOpen, setVersionsOpen] = useState(false)

  const normalizedSteps = useMemo(
    () =>
      approvalSteps.length
        ? approvalSteps
        : [
            { key: 'prepared', label: 'Prepared', status: 'complete' },
            { key: 'reviewed', label: 'Reviewed', status: 'pending' },
            { key: 'approved', label: 'Approved', status: 'pending' },
            { key: 'locked', label: 'Locked', status: locked ? 'complete' : 'pending' },
          ],
    [approvalSteps, locked],
  )

  return (
    <section className="report-governance-bar no-print" aria-label="Report governance">
      <div className="report-governance-status">
        <span className={`report-status-badge report-status-badge--${tone(status)}`}>
          {locked ? <LockKeyhole size={14} /> : <ShieldCheck size={14} />}
          {status}
        </span>
        {snapshotId ? (
          <span className="report-governance-snapshot">
            <FileCheck2 size={14} />
            Snapshot {snapshotId}
          </span>
        ) : (
          <span className="report-governance-snapshot report-governance-snapshot--muted">
            No approved snapshot
          </span>
        )}
      </div>

      <ol className="report-approval-ribbon" aria-label="Approval progress">
        {normalizedSteps.map((step, index) => {
          const complete = /complete|approved|posted|passed|locked/i.test(step.status || '')
          const failed = /reject|fail|invalid/i.test(step.status || '')
          return (
            <li
              key={step.key || step.label || index}
              className={[complete ? 'is-complete' : '', failed ? 'is-failed' : '']
                .filter(Boolean)
                .join(' ')}
            >
              <span className="report-approval-ribbon__icon">
                {failed ? (
                  <CircleAlert size={13} />
                ) : complete ? (
                  <Check size={13} />
                ) : (
                  <Clock3 size={13} />
                )}
              </span>
              <span className="report-approval-ribbon__body">
                <strong>{step.label || `Step ${index + 1}`}</strong>
                {step.actorName ? <small>{step.actorName}</small> : null}
                {step.completedAt ? <small>{formatTime(step.completedAt)}</small> : null}
              </span>
            </li>
          )
        })}
      </ol>

      <div className="report-governance-actions">
        <div className="report-version-picker">
          <button
            type="button"
            className="report-governance-button"
            onClick={() => setVersionsOpen((open) => !open)}
            aria-expanded={versionsOpen}
          >
            Version {activeVersion || versions[0]?.version || 'Current'}
            <ChevronDown size={14} />
          </button>

          {versionsOpen ? (
            <div className="report-version-menu">
              <header>
                <strong>Report versions</strong>
                <span>Approved and regenerated snapshots</span>
              </header>
              <div>
                {versions.length ? (
                  versions.map((version, index) => (
                    <button
                      key={version.id || String(version.version || index)}
                      type="button"
                      onClick={() => {
                        onVersionChange?.(version)
                        setVersionsOpen(false)
                      }}
                      className={
                        String(version.version) === String(activeVersion) ? 'is-active' : ''
                      }
                    >
                      <span>
                        <strong>
                          {version.label || `Version ${version.version || index + 1}`}
                        </strong>
                        <small>
                          {version.status || 'Generated'}
                          {version.generatedAt ? ` · ${formatTime(version.generatedAt)}` : ''}
                        </small>
                      </span>
                      {String(version.version) === String(activeVersion) ? (
                        <Check size={14} />
                      ) : null}
                    </button>
                  ))
                ) : (
                  <p>No stored report versions are available.</p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <button type="button" className="report-governance-button" onClick={onOpenHistory}>
          <History size={14} />
          History
        </button>
      </div>
    </section>
  )
}
