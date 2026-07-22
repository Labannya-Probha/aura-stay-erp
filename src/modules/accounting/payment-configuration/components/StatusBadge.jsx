import ModuleStatusPill from 'src/components/shared/ModuleStatusPill'

export default function StatusBadge({ active }) {
  return (
    <ModuleStatusPill
      status={active ? 'ACTIVE' : 'INACTIVE'}
      toneMap={{ ACTIVE: 'success', INACTIVE: 'neutral' }}
    />
  )
}
