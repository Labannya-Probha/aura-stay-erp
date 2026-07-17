export const reservationListColumns = [
  {
    accessorKey: "reservationNo",
    header: "Reservation No.",
    width: 180,
  },
  {
    accessorKey: "guestName",
    header: "Guest Name",
    width: 240,
  },
  {
    accessorKey: "customerId",
    header: "Customer ID",
    width: 150,
  },
  {
    accessorKey: "mobile",
    header: "Mobile",
    width: 160,
  },
  {
    accessorKey: "checkIn",
    header: "Check In",
    type: "date",
    width: 150,
  },
  {
    accessorKey: "checkOut",
    header: "Check Out",
    type: "date",
    width: 150,
  },
  {
    accessorKey: "nights",
    header: "Nights",
    type: "number",
    width: 100,
  },
  {
    accessorKey: "roomNumber",
    header: "Room Number / Type",
    width: 240,
  },
  {
    accessorKey: "roomCount",
    header: "Rooms",
    type: "number",
    width: 100,
  },
  {
    accessorKey: "pax",
    header: "Pax",
    type: "number",
    width: 90,
  },
  {
    accessorKey: "source",
    header: "Source",
    width: 140,
  },
  {
    accessorKey: "status",
    header: "Status",
    type: "status",
    width: 150,
  },
  {
    accessorKey: "totalAmount",
    header: "Total",
    type: "currency",
    aggregation: "sum",
    width: 160,
  },
  {
    accessorKey: "paidAmount",
    header: "Paid",
    type: "currency",
    aggregation: "sum",
    width: 160,
  },
  {
    accessorKey: "dueAmount",
    header: "Due",
    type: "currency",
    aggregation: "sum",
    width: 160,
  },
]
