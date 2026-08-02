import { useMemo, useState } from 'react'
import { Hotel, RefreshCw } from 'lucide-react'

import CheckoutHistoryPage from './CheckoutHistoryPage'

import PrintPortal from '../../components/PrintPortal'
import GuestBill from '../../components/print/GuestBill'
import Mushak63 from '../../components/print/Mushak63'
import { getPrintBrandProps } from '../../lib/companySettings'

import EnterpriseWorkspace from '../../components/layout/EnterpriseWorkspace'
import { Button } from '../../components/ui/button'
import { can } from '../../lib/roles'

import { FRONT_OFFICE_PAGES, getFrontOfficePage } from './frontOffice.config'
import { useFrontOfficeTabs } from './hooks/useFrontOfficeTabs'
import { useFrontOfficeData } from './hooks/useFrontOfficeData'
import FrontOfficeKpiStrip from './shared/FrontOfficeKpiStrip'
import FrontOfficePageHeader from './shared/FrontOfficePageHeader'
import FrontOfficeRouteBoundary from './shared/FrontOfficeRouteBoundary'
import ArrivalBoardPage from './arrival-board/ArrivalBoardPage'
import DepartureBoardPage from './departure-board/DepartureBoardPage'
import InHouseGuestsPage from './in-house/InHouseGuestsPage'
import RoomRackPage from './room-rack/RoomRackPage'
import GuestFolioPage from './guest-folio/GuestFolioPage'
import CashierPage from './cashier/CashierPage'
import NightAuditPage from './night-audit/NightAuditPage'
import LostFoundPage from './lost-found/LostFoundPage'
import GuestMessagesPage from './guest-messages/GuestMessagesPage'
import ServiceBillsPage from '../../pages/ServiceBills.jsx'
import CheckInDialog from './dialog/CheckInDialog'
import CheckOutDialog from './dialog/CheckOutDialog'
import RoomMoveDialog from './dialog/RoomMoveDialog'
import StayAmendDialog from './dialog/StayAmendDialog'

function hasPageAccess(page, { role, isAdmin, privileges }) {
  if (isAdmin || role === 'SUPERUSER') return true
  return can(role, page.permission || 'frontoffice', privileges)
}

