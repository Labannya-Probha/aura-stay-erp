import { fmtBDT, fmtDate, takaInWords, nightsBetween } from '../../lib/helpers'

export default function GuestBill({ 
  invoice, res, guest, company,
  charges, totals, paid, due, invoice_no, issued_at, is_void, buyer_name, buyer_address 
}) {
  const activeLines = invoice?.line_snapshot || charges || []
  
  if (!invoice && activeLines.length === 0) {
    return <div style={{ padding: 24, textAlign: 'center', color: '#b91c1c' }}>No guest bill to display. Check the guest out from the Folio &amp; Payments tab first, then print the bill.</div>
  }

  const lines = activeLines.filter((l) => l.charge_type !== 'ROUNDING')
  const t = invoice?.totals || totals || {}
  
  const isVoid = invoice?.is_void || is_void
  const invNo = invoice?.invoice_no || invoice_no || '—'
  const issuedDate = invoice?.issued_at || issued_at || new Date()
  
  const bName = invoice?.buyer_name || buyer_name || guest?.full_name
  const bAddress = invoice?.buyer_address || buyer_address || guest?.address || '—'
  
  const tPaid = paid ?? t.paid ?? 0
  const tDue = due ?? t.due ?? 0

  // লজিক ঠিক রেখে শুধু বর্ডার এবং ফন্ট আপডেট করা হয়েছে
  const cell = { borderBottom: '0.5px solid #ccc', padding: '10px 6px', fontSize: 11, fontFamily: 'Inter, sans-serif' };
  const num = { ...cell, textAlign: 'right', fontFamily: 'Inter, sans-serif' };
  const hcell = { borderBottom: '1px solid #000', padding: '10px 6px', fontSize: 10, textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative', fontFamily: 'Inter, sans-serif' }}>
      {isVoid && <div style={{ position: 'absolute', top: '40%', left: 0, right: 0, textAlign: 'center', transform: 'rotate(-24deg)', fontSize: 96, fontWeight: 800, color: 'rgba(220,0,0,0.16)', letterSpacing: 8, pointerEvents: 'none' }}>VOID</div>}
      
      {/* হেডার লেআউট */}
      <table style={{ width: '100%', marginBottom: 30 }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: 'top' }}>
               <div style={{ fontSize: 22, fontWeight: 700 }}>{company?.name || 'Novem Eco Resort'}</div>
               <div style={{ fontSize: 10 }}>{company?.address}</div>
            </td>
            <td style={{ textAlign: 'right', verticalAlign: 'top' }}>
              <div style={{ display: 'inline-block', padding: '6px 14px', border: '1px solid #000', fontWeight: 700, fontSize: 14 }}>GUEST BILL</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Guest Bill Title */}
      <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>GUEST BILL</div>

      {/* Guest Details & Invoice */}
      <table style={{ width: '100%', marginBottom: 20 }}>
        <tbody>
          <tr>
            <td style={{ padding: '6px 0' }}><b>Guest:</b> {bName}</td>
            <td style={{ textAlign: 'right', padding: '6px 0' }}><b>Invoice No:</b> {invNo}</td>
          </tr>
          <tr>
            <td style={{ padding: '6px 0' }}><b>Address:</b> {bAddress}</td>
            <td style={{ textAlign: 'right', padding: '6px 0' }}><b>Date:</b> {fmtDate(issuedDate)}</td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
        <thead>
          <tr>
            <th style={hcell}>Date</th><th style={hcell}>Description</th>
            <th style={{ ...hcell, textAlign: 'right' }}>Base</th>
            <th style={{ ...hcell, textAlign: 'right' }}>Discount</th>
            <th style={{ ...hcell, textAlign: 'right' }}>Total</th>
            <th style={hcell}>Status</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i}>
              <td style={cell}>{fmtDate(l.charge_date)}</td>
              <td style={cell}>{l.description}</td>
              <td style={num}>{Number(l.base_amount).toFixed(2)}</td>
              <td style={num}>{Number(l.discount).toFixed(2)}</td>
              <td style={num}>{Number(l.total).toFixed(2)}</td>
              <td style={cell}>{l.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table style={{ width: '46%', marginLeft: 'auto', marginTop: 10, fontSize: 11 }}>
        <tbody>
          <TR k="Room / service charges (base)" v={fmtBDT(t.base)} />
          <TR k="Discount" v={'− ' + fmtBDT(t.discount)} />
          <TR k="VAT" v={fmtBDT(t.vat)} />
          <tr>
            <td style={{ padding: '8px 6px', fontWeight: 700, borderTop: '1px solid #000' }}>GRAND TOTAL</td>
            <td style={{ padding: '8px 6px', fontWeight: 700, textAlign: 'right' }}>{fmtBDT(t.grand_total)}</td>
          </tr>
          <TR k="Paid" v={fmtBDT(tPaid)} />
          <tr>
            <td style={{ padding: '4px 6px', fontWeight: 700 }}>{tDue > 0 ? 'BALANCE DUE' : 'FULLY SETTLED'}</td>
            <td style={{ padding: '4px 6px', fontWeight: 700, textAlign: 'right' }}>{fmtBDT(tDue)}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ fontSize: 10, marginTop: 20 }}><b>In words:</b> {takaInWords(t.grand_total || 0)}</div>

      <table style={{ width: '100%', marginTop: 60, fontSize: 11 }}>
        <tbody>
          <tr>
            <td style={{ width: '40%', borderTop: '1px solid #000', paddingTop: 8 }}>Guest Signature</td>
            <td style={{ width: '20%' }}></td>
            <td style={{ width: '40%', borderTop: '1px solid #000', paddingTop: 8, textAlign: 'right' }}>Authorized Signature</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

const TR = ({ k, v }) => (
  <tr>
    <td style={{ padding: '4px 6px' }}>{k}</td>
    <td style={{ padding: '4px 6px', textAlign: 'right' }}>{v}</td>
  </tr>
)
