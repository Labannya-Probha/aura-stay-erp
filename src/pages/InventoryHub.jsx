import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { fmtBDT, fmtDate, todayISO, exportXLSX } from '../lib/helpers'
import { Boxes, Plus, Trash2, Check, X, Truck, PackageCheck, ArrowLeftRight, Undo2, FileDown } from 'lucide-react'

const TABS = ['Items & Stock', 'Vendors', 'Requisitions', 'Purchase Orders', 'Goods Receipt', 'Transfers', 'Returns']

export default function InventoryHub({ userName, role, isAdmin }) {
  const [tab, setTab] = useState('Items & Stock')
  const [msg, setMsg] = useState('')
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 5000) }
  const canApprove = isAdmin || role === 'MANAGER'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-pine flex items-center gap-2"><Boxes className="text-forest" /> Inventory & Procurement</h1>
        <p className="text-sm text-pine/60">Store items, vendors, requisition → PO → goods receipt (auto VAT-6.1), transfers and returns.</p>
      </div>
      {msg && <div className="px-4 py-3 rounded-lg bg-forest/10 text-forest text-sm font-medium">{msg}</div>}
      <div className="flex gap-1 border-b border-leaf flex-wrap">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-semibold rounded-t-lg ${tab === t ? 'bg-white border border-leaf border-b-white text-forest -mb-px' : 'text-pine/60 hover:text-pine'}`}>{t}</button>
        ))}
      </div>
      {tab === 'Items & Stock' && <ItemsTab flash={flash} isAdmin={isAdmin} />}
      {tab === 'Vendors' && <VendorsTab flash={flash} isAdmin={isAdmin} />}
      {tab === 'Requisitions' && <RequisitionsTab flash={flash} userName={userName} canApprove={canApprove} />}
      {tab === 'Purchase Orders' && <POTab flash={flash} userName={userName} />}
      {tab === 'Goods Receipt' && <GRNTab flash={flash} userName={userName} />}
      {tab === 'Transfers' && <TransfersTab flash={flash} userName={userName} />}
      {tab === 'Returns' && <ReturnsTab flash={flash} userName={userName} />}
    </div>
  )
}

function ItemsTab({ flash, isAdmin }) {
  const [items, setItems] = useState([])
  const [stock, setStock] = useState([])
  const [f, setF] = useState({ code: '', name: '', unit: 'pc', category: 'GENERAL', reorder_level: 0 })
  const load = async () => {
    const [{ data: it }, { data: sb }] = await Promise.all([
      supabase.from('inv_items').select('*').order('name'),
      supabase.from('v_stock_balance').select('*'),
    ])
    setItems(it || []); setStock(sb || [])
  }
  useEffect(() => { load() }, [])
  const onHand = (id) => stock.find((s) => s.id === id)?.on_hand ?? 0
  const add = async () => {
    if (!f.name.trim()) return
    const { error } = await supabase.from('inv_items').insert({ ...f, reorder_level: +f.reorder_level })
    if (error) flash(error.message); else { setF({ code: '', name: '', unit: 'pc', category: 'GENERAL', reorder_level: 0 }); load() }
  }
  const del = async (id) => { const { error } = await supabase.from('inv_items').delete().eq('id', id); if (error) flash('Admin access required.'); else load() }
  return (
    <div className="space-y-4">
      <div className="card p-4 grid grid-cols-6 gap-2">
        <input className="input" placeholder="Code" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />
        <input className="input col-span-2" placeholder="Item name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className="input" placeholder="Unit" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} />
        <input className="input" placeholder="Category" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
        <button className="btn-primary justify-center" onClick={add}><Plus size={15} /> Add</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr><th className="th">Code</th><th className="th">Item</th><th className="th">Unit</th><th className="th">Category</th><th className="th text-right">Reorder</th><th className="th text-right">On hand</th><th className="th"></th></tr></thead>
          <tbody>
            {items.map((it) => { const oh = onHand(it.id); return (
              <tr key={it.id} className={oh <= it.reorder_level && it.reorder_level > 0 ? 'bg-red-50' : ''}>
                <td className="td money text-xs">{it.code || '—'}</td><td className="td text-sm font-medium">{it.name}</td>
                <td className="td text-sm">{it.unit}</td><td className="td text-xs">{it.category}</td>
                <td className="td money text-right">{Number(it.reorder_level)}</td>
                <td className={`td money text-right font-semibold ${oh <= it.reorder_level && it.reorder_level > 0 ? 'text-red-600' : ''}`}>{Number(oh)}</td>
                <td className="td">{isAdmin && <button onClick={() => del(it.id)} className="text-red-300 hover:text-red-600"><Trash2 size={13} /></button>}</td>
              </tr>) })}
            {items.length === 0 && <tr><td className="td text-pine/40" colSpan={7}>No items yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function VendorsTab({ flash, isAdmin }) {
  const [rows, setRows] = useState([])
  const [f, setF] = useState({ name: '', bin: '', phone: '', address: '' })
  const load = async () => { const { data } = await supabase.from('vendors').select('*').order('name'); setRows(data || []) }
  useEffect(() => { load() }, [])
  const add = async () => { if (!f.name.trim()) return; const { error } = await supabase.from('vendors').insert(f); if (error) flash(error.message); else { setF({ name: '', bin: '', phone: '', address: '' }); load() } }
  const del = async (id) => { const { error } = await supabase.from('vendors').delete().eq('id', id); if (error) flash('Admin access required.'); else load() }
  return (
    <div className="space-y-4">
      <div className="card p-4 grid grid-cols-5 gap-2">
        <input className="input" placeholder="Vendor name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className="input money" placeholder="BIN" value={f.bin} onChange={(e) => setF({ ...f, bin: e.target.value })} />
        <input className="input" placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <input className="input" placeholder="Address" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
        <button className="btn-primary justify-center" onClick={add}><Plus size={15} /> Add</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr><th className="th">Vendor</th><th className="th">BIN</th><th className="th">Phone</th><th className="th">Address</th><th className="th"></th></tr></thead>
          <tbody>
            {rows.map((v) => (<tr key={v.id}><td className="td text-sm font-medium">{v.name}</td><td className="td money text-xs">{v.bin || '—'}</td><td className="td text-sm">{v.phone || '—'}</td><td className="td text-xs">{v.address || '—'}</td><td className="td">{isAdmin && <button onClick={() => del(v.id)} className="text-red-300 hover:text-red-600"><Trash2 size={13} /></button>}</td></tr>))}
            {rows.length === 0 && <tr><td className="td text-pine/40" colSpan={5}>No vendors.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LineEditor({ items, lines, setLines, withCost }) {
  const add = () => setLines([...lines, { item_id: '', item_name: '', qty: 1, unit_cost: 0, vat_pct: 0 }])
  const upd = (i, k, v) => { const n = [...lines]; n[i][k] = v; if (k === 'item_id') { const it = items.find((x) => x.id === v); n[i].item_name = it?.name || '' } setLines(n) }
  const del = (i) => setLines(lines.filter((_, idx) => idx !== i))
  return (
    <div className="space-y-2">
      {lines.map((l, i) => (
        <div key={i} className={`grid ${withCost ? 'grid-cols-12' : 'grid-cols-8'} gap-2 items-center`}>
          <select className="input col-span-4" value={l.item_id} onChange={(e) => upd(i, 'item_id', e.target.value)}>
            <option value="">Select item…</option>
            {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
          </select>
          <input type="number" className="input col-span-2 money" placeholder="Qty" value={l.qty} onChange={(e) => upd(i, 'qty', e.target.value)} />
          {withCost && <input type="number" className="input col-span-2 money" placeholder="Unit cost" value={l.unit_cost} onChange={(e) => upd(i, 'unit_cost', e.target.value)} />}
          {withCost && <input type="number" className="input col-span-2 money" placeholder="VAT amt" value={l.vat_pct} onChange={(e) => upd(i, 'vat_pct', e.target.value)} />}
          <button className="text-red-400 hover:text-red-600" onClick={() => del(i)}><Trash2 size={15} /></button>
        </div>
      ))}
      <button className="btn-ghost !py-1" onClick={add}><Plus size={14} /> Add line</button>
    </div>
  )
}

function RequisitionsTab({ flash, userName, canApprove }) {
  const [items, setItems] = useState([])
  const [rows, setRows] = useState([])
  const [dept, setDept] = useState('GENERAL')
  const [lines, setLines] = useState([])
  const load = async () => {
    const [{ data: it }, { data: rq }] = await Promise.all([
      supabase.from('inv_items').select('*').order('name'),
      supabase.from('requisitions').select('*, requisition_items(*)').order('created_at', { ascending: false }),
    ])
    setItems(it || []); setRows(rq || [])
  }
  useEffect(() => { load() }, [])
  const create = async () => {
    if (lines.length === 0) { flash('Add at least one line.'); return }
    const { data: r, error } = await supabase.from('requisitions').insert({ department: dept, requested_by: userName }).select().single()
    if (error) { flash(error.message); return }
    const { error: le } = await supabase.from('requisition_items').insert(lines.map((l) => ({ requisition_id: r.id, item_id: l.item_id || null, item_name: l.item_name, qty: +l.qty })))
    if (le) flash(le.message); else { setLines([]); load(); flash(`Requisition ${r.req_no} created.`) }
  }
  const setStatus = async (id, status) => { await supabase.from('requisitions').update({ status, approved_by: userName, approved_at: new Date().toISOString() }).eq('id', id); load() }
  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <div className="flex gap-2 items-center"><span className="label !mb-0">Department</span><input className="input !w-48" value={dept} onChange={(e) => setDept(e.target.value)} /></div>
        <LineEditor items={items} lines={lines} setLines={setLines} withCost={false} />
        <button className="btn-primary" onClick={create}><Plus size={15} /> Create requisition</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr><th className="th">Req No</th><th className="th">Date</th><th className="th">Dept</th><th className="th">By</th><th className="th">Items</th><th className="th">Status</th><th className="th"></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="td money font-semibold">{r.req_no}</td><td className="td money text-xs">{fmtDate(r.req_date)}</td>
                <td className="td text-xs">{r.department}</td><td className="td text-xs">{r.requested_by}</td>
                <td className="td text-xs">{(r.requisition_items || []).map((x) => `${x.item_name}×${x.qty}`).join(', ')}</td>
                <td className="td"><span className={`status-chip ${r.status === 'APPROVED' ? 'bg-forest/15 text-forest' : r.status === 'REJECTED' ? 'bg-red-100 text-red-600' : 'bg-amber/20 text-amber'}`}>{r.status}</span></td>
                <td className="td">{r.status === 'PENDING' && canApprove && (<div className="flex gap-1"><button className="text-forest" title="Approve" onClick={() => setStatus(r.id, 'APPROVED')}><Check size={15} /></button><button className="text-red-500" title="Reject" onClick={() => setStatus(r.id, 'REJECTED')}><X size={15} /></button></div>)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="td text-pine/40" colSpan={7}>No requisitions.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function POTab({ flash, userName }) {
  const [items, setItems] = useState([]); const [vendors, setVendors] = useState([]); const [rows, setRows] = useState([])
  const [vendor, setVendor] = useState(''); const [lines, setLines] = useState([])
  const load = async () => {
    const [{ data: it }, { data: v }, { data: po }] = await Promise.all([
      supabase.from('inv_items').select('*').order('name'),
      supabase.from('vendors').select('*').eq('is_active', true).order('name'),
      supabase.from('purchase_orders').select('*, vendors(name), po_items(*)').order('created_at', { ascending: false }),
    ])
    setItems(it || []); setVendors(v || []); setRows(po || [])
  }
  useEffect(() => { load() }, [])
  const create = async () => {
    if (!vendor) { flash('Select a vendor.'); return }
    if (lines.length === 0) { flash('Add at least one line.'); return }
    const { data: po, error } = await supabase.from('purchase_orders').insert({ vendor_id: vendor, created_by: userName }).select().single()
    if (error) { flash(error.message); return }
    const { error: le } = await supabase.from('po_items').insert(lines.map((l) => ({ po_id: po.id, item_id: l.item_id || null, item_name: l.item_name, qty: +l.qty, unit_cost: +l.unit_cost, vat_pct: +l.vat_pct })))
    if (le) flash(le.message); else { setLines([]); setVendor(''); load(); flash(`PO ${po.po_no} created.`) }
  }
  const setStatus = async (id, status) => { await supabase.from('purchase_orders').update({ status }).eq('id', id); load() }
  const poTotal = (po) => (po.po_items || []).reduce((a, l) => a + (+l.qty * +l.unit_cost), 0)
  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <select className="input !w-64" value={vendor} onChange={(e) => setVendor(e.target.value)}><option value="">Select vendor…</option>{vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
        <LineEditor items={items} lines={lines} setLines={setLines} withCost={true} />
        <button className="btn-primary" onClick={create}><Truck size={15} /> Create PO</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr><th className="th">PO No</th><th className="th">Date</th><th className="th">Vendor</th><th className="th text-right">Value</th><th className="th">Status</th><th className="th"></th></tr></thead>
          <tbody>
            {rows.map((po) => (
              <tr key={po.id}>
                <td className="td money font-semibold">{po.po_no}</td><td className="td money text-xs">{fmtDate(po.po_date)}</td>
                <td className="td text-sm">{po.vendors?.name}</td><td className="td money text-right">{fmtBDT(poTotal(po))}</td>
                <td className="td"><span className={`status-chip ${po.status === 'RECEIVED' ? 'bg-forest/15 text-forest' : po.status === 'CANCELLED' ? 'bg-red-100 text-red-600' : 'bg-amber/20 text-amber'}`}>{po.status}</span></td>
                <td className="td">{['OPEN', 'PARTIAL'].includes(po.status) && <button className="btn-ghost !py-1 text-red-600" onClick={() => setStatus(po.id, 'CANCELLED')}>Cancel</button>}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="td text-pine/40" colSpan={6}>No purchase orders.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function GRNTab({ flash, userName }) {
  const [items, setItems] = useState([]); const [vendors, setVendors] = useState([]); const [pos, setPos] = useState([]); const [rows, setRows] = useState([])
  const [h, setH] = useState({ vendor_id: '', po_id: '', vendor_invoice_no: '', vendor_invoice_date: todayISO(), rebateable: true })
  const [lines, setLines] = useState([])
  const load = async () => {
    const [{ data: it }, { data: v }, { data: po }, { data: grn }] = await Promise.all([
      supabase.from('inv_items').select('*').order('name'),
      supabase.from('vendors').select('*').eq('is_active', true).order('name'),
      supabase.from('purchase_orders').select('id, po_no').in('status', ['OPEN', 'PARTIAL']),
      supabase.from('goods_receipts').select('*, vendors(name), grn_items(*)').order('created_at', { ascending: false }),
    ])
    setItems(it || []); setVendors(v || []); setPos(po || []); setRows(grn || [])
  }
  useEffect(() => { load() }, [])
  const create = async () => {
    if (!h.vendor_id) { flash('Select a vendor.'); return }
    if (lines.length === 0) { flash('Add at least one line.'); return }
    const { data: grn, error } = await supabase.from('goods_receipts').insert({ vendor_id: h.vendor_id, po_id: h.po_id || null, vendor_invoice_no: h.vendor_invoice_no, vendor_invoice_date: h.vendor_invoice_date, rebateable: h.rebateable, created_by: userName }).select().single()
    if (error) { flash(error.message); return }
    const { error: le } = await supabase.from('grn_items').insert(lines.map((l) => ({ grn_id: grn.id, item_id: l.item_id || null, item_name: l.item_name, qty: +l.qty, unit_cost: +l.unit_cost, vat_amount: +l.vat_pct })))
    if (le) { flash(le.message); return }
    if (h.po_id) await supabase.from('purchase_orders').update({ status: 'RECEIVED' }).eq('id', h.po_id)
    setLines([]); setH({ vendor_id: '', po_id: '', vendor_invoice_no: '', vendor_invoice_date: todayISO(), rebateable: true }); load()
    flash(`${grn.grn_no} received — stock updated and VAT-6.1 purchase register posted${h.rebateable ? ' (rebateable)' : ''}.`)
  }
  const grnTotal = (g) => (g.grn_items || []).reduce((a, l) => a + (+l.qty * +l.unit_cost + +l.vat_amount), 0)
  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-4 gap-2">
          <select className="input" value={h.vendor_id} onChange={(e) => setH({ ...h, vendor_id: e.target.value })}><option value="">Vendor…</option>{vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
          <select className="input" value={h.po_id} onChange={(e) => setH({ ...h, po_id: e.target.value })}><option value="">PO (optional)…</option>{pos.map((p) => <option key={p.id} value={p.id}>{p.po_no}</option>)}</select>
          <input className="input money" placeholder="Vendor invoice no" value={h.vendor_invoice_no} onChange={(e) => setH({ ...h, vendor_invoice_no: e.target.value })} />
          <input type="date" className="input" value={h.vendor_invoice_date} onChange={(e) => setH({ ...h, vendor_invoice_date: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-forest" checked={h.rebateable} onChange={(e) => setH({ ...h, rebateable: e.target.checked })} /> Input VAT is rebateable (valid 6.3 received from vendor)</label>
        <p className="text-xs text-pine/50">VAT column = total VAT amount on the line (Tk), not %. It feeds the 6.1 purchase register.</p>
        <LineEditor items={items} lines={lines} setLines={setLines} withCost={true} />
        <button className="btn-primary" onClick={create}><PackageCheck size={15} /> Receive goods</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr><th className="th">GRN No</th><th className="th">Date</th><th className="th">Vendor</th><th className="th">Invoice</th><th className="th text-right">Value</th><th className="th">Rebate</th></tr></thead>
          <tbody>
            {rows.map((g) => (
              <tr key={g.id}>
                <td className="td money font-semibold">{g.grn_no}</td><td className="td money text-xs">{fmtDate(g.grn_date)}</td>
                <td className="td text-sm">{g.vendors?.name}</td><td className="td text-xs">{g.vendor_invoice_no || '—'}</td>
                <td className="td money text-right">{fmtBDT(grnTotal(g))}</td>
                <td className="td text-xs">{g.rebateable ? 'Yes' : 'No'}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="td text-pine/40" colSpan={6}>No goods receipts.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TransfersTab({ flash, userName }) {
  const [items, setItems] = useState([]); const [rows, setRows] = useState([])
  const [h, setH] = useState({ from_location: 'STORE', to_location: 'KITCHEN' }); const [lines, setLines] = useState([])
  const load = async () => {
    const [{ data: it }, { data: tr }] = await Promise.all([
      supabase.from('inv_items').select('*').order('name'),
      supabase.from('stock_transfers').select('*, transfer_items(*)').order('created_at', { ascending: false }),
    ])
    setItems(it || []); setRows(tr || [])
  }
  useEffect(() => { load() }, [])
  const create = async () => {
    if (lines.length === 0) { flash('Add at least one line.'); return }
    const { data: tr, error } = await supabase.from('stock_transfers').insert({ ...h, created_by: userName }).select().single()
    if (error) { flash(error.message); return }
    const { error: le } = await supabase.from('transfer_items').insert(lines.map((l) => ({ transfer_id: tr.id, item_id: l.item_id || null, item_name: l.item_name, qty: +l.qty })))
    if (le) flash(le.message); else { setLines([]); load(); flash(`${tr.trf_no} posted — stock moved out of ${h.from_location}.`) }
  }
  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label">From</label><input className="input" value={h.from_location} onChange={(e) => setH({ ...h, from_location: e.target.value })} /></div>
          <div><label className="label">To</label><input className="input" value={h.to_location} onChange={(e) => setH({ ...h, to_location: e.target.value })} /></div>
        </div>
        <LineEditor items={items} lines={lines} setLines={setLines} withCost={false} />
        <button className="btn-primary" onClick={create}><ArrowLeftRight size={15} /> Post transfer</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr><th className="th">TRF No</th><th className="th">Date</th><th className="th">From → To</th><th className="th">Items</th></tr></thead>
          <tbody>
            {rows.map((t) => (<tr key={t.id}><td className="td money font-semibold">{t.trf_no}</td><td className="td money text-xs">{fmtDate(t.trf_date)}</td><td className="td text-sm">{t.from_location} → {t.to_location}</td><td className="td text-xs">{(t.transfer_items || []).map((x) => `${x.item_name}×${x.qty}`).join(', ')}</td></tr>))}
            {rows.length === 0 && <tr><td className="td text-pine/40" colSpan={4}>No transfers.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ReturnsTab({ flash, userName }) {
  const [items, setItems] = useState([]); const [vendors, setVendors] = useState([]); const [rows, setRows] = useState([])
  const [h, setH] = useState({ return_type: 'TO_STORE', vendor_id: '', from_location: 'KITCHEN' }); const [lines, setLines] = useState([])
  const load = async () => {
    const [{ data: it }, { data: v }, { data: rt }] = await Promise.all([
      supabase.from('inv_items').select('*').order('name'),
      supabase.from('vendors').select('*').eq('is_active', true).order('name'),
      supabase.from('stock_returns').select('*, vendors(name), return_items(*)').order('created_at', { ascending: false }),
    ])
    setItems(it || []); setVendors(v || []); setRows(rt || [])
  }
  useEffect(() => { load() }, [])
  const create = async () => {
    if (lines.length === 0) { flash('Add at least one line.'); return }
    const { data: rt, error } = await supabase.from('stock_returns').insert({ return_type: h.return_type, vendor_id: h.return_type === 'TO_VENDOR' ? (h.vendor_id || null) : null, from_location: h.from_location, created_by: userName }).select().single()
    if (error) { flash(error.message); return }
    const { error: le } = await supabase.from('return_items').insert(lines.map((l) => ({ return_id: rt.id, item_id: l.item_id || null, item_name: l.item_name, qty: +l.qty })))
    if (le) flash(le.message); else { setLines([]); load(); flash(`${rt.ret_no} posted.`) }
  }
  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <select className="input" value={h.return_type} onChange={(e) => setH({ ...h, return_type: e.target.value })}><option value="TO_STORE">Return to Store (back in stock)</option><option value="TO_VENDOR">Return to Vendor (out of stock)</option></select>
          {h.return_type === 'TO_VENDOR' && <select className="input" value={h.vendor_id} onChange={(e) => setH({ ...h, vendor_id: e.target.value })}><option value="">Vendor…</option>{vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select>}
          <input className="input" placeholder="From location" value={h.from_location} onChange={(e) => setH({ ...h, from_location: e.target.value })} />
        </div>
        <LineEditor items={items} lines={lines} setLines={setLines} withCost={false} />
        <button className="btn-primary" onClick={create}><Undo2 size={15} /> Post return</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr><th className="th">RET No</th><th className="th">Date</th><th className="th">Type</th><th className="th">Vendor</th><th className="th">Items</th></tr></thead>
          <tbody>
            {rows.map((r) => (<tr key={r.id}><td className="td money font-semibold">{r.ret_no}</td><td className="td money text-xs">{fmtDate(r.ret_date)}</td><td className="td text-xs">{r.return_type}</td><td className="td text-sm">{r.vendors?.name || '—'}</td><td className="td text-xs">{(r.return_items || []).map((x) => `${x.item_name}×${x.qty}`).join(', ')}</td></tr>))}
            {rows.length === 0 && <tr><td className="td text-pine/40" colSpan={5}>No returns.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
