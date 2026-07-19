import {
  BedDouble,
  Boxes,
  CalendarDays,
  Landmark,
  ShieldCheck,
  Utensils,
  Workflow,
} from 'lucide-react'

export const REPORT_CATEGORIES = [
  { code: 'accounts', name: 'Accounts', slug: 'accounts', icon: Landmark },
  { code: 'inventory', name: 'Inventory', slug: 'inventory', icon: Boxes },
  { code: 'admin', name: 'Admin & Audit', slug: 'admin', icon: ShieldCheck },
  { code: 'housekeeping', name: 'Housekeeping', slug: 'housekeeping', icon: BedDouble },
  { code: 'restaurant', name: 'Restaurant POS', slug: 'restaurant', icon: Utensils },
  { code: 'sales', name: 'Sales & Reservations', slug: 'sales', icon: CalendarDays },
  { code: 'cross-module', name: 'Cross Module', slug: 'cross-module', icon: Workflow },
]

const REPORT_TEMPLATE_DEFINITIONS = [
  {
    "category": "accounts",
    "department": "Accounts",
    "departmentSlug": "accounts",
    "name": "Accounts Payable Aging",
    "title": "Accounts Payable Aging",
    "slug": "accounts-payable-aging",
    "route": "/reports/accounts/accounts-payable-aging",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "accounts",
    "department": "Accounts",
    "departmentSlug": "accounts",
    "name": "Accounts Receivable Aging",
    "title": "Accounts Receivable Aging",
    "slug": "accounts-receivable-aging",
    "route": "/reports/accounts/accounts-receivable-aging",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "accounts",
    "department": "Accounts",
    "departmentSlug": "accounts",
    "name": "Balance Sheet",
    "title": "Balance Sheet",
    "slug": "balance-sheet",
    "route": "/reports/accounts/balance-sheet",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "accounts",
    "department": "Accounts",
    "departmentSlug": "accounts",
    "name": "Bank Book",
    "title": "Bank Book",
    "slug": "bank-book",
    "route": "/reports/accounts/bank-book",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "accounts",
    "department": "Accounts",
    "departmentSlug": "accounts",
    "name": "Bank Reconciliation",
    "title": "Bank Reconciliation",
    "slug": "bank-reconciliation",
    "route": "/reports/accounts/bank-reconciliation",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "accounts",
    "department": "Accounts",
    "departmentSlug": "accounts",
    "name": "Cash Book",
    "title": "Cash Book",
    "slug": "cash-book",
    "route": "/reports/accounts/cash-book",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "accounts",
    "department": "Accounts",
    "departmentSlug": "accounts",
    "name": "Cash Flow Statement",
    "title": "Cash Flow Statement",
    "slug": "cash-flow-statement",
    "route": "/reports/accounts/cash-flow-statement",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "accounts",
    "department": "Accounts",
    "departmentSlug": "accounts",
    "name": "Depreciation",
    "title": "Depreciation",
    "slug": "depreciation",
    "route": "/reports/accounts/depreciation",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "accounts",
    "department": "Accounts",
    "departmentSlug": "accounts",
    "name": "Due Balance",
    "title": "Due Balance",
    "slug": "due-balance",
    "route": "/reports/accounts/due-balance",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "accounts",
    "department": "Accounts",
    "departmentSlug": "accounts",
    "name": "Expense By Category Department",
    "title": "Expense By Category Department",
    "slug": "expense-by-category-department",
    "route": "/reports/accounts/expense-by-category-department",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "accounts",
    "department": "Accounts",
    "departmentSlug": "accounts",
    "name": "Ledger",
    "title": "Ledger",
    "slug": "ledger",
    "route": "/reports/accounts/ledger",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "accounts",
    "department": "Accounts",
    "departmentSlug": "accounts",
    "name": "Net Asset Value",
    "title": "Net Asset Value",
    "slug": "net-asset-value",
    "route": "/reports/accounts/net-asset-value",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "accounts",
    "department": "Accounts",
    "departmentSlug": "accounts",
    "name": "Profit & Loss Statement",
    "title": "Profit & Loss Statement",
    "slug": "profit-and-loss-statement",
    "route": "/reports/accounts/profit-and-loss-statement",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "accounts",
    "department": "Accounts",
    "departmentSlug": "accounts",
    "name": "Trial Balance",
    "title": "Trial Balance",
    "slug": "trial-balance",
    "route": "/reports/accounts/trial-balance",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "accounts",
    "department": "Accounts",
    "departmentSlug": "accounts",
    "name": "VAT & Tax Collection",
    "title": "VAT & Tax Collection",
    "slug": "vat-tax-collection",
    "route": "/reports/accounts/vat-tax-collection",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "accounts",
    "department": "Accounts",
    "departmentSlug": "accounts",
    "name": "VAT & Tax Collection vs Payment",
    "title": "VAT & Tax Collection vs Payment",
    "slug": "vat-tax-collection-vs-payment",
    "route": "/reports/accounts/vat-tax-collection-vs-payment",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "accounts",
    "department": "Accounts",
    "departmentSlug": "accounts",
    "name": "VAT & Tax Payment",
    "title": "VAT & Tax Payment",
    "slug": "vat-tax-payment",
    "route": "/reports/accounts/vat-tax-payment",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "inventory",
    "department": "Inventory",
    "departmentSlug": "inventory",
    "name": "Item Wise Stock",
    "title": "Item Wise Stock",
    "slug": "item-wise-stock",
    "route": "/reports/inventory/item-wise-stock",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "inventory",
    "department": "Inventory",
    "departmentSlug": "inventory",
    "name": "Low Stock Reorder Alert",
    "title": "Low Stock Reorder Alert",
    "slug": "low-stock-reorder-alert",
    "route": "/reports/inventory/low-stock-reorder-alert",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "inventory",
    "department": "Inventory",
    "departmentSlug": "inventory",
    "name": "Price Comparison",
    "title": "Price Comparison",
    "slug": "price-comparison",
    "route": "/reports/inventory/price-comparison",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "inventory",
    "department": "Inventory",
    "departmentSlug": "inventory",
    "name": "Product In",
    "title": "Product In",
    "slug": "product-in",
    "route": "/reports/inventory/product-in",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "inventory",
    "department": "Inventory",
    "departmentSlug": "inventory",
    "name": "Product Out",
    "title": "Product Out",
    "slug": "product-out",
    "route": "/reports/inventory/product-out",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "inventory",
    "department": "Inventory",
    "departmentSlug": "inventory",
    "name": "Purchase",
    "title": "Purchase",
    "slug": "purchase",
    "route": "/reports/inventory/purchase",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "inventory",
    "department": "Inventory",
    "departmentSlug": "inventory",
    "name": "Warehouse Wise Stock",
    "title": "Warehouse Wise Stock",
    "slug": "warehouse-wise-stock",
    "route": "/reports/inventory/warehouse-wise-stock",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "admin",
    "department": "Admin & Audit",
    "departmentSlug": "admin",
    "name": "Cost Controller",
    "title": "Cost Controller",
    "slug": "cost-controller",
    "route": "/reports/admin/cost-controller",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "admin",
    "department": "Admin & Audit",
    "departmentSlug": "admin",
    "name": "Executive Summary Dashboard KPI Snapshot",
    "title": "Executive Summary Dashboard KPI Snapshot",
    "slug": "executive-summary-dashboard-kpi-snapshot",
    "route": "/reports/admin/executive-summary-dashboard-kpi-snapshot",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "admin",
    "department": "Admin & Audit",
    "departmentSlug": "admin",
    "name": "Multi Property Consolidated Performance",
    "title": "Multi Property Consolidated Performance",
    "slug": "multi-property-consolidated-performance",
    "route": "/reports/admin/multi-property-consolidated-performance",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "admin",
    "department": "Admin & Audit",
    "departmentSlug": "admin",
    "name": "Out Of Order Maintenance Room",
    "title": "Out Of Order Maintenance Room",
    "slug": "out-of-order-maintenance-room",
    "route": "/reports/admin/out-of-order-maintenance-room",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "admin",
    "department": "Admin & Audit",
    "departmentSlug": "admin",
    "name": "User Activity Audit Trail Log",
    "title": "User Activity Audit Trail Log",
    "slug": "user-activity-audit-trail-log",
    "route": "/reports/admin/user-activity-audit-trail-log",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "housekeeping",
    "department": "Housekeeping",
    "departmentSlug": "housekeeping",
    "name": "Consumption",
    "title": "Consumption",
    "slug": "consumption",
    "route": "/reports/housekeeping/consumption",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "housekeeping",
    "department": "Housekeeping",
    "departmentSlug": "housekeeping",
    "name": "Lost And Found",
    "title": "Lost And Found",
    "slug": "lost-and-found",
    "route": "/reports/housekeeping/lost-and-found",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "housekeeping",
    "department": "Housekeeping",
    "departmentSlug": "housekeeping",
    "name": "Room Status Live",
    "title": "Room Status Live",
    "slug": "room-status-live",
    "route": "/reports/housekeeping/room-status-live",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "restaurant",
    "department": "Restaurant POS",
    "departmentSlug": "restaurant",
    "name": "Component Wise Sales Summary",
    "title": "Component Wise Sales Summary",
    "slug": "component-wise-sales-summary",
    "route": "/reports/restaurant/component-wise-sales-summary",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "restaurant",
    "department": "Restaurant POS",
    "departmentSlug": "restaurant",
    "name": "Consumption",
    "title": "Consumption",
    "slug": "consumption",
    "route": "/reports/restaurant/consumption",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "restaurant",
    "department": "Restaurant POS",
    "departmentSlug": "restaurant",
    "name": "Cost Of Goods Sold",
    "title": "Cost Of Goods Sold",
    "slug": "cost-of-goods-sold",
    "route": "/reports/restaurant/cost-of-goods-sold",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "restaurant",
    "department": "Restaurant POS",
    "departmentSlug": "restaurant",
    "name": "Night Audit Day Closing",
    "title": "Night Audit Day Closing",
    "slug": "night-audit-day-closing",
    "route": "/reports/restaurant/night-audit-day-closing",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "restaurant",
    "department": "Restaurant POS",
    "departmentSlug": "restaurant",
    "name": "Payment Transaction",
    "title": "Payment Transaction",
    "slug": "payment-transaction",
    "route": "/reports/restaurant/payment-transaction",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "restaurant",
    "department": "Restaurant POS",
    "departmentSlug": "restaurant",
    "name": "Sales",
    "title": "Sales",
    "slug": "sales",
    "route": "/reports/restaurant/sales",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "restaurant",
    "department": "Restaurant POS",
    "departmentSlug": "restaurant",
    "name": "Table Section Wise Sales",
    "title": "Table Section Wise Sales",
    "slug": "table-section-wise-sales",
    "route": "/reports/restaurant/table-section-wise-sales",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "restaurant",
    "department": "Restaurant POS",
    "departmentSlug": "restaurant",
    "name": "Void And Discount POS",
    "title": "Void And Discount POS",
    "slug": "void-and-discount-pos",
    "route": "/reports/restaurant/void-and-discount-pos",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "ADR RevPAR Hotel KPI",
    "title": "ADR RevPAR Hotel KPI",
    "slug": "adr-revpar-hotel-kpi",
    "route": "/reports/sales/adr-revpar-hotel-kpi",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "Agency Booking",
    "title": "Agency Booking",
    "slug": "agency-booking",
    "route": "/reports/sales/agency-booking",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "Average Daily Revenue",
    "title": "Average Daily Revenue",
    "slug": "average-daily-revenue",
    "route": "/reports/sales/average-daily-revenue",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "Booking Cancellation Income",
    "title": "Booking Cancellation Income",
    "slug": "booking-cancellation-income",
    "route": "/reports/sales/booking-cancellation-income",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "Check In Log",
    "title": "Check In Log",
    "slug": "check-in-log",
    "route": "/reports/sales/check-in-log",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "Check Out Log",
    "title": "Check Out Log",
    "slug": "check-out-log",
    "route": "/reports/sales/check-out-log",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "Complimentary And House Use Room",
    "title": "Complimentary And House Use Room",
    "slug": "complimentary-and-house-use-room",
    "route": "/reports/sales/complimentary-and-house-use-room",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "Component Wise Sales Summary",
    "title": "Component Wise Sales Summary",
    "slug": "component-wise-sales-summary",
    "route": "/reports/sales/component-wise-sales-summary",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "Cost Of Room Sold",
    "title": "Cost Of Room Sold",
    "slug": "cost-of-room-sold",
    "route": "/reports/sales/cost-of-room-sold",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "Discount And Void Transaction",
    "title": "Discount And Void Transaction",
    "slug": "discount-and-void-transaction",
    "route": "/reports/sales/discount-and-void-transaction",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "Group Block Booking",
    "title": "Group Block Booking",
    "slug": "group-block-booking",
    "route": "/reports/sales/group-block-booking",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "Guest Advance",
    "title": "Guest Advance",
    "slug": "guest-advance",
    "route": "/reports/sales/guest-advance",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "Guest Loyalty And Repeat Stay",
    "title": "Guest Loyalty And Repeat Stay",
    "slug": "guest-loyalty-and-repeat-stay",
    "route": "/reports/sales/guest-loyalty-and-repeat-stay",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "Guest Refund",
    "title": "Guest Refund",
    "slug": "guest-refund",
    "route": "/reports/sales/guest-refund",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "In House Guest",
    "title": "In House Guest",
    "slug": "in-house-guest",
    "route": "/reports/sales/in-house-guest",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "Night Audit Day Closing",
    "title": "Night Audit Day Closing",
    "slug": "night-audit-day-closing",
    "route": "/reports/sales/night-audit-day-closing",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "No Show Charge",
    "title": "No Show Charge",
    "slug": "no-show-charge",
    "route": "/reports/sales/no-show-charge",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "OTA Agency Commission",
    "title": "OTA Agency Commission",
    "slug": "ota-agency-commission",
    "route": "/reports/sales/ota-agency-commission",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "Occupancy",
    "title": "Occupancy",
    "slug": "occupancy",
    "route": "/reports/sales/occupancy",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "Payment Transaction",
    "title": "Payment Transaction",
    "slug": "payment-transaction",
    "route": "/reports/sales/payment-transaction",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "Reservation Entry Log Sales Person Wise",
    "title": "Reservation Entry Log Sales Person Wise",
    "slug": "reservation-entry-log-sales-person-wise",
    "route": "/reports/sales/reservation-entry-log-sales-person-wise",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "Reservation No History Missing Numbers",
    "title": "Reservation No History Missing Numbers",
    "slug": "reservation-no-history-missing-numbers",
    "route": "/reports/sales/reservation-no-history-missing-numbers",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "Revenue Projection",
    "title": "Revenue Projection",
    "slug": "revenue-projection",
    "route": "/reports/sales/revenue-projection",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "Room Type Rate Plan Wise Sales",
    "title": "Room Type Rate Plan Wise Sales",
    "slug": "room-type-rate-plan-wise-sales",
    "route": "/reports/sales/room-type-rate-plan-wise-sales",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "Rooms On Books Booking Pace",
    "title": "Rooms On Books Booking Pace",
    "slug": "rooms-on-books-booking-pace",
    "route": "/reports/sales/rooms-on-books-booking-pace",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "Sales",
    "title": "Sales",
    "slug": "sales",
    "route": "/reports/sales/sales",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "Shareholder Commission",
    "title": "Shareholder Commission",
    "slug": "shareholder-commission",
    "route": "/reports/sales/shareholder-commission",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "Shareholder Entitlement Usage",
    "title": "Shareholder Entitlement Usage",
    "slug": "shareholder-entitlement-usage",
    "route": "/reports/sales/shareholder-entitlement-usage",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "Source Channel Wise Booking Revenue",
    "title": "Source Channel Wise Booking Revenue",
    "slug": "source-channel-wise-booking-revenue",
    "route": "/reports/sales/source-channel-wise-booking-revenue",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "Today's Arrival List",
    "title": "Today's Arrival List",
    "slug": "todays-arrival-list",
    "route": "/reports/sales/todays-arrival-list",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "sales",
    "department": "Sales & Reservations",
    "departmentSlug": "sales",
    "name": "Today's Departure List",
    "title": "Today's Departure List",
    "slug": "todays-departure-list",
    "route": "/reports/sales/todays-departure-list",
    "exportPermission": true,
    "printPermission": true
  },
  {
    "category": "cross-module",
    "department": "Cross Module",
    "departmentSlug": "cross-module",
    "name": "Other Items Sales",
    "title": "Other Items Sales",
    "slug": "other-items-sales",
    "route": "/reports/cross-module/other-items-sales",
    "exportPermission": true,
    "printPermission": true
  }
]

const toReportCode = (index) => `RPT-${String(index + 1).padStart(3, '0')}`

export const REPORT_TEMPLATES = REPORT_TEMPLATE_DEFINITIONS.map((report, index) => {
  const reportCode = toReportCode(index)
  return {
    ...report,
    code: reportCode,
    reportCode,
  }
})

export function getReportByCode(code) {
  return REPORT_TEMPLATES.find((report) => report.code === code || report.reportCode === code) || null
}

export function getReportByRoute(departmentSlug, reportSlug) {
  return REPORT_TEMPLATES.find(
    (report) => report.departmentSlug === departmentSlug && report.slug === reportSlug
  ) || null
}

