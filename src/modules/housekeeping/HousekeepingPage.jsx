import { BedDouble } from 'lucide-react'
import Breadcrumb from 'src/components/layout/Breadcrumb'
import ModuleLayout from 'src/components/shared/ModuleLayout'
import HousekeepingHub from '../../pages/HousekeepingHub.jsx'

export default function HousekeepingPage({ role, isAdmin, userName }) {
  return (
    <ModuleLayout
      moduleName="Housekeeping"
      routeKey="housekeeping-root"
      eyebrow="Rooms Operations"
      title="Housekeeping"
      description="Track room readiness, assignments, checklists and checkout clearance."
      icon={BedDouble}
      breadcrumb={
        <Breadcrumb items={[{ label: 'Modules' }, { label: 'Housekeeping', current: true }]} />
      }
    >
      <HousekeepingHub role={role} isAdmin={isAdmin} userName={userName} embedded />
    </ModuleLayout>
  )
}
