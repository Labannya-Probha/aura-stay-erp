export const reportCategories = [
  { code: 'IFRS', name: 'IFRS Financial Reports', sort_order: 10 },
  { code: 'HOTEL_KPI', name: 'Hotel KPI & Operations', sort_order: 20 },
  { code: 'POS', name: 'Restaurant POS', sort_order: 30 },
  { code: 'ACCOUNTING', name: 'Accounting Control', sort_order: 40 },
]

export const standardFilters = [
  'dateFrom', 'dateTo', 'property', 'outlet', 'department', 'costCenter',
  'roomType', 'guestType', 'reservationSource', 'paymentMethod', 'status', 'user', 'currency',
]

export const standardColumns = [
  'slNo', 'transactionDate', 'documentNo', 'voucherNo', 'reservationNo', 'guestId',
  'guestName', 'roomNo', 'roomType', 'department', 'costCenter', 'accountCode',
  'accountName', 'description', 'quantity', 'rate', 'grossAmount', 'discount',
  'vat', 'serviceCharge', 'netAmount', 'debit', 'credit', 'balance', 'paymentMethod',
  'createdBy', 'approvedBy', 'status', 'remarks',
]

const template = (code, name, category, overrides = {}) => ({
  code,
  name,
  category,
  columns: overrides.columns || standardColumns,
  filters: overrides.filters || standardFilters,
  kpis: overrides.kpis || ['totalRevenue', 'netAmount', 'outstandingReceivable'],
  dataSource: overrides.dataSource || 'reporting.vw_enterprise_report_rows',
  grouping: overrides.grouping || 'department',
  sorting: overrides.sorting || [{ key: 'transactionDate', direction: 'desc' }],
  ifrsReference: overrides.ifrsReference || null,
  exportPermission: true,
  printPermission: true,
})

