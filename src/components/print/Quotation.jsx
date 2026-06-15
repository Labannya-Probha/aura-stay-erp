import { fmtBDT, fmtDate, nightsBetween, computeCharge, rateFor, todayISO } from '../../lib/helpers'

export default function Quotation({ res, guest, resRooms, company, taxConfig, terms, discountPct, validDays }) {
  const rate = rateFor(taxConfig, 'ROOM', todayISO())
  
  const lines = resRooms.map((rr) => ({ 
    label: `Room ${rr.rooms?.room_no}`, 
    calc: computeCharge(rr.rate, discountPct, rate),
    nights: nightsBetween(rr.from_date || res.check_in, rr.to_date || res.check_out)
  }))

  const totals = lines.reduce((a, l) => {
    const totalBase = l.calc.base_amount * l.nights
    const totalDisc = l.calc.discount * l.nights
    const netBase = totalBase - totalDisc
    const sc = (netBase * (rate.service_charge_pct || 0)) / 100
    const vat = ((netBase + sc) * (rate.vat_pct || 0)) / 100
    return { base: a.base + totalBase, discount: a.discount + totalDisc, sc: a.sc + sc, vat: a.vat + vat, total: a.total + (netBase + sc + vat) }
  }, { base: 0, discount: 0, sc: 0, vat: 0, total: 0 })

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', fontSize: 12 }}>
      <div style={{ borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{company?.name}</div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th>Description</th><th>Tariff/night</th><th>Nights</th><th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i}>
              <td>{l.label}</td>
              <td>{fmtBDT(l.calc.base_amount)}</td>
              <td>{l.nights}</td>
              <td>{fmtBDT(l.calc.base_amount * l.nights)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          {totals.discount > 0 && <tr><td colSpan={3}>Discount</td><td>− {fmtBDT(totals.discount)}</td></tr>}
          {totals.sc > 0 && <tr><td colSpan={3}>Service charge</td><td>{fmtBDT(totals.sc)}</td></tr>}
          <tr><td colSpan={3}>VAT</td><td>{fmtBDT(totals.vat)}</td></tr>
          <tr style={{ fontWeight: 700 }}><td colSpan={3}>GRAND TOTAL</td><td>{fmtBDT(totals.total)}</td></tr>
        </tfoot>
      </table>
    </div>
  )
}
