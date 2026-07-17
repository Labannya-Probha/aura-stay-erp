import { useMemo } from 'react'
import { Utensils } from 'lucide-react'
import { isModuleEnabled } from 'src/lib/saasModules'
import Breadcrumb from 'src/components/layout/Breadcrumb'
import ModuleTabs from 'src/components/layout/ModuleTabs'
import PosOrdersTab from './tabs/PosOrdersTab'
import TableViewTab from './tabs/TableViewTab'
import MenuManagementTab from './tabs/MenuManagementTab'
import PrintCenterTab from './tabs/PrintCenterTab'
import DayCloseReportsTab from './tabs/DayCloseReportsTab'
import { useRestaurantTabs } from './hooks/useRestaurantTabs'
import EnterpriseWorkspace from '../../components/layout/EnterpriseWorkspace'

export default function RestaurantPage({ userName, isAdmin, role, modulesEnabled, company }) {
  const canManageMenu = isModuleEnabled('menu-management', modulesEnabled, role) && (isAdmin || role === 'SUPERUSER' || role === 'RESTAURANT')
  const { activeTab, tabs, setTab } = useRestaurantTabs({ canManageMenu })

  const tabContent = useMemo(() => {
    if (activeTab === 'tables') return <TableViewTab />
    if (activeTab === 'menu') return <MenuManagementTab isAdmin={isAdmin} canManageMenu={canManageMenu} />
    if (activeTab === 'print') return <PrintCenterTab company={company} userName={userName} />
    if (activeTab === 'reports') return <DayCloseReportsTab />
    return <PosOrdersTab userName={userName} isAdmin={isAdmin} role={role} />
  }, [activeTab, canManageMenu, company, isAdmin, role, userName])

  return (
    <EnterpriseWorkspace
      title="Restaurant Workspace"
      subtitle="POS, table service, menu management, printing and day-close controls."
      eyebrow="Food & Beverage Operations"
      icon={Utensils}
      tabs={<ModuleTabs tabs={tabs} activeTab={activeTab} onChange={setTab} />}
    >
      <div className="sr-only">
        <Breadcrumb items={[{ label: 'Modules' }, { label: 'Restaurant', current: true }]} />
      </div>
      <section id={`module-tab-panel-${activeTab}`} role="tabpanel" aria-labelledby={`module-tab-${activeTab}`}>
        {tabContent}
      </section>
    </EnterpriseWorkspace>
  )
}
