import {
  BarChart3, BedDouble, Boxes, CalendarDays, ClipboardCheck,
  FileBarChart, Home, Hotel, Settings, ShieldCheck, Utensils, Users
} from "lucide-react"

export const NAVIGATION_REGISTRY = [
  { id:"dashboard", label:"Dashboard", path:"/dashboard", icon:Home, group:"main", roles:["SUPERUSER","ADMIN","MANAGER","FRONT_OFFICE","ACCOUNTS"] },
  { id:"front-office", label:"Front Office", path:"/front-office", icon:Hotel, group:"operations", roles:["SUPERUSER","ADMIN","MANAGER","FRONT_OFFICE"],
    children:[
      { id:"room-board", label:"Room Board", path:"/front-office" },
      { id:"check-in", label:"Check In", path:"/front-office/check-in" },
      { id:"check-out", label:"Check Out", path:"/front-office/check-out" },
      { id:"guest-folio", label:"Guest Folio", path:"/front-office/folio" },
    ] },
  { id:"reservations", label:"Reservations", path:"/reservations", icon:CalendarDays, group:"operations", roles:["SUPERUSER","ADMIN","MANAGER","FRONT_OFFICE"],
    children:[
      { id:"reservation-list", label:"Reservation List", path:"/reservations" },
      { id:"booking-calendar", label:"Booking Calendar", path:"/reservations/calendar" },
      { id:"availability", label:"Availability", path:"/reservations/availability" },
      { id:"guest-crm", label:"Guest CRM", path:"/reservations/guest-crm" },
    ] },
  { id:"housekeeping", label:"Housekeeping", path:"/housekeeping", icon:BedDouble, group:"operations", roles:["SUPERUSER","ADMIN","MANAGER","HOUSEKEEPING","FRONT_OFFICE"] },
  { id:"restaurant", label:"Restaurant POS", path:"/restaurant", icon:Utensils, group:"operations", roles:["SUPERUSER","ADMIN","MANAGER","RESTAURANT"] },
  { id:"inventory", label:"Inventory", path:"/inventory", icon:Boxes, group:"backoffice", roles:["SUPERUSER","ADMIN","MANAGER","STORE","ACCOUNTS"] },
  { id:"accounting", label:"Accounting", path:"/accounting/voucher", icon:FileBarChart, group:"backoffice", roles:["SUPERUSER","ADMIN","MANAGER","ACCOUNTS"],
    children:[
      { id:"voucher", label:"Voucher Entry", path:"/accounting/voucher" },
      { id:"chart-of-accounts", label:"Chart of Accounts", path:"/accounting/chart-of-accounts" },
      { id:"trial-balance", label:"Trial Balance", path:"/accounting/trial-balance" },
      { id:"vendor-payment", label:"Vendor Payment", path:"/accounting/vendor-payment" },
      { id:"vat-center", label:"VAT Center", path:"/vat" },
    ] },
  { id:"hr", label:"HR & Payroll", path:"/hr/employee-entry", icon:Users, group:"backoffice", roles:["SUPERUSER","ADMIN","MANAGER","HR"] },
  { id:"reports", label:"Reports", path:"/reports", icon:BarChart3, group:"analytics", roles:["SUPERUSER","ADMIN","MANAGER","ACCOUNTS","FRONT_OFFICE"],
    children:[
      { id:"reports-center", label:"Reports Center", path:"/reports" },
      { id:"accounts-reports", label:"Accounts Reports", path:"/reports/accounts/ledger" },
      { id:"inventory-reports", label:"Inventory Reports", path:"/reports/inventory/purchase" },
      { id:"sales-reports", label:"Sales Reports", path:"/reports/sales/occupancy" },
    ] },
  { id:"tasks", label:"Tasks & Approvals", path:"/tasks", icon:ClipboardCheck, group:"analytics", roles:["SUPERUSER","ADMIN","MANAGER","ACCOUNTS","FRONT_OFFICE"] },
  { id:"users", label:"Users & Roles", path:"/settings/users", icon:ShieldCheck, group:"system", roles:["SUPERUSER","ADMIN"] },
  { id:"settings", label:"Settings", path:"/settings", icon:Settings, group:"system", roles:["SUPERUSER","ADMIN","MANAGER"] },
]

export const NAV_GROUP_LABELS = {
  main:"Main",
  operations:"Operations",
  backoffice:"Back Office",
  analytics:"Analytics",
  system:"System",
}
