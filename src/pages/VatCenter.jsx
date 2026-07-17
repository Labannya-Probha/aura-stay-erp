import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { fmtBDT, fmtDate, todayISO, exportXLSX } from '../lib/helpers'
import KPICards from '../components/KPICards.jsx'
import { FileSpreadsheet, Plus, FileDown, Printer, Trash2, Pencil } from 'lucide-react'
import PrintPortal from '../components/PrintPortal.jsx'
import VdsCertificate from '../components/print/VdsCertificate.jsx'
import ChallanForm from './ChallanForm'
import '../styles/aeds-v6-workspaces.css'
import AedsDataGrid from '../components/data-grid/AedsDataGrid.jsx'

const TABS = ['Sales 6.2', 'Purchase 6.1', 'VDS 6.6', 'Monthly 9.1', 'Over-threshold 6.10', 'A-Challan']
const monthBounds = (ym) => { const [y, m] = ym.split('-').map(Number); const start = `${ym}-01`; const end = new Date(y, m, 0); return { start, end: `${ym}-${String(end.getDate()).padStart(2, '0')}` } }
const thisMonth = () => todayISO().slice(0, 7)

export default function VatCenter({ userName, company }) {
  const [tab, setTab] = useState('Sales 6.2')
  const [ym, setYm] = useState(thisMonth())
  const [msg, setMsg] = useState('')
  const [printCert, setPrintCert] = useState(null)
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 5000) }
  return (
    <div className="aeds-v6-legacy-page">
      {printCert && (
        <PrintPortal title={`Mushak-6.6 — ${printCert.cert_no || 'VDS'}`} onClose={() => setPrintCert(null)} primaryColor={company?.primary_color || company?.brand_primary} accentColor={company?.accent_color || company?.brand_accent}>
          <VdsCertificate cert={printCert} company={company} />
        </PrintPortal>
      )}      
      <div className="aeds-v6-legacy-header">
        <div>
          <div className="aeds-v6-workspace-eyebrow">Bangladesh VAT Compliance</div>
          <h1 className="flex items-center gap-2">
            <FileSpreadsheet className="text-forest" /> VAT Workspace
          </h1>
          <p>Sales, purchases, VDS certificates, monthly return and Mushak compliance.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="label !mb-0">Tax month</span>
          <input type="month" className="input !w-44" value={ym} onChange={(e) => setYm(e.target.value)} />
        </div>
      </div>
      <KPICards module="vat" />
      {msg && <div className="px-4 py-3 rounded-lg bg-forest/10 text-forest text-sm font-medium">{msg}</div>}
      <div className="aeds-v6-tab-strip">
        {TABS.map((t) => (<button key={t} onClick={() => setTab(t)} className={tab === t ? 'aeds-v6-tab-active' : ''}>{t}</button>))}
      </div>
      {tab === 'Sales 6.2' && <SalesReg ym={ym} company={company} />}
      {tab === 'Purchase 6.1' && <PurchaseReg ym={ym} company={company} />}
      {tab === 'VDS 6.6' && <VdsTab ym={ym} userName={userName} flash={flash} onPrint={setPrintCert} />}
      {tab === 'Monthly 9.1' && <Summary91 ym={ym} />}
      {tab === 'Over-threshold 6.10' && <Mushak610 company={company} />}
      {tab === 'A-Challan' && <ChallanForm />}
    </div>
  )
}

