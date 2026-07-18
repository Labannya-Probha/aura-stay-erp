import { useEffect, useState } from 'react'
import ReservationPaymentReceipt from '../components/print/ReservationPaymentReceipt.jsx'
import { getCompanySettingsQuery } from '../lib/companySettings'

const samplePayment = {
  id: 'preview-1',
  payment_id: 'MR-2026-00000001',
  reservation_id: 'RES-001',
  received_date: '2026-07-18',
  amount: 12000,
  method: 'CASH',
  reference: 'MR-2026-00000001|General Collection',
  received_by: 'Accounts User',
  paid_by_party: 'Member / Donor Collection',
  payment_class: 'SETTLEMENT',
  reservations: {
    res_no: 'RES-2026-000021',
    reservation_name: 'Member / Donor Name',
    guests: {
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
        'tenant_id,tenant_name,name,company_name,address,phone,email,tin,bin,logo_url,software_name,primary_color,accent_color,secondary_color'
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
        <div className="mb-3 text-sm text-pine/70 font-semibold">Reservation Payment Receipt Preview</div>
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
