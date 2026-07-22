const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function toDateOnly(value) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function calculateReservationNights(checkIn, checkOut) {
  const start = toDateOnly(checkIn)
  const end = toDateOnly(checkOut)
  if (!start || !end) return 0

  const difference = end.getTime() - start.getTime()
  return difference > 0 ? Math.round(difference / 86_400_000) : 0
}

export function normalizeReservationPayload(input = {}) {
  return {
    reservationName: String(input.reservationName || input.reservation_name || "").trim(),
    guestName: String(input.guestName || input.guest_name || "").trim(),
    phone: String(input.phone || "").trim(),
    email: String(input.email || "").trim().toLowerCase(),
    checkIn: input.checkIn || input.check_in || "",
    checkOut: input.checkOut || input.check_out || "",
    adults: Math.max(1, Number(input.adults ?? input.pax_adults ?? 1) || 1),
    children: Math.max(0, Number(input.children ?? input.pax_children ?? 0) || 0),
    source: String(input.source || "Direct").trim() || "Direct",
    notes: String(input.notes || "").trim(),
    guestType: String(input.guestType || input.guest_type || "Individual").trim(),
    salutation: String(input.salutation || "").trim(),
  }
}

export function validateReservationPayload(input = {}) {
  const payload = normalizeReservationPayload(input)
  const errors = {}

  if (!payload.reservationName) errors.reservationName = "Reservation name is required."
  if (!payload.guestName) errors.guestName = "Guest name is required."
  if (!payload.checkIn) errors.checkIn = "Check-in date is required."
  if (!payload.checkOut) errors.checkOut = "Check-out date is required."

  if (payload.email && !EMAIL_PATTERN.test(payload.email)) {
    errors.email = "Enter a valid email address."
  }

  if (payload.checkIn && payload.checkOut && calculateReservationNights(payload.checkIn, payload.checkOut) < 1) {
    errors.checkOut = "Check-out must be after check-in."
  }

  if (payload.adults < 1) errors.adults = "At least one adult is required."
  if (payload.children < 0) errors.children = "Children cannot be negative."

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    payload,
    nights: calculateReservationNights(payload.checkIn, payload.checkOut),
  }
}
