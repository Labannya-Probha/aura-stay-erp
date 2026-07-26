import { useState } from "react"
import { Hotel, RefreshCw } from "lucide-react"
import { useNavigate } from "react-router-dom"

import EnterpriseWorkspace from "../../components/layout/EnterpriseWorkspace"
import ModuleTabs from "../../components/layout/ModuleTabs"
import { Button } from "../../components/ui/button"
import { PATHS } from "../../app/paths"
import { can } from "../../lib/roles"
import { FRONT_OFFICE_TABS } from "./frontOffice.config"
import { useFrontOfficeTabs } from "./hooks/useFrontOfficeTabs"
import { useFrontOfficeData } from "./hooks/useFrontOfficeData"
import FrontOfficeKpiStrip from "./shared/FrontOfficeKpiStrip"
import ArrivalBoardPage from "./arrival-board/ArrivalBoardPage"
import DepartureBoardPage from "./departure-board/DepartureBoardPage"
import InHouseGuestsPage from "./in-house/InHouseGuestsPage"
import RoomRackControlCenter from "./room-rack/RoomRackControlCenter"
import CheckInOutPage from "./check-in-out/CheckInOutPage"
import GuestFolioPage from "./guest-folio/GuestFolioPage"
import CashierPage from "./cashier/CashierPage"
import NightAuditPage from "./night-audit/NightAuditPage"
import LostFoundPage from "./lost-found/LostFoundPage"
import GuestMessagesPage from "./guest-messages/GuestMessagesPage"
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
  const navigate = useNavigate()
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
    : visibleTabs[0]?.id || "room-rack"

  const goToTab = (tabId) => setActiveTab(tabId)

  return (
    <>
      <EnterpriseWorkspace
        title="Front Office Workspace"
        subtitle="Room rack, arrival, departure, in-house, folio, cashier and night audit control center."
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
          {currentTab === "room-rack" && (
            <RoomRackControlCenter
              rooms={roomRack}
              loading={loading}
              onOpenReservation={openReservation}
              onOpenFolio={() => goToTab("guest-folio")}
              onOpenHousekeeping={() => navigate(PATHS.HOUSEKEEPING || "/housekeeping")}
              onOpenMaintenance={() => navigate(PATHS.MAINTENANCE || "/maintenance")}
              onOpenMessages={() => goToTab("guest-messages")}
            />
          )}

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

          {currentTab === "check-in-out" && (
            <CheckInOutPage
              arrivals={arrivals}
              departures={departures}
              loading={loading}
              openReservation={openReservation}
              onCheckIn={setCheckInTarget}
              onCheckOut={setCheckOutTarget}
            />
          )}

          {currentTab === "guest-folio" && (
            <GuestFolioPage
              openReservation={openReservation}
            />
          )}

          {currentTab === "cashier" && (
            <CashierPage
              userName={userName}
              isAdmin={isAdmin}
            />
          )}

          {currentTab === "night-audit" && (
            <NightAuditPage
              userName={userName}
              isAdmin={isAdmin}
              role={role}
            />
          )}

          {currentTab === "lost-found" && (
            <LostFoundPage userName={userName} />
          )}

          {currentTab === "guest-messages" && (
            <GuestMessagesPage userName={userName} />
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
