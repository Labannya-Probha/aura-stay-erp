import { describe, expect, it } from 'vitest'

import { buildCheckoutBillPayload } from '../checkoutPrint.utils'

describe('buildCheckoutBillPayload', () => {
  it('builds totals, paid, and due from charges and payments', () => {
    const payload = buildCheckoutBillPayload({
      reservation: {
        reservationId: 42,
        reservationNo: 'R-100',
        guestName: 'Alice',
        balance: 150,
        checkIn: '2026-01-01',
        checkOut: '2026-01-03',
      },
      charges: [
        {
          charge_date: '2026-01-01',
          charge_type: 'ROOM',
          description: 'Room charge',
          base_amount: 100,
          discount: 0,
          service_charge: 0,
          vat: 0,
          total: 100,
        },
        {
          charge_date: '2026-01-02',
          charge_type: 'F&B',
          description: 'Dinner',
          base_amount: 50,
          discount: 0,
          service_charge: 0,
          vat: 0,
          total: 50,
        },
      ],
      payments: [{ amount: 0 }],
      company: { name: 'AURA STAY' },
      guest: { full_name: 'Alice', phone: '123456' },
      issuedAt: '2026-01-03T10:00:00.000Z',
    })

    expect(payload.totals.base).toBe(150)
    expect(payload.totals.grand_total).toBe(150)
    expect(payload.paid).toBe(0)
    expect(payload.due).toBe(150)
    expect(payload.res.res_no).toBe('R-100')
    expect(payload.guest.full_name).toBe('Alice')
  })

  it('uses an explicit invoice number for reprints', () => {
    const payload = buildCheckoutBillPayload({
      reservation: { reservationId: 42, reservationNo: 'R-100' },
      charges: [{ total: 100 }],
      payments: [{ amount: 100 }],
      invoiceNo: 'INV-1001',
    })

    expect(payload.invoiceData.invoice_no).toBe('INV-1001')
  })
})
