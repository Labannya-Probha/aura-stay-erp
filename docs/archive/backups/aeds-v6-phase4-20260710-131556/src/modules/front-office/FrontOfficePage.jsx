/* ------------------------------------------------------------------ */
/*  FRONT OFFICE PAGE — AEDS v2 Enterprise Operations Workspace         */
/* ------------------------------------------------------------------ */
import PageHeader from "../../components/layout/PageHeader"
import Breadcrumb from "../../components/layout/Breadcrumb"
import ModuleTabs from "../../components/layout/ModuleTabs"
import { Button } from "../../components/ui/button"
import { can } from "../../lib/roles"
import { FRONT_OFFICE_TABS } from "./frontOffice.config"
import { useFrontOfficeTabs } from "./hooks/useFrontOfficeTabs"
import { useFrontOfficeData } from "./hooks/useFrontOfficeData"
import FrontOfficeKpiStrip from "./shared/FrontOfficeKpiStrip"
import ArrivalBoardPage from "./arrival-board/ArrivalBoardPage"
import DepartureBoardPage from "./departure-board/DepartureBoardPage"
import InHouseGuestsPage from "./in-house/InHouseGuestsPage"
import RoomRackPage from "./room-rack/RoomRackPage"
import GuestFolioPage from "./guest-folio/GuestFolioPage"
import CashierPage from "./cashier/CashierPage"
import NightAuditPage from "./night-audit/NightAuditPage"
import LostFoundPage from "./lost-found/LostFoundPage"
import GuestMessagesPage from "./guest-messages/GuestMessagesPage"

export default function FrontOfficePage({
  openReservation,
  userName,
  role,
  isAdmin,
  company,
  privileges,
}) {
  const { activeTab, setActiveTab } = useFrontOfficeTabs()
  const {
    summary,
    arrivals,
    departures,
    inHouse,
    roomRack,
    loading,
    refreshing,
    error,
    refresh,
  } = useFrontOfficeData()

  const visibleTabs = FRONT_OFFICE_TABS.filter((tab) => {
    if (isAdmin || role === "SUPERUSER") return true
    return can(role, tab.permission || "dashboard", privileges)
  })

  const currentTab = visibleTabs.some((tab) => tab.id === activeTab)
    ? activeTab
    : visibleTabs[0]?.id || "arrival-board"

  return (
    <div className="space-y-5">
      <PageHeader
        title="Front Office"
        subtitle="Arrival, departure, in-house guest, room rack, cashier and night audit command center."
        breadcrumb={<Breadcrumb items={[{ label: "Modules" }, { label: "Front Office", current: true }]} />}
        actions={
          <Button variant="outline" onClick={refresh} disabled={loading || refreshing}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        }
        kpiStrip={<FrontOfficeKpiStrip data={summary} loading={loading} />}
        tabs={<ModuleTabs tabs={visibleTabs} activeTab={currentTab} onChange={setActiveTab} />}
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <section id={`module-tab-panel-${currentTab}`} role="tabpanel" aria-labelledby={`module-tab-${currentTab}`}>
        {currentTab === "arrival-board" && (
          <ArrivalBoardPage rows={arrivals} loading={loading} openReservation={openReservation} />
        )}

        {currentTab === "departure-board" && (
          <DepartureBoardPage rows={departures} loading={loading} openReservation={openReservation} />
        )}

        {currentTab === "in-house" && (
          <InHouseGuestsPage rows={inHouse} loading={loading} openReservation={openReservation} />
        )}

        {currentTab === "room-rack" && (
          <RoomRackPage rows={roomRack} loading={loading} />
        )}

        {currentTab === "guest-folio" && (
          <GuestFolioPage userName={userName} company={company} />
        )}

        {currentTab === "cashier" && (
          <CashierPage userName={userName} company={company} />
        )}

        {currentTab === "night-audit" && (
          <NightAuditPage userName={userName} role={role} />
        )}

        {currentTab === "lost-found" && (
          <LostFoundPage />
        )}

        {currentTab === "guest-messages" && (
          <GuestMessagesPage />
        )}
      </section>
    </div>
  )
}
