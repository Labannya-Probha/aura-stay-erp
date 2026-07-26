/* ------------------------------------------------------------------ */
/*  RESERVATIONS PAGE — AEDS v6 Enterprise Booking Workspace          */
/* ------------------------------------------------------------------ */
import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { CalendarDays, Plus } from "lucide-react"

import EnterpriseWorkspace from "../../components/layout/EnterpriseWorkspace"
import ModuleTabs from "../../components/layout/ModuleTabs"
import { Button } from "../../components/ui/button"

import { PATHS } from "../../app/paths"
import { can } from "../../lib/roles"

import { useReservationTabs } from "./hooks/useReservationTabs"
import ReservationKpiStrip from "./components/ReservationKpiStrip"

import ReservationsListTab from "./tabs/ReservationsListTab"
import BookingCalendarTab from "./tabs/BookingCalendarTab"
import AvailabilityTab from "./tabs/AvailabilityTab"
import NewReservationTab from "./tabs/NewReservationTab"
import ReservationPaymentsTab from "./tabs/ReservationPaymentsTab"
import GuestCrmTab from "./tabs/GuestCrmTab"
import QuotationsTab from "./tabs/QuotationsTab"
import ReservationHistoryTab from "./tabs/ReservationHistoryTab"
import ReservationReportsTab from "./tabs/ReservationReportsTab"

import { getVisibleReservationTabs } from "./reservations.config"

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
    () => getVisibleReservationTabs({ role, isAdmin, privileges }),
    [isAdmin, privileges, role]
  )

  const { activeTab, setActiveTab } = useReservationTabs(visibleTabs)

  const permissions = useMemo(
    () => ({
      create:
        isAdmin ||
        role === "SUPERUSER" ||
        can(role, "reservations", privileges),
      edit:
        isAdmin ||
        role === "SUPERUSER" ||
        can(role, "reservations", privileges),
      cancel:
        isAdmin ||
        role === "SUPERUSER" ||
        can(role, "reservations", privileges),
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
            onNewReservation={startReservation}
            canCreate={permissions.create}
            canEdit={permissions.edit}
            canCancel={permissions.cancel}
          />
        )

      case "availability":
        return <AvailabilityTab onCreateReservation={startReservation} />

      case "new":
        return (
          <NewReservationTab
            openReservation={openReservation}
            userName={userName}
            onBackToList={() => setActiveTab("list")}
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
        return (
          <QuotationsTab
            onCreateReservation={startReservation}
          />
        )

      case "history":
        return <ReservationHistoryTab />

      case "reports":
        return (
          <ReservationReportsTab
            canOpenReportsCenter={permissions.viewReports}
            onOpenReportsCenter={() => navigate(PATHS.REPORTS)}
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

  const canCreateReservation = visibleTabs.some(
    (tab) => tab.id === "new"
  )

  return (
    <EnterpriseWorkspace
      title="Reservations Workspace"
      subtitle="Booking calendar, availability, guest CRM, quotations, payments and reservation control."
      eyebrow="Front Office & Distribution"
      icon={CalendarDays}
      actions={
        canCreateReservation ? (
          <Button onClick={() => setActiveTab("new")}>
            <Plus size={16} />
            New Reservation
          </Button>
        ) : null
      }
      kpis={<ReservationKpiStrip />}
      tabs={
        <ModuleTabs
          tabs={visibleTabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      }
    >
      <section
        id={`module-tab-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`module-tab-${activeTab}`}
      >
        {renderTab()}
      </section>
    </EnterpriseWorkspace>
  )
}
