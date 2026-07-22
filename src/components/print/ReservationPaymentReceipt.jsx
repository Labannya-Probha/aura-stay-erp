import { fmtBDT } from '../../lib/helpers'
import { parsePaymentReference } from '../../lib/paymentNumber'
import { getCompanyLogo, getCompanyName } from '../../theme/branding.service'

const DEFAULT_ADDRESS = 'Bishamoni, Radhanagar, Sreemangal, Moulvibazar'

function pickLogo(company) {
  return getCompanyLogo(company)
}

function makeInitials(text) {
  const words = String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!words.length) return 'CO'
  return words
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
}

function formatReceiptDate(value) {
  if (!value) return '---'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '---'
  const day = String(date.getDate()).padStart(2, '0')
  const month = date.toLocaleDateString('en-GB', { month: 'short' })
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

function normalizeReceiptNo(paymentNo, receivedDate, fallbackId) {
  if (/^MR-\d{8}-\d{4}$/.test(String(paymentNo || ''))) return String(paymentNo)
  const dt = receivedDate ? new Date(receivedDate) : new Date()
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const d = String(dt.getDate()).padStart(2, '0')
  const raw = String(paymentNo || fallbackId || '').replace(/\D/g, '')
  const serial = String(raw.slice(-4) || '0001').padStart(4, '0')
  return `MR-${y}${m}${d}-${serial}`
}

function toFieldRows(labelValuePairs) {
  return labelValuePairs.map(([label, value]) => ({
    label,
    value: value || '---',
  }))
}

function amountInWords(value) {
  const amount = Number(value || 0)
  if (!amount) return 'Zero BDT only'

  const small = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ]
  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ]

  const underThousand = (n) => {
    let out = ''
    if (n >= 100) {
      out += `${small[Math.floor(n / 100)]} Hundred`
      n %= 100
      if (n) out += ' '
    }
    if (n >= 20) {
      out += tens[Math.floor(n / 10)]
      if (n % 10) out += ` ${small[n % 10]}`
    } else if (n > 0) {
      out += small[n]
    }
    return out.trim()
  }

  const toIndianWords = (n) => {
    if (n === 0) return 'Zero'
    const parts = []
    const crore = Math.floor(n / 10000000)
    const lakh = Math.floor((n % 10000000) / 100000)
    const thousand = Math.floor((n % 100000) / 1000)
    const rest = n % 1000

    if (crore) parts.push(`${underThousand(crore)} Crore`)
    if (lakh) parts.push(`${underThousand(lakh)} Lakh`)
    if (thousand) parts.push(`${underThousand(thousand)} Thousand`)
    if (rest) parts.push(underThousand(rest))
    return parts.join(' ').trim()
  }

  const taka = Math.floor(amount)
  const poisha = Math.round((amount - taka) * 100)
  if (poisha > 0) return `${toIndianWords(taka)} BDT and ${toIndianWords(poisha)} Poisha only`
  return `${toIndianWords(taka)} BDT only`
}

