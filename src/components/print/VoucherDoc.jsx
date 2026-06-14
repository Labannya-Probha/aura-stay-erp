import { fmtBDT, fmtDate, takaInWords } from '../../lib/helpers'

const CASH_CODES = ['1010', '1020', '1030'] // Cash, Wallets, Bank

// Auto-detect voucher type from the lines when not explicitly given.
function detectType(lines) {
  const cashDr = lines.filter((l) => CASH_CODES.includes(l.code)).reduce((a, l) => a + (+l.debit || 0), 0)
  const cashCr = lines.filter((l) => CASH_CODES.includes(l.code)).reduce((a, l) => a + (+l.credit || 0), 0)
  if (cashDr === 0 && cashCr === 0) return 'JV'   // no cash/bank movement → pure journal
  if (cashCr > cashDr) return 'DEBIT'             // net cash out → payment
  return 'CREDIT'                                 // net cash in → receipt
}

const TITLES = {
  JV: { en: 'JOURNAL VOUCHER', bn: 'জার্নাল ভাউচার' },
  DEBIT: { en: 'DEBIT VOUCHER', bn: 'ডেবিট ভাউচার' },
  CREDIT: { en: 'CREDIT VOUCHER', bn: 'ক্রেডিট ভাউচার' },
}

export default function VoucherDoc({ entry, lines = [], company, voucherType }) {
  const type = voucherType || detectType(lines)
  const title = TITLES[type] || TITLES.JV
  const totalDr = lines.reduce((a, l) => a + (+l.debit || 0), 0)
  const totalCr = lines.reduce((a, l) => a + (+l.credit || 0), 0)
  const amount = Math.max(totalDr, totalCr)

  const cell = { border: '1px solid #000', padding: '6px 8px', fontSize: 11, verticalAlign: 'top' }
  const rt = { ...cell, textAlign: 'right', fontFamily: '"IBM Plex Mono", monospace' }
  const ct = { ...cell, textAlign: 'center' }

  // For Debit/Credit voucher we surface the contra (cash/bank) account in the header line.
  const cashLine = lines.find((l) => CASH_CODES.includes(l.code))

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', color: '#000' }}>
      {/* Letterhead */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '2px solid #1B4D2E', paddingBottom: 8, marginBottom: 6 }}>
        {company?.logo_url && <img src={company.logo_url} alt="" style={{ height: 50, width: 50, objectFit: 'contain' }} />}
        <div style={{ flex: 1, textAlign: company?.logo_url ? 'left' : 'center' }}>
          <div style={{ fontSize: 19, fontWeight: 700, fontFamily: 'Fraunces, serif', color: '#1B4D2E' }}>{company?.legal_name || company?.name || 'Company'}</div>
          <div style={{ fontSize: 10.5 }}>{company?.address}{company?.phone ? ` · ${company.phone}` : ''}</div>
          {company?.bin && <div style={{ fontSize: 9.5 }}>BIN: {company.bin}</div>}
        </div>
      </div>

      {/* Title + voucher meta */}
      <div style={{ textAlign: 'center', margin: '4px 0 10px' }}>
        <div style={{ display: 'inline-block', border: '1.5px solid #000', borderRadius: 4, padding: '3px 18px', fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>
          {title.en} <span style={{ fontWeight: 400, fontSize: 11 }}>/ {title.bn}</span>
        </div>
      </div>

      <table style={{ width: '100%', fontSize: 11, marginBottom: 8 }}>
        <tbody>
          <tr>
            <td><b>Voucher No:</b> {entry.jv_no || '—'}</td>
            <td style={{ textAlign: 'right' }}><b>Date:</b> {fmtDate(entry.jv_date)}</td>
          </tr>
          {type !== 'JV' && cashLine && (
            <tr>
              <td colSpan={2}><b>{type === 'DEBIT' ? 'Paid through' : 'Received in'}:</b> {cashLine.code} · {cashLine.name}</td>
            </tr>
          )}
          {entry.source && <tr><td colSpan={2}><b>Source:</b> {entry.source}</td></tr>}
        </tbody>
      </table>

      {/* Lines table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th style={ct}>A/C Code</th>
            <th style={cell}>Account Head & Particulars</th>
            <th style={{ ...cell, textAlign: 'right', width: '18%' }}>Debit (৳)</th>
            <th style={{ ...cell, textAlign: 'right', width: '18%' }}>Credit (৳)</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i}>
              <td style={{ ...ct, fontFamily: '"IBM Plex Mono", monospace' }}>{l.code || '—'}</td>
              <td style={cell}>
                <b>{l.name || '—'}</b>
                {l.line_note ? <div style={{ fontSize: 10, color: '#444' }}>{l.line_note}</div> : null}
              </td>
              <td style={rt}>{+l.debit ? fmtBDT(l.debit) : ''}</td>
              <td style={rt}>{+l.credit ? fmtBDT(l.credit) : ''}</td>
            </tr>
          ))}
          {/* pad to keep the form tidy */}
          {Array.from({ length: Math.max(0, 4 - lines.length) }).map((_, i) => (
            <tr key={`p${i}`}><td style={ct}>&nbsp;</td><td style={cell}></td><td style={rt}></td><td style={rt}></td></tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: 700, background: '#f5f5f5' }}>
            <td style={cell} colSpan={2}>TOTAL</td>
            <td style={rt}>{fmtBDT(totalDr)}</td>
            <td style={rt}>{fmtBDT(totalCr)}</td>
          </tr>
        </tfoot>
      </table>

      <div style={{ fontSize: 11, marginTop: 6 }}><b>In words:</b> {takaInWords(amount)}</div>
      {entry.narration && <div style={{ fontSize: 11, marginTop: 4 }}><b>Narration:</b> {entry.narration}</div>}
      {Math.abs(totalDr - totalCr) > 0.009 && (
        <div style={{ fontSize: 10.5, marginTop: 4, color: '#b91c1c' }}>⚠ Debit and Credit are not equal — this voucher is unbalanced.</div>
      )}

      {/* Signatures */}
      <table style={{ width: '100%', marginTop: 48, fontSize: 10.5, textAlign: 'center' }}>
        <tbody>
          <tr>
            <td style={{ borderTop: '1px solid #000', paddingTop: 5 }}>Prepared by<br /><span style={{ fontSize: 9.5 }}>{entry.posted_by || ''}</span></td>
            <td style={{ width: '6%' }}></td>
            <td style={{ borderTop: '1px solid #000', paddingTop: 5 }}>Checked by</td>
            <td style={{ width: '6%' }}></td>
            <td style={{ borderTop: '1px solid #000', paddingTop: 5 }}>Approved by</td>
            <td style={{ width: '6%' }}></td>
            <td style={{ borderTop: '1px solid #000', paddingTop: 5 }}>Receiver's Signature</td>
          </tr>
        </tbody>
      </table>

      <div style={{ fontSize: 8.5, color: '#777', marginTop: 14, textAlign: 'center' }}>
        Prepared under the double-entry system in accordance with IFRS. System-generated voucher — {company?.software_name || 'Aura Stay'}.
      </div>
    </div>
  )
}
