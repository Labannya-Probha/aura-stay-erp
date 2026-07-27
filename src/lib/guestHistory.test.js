import { describe, expect, it } from 'vitest'
import { summarizeGuestHistory } from './guestHistory'

describe('summarizeGuestHistory', () => {
  it('derives stay totals, spend, last stay, and active stays from reservations and charges', () => {
    const reservations = [
      {
        id: 'r1',
        res_no: 'R-100',
        check_in: '2025-01-10',
        check_out: '2025-01-12',
        status: 'CHECKED_OUT',
      },
      {
        id: 'r2',
        res_no: 'R-101',
        check_in: '2025-02-01',
        check_out: '2025-02-03',
        status: 'CHECKED_IN',
      },
    ]

    const charges = [
      { reservation_id: 'r1', total: 100 },
      { reservation_id: 'r1', total: 50 },
      { reservation_id: 'r2', total: 200 },
    ]

    const summary = summarizeGuestHistory(reservations, charges)

    expect(summary.booking_count).toBe(2)
    expect(summary.total_spend).toBe(350)
    expect(summary.last_stay_date).toBe('2025-02-01')
    expect(summary.active_stays).toBe(1)
    expect(summary.reservations).toHaveLength(2)
  })
})