function SalesReg({ ym, company }) {
  const [rows, setRows] = useState([])
  useEffect(() => { const { start, end } = monthBounds(ym); supabase.from('vat_sales_register').select('*').gte('issue_date', start).lte('issue_date', end).order('issue_date').then(({ data }) => setRows((data || []).filter((r) => !r.is_void))) }, [ym])
  const tot = rows.reduce((a, r) => ({ tv: a.tv + +r.taxable_value, sd: a.sd + +r.sd, vat: a.vat + +r.vat, total: a.total + +r.total }), { tv: 0, sd: 0, vat: 0, total: 0 })
  const xls = () => exportXLSX(`Mushak_6.2_${ym}.xlsx`, [{ name: '6.2 Sales', rows: [[`${company?.name || ''} — Mushak-6.2 Sales Register`], [`Month: ${ym}`, `BIN: ${company?.bin || ''}`], [], ['Date', 'Invoice', 'Buyer', 'Buyer BIN', 'Taxable Value', 'SD', 'VAT', 'Total'], ...rows.map((r) => [r.issue_date, r.invoice_no, r.buyer_name, r.buyer_bin, +r.taxable_value, +r.sd, +r.vat, +r.total]), [], ['', '', '', 'TOTAL', tot.tv, tot.sd, tot.vat, tot.total]] }])
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button className="btn-ghost !py-1" onClick={xls}><FileDown size={14} /> Excel</button>
      </div>
      <AedsDataGrid
        title="Sales Register (Mushak-6.2)"
        subtitle={`Month ${ym} · Taxable ${fmtBDT(tot.tv)} · VAT ${fmtBDT(tot.vat)}`}
        data={rows}
        columns={[
          { accessorKey: 'issue_date', header: 'Date', type: 'date', width: 130 },
          { accessorKey: 'invoice_no', header: 'Invoice', width: 150 },
          { accessorKey: 'buyer_name', header: 'Buyer', width: 230 },
          { accessorKey: 'buyer_bin', header: 'Buyer BIN', width: 170 },
          { accessorKey: 'taxable_value', header: 'Taxable', type: 'currency', aggregation: 'sum', width: 150 },
          { accessorKey: 'sd', header: 'SD', type: 'currency', aggregation: 'sum', width: 130 },
          { accessorKey: 'vat', header: 'VAT', type: 'currency', aggregation: 'sum', width: 130 },
          { accessorKey: 'total', header: 'Total', type: 'currency', aggregation: 'sum', width: 150 },
        ]}
        pageSize={100}
        emptyText="No sales this month."
        getRowId={(row) => row.id}
      />
    </div>
  )
}

function PurchaseReg({ ym, company }) {
  const [rows, setRows] = useState([])
  useEffect(() => { const { start, end } = monthBounds(ym); supabase.from('vat_purchase_register').select('*').gte('entry_date', start).lte('entry_date', end).order('entry_date').then(({ data }) => setRows(data || [])) }, [ym])
  const tot = rows.reduce((a, r) => ({ tv: a.tv + +r.taxable_value, vat: a.vat + +r.vat_amount, reb: a.reb + (r.rebateable ? +r.vat_amount : 0), total: a.total + +r.total }), { tv: 0, vat: 0, reb: 0, total: 0 })
  const xls = () => exportXLSX(`Mushak_6.1_${ym}.xlsx`, [{ name: '6.1 Purchase', rows: [[`${company?.name || ''} — Mushak-6.1 Purchase Register`], [`Month: ${ym}`], [], ['Date', 'Vendor', 'Vendor BIN', 'Invoice', 'Taxable Value', 'VAT', 'Rebateable', 'Total'], ...rows.map((r) => [r.entry_date, r.vendor_name, r.vendor_bin, r.invoice_no, +r.taxable_value, +r.vat_amount, r.rebateable ? 'Yes' : 'No', +r.total]), [], ['', '', '', 'TOTAL', tot.tv, tot.vat, `Rebateable ${tot.reb.toFixed(2)}`, tot.total]] }])
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button className="btn-ghost !py-1" onClick={xls}><FileDown size={14} /> Excel</button>
      </div>
      <AedsDataGrid
        title="Purchase Register (Mushak-6.1)"
        subtitle={`Month ${ym} · Input VAT ${fmtBDT(tot.vat)} · Rebateable ${fmtBDT(tot.reb)}`}
        data={rows.map((row) => ({
          ...row,
          rebate_status: row.rebateable ? 'REBATEABLE' : 'NON-REBATEABLE',
        }))}
        columns={[
          { accessorKey: 'entry_date', header: 'Date', type: 'date', width: 130 },
          { accessorKey: 'vendor_name', header: 'Vendor', width: 230 },
          { accessorKey: 'vendor_bin', header: 'Vendor BIN', width: 170 },
          { accessorKey: 'invoice_no', header: 'Invoice', width: 150 },
          { accessorKey: 'taxable_value', header: 'Taxable', type: 'currency', aggregation: 'sum', width: 150 },
          { accessorKey: 'vat_amount', header: 'VAT', type: 'currency', aggregation: 'sum', width: 140 },
          { accessorKey: 'rebate_status', header: 'Rebate', type: 'status', width: 150 },
          { accessorKey: 'total', header: 'Total', type: 'currency', aggregation: 'sum', width: 150 },
        ]}
        pageSize={100}
        emptyText="No purchases this month."
        getRowId={(row) => row.id}
      />
    </div>
  )
}

