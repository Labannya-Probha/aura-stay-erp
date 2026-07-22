import { useEffect, useState } from 'react'
import ReservationPaymentReceipt from '../components/print/ReservationPaymentReceipt.jsx'
import { getCompanySettingsQuery } from '../lib/companySettings'

const samplePayment = {
  id: 'preview-1',
  payment_id: 'MR-20260714-0012',
  reservation_id: 'RES-DEMO-2026-00000003',
  received_date: '2026-07-14',
  amount: 5245,
  method: 'CARD',
  reference: 'MR-20260714-0012|Reservation Folio Payment',
  received_by: 'Demo Superuser',
  payment_class: 'REGULAR',
  balance_due: 0,
  reservations: {
    res_no: 'RES-DEMO-2026-00000003',
    reservation_name: 'Nirvik',
    check_in: '2026-07-12',
    check_out: '2026-07-14',
    balance: 0,
    reservation_rooms: [{ rooms: { room_no: '201' } }],
    guests: {
      full_name: 'Nirvik',
      phone: '01XXXXXXXXX',
    },
  },
}

export default function PreviewReservationPaymentReceipt() {
  const [company, setCompany] = useState(null)

  useEffect(() => {
    let alive = true

    const loadCompany = async () => {
      const { data } = await getCompanySettingsQuery(
        'tenant_id,name,legal_name,property_name,address,phone,email,bin,logo_url,software_name,primary_color,accent_color,secondary_color,company_name:name,tenant_name:property_name,tin:bin',
      )
        .limit(1)
        .maybeSingle()

      if (!alive) return
      if (!data) return
      setCompany(data)
    }

    loadCompany()
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#f5f6f8] py-6 px-2 sm:px-4">
      <div className="mx-auto max-w-[920px]">
        <div className="mb-3 text-sm text-pine/70 font-semibold">
          Reservation Payment Receipt Preview
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-2 sm:p-4">
          <ReservationPaymentReceipt
            payment={samplePayment}
            company={company || { software_name: 'Enterprise Management System' }}
          />
        </div>
      </div>
    </div>
  )
}
