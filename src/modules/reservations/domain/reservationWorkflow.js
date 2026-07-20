import {
  RESERVATION_STATUS,
  assertReservationTransition,
  normalizeReservationStatus,
} from "./reservationLifecycle"

export const RESERVATION_ACTION = Object.freeze({
  PLACE_ON_HOLD: "PLACE_ON_HOLD",
  CONFIRM: "CONFIRM",
  GUARANTEE: "GUARANTEE",
  CHECK_IN: "CHECK_IN",
  CHECK_OUT: "CHECK_OUT",
  CANCEL: "CANCEL",
  NO_SHOW: "NO_SHOW",
  REINSTATE: "REINSTATE",
  MODIFY_DATES: "MODIFY_DATES",
  CHANGE_ROOM: "CHANGE_ROOM",
  EXTEND_STAY: "EXTEND_STAY",
  EARLY_DEPARTURE: "EARLY_DEPARTURE",
})

export const APPROVAL_TYPE = Object.freeze({
  RATE_OVERRIDE: "RATE_OVERRIDE",
  DISCOUNT: "DISCOUNT",
  COMPLIMENTARY_STAY: "COMPLIMENTARY_STAY",
  ROOM_UPGRADE: "ROOM_UPGRADE",
  LATE_CHECKOUT: "LATE_CHECKOUT",
})

const ACTION_STATUS_MAP = Object.freeze({
  [RESERVATION_ACTION.PLACE_ON_HOLD]: RESERVATION_STATUS.HOLD,
  [RESERVATION_ACTION.CONFIRM]: RESERVATION_STATUS.CONFIRMED,
  [RESERVATION_ACTION.GUARANTEE]: RESERVATION_STATUS.GUARANTEED,
  [RESERVATION_ACTION.CHECK_IN]: RESERVATION_STATUS.CHECKED_IN,
  [RESERVATION_ACTION.CHECK_OUT]: RESERVATION_STATUS.CHECKED_OUT,
  [RESERVATION_ACTION.CANCEL]: RESERVATION_STATUS.CANCELLED,
  [RESERVATION_ACTION.NO_SHOW]: RESERVATION_STATUS.NO_SHOW,
})

export function resolveWorkflowTargetStatus(action, currentStatus) {
  const current = normalizeReservationStatus(currentStatus)
  if (action === RESERVATION_ACTION.REINSTATE) {
    if (![RESERVATION_STATUS.CANCELLED, RESERVATION_STATUS.NO_SHOW].includes(current)) {
      throw new Error("Only cancelled or no-show reservations can be reinstated.")
    }
    return RESERVATION_STATUS.CONFIRMED
  }

  const target = ACTION_STATUS_MAP[action]
  if (!target) return current
  return assertReservationTransition(current, target)
}

export function requiresApproval(type, context = {}) {
  switch (type) {
    case APPROVAL_TYPE.RATE_OVERRIDE:
      return Number(context.overridePercent || 0) !== 0
    case APPROVAL_TYPE.DISCOUNT:
      return Number(context.discountPercent || 0) > Number(context.allowedDiscountPercent || 0)
    case APPROVAL_TYPE.COMPLIMENTARY_STAY:
      return true
    case APPROVAL_TYPE.ROOM_UPGRADE:
      return Boolean(context.isComplimentaryUpgrade)
    case APPROVAL_TYPE.LATE_CHECKOUT:
      return Number(context.minutesAfterPolicy || 0) > Number(context.graceMinutes || 0)
    default:
      return false
  }
}

export function buildAmendmentSnapshot(reservation = {}) {
  return {
    check_in: reservation.check_in || null,
    check_out: reservation.check_out || null,
    status: normalizeReservationStatus(reservation.status),
    room_type_id: reservation.room_type_id || null,
    rate_plan_id: reservation.rate_plan_id || null,
    adults: Number(reservation.pax_adults || reservation.adults || 0),
    children: Number(reservation.pax_children || reservation.children || 0),
    total_amount: Number(reservation.total_amount || 0),
    notes: reservation.notes || null,
  }
}

export function diffReservationSnapshot(before = {}, after = {}) {
  return Object.keys({ ...before, ...after }).reduce((changes, key) => {
    const previous = before[key] ?? null
    const next = after[key] ?? null
    if (JSON.stringify(previous) !== JSON.stringify(next)) {
      changes[key] = { before: previous, after: next }
    }
    return changes
  }, {})
}
