/* ------------------------------------------------------------------ */
/*  FRONT OFFICE PAGE — AEDS v2 unified module page                   */
/* ------------------------------------------------------------------ */
import PageHeader from '../../components/layout/PageHeader'
import ModuleTabs from '../../components/layout/ModuleTabs'
import { can } from '../../lib/roles'
import { useFrontOfficeTabs } from './hooks/useFrontOfficeTabs'
import { FRONT_OFFICE_TABS } from './frontOffice.config'
import InHouseGuestsTab from './tabs/InHouseGuestsTab'
import RoomBoardTab from './tabs/RoomBoardTab'
import CheckInOutTab from './tabs/CheckInOutTab'
import GuestFolioTab from './tabs/GuestFolioTab'
import ServiceBillsTab from './tabs/ServiceBillsTab'
import NightAuditTab from './tabs/NightAuditTab'
import LostFoundTab from './tabs/LostFoundTab'
import GuestMessagesTab from './tabs/GuestMessagesTab'
import { useEffect } from 'react'

export default function FrontOfficePage({
  openReservation,
  userName,
  role,
  isAdmin,
  company,
  privileges,
}) {
  const { activeTab, setActiveTab } = useFrontOfficeTabs()
  const canAccessServiceBills = can(role, 'facilities', privileges)
  const canAccessNightAudit = can(role, 'nightaudit', privileges)
  const visibleTabs = FRONT_OFFICE_TABS.filter((tab) => can(role, tab.permission || 'dashboard', privileges))
  const effectiveTab = visibleTabs.some((tab) => tab.id === activeTab)
    ? activeTab
    : (visibleTabs[0]?.id || 'in-house')

  useEffect(() => {
    if (activeTab !== effectiveTab) setActiveTab(effectiveTab)
  }, [activeTab, effectiveTab, setActiveTab])

  return (
    <div className="space-y-4">
      <PageHeader
        title="Front Office"
        breadcrumb={[{ label: 'Front Office', current: true }]}
        tabs={
          <ModuleTabs
            tabs={visibleTabs}
            activeTab={effectiveTab}
            onChange={setActiveTab}
          />
        }
      />

      <div
        id={`module-tab-panel-${effectiveTab}`}
        role="tabpanel"
        aria-labelledby={`module-tab-${effectiveTab}`}
      >
        {effectiveTab === 'in-house' && (
          <InHouseGuestsTab
            openReservation={openReservation}
            userName={userName}
            role={role}
            isAdmin={isAdmin}
            company={company}
          />
        )}
        {effectiveTab === 'room-board' && (
          <RoomBoardTab
            openReservation={openReservation}
            userName={userName}
            role={role}
            isAdmin={isAdmin}
            company={company}
          />
        )}
        {effectiveTab === 'check-in-out' && (
          <CheckInOutTab openReservation={openReservation} />
        )}
        {effectiveTab === 'guest-folio' && (
          <GuestFolioTab openReservation={openReservation} />
        )}
        {effectiveTab === 'service-bills' && canAccessServiceBills && (
          <ServiceBillsTab userName={userName} isAdmin={isAdmin} />
        )}
        {effectiveTab === 'night-audit' && canAccessNightAudit && (
          <NightAuditTab userName={userName} isAdmin={isAdmin} role={role} />
        )}
        {effectiveTab === 'lost-found' && (
          <LostFoundTab />
        )}
        {effectiveTab === 'guest-messages' && (
          <GuestMessagesTab openReservation={openReservation} />
        )}
      </div>
    </div>
  )
}
