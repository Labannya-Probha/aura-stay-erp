import { useState } from "react"
import { Hotel, RefreshCw } from "lucide-react"

import EnterpriseWorkspace from "../../components/layout/EnterpriseWorkspace"
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
import ServiceBillsPage from "../../pages/ServiceBills.jsx"
import CheckInDialog from "./dialog/CheckInDialog"
import CheckOutDialog from "./dialog/CheckOutDialog"
import RoomMoveDialog from "./dialog/RoomMoveDialog"
import StayAmendDialog from "./dialog/StayAmendDialog"

export default function FrontOfficePage({
  openReservation,
  userName,
  role,
  isAdmin,
  company,
  privileges,
}) {
  const { activeTab, setActiveTab } = useFrontOfficeTabs()
  const [checkInTarget, setCheckInTarget] = useState(null)
  const [checkOutTarget, setCheckOutTarget] = useState(null)
  const [roomMoveTarget, setRoomMoveTarget] = useState(null)
  const [stayAmendTarget, setStayAmendTarget] = useState(null)

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
    <>
      <EnterpriseWorkspace
        title="Front Office Workspace"
        subtitle="Arrival, departure, in-house guests, room rack, cashier and night audit command center."
        eyebrow="Hotel Operations"
        icon={Hotel}
        actions={
          <Button
            variant="outline"
            onClick={refresh}
            disabled={loading || refreshing}
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        }
        kpis={
          <FrontOfficeKpiStrip
            data={summary}
            loading={loading}
          />
        }
        tabs={
          <ModuleTabs
            tabs={visibleTabs}
            activeTab={currentTab}
            onChange={setActiveTab}
          />
        }
      >
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <section
          id={`module-tab-panel-${currentTab}`}
          role="tabpanel"
          aria-labelledby={`module-tab-${currentTab}`}
        >
          {currentTab === "arrival-board" && (
            <ArrivalBoardPage
              rows={arrivals}
              loading={loading}
              openReservation={openReservation}
              onCheckIn={setCheckInTarget}
            />
          )}

          {currentTab === "departure-board" && (
            <DepartureBoardPage
              rows={departures}
              loading={loading}
              openReservation={openReservation}
              onCheckOut={setCheckOutTarget}
            />
          )}

          {currentTab === "in-house" && (
            <InHouseGuestsPage
              rows={inHouse}
              loading={loading}
              openReservation={openReservation}
              onRoomMove={setRoomMoveTarget}
              onStayAmend={setStayAmendTarget}
            />
          )}

          {currentTab === "room-rack" && (
            <RoomRackPage
              rows={roomRack}
              loading={loading}
            />
          )}

          {currentTab === "guest-folio" && (
            <GuestFolioPage
              userName={userName}
              company={company}
            />
          )}

          {currentTab === "cashier" && (
            <CashierPage
              userName={userName}
              company={company}
            />
          )}

          {currentTab === "service-bills" && (
            <ServiceBillsPage
              userName={userName}
              isAdmin={isAdmin}
            />
          )}

          {currentTab === "night-audit" && (
            <NightAuditPage
              userName={userName}
              role={role}
            />
          )}

          {currentTab === "lost-found" && (
            <LostFoundPage />
          )}

          {currentTab === "guest-messages" && (
            <GuestMessagesPage />
          )}
        </section>
      </EnterpriseWorkspace>

      <CheckInDialog
        open={Boolean(checkInTarget)}
        reservation={checkInTarget}
        userName={userName}
        onClose={() => setCheckInTarget(null)}
        onCompleted={refresh}
      />

      <CheckOutDialog
        open={Boolean(checkOutTarget)}
        reservation={checkOutTarget}
        userName={userName}
        onClose={() => setCheckOutTarget(null)}
        onCompleted={refresh}
      />

      <RoomMoveDialog
        open={Boolean(roomMoveTarget)}
        reservation={roomMoveTarget}
        userName={userName}
        onClose={() => setRoomMoveTarget(null)}
        onCompleted={refresh}
      />

      <StayAmendDialog
        open={Boolean(stayAmendTarget)}
        reservation={stayAmendTarget}
        userName={userName}
        onClose={() => setStayAmendTarget(null)}
        onCompleted={refresh}
      />
    </>
  )
}
