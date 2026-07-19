export const COMMANDS = [
  { id: "dashboard", title: "Open Dashboard", group: "Navigation", path: "/dashboard", keywords: ["home", "kpi", "overview"] },
  { id: "new-reservation", title: "New Reservation", group: "Reservations", path: "/reservations?tab=new", keywords: ["booking", "guest", "new"] },
  { id: "booking-calendar", title: "Booking Calendar", group: "Reservations", path: "/reservations?tab=calendar", keywords: ["calendar", "availability", "room"] },
  { id: "front-office", title: "Front Office", group: "Operations", path: "/front-office", keywords: ["arrival", "departure", "in-house"] },
  { id: "guest-folio", title: "Guest Folio", group: "Front Office", path: "/front-office?tab=guest-folio", keywords: ["folio", "bill", "guest"] },
  { id: "restaurant-pos", title: "Restaurant POS", group: "Restaurant", path: "/restaurant?tab=pos", keywords: ["pos", "kot", "restaurant"] },
  { id: "inventory", title: "Inventory", group: "Inventory", path: "/inventory", keywords: ["stock", "purchase", "store"] },
  { id: "voucher", title: "Voucher Entry", group: "Accounting", path: "/accounting/voucher", keywords: ["accounts", "journal", "payment"] },
  { id: "reports", title: "Reports Center", group: "Reports", path: "/reports", keywords: ["report", "analytics", "statement"] }
]