function VdsTab({ ym, userName, flash, onPrint }) {
  const [rows, setRows] = useState([])
  const [editId, setEditId] = useState(null)
  const blank = { direction: 'RECEIVED', cert_no: '', cert_date: todayISO(), party_name: '', party_bin: '', base_amount: '', vds_rate: '', challan_no: '', challan_date: '' }
  const [f, setF] = useState(blank)
  const load = () => { const { start, end } = monthBounds(ym); supabase.from('vds_certificates').select('*').gte('cert_date', start).lte('cert_date', end).order('cert_date', { ascending: false }).then(({ data }) => setRows(data || [])) }
  useEffect(() => { load() }, [ym])

  const save = async () => {
    if (!f.base_amount) { flash('Enter base amount.'); return }
    const vds_amount = +(+f.base_amount * (+f.vds_rate || 0) / 100).toFixed(2)
    const payload = { ...f, base_amount: +f.base_amount, vds_rate: +f.vds_rate || 0, vds_amount, challan_date: f.challan_date || null }
    if (editId) {
      const { error } = await supabase.from('vds_certificates').update(payload).eq('id', editId)
      if (error) { flash(error.message); return }
      flash('VDS certificate updated.')
    } else {
      const { error } = await supabase.from('vds_certificates').insert({ ...payload, created_by: userName })
      if (error) { flash(error.message); return }
    }
    setF(blank); setEditId(null); load()
  }
  const edit = (r) => { setEditId(r.id); setF({ direction: r.direction, cert_no: r.cert_no || '', cert_date: r.cert_date, party_name: r.party_name || '', party_bin: r.party_bin || '', base_amount: r.base_amount, vds_rate: r.vds_rate, challan_no: r.challan_no || '', challan_date: r.challan_date || '' }) }
  const del = async (id) => {
    if (!window.confirm('Delete this VDS certificate? This cannot be undone.')) return
    const { error } = await supabase.from('vds_certificates').delete().eq('id', id)
    if (error) flash(error.message); else { if (editId === id) { setF(blank); setEditId(null) } load() }
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 grid grid-cols-4 gap-2">
        <select className="input" value={f.direction} onChange={(e) => setF({ ...f, direction: e.target.value })}><option value="RECEIVED">VDS Received (we are supplier)</option><option value="ISSUED">VDS Issued (we withheld)</option></select>
        <input className="input money" placeholder="Certificate no" value={f.cert_no} onChange={(e) => setF({ ...f, cert_no: e.target.value })} />
        <input type="date" className="input" value={f.cert_date} onChange={(e) => setF({ ...f, cert_date: e.target.value })} />
        <input className="input" placeholder="Party name" value={f.party_name} onChange={(e) => setF({ ...f, party_name: e.target.value })} />
        <input className="input money" placeholder="Party BIN" value={f.party_bin} onChange={(e) => setF({ ...f, party_bin: e.target.value })} />
        <input type="number" className="input money" placeholder="Base amount" value={f.base_amount} onChange={(e) => setF({ ...f, base_amount: e.target.value })} />
        <input type="number" className="input money" placeholder="VDS rate %" value={f.vds_rate} onChange={(e) => setF({ ...f, vds_rate: e.target.value })} />
        <input className="input money" placeholder="Challan no" value={f.challan_no} onChange={(e) => setF({ ...f, challan_no: e.target.value })} />
        <input type="date" className="input" placeholder="Challan date" value={f.challan_date} onChange={(e) => setF({ ...f, challan_date: e.target.value })} />
        <button className="btn-primary justify-center col-span-3" onClick={save}><Plus size={15} /> {editId ? 'Update certificate' : 'Add VDS certificate'}</button>
        {editId && <button className="btn-ghost justify-center" onClick={() => { setF(blank); setEditId(null) }}>Cancel edit</button>}
      </div>
      <AedsDataGrid
        title="VDS Certificates (Mushak-6.6)"
        subtitle={`Month ${ym} · Withholding certificate register`}
        data={rows}
        columns={[
          { accessorKey: 'cert_date', header: 'Date', type: 'date', width: 130 },
          { accessorKey: 'direction', header: 'Direction', type: 'status', width: 140 },
          { accessorKey: 'cert_no', header: 'Certificate', width: 160 },
          { accessorKey: 'party_name', header: 'Party', width: 230 },
          { accessorKey: 'party_bin', header: 'Party BIN', width: 170 },
          { accessorKey: 'base_amount', header: 'Base', type: 'currency', aggregation: 'sum', width: 150 },
          { accessorKey: 'vds_rate', header: 'Rate', type: 'percent', width: 110 },
          { accessorKey: 'vds_amount', header: 'VDS', type: 'currency', aggregation: 'sum', width: 150 },
          { accessorKey: 'challan_no', header: 'Challan', width: 150 },
          {
            accessorKey: 'actions',
            header: 'Actions',
            sortable: false,
            width: 180,
            cell: ({ row }) => (
              <div className="flex justify-end gap-1">
                <button className="btn-ghost !py-1" title="Print Mushak-6.6" onClick={(event) => { event.stopPropagation(); onPrint(row) }}><Printer size={13} /></button>
                <button className="btn-ghost !py-1" title="Edit" onClick={(event) => { event.stopPropagation(); edit(row) }}><Pencil size={13} /></button>
                <button className="btn-ghost !py-1 text-red-600" title="Delete" onClick={(event) => { event.stopPropagation(); del(row.id) }}><Trash2 size={13} /></button>
              </div>
            ),
          },
        ]}
        pageSize={100}
        emptyText="No VDS certificates this month."
        getRowId={(row) => row.id}
      />
    </div>
  )
}

