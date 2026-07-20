import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { CalendarDays } from "lucide-react"

import EnterpriseWorkspace from "../../components/layout/EnterpriseWorkspace"
import ModuleTabs from "../../components/layout/ModuleTabs"

import { PATHS } from "../../app/paths"
import { can } from "../../lib/roles"

import { useReservationTabs } from "./hooks/useReservationTabs"
import ReservationKpiStrip from "./components/ReservationKpiStrip"

import ReservationsListTab from "./tabs/ReservationsListTab"
import BookingCalendarTab from "./tabs/BookingCalendarTab"
import NewReservationTab from "./tabs/NewReservationTab"
import ReservationPaymentsTab from "./tabs/ReservationPaymentsTab"
import GuestCrmTab from "./tabs/GuestCrmTab"
import QuotationsTab from "./tabs/QuotationsTab"
import ReservationHistoryTab from "./tabs/ReservationHistoryTab"
import ReservationWorkflowTab from "./tabs/ReservationWorkflowTab"
import ReservationReportsTab from "./tabs/ReservationReportsTab"
import ChannelManagerTab from "./tabs/ChannelManagerTab"

import {
  getVisibleReservationTabs,
} from "./reservations.config"

export default function ReservationsPage({
  openReservation,
  startReservation,
  userName,
  isAdmin,
  role,
  privileges,
  company,
}) {
  const navigate = useNavigate()

  const visibleTabs = useMemo(
    () =>
      getVisibleReservationTabs({
        role,
        isAdmin,
        privileges,
      }),
    [isAdmin, privileges, role]
  )

  const {
    activeTab,
    setActiveTab,
  } = useReservationTabs(visibleTabs)

  const permissions = useMemo(
    () => ({
      create:
        isAdmin ||
        role === "SUPERUSER" ||
        can(
          role,
          "reservations",
          privileges
        ),
      edit:
        isAdmin ||
        role === "SUPERUSER" ||
        can(
          role,
          "reservations",
          privileges
        ),
      cancel:
        isAdmin ||
        role === "SUPERUSER" ||
        can(
          role,
          "reservations",
          privileges
        ),
      viewReports:
        isAdmin ||
        role === "SUPERUSER" ||
        can(role, "reports", privileges),
    }),
    [isAdmin, privileges, role]
  )

  function renderTab() {
    switch (activeTab) {
      case "calendar":
        return (
          <BookingCalendarTab
            company={company}
            openReservation={openReservation}
            onNewReservation={
              startReservation
            }
            canCreate={permissions.create}
            canEdit={permissions.edit}
            canCancel={permissions.cancel}
          />
        )

      case "new":
        return (
          <NewReservationTab
            openReservation={openReservation}
            userName={userName}
            onBackToList={() =>
              setActiveTab("list")
            }
          />
        )

      case "payments":
        return (
          <ReservationPaymentsTab
            userName={userName}
            isAdmin={isAdmin}
          />
        )

      case "guest-crm":
        return (
          <GuestCrmTab
            userName={userName}
            isAdmin={isAdmin}
            role={role}
          />
        )

      case "quotations":
        return <QuotationsTab openReservation={openReservation} />

      case "workflow":
        return <ReservationWorkflowTab />

      case "history":
        return <ReservationHistoryTab />

      case "channels":
        return <ChannelManagerTab />

      case "reports":
        return (
          <ReservationReportsTab
            canOpenReportsCenter={
              permissions.viewReports
            }
            onOpenReportsCenter={() =>
              navigate(PATHS.REPORTS)
            }
          />
        )

      case "list":
      default:
        return (
          <ReservationsListTab
            openReservation={openReservation}
            userName={userName}
          />
        )
    }
  }

  const tabs = (
    <ModuleTabs
      tabs={visibleTabs}
      activeTab={activeTab}
      onChange={setActiveTab}
    />
  )

  const panel = (
    <section
      id={`module-tab-panel-${activeTab}`}
      role="tabpanel"
      aria-labelledby={`module-tab-${activeTab}`}
    >
      {renderTab()}
    </section>
  )

  if (activeTab === "calendar") {
    return (
      <EnterpriseWorkspace
        title="Reservations Workspace"
        subtitle="Calendar, booking register, payments, guest CRM, quotations, distribution channels and analytics."
        eyebrow="Front Office & Distribution"
        icon={CalendarDays}
        actions={null}
        kpis={<ReservationKpiStrip />}
        tabs={tabs}
      >
        {panel}
      </EnterpriseWorkspace>
    )
  }

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
        {tabs}
      </div>

      {panel}
    </section>
  )
}
