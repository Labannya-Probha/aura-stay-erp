import { Clock3, Cpu, Database, Fingerprint, UserCheck } from 'lucide-react'

type Props = {
  generatedAt?: string
  engine?: string
  datasetHash?: string
  snapshotVersion?: string | number
  approvedBy?: string
  executionMs?: number
  freshnessLabel?: string
}

function formatDateTime(value?: string) {
  if (!value) return 'Not supplied'
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

function item(icon: React.ReactNode, label: string, value: string) {
  return (
    <div className="report-provenance-item">
      {icon}
      <span>
        <small>{label}</small>
        <strong title={value}>{value}</strong>
      </span>
    </div>
  )
}

export default function ReportProvenanceBar({
  generatedAt,
  engine = 'Reporting service',
  datasetHash,
  snapshotVersion,
  approvedBy,
  executionMs,
  freshnessLabel,
}: Props) {
  return (
    <footer className="report-provenance-bar no-print" aria-label="Report provenance">
      {item(<Clock3 size={14} />, 'Generated', formatDateTime(generatedAt))}
      {item(<Cpu size={14} />, 'Engine', engine)}
      {item(
        <Fingerprint size={14} />,
        'Dataset hash',
        datasetHash ? datasetHash.slice(0, 16) : 'Not supplied',
      )}
      {item(
        <Database size={14} />,
        'Snapshot',
        snapshotVersion ? `Version ${snapshotVersion}` : 'Working result',
      )}
      {item(<UserCheck size={14} />, 'Approved by', approvedBy || 'Not approved')}
      {executionMs != null
        ? item(<Clock3 size={14} />, 'Execution', `${(executionMs / 1000).toFixed(2)} sec`)
        : null}
      {freshnessLabel ? item(<Clock3 size={14} />, 'Freshness', freshnessLabel) : null}
    </footer>
  )
}
