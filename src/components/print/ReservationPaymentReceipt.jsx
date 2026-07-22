import { fmtBDT, fmtDate } from '../../lib/helpers'
import { parsePaymentReference } from '../../lib/paymentNumber'
import { getCompanyLogo, getCompanyName, getTenantDisplayName } from '../../theme/branding.service'

const PINE = 'var(--print-primary, #1B4D2E)'
const ACCENT = 'var(--print-accent, #2E7D32)'
const GOLD = '#D4A017'
const LINE = 'var(--print-line, rgba(27,77,46,0.22))'
const MUTE = 'var(--print-muted, #6b7280)'
const INK = 'var(--print-ink, #111827)'
const CREAM = '#F7F4EC'

const labelStyle = {
  color: MUTE,
  fontSize: 9,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const valueStyle = {
  color: INK,
  fontSize: 10,
  fontWeight: 700,
}

const moneyStyle = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: 'tnum',
  fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
}

function row(label, value) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 6, alignItems: 'baseline' }}>
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{value || '---'}</span>
    </div>
  )
}

function buildVerifyUrl(paymentNo) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/verify/payment/${encodeURIComponent(paymentNo || 'unknown')}`
}

function qrUrl(value) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=110x110&margin=1&data=${encodeURIComponent(value || '')}`
}

function pickLogo(company) {
  return getCompanyLogo(company)
}

function makeInitials(text) {
  const words = String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!words.length) return 'CO'
  return words.slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('')
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