function OfficeCopy({ payment, company }) {
  const parsed = parsePaymentReference(payment?.reference)
  const paymentNoRaw = parsed.paymentNo || payment?.payment_id || payment?.id || 'N/A'
  const receiptNo = normalizeReceiptNo(paymentNoRaw, payment?.received_date, payment?.id)
  const reservationNo = payment?.reservations?.res_no || '---'
  const reservationName =
    payment?.reservations?.reservation_name || payment?.reservations?.guests?.full_name || '---'
  const roomNo =
    (payment?.reservations?.reservation_rooms || [])
      .map((r) => r?.rooms?.room_no)
      .filter(Boolean)
      .join(', ') || '---'
  const amount = Number(payment?.amount || 0)
  const amountWords = amountInWords(amount)
  const balanceDue = Number(
    payment?.balance_due ?? payment?.due_amount ?? payment?.reservations?.balance ?? 0,
  )
  const statusText = balanceDue > 0 ? 'Balance Due' : 'Paid in Full'
  const paymentMode = payment?.method || 'CARD'

  const orgName = company?.company_name || getCompanyName(company) || 'Company'
  const logo = pickLogo(company)
  const initials = makeInitials(orgName)
  const companyAddress = company?.address || DEFAULT_ADDRESS
  const paymentClass = payment?.payment_class || 'REGULAR'
  const receivedBy = payment?.received_by || 'Demo Superuser'

  const guestRows = toFieldRows([
    ['Guest Name', reservationName],
    ['Reservation ID', reservationNo],
    ['Folio No', reservationNo],
    ['Room No', roomNo],
    ['Check-In', formatReceiptDate(payment?.reservations?.check_in)],
    ['Check-Out', formatReceiptDate(payment?.reservations?.check_out)],
  ])

  const receiptRows = toFieldRows([
    ['Receipt No', receiptNo],
    ['Date', formatReceiptDate(payment?.received_date)],
    ['Received By', receivedBy],
    ['Payment Class', paymentClass],
  ])

  return (
    <section className="mx-auto w-full max-w-[840px] border-2 border-pine bg-white p-4 text-[12px] text-slate-900 print:max-w-none print:p-2">
      <header className="grid grid-cols-[72px_1fr_auto] items-center gap-3 border border-pine p-3">
        <div className="grid h-[64px] w-[64px] place-items-center overflow-hidden border border-pine bg-white">
          {logo ? (
            <img src={logo} alt={`${orgName} logo`} className="h-full w-full object-contain p-1" />
          ) : (
            <span className="text-lg font-black text-pine">{initials}</span>
          )}
        </div>
        <div>
          <h1 className="text-xl font-black uppercase tracking-wide text-pine">{orgName}</h1>
          <p className="text-[11px] text-slate-700">{companyAddress}</p>
          <p className="text-[11px] text-slate-700">
            Phone: {company?.phone || '---'} | Email: {company?.email || '---'}
          </p>
          <p className="font-mono text-[11px] text-slate-700">
            BIN/TIN: {company?.tin || company?.bin || '---'}
          </p>
        </div>
        <div className="text-right">
          <div className="inline-flex border border-amber-600 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold text-pine">
            OFFICE COPY
          </div>
          <div className="mt-1 text-[24px] font-black tracking-[0.12em] text-pine">
            MONEY RECEIPT
          </div>
          <div className="text-[10px] text-slate-500">English Copy</div>
        </div>
      </header>

      <div className="mt-3 grid gap-3 border border-pine p-3 md:grid-cols-2">
        <div className="space-y-1.5">
          {guestRows.map((row) => (
            <div key={row.label} className="grid grid-cols-[130px_1fr] items-baseline gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-500">
                {row.label}
              </span>
              <span className="font-semibold text-slate-900">{row.value}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          {receiptRows.map((row) => (
            <div key={row.label} className="grid grid-cols-[130px_1fr] items-baseline gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-500">
                {row.label}
              </span>
              <span className="font-semibold text-slate-900">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 overflow-hidden border border-pine">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-amber-50 text-pine">
              <th className="border-b border-r border-pine px-2 py-1.5 text-left font-bold">
                Description
              </th>
              <th className="border-b border-r border-pine px-2 py-1.5 text-left font-bold">
                Payment Mode
              </th>
              <th className="border-b border-pine px-2 py-1.5 text-right font-bold">
                Amount (BDT)
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-r border-pine px-2 py-1.5">Reservation Folio Payment</td>
              <td className="border-r border-pine px-2 py-1.5">{paymentMode}</td>
              <td className="px-2 py-1.5 text-right font-mono font-bold">{fmtBDT(amount)}</td>
            </tr>
            <tr>
              <td
                colSpan={2}
                className="border-t border-pine px-2 py-1.5 text-right font-extrabold text-pine"
              >
                TOTAL RECEIVED
              </td>
              <td className="border-t border-pine px-2 py-1.5 text-right font-mono text-[13px] font-black text-pine">
                {fmtBDT(amount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-3 space-y-1 border border-pine p-3 text-[12px]">
        <p>
          <span className="font-bold">Amount in Words:</span> {amountWords}
        </p>
        <p>
          <span className="font-bold">Balance Due:</span>{' '}
          <span className="font-mono font-semibold">{fmtBDT(balanceDue)}</span>
        </p>
        <p>
          <span className="font-bold">Status:</span>{' '}
          <span className="inline-flex border border-amber-600 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-pine">
            {statusText}
          </span>
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-6 border border-pine p-3">
        <div className="pt-5 text-center">
          <div className="border-t border-pine" />
          <p className="mt-1 font-semibold">Received By</p>
          <p className="text-[11px] text-slate-500">{receivedBy}</p>
        </div>
        <div className="pt-5 text-center">
          <div className="border-t border-pine" />
          <p className="mt-1 font-semibold">Guest Signature</p>
          <p className="text-[11px] text-slate-500">{reservationName}</p>
        </div>
      </div>
    </section>
  )
}

export default function ReservationPaymentReceipt({ payment, company }) {
  if (!payment) return null

  return (
    <div
      className="print-doc mx-auto w-full text-slate-900"
      style={{ fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif" }}
    >
      <OfficeCopy payment={payment} company={company} />
    </div>
  )
}
