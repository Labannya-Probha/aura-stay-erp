import ModuleStatusPill from 'src/components/shared/ModuleStatusPill'

const FRONT_OFFICE_TONES = {
  ARRIVAL: 'info',
  DEPARTURE: 'warning',
  IN_HOUSE: 'success',
  DUE: 'danger',
  CLEAN: 'success',
  DIRTY: 'danger',
  INSPECTION: 'warning',
  OOO: 'neutral',
}

export default function StatusPill({ status }) {
  return <ModuleStatusPill status={status} toneMap={FRONT_OFFICE_TONES} />
}
