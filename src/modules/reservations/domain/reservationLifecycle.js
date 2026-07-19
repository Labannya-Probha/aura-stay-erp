export const RESERVATION_STATUS = Object.freeze({
  DRAFT: "DRAFT",
  HOLD: "HOLD",
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  GUARANTEED: "GUARANTEED",
  CHECKED_IN: "CHECKED_IN",
  CHECKED_OUT: "CHECKED_OUT",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
})

const TERMINAL_STATUSES = new Set([
  RESERVATION_STATUS.CHECKED_OUT,
  RESERVATION_STATUS.CANCELLED,
  RESERVATION_STATUS.NO_SHOW,
])

const ALLOWED_TRANSITIONS = Object.freeze({
  [RESERVATION_STATUS.DRAFT]: [
    RESERVATION_STATUS.HOLD,
    RESERVATION_STATUS.PENDING,
    RESERVATION_STATUS.CONFIRMED,
    RESERVATION_STATUS.CANCELLED,
  ],
  [RESERVATION_STATUS.HOLD]: [
    RESERVATION_STATUS.PENDING,
    RESERVATION_STATUS.CONFIRMED,
    RESERVATION_STATUS.CANCELLED,
  ],
  [RESERVATION_STATUS.PENDING]: [
    RESERVATION_STATUS.HOLD,
    RESERVATION_STATUS.CONFIRMED,
    RESERVATION_STATUS.GUARANTEED,
    RESERVATION_STATUS.CANCELLED,
    RESERVATION_STATUS.NO_SHOW,
  ],
  [RESERVATION_STATUS.CONFIRMED]: [
    RESERVATION_STATUS.GUARANTEED,
    RESERVATION_STATUS.CHECKED_IN,
    RESERVATION_STATUS.CANCELLED,
    RESERVATION_STATUS.NO_SHOW,
  ],
  [RESERVATION_STATUS.GUARANTEED]: [
    RESERVATION_STATUS.CHECKED_IN,
    RESERVATION_STATUS.CANCELLED,
    RESERVATION_STATUS.NO_SHOW,
  ],
  [RESERVATION_STATUS.CHECKED_IN]: [
    RESERVATION_STATUS.CHECKED_OUT,
  ],
  [RESERVATION_STATUS.CHECKED_OUT]: [],
  [RESERVATION_STATUS.CANCELLED]: [],
  [RESERVATION_STATUS.NO_SHOW]: [],
})

export function normalizeReservationStatus(status) {
  const normalized = String(status || RESERVATION_STATUS.PENDING)
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_")

  return RESERVATION_STATUS[normalized] || normalized
}

export function isTerminalReservationStatus(status) {
  return TERMINAL_STATUSES.has(normalizeReservationStatus(status))
}

export function getAllowedReservationTransitions(status) {
  return [...(ALLOWED_TRANSITIONS[normalizeReservationStatus(status)] || [])]
}

export function canTransitionReservation(fromStatus, toStatus) {
  const from = normalizeReservationStatus(fromStatus)
  const to = normalizeReservationStatus(toStatus)

  if (from === to) return true
  return getAllowedReservationTransitions(from).includes(to)
}

export function assertReservationTransition(fromStatus, toStatus) {
  if (!canTransitionReservation(fromStatus, toStatus)) {
    throw new Error(
      `Reservation cannot move from ${normalizeReservationStatus(fromStatus)} to ${normalizeReservationStatus(toStatus)}.`
    )
  }

  return normalizeReservationStatus(toStatus)
}