export const reportTemplates = [
  template('IFRS-SFP', 'Statement of Financial Position', 'IFRS', { ifrsReference: 'IAS 1', grouping: 'classification' }),
  template('IFRS-PNL', 'Statement of Profit or Loss', 'IFRS', { ifrsReference: 'IAS 1', grouping: 'statementLine' }),
  template('IFRS-CFS', 'Statement of Cash Flows', 'IFRS', { ifrsReference: 'IAS 7', grouping: 'cashFlowClass' }),
  template('IFRS-SCE', 'Statement of Changes in Equity', 'IFRS', { ifrsReference: 'IAS 1', grouping: 'equityComponent' }),
  template('IFRS-REV-REC', 'Revenue Recognition Report', 'IFRS', { ifrsReference: 'IFRS 15', grouping: 'performanceObligation' }),
  template('IFRS-DEF-REV', 'Deferred Revenue Report', 'IFRS', { ifrsReference: 'IFRS 15', grouping: 'status' }),
  template('INV-MOV', 'Inventory Movement Report', 'IFRS', { ifrsReference: 'IAS 2', grouping: 'itemCategory' }),
  template('FA-REG', 'Fixed Asset Register', 'IFRS', { ifrsReference: 'IAS 16', grouping: 'assetClass' }),
  template('FA-DEP', 'Depreciation Schedule', 'IFRS', { ifrsReference: 'IAS 16', grouping: 'assetClass' }),
  template('LEASE-LIAB', 'Lease Liability Schedule', 'IFRS', { ifrsReference: 'IFRS 16', grouping: 'leaseContract' }),
  template('AR-AGING', 'Accounts Receivable Aging', 'ACCOUNTING', { grouping: 'agingBucket' }),
  template('AP-AGING', 'Accounts Payable Aging', 'ACCOUNTING', { grouping: 'agingBucket' }),
  template('OCC-RPT', 'Occupancy Report', 'HOTEL_KPI', { kpis: ['occupancy', 'totalGuests', 'roomRevenue'], grouping: 'roomType' }),
  template('ADR-RPT', 'ADR Report', 'HOTEL_KPI', { kpis: ['adr', 'roomRevenue', 'occupancy'], grouping: 'roomType' }),
  template('REVPAR-RPT', 'RevPAR Report', 'HOTEL_KPI', { kpis: ['revpar', 'adr', 'occupancy'], grouping: 'roomType' }),
  template('ROOM-REV', 'Room Revenue Report', 'HOTEL_KPI', { kpis: ['roomRevenue', 'adr', 'revpar'], grouping: 'roomType' }),
  template('GUEST-LEDGER', 'Guest Ledger Report', 'HOTEL_KPI', { grouping: 'guestName' }),
  template('RES-RPT', 'Reservation Report', 'HOTEL_KPI', { grouping: 'reservationSource' }),
  template('CHECKIN-RPT', 'Check-in Report', 'HOTEL_KPI', { kpis: ['checkIns', 'totalGuests'], grouping: 'roomType' }),
  template('CHECKOUT-RPT', 'Check-out Report', 'HOTEL_KPI', { kpis: ['checkOuts', 'totalGuests'], grouping: 'roomType' }),
  template('NOSHOW-RPT', 'No-show Report', 'HOTEL_KPI', { kpis: ['noShows'], grouping: 'reservationSource' }),
  template('CANCEL-RPT', 'Cancellation Report', 'HOTEL_KPI', { kpis: ['cancellations'], grouping: 'reservationSource' }),
  template('HK-STATUS', 'Housekeeping Status Report', 'HOTEL_KPI', { grouping: 'status' }),
  template('ROOM-AVAIL', 'Room Availability Report', 'HOTEL_KPI', { grouping: 'roomType' }),
  template('REST-SALES', 'Restaurant Sales Report', 'POS', { kpis: ['restaurantRevenue', 'vatPayable', 'cashCollection'], grouping: 'outlet' }),
  template('POS-COLL', 'POS Collection Report', 'POS', { kpis: ['cashCollection', 'cardCollection', 'mobileCollection'], grouping: 'paymentMethod' }),
  template('PAY-SUM', 'Payment Summary Report', 'ACCOUNTING', { kpis: ['cashCollection', 'cardCollection', 'mobileCollection'], grouping: 'paymentMethod' }),
  template('DAILY-SALES', 'Daily Sales Report', 'ACCOUNTING', { kpis: ['totalRevenue', 'roomRevenue', 'restaurantRevenue'], grouping: 'department' }),
  template('NIGHT-AUDIT', 'Night Audit Report', 'ACCOUNTING', { kpis: ['totalRevenue', 'cashCollection', 'outstandingReceivable'], grouping: 'department' }),
]

export const sampleRows = [
  { slNo: 1, transactionDate: '2026-06-30', documentNo: 'INV-0001', reservationNo: 'RES-1021', guestId: 'GST-101', guestName: 'Rahman Group', roomNo: '201', roomType: 'Deluxe', department: 'Rooms', costCenter: 'ROOMS', accountCode: '4001', accountName: 'Room Revenue', description: 'Room night revenue', quantity: 2, rate: 7500, grossAmount: 15000, discount: 500, vat: 2175, serviceCharge: 1450, netAmount: 18125, debit: 0, credit: 18125, balance: 18125, paymentMethod: 'Card', createdBy: 'Front Desk', approvedBy: 'Demo Superuser', status: 'Posted', remarks: 'IFRS 15 recognized' },
  { slNo: 2, transactionDate: '2026-06-30', documentNo: 'POS-0188', reservationNo: 'RES-1021', guestId: 'GST-101', guestName: 'Rahman Group', roomNo: '201', roomType: 'Deluxe', department: 'Restaurant', costCenter: 'F&B', accountCode: '4010', accountName: 'Restaurant Revenue', description: 'Restaurant dinner bill', quantity: 4, rate: 1250, grossAmount: 5000, discount: 250, vat: 713, serviceCharge: 475, netAmount: 5938, debit: 0, credit: 5938, balance: 24063, paymentMethod: 'Cash', createdBy: 'Cashier', approvedBy: 'Demo Superuser', status: 'Settled', remarks: 'POS settled' },
]
