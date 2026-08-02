import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { isModuleEnabled } from './lib/saasModules'
import { can } from './lib/roles'
import { firstAccessiblePath } from './app/navigation/helpers'
import { PATHS } from './app/paths'
import Dashboard from './modules/dashboard/DashboardPage.jsx'
import { SaasModuleBlocked, SaasModuleFrame } from './components/saas/SaasModuleFrame.jsx'
import {
  SaasModuleRoute,
  TenantReportsRedirect,
  ReservationModuleRoute,
  FrontOfficeReservationRoute,
} from './routeGuards.jsx'
import FrontOfficePage from './modules/front-office/FrontOfficePage.jsx'
import HousekeepingPage from './modules/housekeeping/HousekeepingPage.jsx'
import {
  VoucherEntryPage,
  TrialBalancePage,
  ChartOfAccountsPage,
  FixedAssetsPage,
  OpeningBalancePage,
  TransactionMappingPage,
  VendorPaymentPage,
  VatCenterPage,
  VATReturnPage,
} from './modules/accounting/routePages.jsx'
import {
  HrEmployeeEntryPage,
  HrServiceBookPage,
  HrNomineePage,
  HrLeaveEntryPage,
  HrCompLeavePage,
  HrFestivalLeavePage,
  HrPayrollConfigPage,
  HrPayrollGenPage,
  HrPayrollRegisterPage,
  HrLetterPage,
  HrAttendanceRegisterPage,
  HrEmployeeRegisterPage,
  HrServiceBookRegPage,
  HrIncidentsPage,
  HrCompliancePage,
} from './modules/hr/routePages.jsx'
import {
  GuestPosKiosk,
  VerifyBillPage,
  VerifyInvoicePage,
  VerifyPaymentPage,
  PreviewReservationPaymentReceiptPage,
} from './modules/public/routePages.jsx'
import { FRONT_OFFICE_LEGACY_TAB_REDIRECTS } from './modules/front-office/frontOffice.config'
import ReservationsPage from './modules/reservations/ReservationsPage.jsx'
import InventoryPage from './modules/inventory/InventoryPage.jsx'
import ReportsCenterPage from './modules/reports/ReportsCenterPage.jsx'
import NotesEditorPage from './modules/reports/pages/NotesEditorPage.jsx'
import ProfitAndLossEnterpriseView from './modules/reports/pages/ProfitAndLossEnterpriseView.jsx'
import { DynamicReportPage } from './modules/reports'
import Settings from './modules/settings/SettingsPage.jsx'
import MasterDataPage from './modules/master-data/MasterDataPage.jsx'
import TasksPage from './modules/tasks/TasksPage.jsx'
import PosPrintCenterPage from './modules/restaurant/PosPrintCenterPage.jsx'
import RestaurantPage from './modules/restaurant/RestaurantPage.jsx'
import ModuleErrorBoundary from './components/boundary/ModuleErrorBoundary'
import { getVisibleReservationTabs } from './modules/reservations/reservations.config'
import {
  DEFAULT_MASTER_DATA_TAB,
  MASTER_DATA_LEGACY_TAB_MAP,
} from './modules/master-data/masterData.config'
import { PaymentConfigurationPage } from './modules/accounting/payment-configuration'
import { PaymentPostingPage } from './modules/accounting/payment-posting'
import { PaymentSettlementPage } from './modules/accounting/payment-settlement'

function CmsLegacyRedirect() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const legacyEntity = params.get('entity')
  const tab = MASTER_DATA_LEGACY_TAB_MAP[legacyEntity] || DEFAULT_MASTER_DATA_TAB
  const nextParams = new URLSearchParams()
  nextParams.set('tab', tab)
  if (legacyEntity === 'agencies' || legacyEntity === 'shareholders') {
    nextParams.set('entity', legacyEntity)
  }
  return <Navigate to={`${PATHS.MASTER_DATA}?${nextParams.toString()}`} replace />
}

function FrontOfficeLegacyRedirect({ legacyRoute }) {
  const tab =
    FRONT_OFFICE_LEGACY_TAB_REDIRECTS[legacyRoute] || FRONT_OFFICE_LEGACY_TAB_REDIRECTS.frontoffice
  return <Navigate to={`${PATHS.FRONT_OFFICE}/${tab}`} replace />
}