function amountInWords(value) {
  const amount = Number(value || 0)
  if (!amount) return 'Zero BDT only'

  const small = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

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

function ReceiptCopy({ payment, company, copyLabel }) {
  const parsed = parsePaymentReference(payment?.reference)
  const paymentNoRaw = parsed.paymentNo || payment?.payment_id || payment?.id || 'N/A'
  const receiptNo = normalizeReceiptNo(paymentNoRaw, payment?.received_date, payment?.id)
  const ref = parsed.reference || '---'
  const reservationNo = payment?.reservations?.res_no || '---'
  const reservationName = payment?.reservations?.reservation_name || payment?.reservations?.guests?.full_name || '---'
  const verifyUrl = buildVerifyUrl(receiptNo)
  const roomNo = (payment?.reservations?.reservation_rooms || [])
    .map((r) => r?.rooms?.room_no)
    .filter(Boolean)
    .join(', ') || '---'
  const amount = Number(payment?.amount || 0)
  const amountWords = amountInWords(amount)
  const balanceDue = Number(payment?.balance_due ?? payment?.due_amount ?? payment?.reservations?.balance ?? 0)
  const statusText = balanceDue > 0 ? 'Balance Due' : 'Paid in Full'

  const orgName = company?.company_name || getCompanyName(company) || 'Company'
  const tenantName = getTenantDisplayName(company) || 'Tenant'
  const orgTagline = company?.software_name || tenantName
  const logo = pickLogo(company)
  const initials = makeInitials(orgName)
  const resortAddress = company?.address || 'Bishamoni, Radhanagar, Sreemangal, Moulvibazar'

  return (
    <section className="print-copy" style={{ border: `1px solid ${PINE}`, padding: 10, position: 'relative', background: '#fff' }}>
      <header style={{ border: `1px solid ${PINE}`, padding: 8, marginBottom: 8, display: 'grid', gridTemplateColumns: '72px 1fr auto', gap: 8, alignItems: 'center' }}>
        <div style={{ width: 64, height: 64, border: `1px solid ${PINE}`, display: 'grid', placeItems: 'center', overflow: 'hidden', background: '#fff' }}>
            {logo ? (
              <img src={logo} alt={`${orgName} logo`} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
            ) : (
              <div style={{ fontWeight: 900, color: PINE, fontSize: 18 }}>{initials}</div>
            )}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: PINE, lineHeight: 1.1, textTransform: 'uppercase' }}>{orgName}</div>
          <div style={{ color: INK, fontSize: 10 }}>{resortAddress}</div>
          <div style={{ color: INK, fontSize: 10 }}>Phone: {company?.phone || '---'} | Email: {company?.email || '---'}</div>
          <div style={{ color: INK, fontSize: 10 }}>BIN/TIN: <span style={moneyStyle}>{company?.tin || company?.bin || '---'}</span></div>
          <div style={{ color: MUTE, fontSize: 9 }}>{orgTagline}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'inline-block', border: `1px solid ${GOLD}`, background: CREAM, padding: '2px 8px', fontSize: 9, fontWeight: 800, color: PINE, marginBottom: 4 }}>
            {copyLabel}
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '0.08em', color: PINE }}>MONEY RECEIPT</div>
          <div style={{ fontSize: 9, color: MUTE }}>English Copy</div>
        </div>
      </header>

      <div style={{ border: `1px solid ${PINE}`, marginBottom: 8, padding: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ display: 'grid', gap: 4, fontSize: 10 }}>
          {row('Guest Name', reservationName)}
          {row('Reservation ID', reservationNo)}
          {row('Folio No.', reservationNo)}
          {row('Room No.', roomNo)}
          {row('Check-in', formatReceiptDate(payment?.reservations?.check_in))}
          {row('Check-out', formatReceiptDate(payment?.reservations?.check_out))}
        </div>
        <div style={{ display: 'grid', gap: 4, fontSize: 10 }}>
          {row('Receipt No.', <span style={moneyStyle}>{receiptNo}</span>)}
          {row('Date', <span style={moneyStyle}>{formatReceiptDate(payment?.received_date)}</span>)}
          {row('Received By', payment?.received_by || 'Accounts User')}
          {row('Payment Class', payment?.payment_class || 'SETTLEMENT')}
        </div>
      </div>

      <div style={{ border: `1px solid ${PINE}`, marginBottom: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: `1px solid ${PINE}`, borderRight: `1px solid ${PINE}`, color: PINE, background: CREAM }}>Description</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: `1px solid ${PINE}`, borderRight: `1px solid ${PINE}`, color: PINE, background: CREAM }}>Payment Mode</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: `1px solid ${PINE}`, borderRight: `1px solid ${PINE}`, color: PINE, background: CREAM }}>Reference No.</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', borderBottom: `1px solid ${PINE}`, color: PINE, background: CREAM }}>Amount (BDT)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '6px 8px', borderRight: `1px solid ${PINE}` }}>Reservation Folio Payment</td>
              <td style={{ padding: '6px 8px', borderRight: `1px solid ${PINE}` }}>{payment?.method || '---'}</td>
              <td style={{ ...moneyStyle, padding: '6px 8px', borderRight: `1px solid ${PINE}` }}>{ref}</td>
              <td style={{ ...moneyStyle, textAlign: 'right', padding: '6px 8px', fontWeight: 700 }}>{fmtBDT(amount)}</td>
            </tr>
            <tr>
              <td colSpan={3} style={{ padding: '7px 8px', borderTop: `1px solid ${PINE}`, textAlign: 'right', fontWeight: 800, color: PINE }}>TOTAL RECEIVED</td>
              <td style={{ ...moneyStyle, padding: '7px 8px', borderTop: `1px solid ${PINE}`, textAlign: 'right', fontWeight: 900, color: PINE }}>{fmtBDT(amount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ border: `1px solid ${PINE}`, padding: 8, marginBottom: 8, fontSize: 10 }}>
        <div style={{ marginBottom: 5 }}><span style={{ fontWeight: 700 }}>Amount in Words:</span> {amountWords}</div>
        <div style={{ marginBottom: 5 }}><span style={{ fontWeight: 700 }}>Balance Due:</span> <span style={moneyStyle}>{fmtBDT(balanceDue)}</span></div>
        <div><span style={{ fontWeight: 700 }}>Status:</span> <span style={{ border: `1px solid ${GOLD}`, padding: '1px 6px', fontSize: 9, fontWeight: 700, color: PINE, background: CREAM }}>{statusText}</span></div>
      </div>

      <div style={{ border: `1px solid ${PINE}`, padding: '10px 8px', marginBottom: 8, display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: `1px solid ${PINE}`, height: 14 }} />
          <div style={{ fontSize: 10, fontWeight: 700 }}>Received By</div>
          <div style={{ fontSize: 9, color: MUTE }}>{payment?.received_by || 'Accounts User'}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: `1px solid ${PINE}`, height: 14 }} />
          <div style={{ fontSize: 10, fontWeight: 700 }}>Guest Signature</div>
          <div style={{ fontSize: 9, color: MUTE }}>{reservationName}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <img src={qrUrl(verifyUrl)} alt="Payment verify QR" style={{ width: 54, height: 54, border: `1px solid ${PINE}`, padding: 1, background: '#fff' }} />
          <div className="print-accent" style={{ color: ACCENT, fontSize: 8, marginTop: 2 }}>Scan to verify</div>
        </div>
      </div>

      <div style={{ border: `1px solid ${PINE}`, padding: '6px 8px', fontSize: 9, color: MUTE, textAlign: 'center' }}>
        <div style={{ color: INK, fontWeight: 700 }}>This is a computer-generated receipt.</div>
        <div>All payments are subject to resort policy and verification. Powered by {tenantName}.</div>
      </div>
    </section>
  )
}

export default function ReservationPaymentReceipt({ payment, company }) {
  if (!payment) return null

  return (
    <div className="print-doc" style={{ maxWidth: '192mm', margin: '0 auto', display: 'grid', gap: 12, color: INK, fontFamily: "Inter, 'Segoe UI', Arial, sans-serif" }}>
      <ReceiptCopy payment={payment} company={company} copyLabel="OFFICE COPY" />
      <div style={{ borderTop: `1px dashed ${LINE}`, marginTop: 2 }} />
      <ReceiptCopy payment={payment} company={company} copyLabel="GUEST COPY" />
    </div>
  )
}
