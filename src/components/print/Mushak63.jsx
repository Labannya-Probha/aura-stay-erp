import { fmtBDT, fmtDate } from '../../lib/helpers'
import { normalizeInvoiceItems, normalizeInvoiceTotals, resolveBuyerInfo } from '../../lib/invoiceFormat'

/* ---------- Amount-in-words (kept local — do not assume helpers.js has it) ---------- */
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
const two = (n) => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : ''))
const three = (n) => {
  const h = Math.floor(n / 100), r = n % 100
  return (h ? ONES[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? two(r) : '')
}
function inWords(num) {
  if (num === 0) return 'Zero'
  let w = ''
  const cr = Math.floor(num / 10000000); num %= 10000000
  const la = Math.floor(num / 100000); num %= 100000
  const th = Math.floor(num / 1000); num %= 1000
  if (cr) w += three(cr) + ' Crore '
  if (la) w += two(la) + ' Lakh '
  if (th) w += two(th) + ' Thousand '
  if (num) w += three(num)
  return w.trim()
}
function takaInWords(amount) {
  const v = Math.round(Number(amount || 0) * 100) / 100
  const taka = Math.floor(v)
  const poisha = Math.round((v - taka) * 100)
  let s = 'Taka ' + inWords(taka)
  if (poisha) s += ' and ' + inWords(poisha) + ' Poisha'
  return s + ' Only'
}

// NBR-prescribed Mushak-6.3 (কর চালানপত্র) layout — strict black on white
export default function Mushak63({
  charges = [], line_snapshot = [], totals = {}, paid = 0, due = 0,
  res, guest, company, guestCompany, refNo, invoice_no, issued_at,
  buyer_name, buyer_address, buyer_bin, is_void, created_by,
}) {
  const { items, isLegacy } = normalizeInvoiceItems(charges, line_snapshot)
  const lines = items.filter((l) => l.charge_type !== 'ROUNDING')

  if (lines.length === 0) {
    return <div style={{ padding: 24, textAlign: 'center', color: '#b91c1c' }}>No tax invoice to display. Check the guest out from the Folio &amp; Payments tab first, then print the Mushak-6.3.</div>
  }

  const t = normalizeInvoiceTotals(totals)
  const buyer = resolveBuyerInfo({ res, guest, guestCompany, buyer_name, buyer_address, buyer_bin })
  const issued = new Date(issued_at || new Date())
  const issueTime = issued.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dhaka' })

  const invNo = invoice_no || '—'
  const creator = created_by || '________________'

  const b = { border: 'none', borderBottom: '1px solid #000', padding: '4px 6px', fontSize: 10.5, verticalAlign: 'top', fontFamily: 'Inter, sans-serif' };
  const bc = { ...b, textAlign: 'center' };
  const br = { ...b, textAlign: 'right', fontFamily: 'Inter, sans-serif' };

  // Pre-VAT, pre-discount "value" column per NBR format — for legacy items
  // (no per-line discount/SC available) this is simply the recorded amount.
  const lineValue = (l) => l._legacy
    ? Number(l.base_amount || 0)
    : +(Number(l.base_amount) - Number(l.discount) + Number(l.service_charge)).toFixed(2)
  const totalValue = lines.reduce((a, l) => a + lineValue(l), 0)

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', color: '#000', position: 'relative' }}>
      {is_void && <div style={{ position: 'absolute', top: '40%', left: 0, right: 0, textAlign: 'center', transform: 'rotate(-24deg)', fontSize: 96, fontWeight: 800, color: 'rgba(220,0,0,0.16)', letterSpacing: 8, pointerEvents: 'none' }}>VOID / বাতিল</div>}
      <table style={{ width: '100%' }}>
        <tbody>
          <tr>
            <td style={{ width: '20%' }}></td>
            <td style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</div>
              <div style={{ fontSize: 12 }}>জাতীয় রাজস্ব বোর্ড</div>
              <div style={{ fontSize: 9 }}>Government of the People's Republic of Bangladesh · National Board of Revenue</div>
            </td>
            <td style={{ width: '20%', textAlign: 'right', verticalAlign: 'top' }}>
              <div style={{ display: 'inline-block', border: '2px solid #000', padding: '4px 10px', fontWeight: 700, fontSize: 13 }}>মূসক-৬.৩</div>
            </td>
          </tr>
        </tbody>
      </table>
      <div style={{ textAlign: 'center', fontSize: 9, marginTop: 2 }}>[বিধি ৪০ এর উপ-বিধি (১) এর দফা (গ) দ্রষ্টব্য]</div>
      <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, margin: '6px 0 10px', textDecoration: 'underline' }}>কর চালানপত্র (Tax Invoice)</div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
        <tbody>
          <tr>
            <td style={b}><b>নিবন্ধিত ব্যক্তির নাম</b> (Name of registered person):<br />{company?.legal_name || company?.name}</td>
            <td style={b}><b>নিবন্ধিত ব্যক্তির বিআইএন</b> (BIN):<br /><span style={{ fontFamily: '"IBM Plex Mono", monospace' }}>{company?.bin || '____________________'}</span></td>
          </tr>
          <tr>
            <td style={b} colSpan={2}><b>চালানপত্র ইস্যুর ঠিকানা</b> (Address of issue):<br />{company?.name} — {company?.address}</td>
          </tr>
          <tr>
            <td style={b}>
              <b>ক্রেতার নাম</b> (Buyer's name): {buyer.name}<br />
              <b>ক্রেতার ঠিকানা</b> (Buyer's address): {buyer.address}<br />
              <b>ক্রেতার বিআইএন</b> (Buyer's BIN, if any): {buyer.bin || '—'}
            </td>
            <td style={b}>
              <b>চালানপত্র নম্বর</b> (Invoice No.): <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontWeight: 700 }}>{invNo}</span><br />
              <b>ইস্যুর তারিখ</b> (Date of issue): {fmtDate(issued)}<br />
              <b>ইস্যুর সময়</b> (Time of issue): {issueTime}
            </td>
          </tr>
          <tr>
            <td style={b}><b>সরবরাহের গন্তব্যস্থল</b> (Destination of supply): {company?.name}, {company?.address}</td>
            <td style={b}><b>যানবাহনের প্রকৃতি ও নম্বর</b> (Vehicle type & no.): প্রযোজ্য নয় (N/A) · Ref: {refNo || res?.res_no || '—'}</td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={bc}>ক্রমিক<br />নং</th>
            <th style={bc}>পণ্য বা সেবার বর্ণনা<br />(Description of goods/services)</th>
            <th style={bc}>সরবরাহের<br />একক</th>
            <th style={bc}>পরিমাণ</th>
            <th style={bc}>মূল্য (টাকায়)<br />(Value)</th>
            <th style={bc}>মূসক হার<br />(VAT rate)</th>
            <th style={bc}>মূসকের পরিমাণ<br />(টাকায়)</th>
            <th style={bc}>সকল প্রকার শুল্ক ও<br />করসহ মূল্য</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => {
            const val = lineValue(l)
            const vatPct = l._legacy ? null : (val > 0 ? ((Number(l.vat) / val) * 100).toFixed(1).replace(/\.0$/, '') : '0')
            return (
              <tr key={l.id || i}>
                <td style={bc}>{i + 1}</td>
                <td style={b}>{l.description}</td>
                <td style={bc}>{l.charge_type === 'ROOM' ? 'Night' : 'Service'}</td>
                <td style={bc}>1</td>
                <td style={br}>{val.toFixed(2)}</td>
                <td style={bc}>{vatPct === null ? '—' : `${vatPct}%`}</td>
                <td style={br}>{l._legacy ? '—' : Number(l.vat).toFixed(2)}</td>
                <td style={br}>{Number(l.total).toFixed(2)}</td>
              </tr>
            )
          })}
          <tr>
            <td style={{ ...b, fontWeight: 700 }} colSpan={4}>সর্বমোট (Total)</td>
            <td style={{ ...br, fontWeight: 700 }}>{totalValue.toFixed(2)}</td>
            <td style={bc}>—</td>
            <td style={{ ...br, fontWeight: 700 }}>{t.vat.toFixed(2)}</td>
            <td style={{ ...br, fontWeight: 700 }}>{t.grand_total_raw.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {isLegacy && (
        <div style={{ fontSize: 9, marginTop: 4, color: '#444' }}>
          দ্রষ্টব্য: এই চালানটি লাইন-পর্যায়ের বিস্তারিত হিসাব সংরক্ষণের আগে ইস্যু করা হয়েছিল — প্রতি লাইনে মূসক হার দেখানো সম্ভব হয়নি। মোট মূসক ও সর্বমোট মূল্য সঠিক রয়েছে। (Note: this invoice predates per-line tax breakdown — totals below remain accurate.)
        </div>
      )}

      {!!t.rounding && (
        <div style={{ fontSize: 10.5, marginTop: 6, textAlign: 'right' }}>
          রাউন্ডিং (Rounding): {t.rounding > 0 ? '+' : '−'}{fmtBDT(Math.abs(t.rounding))} &nbsp;·&nbsp; <b>প্রদেয় (Net payable): {fmtBDT(t.grand_total)}</b>
        </div>
      )}

      <div style={{ fontSize: 10.5, marginTop: 6 }}>
        <b>কথায় (In words):</b> {takaInWords(t.grand_total || 0)}
      </div>

      <table style={{ width: '100%', marginTop: 40, fontSize: 10.5 }}>
        <tbody>
          <tr>
            <td style={{ width: '55%' }}>
              <b>প্রতিষ্ঠান কর্তৃপক্ষের দায়িত্বপ্রাপ্ত ব্যক্তির নাম</b> (Name of responsible person): {creator}<br />
              <b>পদবি</b> (Designation): ________________
            </td>
            <td style={{ width: '45%', textAlign: 'right', verticalAlign: 'bottom' }}>
              <div style={{ borderTop: '1px solid #000', display: 'inline-block', paddingTop: 4, minWidth: 180, textAlign: 'center' }}>
                <b>স্বাক্ষর</b> (Signature) ও সিল (Seal)
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
