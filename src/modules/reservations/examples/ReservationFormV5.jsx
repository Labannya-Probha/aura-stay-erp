import { AedsFormEngine } from "../../../components/form-engine"

const steps = [
  { id: "guest", title: "Guest", description: "Guest and contact details" },
  { id: "stay", title: "Stay", description: "Room, date and occupancy" },
  { id: "billing", title: "Billing", description: "Rate, payment and notes" },
]

const sections = [
  {
    id: "guest-info",
    stepId: "guest",
    title: "Guest Information",
    description: "Primary guest and contact profile.",
    fields: [
      { name: "guest_name", label: "Guest Name", required: true, span: 6 },
      { name: "mobile", label: "Mobile", required: true, span: 3 },
      { name: "email", label: "Email", type: "email", span: 3 },
      { name: "nid_passport", label: "NID / Passport", span: 4 },
      { name: "guest_type", label: "Guest Type", type: "select", span: 4, options: ["Walk-in", "Corporate", "OTA", "Agent"] },
      { name: "address", label: "Address", type: "textarea", span: 12 },
    ],
  },
  {
    id: "stay-info",
    stepId: "stay",
    title: "Stay Information",
    description: "Reservation date, room and occupancy details.",
    fields: [
      { name: "check_in", label: "Check In", type: "date", required: true, span: 3 },
      { name: "check_out", label: "Check Out", type: "date", required: true, span: 3 },
      { name: "room_type", label: "Room Type", type: "select", required: true, span: 3, options: ["Deluxe", "Family", "Suite", "Premium Suite"] },
      { name: "room_no", label: "Room No", span: 3 },
      { name: "adults", label: "Adults", type: "number", defaultValue: 2, span: 3 },
      { name: "children", label: "Children", type: "number", defaultValue: 0, span: 3 },
      { name: "source", label: "Booking Source", type: "select", span: 3, options: ["Direct", "Facebook", "Booking.com", "Agoda", "Corporate"] },
      { name: "status", label: "Status", type: "select", span: 3, options: ["Tentative", "Confirmed", "Checked In"] },
    ],
  },
  {
    id: "billing-info",
    stepId: "billing",
    title: "Billing & Notes",
    description: "Rate, advance and internal notes.",
    fields: [
      { name: "rate", label: "Room Rate", type: "number", required: true, span: 3 },
      { name: "discount", label: "Discount", type: "number", defaultValue: 0, span: 3 },
      { name: "advance", label: "Advance Paid", type: "number", defaultValue: 0, span: 3 },
      { name: "payment_method", label: "Payment Method", type: "select", span: 3, options: ["Cash", "Card", "bKash", "Bank"] },
      { name: "remarks", label: "Remarks", type: "textarea", span: 12 },
    ],
  },
]

export default function ReservationFormV5() {
  return (
    <AedsFormEngine
      moduleName="Reservations"
      title="New Reservation"
      subtitle="AEDS v5 enterprise wizard form for creating hotel reservations."
      steps={steps}
      sections={sections}
      onSubmit={(values) => console.log(values)}
    />
  )
}