function Summary91({ ym }) {
  const [d, setD] = useState(null)
  useEffect(() => {
    const { start, end } = monthBounds(ym)
    Promise.all([
      supabase.from('vat_sales_register').select('vat,sd,is_void').gte('issue_date', start).lte('issue_date', end),
      supabase.from('vat_purchase_register').select('vat_amount,rebateable').gte('entry_date', start).lte('entry_date', end),
      supabase.from('vds_certificates').select('vds_amount,direction').gte('cert_date', start).lte('cert_date', end),
    ]).then(([s, p, v]) => {
      const outVat = (s.data || []).filter((r) => !r.is_void).reduce((a, r) => a + +r.vat, 0)
      const outSd = (s.data || []).filter((r) => !r.is_void).reduce((a, r) => a + +r.sd, 0)
      const inVat = (p.data || []).filter((r) => r.rebateable).reduce((a, r) => a + +r.vat_amount, 0)
      const vdsRecv = (v.data || []).filter((r) => r.direction === 'RECEIVED').reduce((a, r) => a + +r.vds_amount, 0)
      setD({ outVat, outSd, inVat, vdsRecv, net: +(outVat - inVat - vdsRecv).toFixed(2) })
    })
  }, [ym])
  if (!d) return <div className="text-pine/50">Loading…</div>
  const Row = ({ label, val, strong, sign }) => (<div className={`flex justify-between py-2 border-b border-leaf/60 ${strong ? 'font-bold text-base' : 'text-sm'}`}><span>{label}</span><span className={`money ${sign === '-' ? 'text-red-600' : ''}`}>{sign === '-' ? '− ' : ''}{fmtBDT(val)}</span></div>)
  return (
    <div className="card p-6 max-w-xl">
      <h3 className="font-display font-semibold text-pine mb-3">Monthly VAT position (Mushak-9.1 basis) — {ym}</h3>
      <Row label="Output VAT on sales (6.2)" val={d.outVat} />
      <Row label="Rebateable input VAT on purchases (6.1)" val={d.inVat} sign="-" />
      <Row label="VDS received against our supplies (6.6)" val={d.vdsRecv} sign="-" />
      <Row label="Net VAT payable to treasury" val={d.net} strong />
      <p className="text-xs text-pine/50 mt-3">Supplementary Duty collected this month: <span className="money">{fmtBDT(d.outSd)}</span> (payable separately). This is an indicative working — confirm against your filed 9.1 return.</p>
    </div>
  )
}

function Mushak610({ company }) {
  const [rows, setRows] = useState([])
  useEffect(() => { supabase.from('v_mushak_610').select('*').order('issue_date', { ascending: false }).then(({ data }) => setRows((data || []).filter((r) => !r.is_void))) }, [])
  const threshold = company?.mushak610_threshold || 200000
  return (
    <AedsDataGrid
      title="Over-threshold Tax Invoices"
      subtitle={`Mushak-6.10 trigger · Threshold ${fmtBDT(threshold)}`}
      data={rows}
      columns={[
        { accessorKey: 'issue_date', header: 'Date', type: 'date', width: 130 },
        { accessorKey: 'invoice_no', header: 'Invoice', width: 160 },
        { accessorKey: 'buyer_name', header: 'Buyer', width: 240 },
        { accessorKey: 'buyer_bin', header: 'Buyer BIN', width: 180 },
        { accessorKey: 'grand_total', header: 'Grand Total', type: 'currency', aggregation: 'sum', width: 170 },
      ]}
      pageSize={100}
      emptyText="No invoices over the threshold."
      getRowId={(row) => row.id}
    />
  )
}
