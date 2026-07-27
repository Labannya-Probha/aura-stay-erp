import { useMemo } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Breadcrumb from '../../components/layout/Breadcrumb'
import { useMasterDataTabs } from './hooks/useMasterDataTabs'
import CompaniesTab from './tabs/CompaniesTab.jsx'
import RoomsTab from './tabs/RoomsTab.jsx'
import GuestsTab from './tabs/GuestsTab.jsx'
import VendorsTab from './tabs/VendorsTab.jsx'
import InventoryItemsTab from './tabs/InventoryItemsTab.jsx'
import MenuCategoriesTab from './tabs/MenuCategoriesTab.jsx'
import MenuItemsTab from './tabs/MenuItemsTab.jsx'
import ChartOfAccountsTab from './tabs/ChartOfAccountsTab.jsx'
import StoreLocationsTab from './tabs/StoreLocationsTab.jsx'
import ReservationPoliciesTab from './tabs/ReservationPoliciesTab.jsx'
import AgenciesShareholdersTab from './tabs/AgenciesShareholdersTab.jsx'

export default function MasterDataPage({ role, isAdmin }) {
  const { activeTab } = useMasterDataTabs()

  const tabContent = useMemo(() => {
    const shared = { role, isAdmin }

    if (activeTab === 'rooms') return <RoomsTab {...shared} />
    if (activeTab === 'guests') return <GuestsTab {...shared} />
    if (activeTab === 'vendors') return <VendorsTab {...shared} />
    if (activeTab === 'inventory-items') return <InventoryItemsTab {...shared} />
    if (activeTab === 'menu-categories') return <MenuCategoriesTab {...shared} />
    if (activeTab === 'menu-items') return <MenuItemsTab {...shared} />
    if (activeTab === 'chart-of-accounts') return <ChartOfAccountsTab {...shared} />
    if (activeTab === 'store-locations') return <StoreLocationsTab {...shared} />
    if (activeTab === 'reservation-policies') return <ReservationPoliciesTab {...shared} />
    if (activeTab === 'agencies-shareholders') return <AgenciesShareholdersTab {...shared} />

    return <CompaniesTab {...shared} />
  }, [activeTab, isAdmin, role])

  return (
    <div className="space-y-4">
      <PageHeader
        title="Master Data"
        subtitle="Manage operational records used across reservations, front office, restaurant, inventory, and accounting."
        breadcrumb={
          <Breadcrumb items={[{ label: 'Modules' }, { label: 'Master Data', current: true }]} />
        }
      />

      <section
        id={`module-tab-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`module-tab-${activeTab}`}
      >
        {tabContent}
      </section>
    </div>
  )
}