function withModuleBoundary(moduleName, routeKey, node) {
  return (
    <ModuleErrorBoundary moduleName={moduleName} routeKey={routeKey}>
      {node}
    </ModuleErrorBoundary>
  )
}

export default function AppRoutes({
  role,
  isAdmin,
  userName,
  userId,
  company,
  privileges,
  modulesEnabled,
  loadCompany,
  openReservation,
  openFrontOfficeReservation,
  startReservation,
}) {
  const visibleReservationTabs = getVisibleReservationTabs({ role, isAdmin, privileges })
  const hasFrontOfficeAccess =
    can(role, 'frontoffice', privileges) ||
    can(role, 'nightaudit', privileges) ||
    can(role, 'facilities', privileges)
  const frontOfficeModuleEnabled =
    isModuleEnabled('frontoffice', modulesEnabled, role) ||
    isModuleEnabled('nightaudit', modulesEnabled, role) ||
    isModuleEnabled('facilities', modulesEnabled, role)
  const frontOfficeElement =
    frontOfficeModuleEnabled && hasFrontOfficeAccess ? (
      <SaasModuleFrame moduleId="frontoffice" company={company} role={role} userName={userName}>
        {withModuleBoundary(
          'Front Office',
          'front-office',
          <FrontOfficePage
            openReservation={openFrontOfficeReservation}
            userName={userName}
            role={role}
            isAdmin={isAdmin}
            company={company}
            privileges={privileges}
          />,
        )}
      </SaasModuleFrame>
    ) : (
      <Navigate to={firstAccessiblePath(role, privileges, modulesEnabled)} replace />
    )
  const frontOfficeReservationElement =
    frontOfficeModuleEnabled && hasFrontOfficeAccess ? (
      <SaasModuleFrame moduleId="frontoffice" company={company} role={role} userName={userName}>
        <FrontOfficeReservationRoute userName={userName} role={role} isAdmin={isAdmin} />
      </SaasModuleFrame>
    ) : (
      <Navigate to={firstAccessiblePath(role, privileges, modulesEnabled)} replace />
    )

  return (
    <Routes>
      <Route
        path={PATHS.DASHBOARD}
        element={<Dashboard company={company} role={role} userName={userName} />}
      />
      <Route path={PATHS.ROOT} element={<Navigate to={PATHS.FRONT_OFFICE} replace />} />

      {/* Front Office — unified AEDS v2 module page */}
      <Route path={PATHS.FRONT_OFFICE} element={frontOfficeElement} />
      <Route path={PATHS.FRONT_OFFICE_PAGE} element={frontOfficeElement} />

      {/* Dashboard / frontoffice legacy routes */}
      <Route
        path={PATHS.FRONTOFFICE}
        element={<FrontOfficeLegacyRedirect legacyRoute="frontoffice" />}
      />

      {/* Reservations — unified tab page */}
      <Route
        path={PATHS.RESERVATIONS}
        element={
          !isModuleEnabled('reservations', modulesEnabled, role) ? (
            <SaasModuleBlocked moduleId="reservations" />
          ) : visibleReservationTabs.length ? (
            <SaasModuleFrame
              moduleId="reservations"
              company={company}
              role={role}
              userName={userName}
            >
              <ReservationsPage
                openReservation={openReservation}
                startReservation={startReservation}
                userName={userName}
                isAdmin={isAdmin}
                role={role}
                privileges={privileges}
              />
            </SaasModuleFrame>
          ) : (
            <Navigate to={firstAccessiblePath(role, privileges, modulesEnabled)} replace />
          )
        }
      />
      <Route
        path={PATHS.RESERVATION_DETAIL}
        element={
          <SaasModuleRoute
            moduleId="reservations"
            role={role}
            navId="reservations"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            <ReservationModuleRoute userName={userName} role={role} isAdmin={isAdmin} />
          </SaasModuleRoute>
        }
      />
      <Route path={PATHS.FRONTOFFICE_RESERVATION_DETAIL} element={frontOfficeReservationElement} />

      {/* Legacy routes — redirect to unified tab page for backward compatibility */}
      <Route
        path={PATHS.RESERVATION_PAYMENTS}
        element={<Navigate to={`${PATHS.RESERVATIONS}?tab=payments`} replace />}
      />
      <Route
        path={PATHS.CRM}
        element={<Navigate to={`${PATHS.RESERVATIONS}?tab=guest-crm`} replace />}
      />
      <Route
        path={PATHS.CALENDAR}
        element={<Navigate to={`${PATHS.RESERVATIONS}?tab=calendar`} replace />}
      />
      <Route
        path={PATHS.BOOKING_CALENDAR}
        element={<Navigate to={`${PATHS.RESERVATIONS}?tab=calendar`} replace />}
      />

      {/* Front Office */}
      <Route
        path={PATHS.NIGHTAUDIT}
        element={<FrontOfficeLegacyRedirect legacyRoute="nightaudit" />}
      />
      <Route
        path={PATHS.HOUSEKEEPING}
        element={
          <SaasModuleRoute
            moduleId="housekeeping"
            role={role}
            navId="housekeeping"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'Housekeeping',
              'housekeeping',
              <HousekeepingPage userName={userName} role={role} isAdmin={isAdmin} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path={PATHS.FACILITIES}
        element={<FrontOfficeLegacyRedirect legacyRoute="facilities" />}
      />

      {/* Restaurant */}
      <Route
        path={PATHS.RESTAURANT}
        element={
          <SaasModuleRoute
            moduleId="pos"
            role={role}
            navId="pos"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'Restaurant POS',
              'restaurant',
              <RestaurantPage
                userName={userName}
                role={role}
                isAdmin={isAdmin}
                modulesEnabled={modulesEnabled}
                company={company}
              />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path={PATHS.POS}
        element={
          <SaasModuleRoute
            moduleId="pos"
            role={role}
            navId="pos"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            <Navigate to={`${PATHS.RESTAURANT}?tab=pos`} replace />
          </SaasModuleRoute>
        }
      />
      <Route
        path={PATHS.POS_PRINT_CENTER}
        element={
          <SaasModuleRoute
            moduleId="pos"
            role={role}
            navId="pos"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'Restaurant POS',
              'pos-print-center',
              <PosPrintCenterPage company={company} userName={userName} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route path={PATHS.GUEST_KIOSK} element={<GuestPosKiosk />} />
      <Route path={PATHS.VERIFY_BILL} element={<VerifyBillPage />} />
      <Route path={PATHS.VERIFY_INVOICE} element={<VerifyInvoicePage />} />
      <Route path={PATHS.VERIFY_PAYMENT} element={<VerifyPaymentPage />} />
      <Route
        path={PATHS.PREVIEW_RESERVATION_PAYMENT_RECEIPT}
        element={<PreviewReservationPaymentReceiptPage />}
      />
      <Route
        path={PATHS.MENU_MANAGEMENT}
        element={
          isModuleEnabled('menu-management', modulesEnabled, role) &&
          (isAdmin || role === 'SUPERUSER' || role === 'RESTAURANT') ? (
            <SaasModuleFrame moduleId="pos" company={company} role={role} userName={userName}>
              <Navigate to={`${PATHS.RESTAURANT}?tab=menu`} replace />
            </SaasModuleFrame>
          ) : (
            <Navigate to={firstAccessiblePath(role, privileges, modulesEnabled)} replace />
          )
        }
      />

      {/* Inventory */}
      <Route
        path={PATHS.INVENTORY}
        element={
          <SaasModuleRoute
            moduleId="inventory"
            role={role}
            navId="inventory"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'Inventory',
              'inventory',
              <InventoryPage userName={userName} role={role} isAdmin={isAdmin} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path={PATHS.CONSUMPTION}
        element={
          <SaasModuleRoute
            moduleId="consumption"
            role={role}
            navId="inventory"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            <Navigate to={`${PATHS.INVENTORY}?tab=consumption`} replace />
          </SaasModuleRoute>
        }
      />

      {/* Accounting — separate routes per section */}
      <Route
        path={PATHS.VAT}
        element={
          <SaasModuleRoute
            moduleId="accounting"
            role={role}
            navId="vat"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'Accounting',
              'vat-center',
              <VatCenterPage userName={userName} company={company} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path={PATHS.VAT_RETURN}
        element={
          <SaasModuleRoute
            moduleId="accounting"
            role={role}
            navId="accounting"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary('Accounting', 'vat-return', <VATReturnPage />)}
          </SaasModuleRoute>
        }
      />
      <Route path={PATHS.ACCOUNTING} element={<Navigate to={PATHS.ACCOUNTING_VOUCHER} replace />} />
      <Route
        path={PATHS.ACCOUNTING_VOUCHER}
        element={
          <SaasModuleRoute
            moduleId="accounting"
            role={role}
            navId="accounting"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'Accounting',
              'accounting-voucher',
              <VoucherEntryPage userName={userName} isAdmin={isAdmin} role={role} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path={PATHS.ACCOUNTING_TRIAL}
        element={
          <SaasModuleRoute
            moduleId="accounting"
            role={role}
            navId="accounting"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary('Accounting', 'trial-balance', <TrialBalancePage />)}
          </SaasModuleRoute>
        }
      />
      <Route
        path={PATHS.ACCOUNTING_COA}
        element={
          <SaasModuleRoute
            moduleId="accounting"
            role={role}
            navId="accounting"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'Accounting',
              'chart-of-accounts',
              <ChartOfAccountsPage isAdmin={isAdmin} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path={PATHS.ACCOUNTING_ASSETS}
        element={
          <SaasModuleRoute
            moduleId="accounting"
            role={role}
            navId="accounting"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'Accounting',
              'fixed-assets',
              <FixedAssetsPage userName={userName} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path={PATHS.ACCOUNTING_OPENING}
        element={
          <SaasModuleRoute
            moduleId="accounting"
            role={role}
            navId="accounting"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'Accounting',
              'opening-balance',
              <OpeningBalancePage userName={userName} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path={PATHS.ACCOUNTING_TX_MAP}
        element={
          <SaasModuleRoute
            moduleId="accounting"
            role={role}
            navId="accounting"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'Accounting',
              'transaction-mapping',
              <TransactionMappingPage userName={userName} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path={PATHS.ACCOUNTING_VENDOR_PAYMENTS}
        element={
          <SaasModuleRoute
            moduleId="accounting"
            role={role}
            navId="accounting"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary('Accounting', 'vendor-payments', <VendorPaymentPage role={role} />)}
          </SaasModuleRoute>
        }
      />
      <Route
        path={PATHS.ACCOUNTING_PAYMENT_CONFIGURATION}
        element={
          <SaasModuleRoute
            moduleId="accounting"
            role={role}
            navId="accounting"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'Accounting',
              'payment-configuration',
              <PaymentConfigurationPage />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path={PATHS.ACCOUNTING_PAYMENT_POSTING}
        element={
          <SaasModuleRoute
            moduleId="accounting"
            role={role}
            navId="accounting"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary('Accounting', 'payment-posting', <PaymentPostingPage />)}
          </SaasModuleRoute>
        }
      />
      <Route
        path={PATHS.ACCOUNTING_PAYMENT_SETTLEMENT}
        element={
          <SaasModuleRoute
            moduleId="accounting"
            role={role}
            navId="accounting"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary('Accounting', 'payment-settlement', <PaymentSettlementPage />)}
          </SaasModuleRoute>
        }
      />

      {/* HR & Payroll */}
      <Route path="/hr" element={<Navigate to="/hr/employee-entry" replace />} />
      <Route
        path="/hr/employee-entry"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'HR & Payroll',
              '/hr/employee-entry',
              <HrEmployeeEntryPage
                userName={userName}
                role={role}
                isAdmin={isAdmin}
                company={company}
              />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path="/hr/service-book"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'HR & Payroll',
              '/hr/service-book',
              <HrServiceBookPage
                userName={userName}
                role={role}
                isAdmin={isAdmin}
                company={company}
              />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path="/hr/nominee"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'HR & Payroll',
              '/hr/nominee',
              <HrNomineePage userName={userName} role={role} isAdmin={isAdmin} company={company} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path="/hr/leave-entry"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'HR & Payroll',
              '/hr/leave-entry',
              <HrLeaveEntryPage
                userName={userName}
                role={role}
                isAdmin={isAdmin}
                company={company}
              />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path="/hr/comp-leave"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'HR & Payroll',
              '/hr/comp-leave',
              <HrCompLeavePage
                userName={userName}
                role={role}
                isAdmin={isAdmin}
                company={company}
              />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path="/hr/festival-leave"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'HR & Payroll',
              '/hr/festival-leave',
              <HrFestivalLeavePage
                userName={userName}
                role={role}
                isAdmin={isAdmin}
                company={company}
              />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path="/hr/payroll-config"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'HR & Payroll',
              '/hr/payroll-config',
              <HrPayrollConfigPage
                userName={userName}
                role={role}
                isAdmin={isAdmin}
                company={company}
              />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path="/hr/payroll-gen"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'HR & Payroll',
              '/hr/payroll-gen',
              <HrPayrollGenPage
                userName={userName}
                role={role}
                isAdmin={isAdmin}
                company={company}
              />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path="/hr/payroll-register"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'HR & Payroll',
              '/hr/payroll-register',
              <HrPayrollRegisterPage
                userName={userName}
                role={role}
                isAdmin={isAdmin}
                company={company}
              />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path="/hr/offer-letter"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'HR & Payroll',
              '/hr/offer-letter',
              <HrLetterPage type="OFFER_LETTER" company={company} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path="/hr/appointment-letter"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'HR & Payroll',
              '/hr/appointment-letter',
              <HrLetterPage type="APPOINTMENT" company={company} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path="/hr/joining-letter"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'HR & Payroll',
              '/hr/joining-letter',
              <HrLetterPage type="JOINING" company={company} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path="/hr/confirmation-letter"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'HR & Payroll',
              '/hr/confirmation-letter',
              <HrLetterPage type="CONFIRMATION" company={company} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path="/hr/increment-letter"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'HR & Payroll',
              '/hr/increment-letter',
              <HrLetterPage type="SALARY_INCREMENT" company={company} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path="/hr/promotion-letter"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'HR & Payroll',
              '/hr/promotion-letter',
              <HrLetterPage type="PROMOTION" company={company} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path="/hr/objection-letter"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'HR & Payroll',
              '/hr/objection-letter',
              <HrLetterPage type="OBJECTION" company={company} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path="/hr/show-cause"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'HR & Payroll',
              '/hr/show-cause',
              <HrLetterPage type="SHOW_CAUSE" company={company} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path="/hr/warning-letter"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'HR & Payroll',
              '/hr/warning-letter',
              <HrLetterPage type="WARNING" company={company} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path="/hr/dismissal-letter"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'HR & Payroll',
              '/hr/dismissal-letter',
              <HrLetterPage type="RELIEVING" company={company} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path="/hr/noc"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'HR & Payroll',
              '/hr/noc',
              <HrLetterPage type="NOC" company={company} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path="/hr/experience-cert"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'HR & Payroll',
              '/hr/experience-cert',
              <HrLetterPage type="EXP_CERT" company={company} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path="/hr/employment-cert"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'HR & Payroll',
              '/hr/employment-cert',
              <HrLetterPage type="SALARY_CERT" company={company} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path="/hr/final-payment"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'HR & Payroll',
              '/hr/final-payment',
              <HrLetterPage type="FINAL_PAYMENT" company={company} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path="/hr/attendance-register"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'HR & Payroll',
              '/hr/attendance-register',
              <HrAttendanceRegisterPage flash={(m) => m} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path="/hr/employee-register"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'HR & Payroll',
              '/hr/employee-register',
              <HrEmployeeRegisterPage role={role} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path="/hr/service-book-reg"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'HR & Payroll',
              '/hr/service-book-reg',
              <HrServiceBookRegPage userName={userName} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path="/hr/incidents"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'HR & Payroll',
              '/hr/incidents',
              <HrIncidentsPage userName={userName} flash={(m) => m} />,
            )}
          </SaasModuleRoute>
        }
      />
      <Route
        path="/hr/compliance"
        element={
          <SaasModuleRoute
            moduleId="hr"
            role={role}
            navId="hr"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary('HR & Payroll', '/hr/compliance', <HrCompliancePage role={role} />)}
          </SaasModuleRoute>
        }
      />

      {/* Reports */}

      <Route
        path={PATHS.REPORTS_CASED_ALIAS}
        caseSensitive
        element={<Navigate to={PATHS.REPORTS} replace />}
      />

      <Route
        path={PATHS.TENANT_REPORTS_CASED_ALIAS}
        caseSensitive
        element={<TenantReportsRedirect />}
      />

      <Route path={PATHS.NIGHT_AUDIT_REPORTS} element={<Navigate to={PATHS.REPORTS} replace />} />

      <Route
        path="/reports/:department/:slug"
        element={
          <SaasModuleRoute
            moduleId="reports"
            role={role}
            navId="reports"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            <DynamicReportPage company={company} role={role} userName={userName} userId={userId} />
          </SaasModuleRoute>
        }
      />

      <Route
        path={PATHS.TENANT_REPORTS}
        element={
          <SaasModuleRoute
            moduleId="reports"
            role={role}
            navId="reports"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'Reports',
              'reports-center',
              <ReportsCenterPage company={company} role={role} userName={userName} userId={userId} />,
            )}
          </SaasModuleRoute>
        }
      />

      <Route
        path={PATHS.REPORTS}
        element={
          <SaasModuleRoute
            moduleId="reports"
            role={role}
            navId="reports"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary(
              'Reports',
              'reports-center',
              <ReportsCenterPage company={company} role={role} userName={userName} userId={userId} />,
            )}
          </SaasModuleRoute>
        }
      />

      <Route
        path={PATHS.REPORTS_NOTES}
        element={
          <SaasModuleRoute
            moduleId="reports"
            role={role}
            navId="reports"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary('Reports', 'reports-notes', <NotesEditorPage />)}
          </SaasModuleRoute>
        }
      />

      <Route
        path={PATHS.REPORTS_PNL_V2}
        element={
          <SaasModuleRoute
            moduleId="reports"
            role={role}
            navId="reports"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            {withModuleBoundary('Reports', 'reports-pnl-v2', <ProfitAndLossEnterpriseView />)}
          </SaasModuleRoute>
        }
      />

      {/* Tasks — unified module */}
      <Route
        path={PATHS.TASKS}
        element={
          <SaasModuleRoute
            moduleId="tasks"
            role={role}
            navId="tasks"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            <TasksPage userName={userName} role={role} isAdmin={isAdmin} />
          </SaasModuleRoute>
        }
      />
      {/* /ai-tasker → redirect to /tasks?tab=ai (old URL still works) */}
      <Route path={PATHS.AI_TASKER} element={<Navigate to={`${PATHS.TASKS}?tab=ai`} replace />} />

      {/* System — superuser only */}
      <Route
        path={PATHS.MASTER_DATA}
        element={
          role === 'SUPERUSER' ? (
            <SaasModuleFrame moduleId="settings" company={company} role={role} userName={userName}>
              <MasterDataPage role={role} isAdmin={isAdmin} />
            </SaasModuleFrame>
          ) : (
            <Navigate to={firstAccessiblePath(role, privileges, modulesEnabled)} replace />
          )
        }
      />
      <Route
        path={PATHS.CMS}
        element={
          role === 'SUPERUSER' ? (
            <CmsLegacyRedirect />
          ) : (
            <Navigate to={firstAccessiblePath(role, privileges, modulesEnabled)} replace />
          )
        }
      />
      <Route
        path={PATHS.SETTINGS}
        element={
          <SaasModuleRoute
            moduleId="settings"
            role={role}
            navId="settings"
            privileges={privileges}
            modulesEnabled={modulesEnabled}
            company={company}
            userName={userName}
          >
            <Settings
              userName={userName}
              role={role}
              isAdmin={isAdmin}
              reloadCompany={loadCompany}
            />
          </SaasModuleRoute>
        }
      />

      <Route
        path="*"
        element={<Navigate to={firstAccessiblePath(role, privileges, modulesEnabled)} replace />}
      />
    </Routes>
  )
}