export default function FrontOfficePage({
  openReservation,
  userName,
  role,
  isAdmin,
  company,
  privileges,
}) {
  const { activeSlug, activePage, setActiveTab } = useFrontOfficeTabs()
  const location = window.location.pathname
  const [checkInTarget, setCheckInTarget] = useState(null)
  const [checkOutTarget, setCheckOutTarget] = useState(null)
  const [roomMoveTarget, setRoomMoveTarget] = useState(null)
  const [stayAmendTarget, setStayAmendTarget] = useState(null)
  const [printDoc, setPrintDoc] = useState(null)

  const { summary, arrivals, departures, inHouse, roomRack, loading, refreshing, error, refresh } =
    useFrontOfficeData()

  const visiblePages = useMemo(
    () => FRONT_OFFICE_PAGES.filter((page) => hasPageAccess(page, { role, isAdmin, privileges })),
    [role, isAdmin, privileges],
  )

  const currentPage = useMemo(() => {
    const slugFromPath = location.split('/').filter(Boolean).pop()
    const resolvedSlug =
      slugFromPath && visiblePages.some((page) => page.slug === slugFromPath)
        ? slugFromPath
        : activeSlug

    if (visiblePages.some((page) => page.slug === resolvedSlug)) {
      return getFrontOfficePage(resolvedSlug)
    }
    return visiblePages[0] || getFrontOfficePage('room-rack')
  }, [activeSlug, location, visiblePages])

  const renderPage = () => {
    switch (currentPage.renderer) {
      case 'room-rack':
        return <RoomRackPage rows={roomRack} loading={loading} />
      case 'arrivals':
        return (
          <ArrivalBoardPage
            rows={arrivals}
            loading={loading}
            openReservation={openReservation}
            onCheckIn={setCheckInTarget}
          />
        )
      case 'departures':
        return (
          <DepartureBoardPage
            rows={departures}
            loading={loading}
            openReservation={openReservation}
            onCheckOut={setCheckOutTarget}
          />
        )
      case 'in-house':
        return (
          <InHouseGuestsPage
            rows={inHouse}
            loading={loading}
            openReservation={openReservation}
            onRoomMove={setRoomMoveTarget}
            onStayAmend={setStayAmendTarget}
            onCheckOut={setCheckOutTarget}
          />
        )
      case 'check-in-out':
        return (
          <div className="grid gap-5 2xl:grid-cols-2">
            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">Arrival Check-in Queue</h2>
              <ArrivalBoardPage
                rows={arrivals}
                loading={loading}
                openReservation={openReservation}
                onCheckIn={setCheckInTarget}
              />
            </section>
            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">
                Departure Checkout Queue
              </h2>
              <DepartureBoardPage
                rows={departures}
                loading={loading}
                openReservation={openReservation}
                onCheckOut={setCheckOutTarget}
              />
            </section>
          </div>
        )
      case 'guest-folio':
        return <GuestFolioPage rows={inHouse} loading={loading} openReservation={openReservation} />
      case 'service-bills':
        return <ServiceBillsPage userName={userName} isAdmin={isAdmin} />
      case 'cashier':
        return <CashierPage userName={userName} isAdmin={isAdmin} />
      case 'night-audit':
        return <NightAuditPage userName={userName} isAdmin={isAdmin} role={role} />
      case 'lost-found':
        return <LostFoundPage />
      case 'guest-messages':
        return <GuestMessagesPage />
      case 'checkout-history':
        return (
          <CheckoutHistoryPage
            openReservation={openReservation}
            onPrintBill={(payload) => setPrintDoc(payload)}
            company={company}
          />
        )
      default:
        return null
    }
  }

  const content = (
    <>
      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}
      <section
        id={`front-office-page-${currentPage.slug}`}
        data-front-office-page={currentPage.slug}
      >
        <FrontOfficeRouteBoundary routeKey={currentPage.slug}>
          {renderPage()}
        </FrontOfficeRouteBoundary>
      </section>
    </>
  )

  return (
    <>
      {currentPage.showWorkspace ? (
        <EnterpriseWorkspace
          title="Front Office Workspace"
          subtitle="Live room operations, occupancy, housekeeping status and guest balances."
          eyebrow="Hotel Operations"
          icon={Hotel}
          actions={
            <Button variant="outline" onClick={refresh} disabled={loading || refreshing}>
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </Button>
          }
          kpis={<FrontOfficeKpiStrip data={summary} loading={loading} />}
        >
          {content}
        </EnterpriseWorkspace>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <FrontOfficePageHeader
            page={currentPage}
            onRefresh={refresh}
            refreshing={loading || refreshing}
          />
          {content}
        </section>
      )}

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
        onPrintBill={(payload) => setPrintDoc(payload)}
        company={company}
        guest={checkOutTarget?.guest}
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

      {printDoc?.type === 'BILL' && (
        <PrintPortal
          title="Guest Bill"
          onClose={() => setPrintDoc(null)}
          {...getPrintBrandProps(company)}
        >
          <GuestBill
            charges={printDoc.invoiceData?.charges ?? []}
            line_snapshot={printDoc.invoiceData?.line_snapshot ?? []}
            totals={printDoc.invoiceData?.totals ?? {}}
            paid={printDoc.invoiceData?.paid ?? 0}
            due={printDoc.invoiceData?.due ?? 0}
            res={printDoc.res}
            guest={printDoc.guest}
            company={printDoc.company || company}
            invoice_no={printDoc.invoiceData?.invoice_no}
            issued_at={printDoc.invoiceData?.issued_at}
            copyLabel="Guest Copy"
            singleCopy
          />
        </PrintPortal>
      )}

      {printDoc?.type === 'MUSHAK' && (
        <PrintPortal
          title="Mushak-6.3"
          onClose={() => setPrintDoc(null)}
          {...getPrintBrandProps(company)}
        >
          <Mushak63
            charges={printDoc.invoiceData?.charges ?? []}
            line_snapshot={printDoc.invoiceData?.line_snapshot ?? []}
            totals={printDoc.invoiceData?.totals ?? {}}
            paid={printDoc.invoiceData?.paid ?? 0}
            due={printDoc.invoiceData?.due ?? 0}
            res={printDoc.res}
            guest={printDoc.guest}
            company={printDoc.company || company}
            invoice_no={printDoc.invoiceData?.invoice_no}
            issued_at={printDoc.invoiceData?.issued_at}
            refNo={printDoc.res?.res_no}
          />
        </PrintPortal>
      )}
    </>
  )
}
