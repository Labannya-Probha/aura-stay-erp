import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { fmtBDT, fmtDate, todayISO } from '../lib/helpers'
import KPICards from '../components/KPICards.jsx'
import AedsDataGrid from '../components/data-grid/AedsDataGrid.jsx'
import {
  Boxes,
  Plus,
  Trash2,
  Check,
  X,
  Truck,
  PackageCheck,
  ArrowLeftRight,
  Undo2,
  Pencil,
  Save,
  Search,
  ChevronRight,
  Printer,
} from 'lucide-react'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'

const TABS = [
  'Items & Stock',
  'Vendors',
  'Requisitions',
  'Purchase Orders',
  'Goods Receipt',
  'Transfers',
  'Returns',
]
const TAB_LABEL_BY_ID = {
  stock: 'Items & Stock',
  vendors: 'Vendors',
  requisitions: 'Requisitions',
  'purchase-orders': 'Purchase Orders',
  'goods-receipt': 'Goods Receipt',
  transfers: 'Transfers',
  returns: 'Returns',
}
const LEGACY_TAB_MAP = {
  ...TAB_LABEL_BY_ID,
  'Consumption Entry': null,
  Consumption: null,
}
const TAB_ID_BY_LABEL = Object.entries(TAB_LABEL_BY_ID).reduce(
  (acc, [id, label]) => ({ ...acc, [label]: id }),
  {},
)
const selectClass =
  'h-9 w-full rounded-2xl border border-transparent bg-input/50 px-2.5 py-1 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30'

function normalizeTabLabel(value) {
  if (!value) return 'Items & Stock'
  if (TABS.includes(value)) return value
  return LEGACY_TAB_MAP[value] || 'Items & Stock'
}

/* ─── shared helpers ─────────────────────────────────────────────────────── */
function flash_fn(setMsg) {
  return (m, type = 'ok') => {
    setMsg({ text: m, type })
    setTimeout(() => setMsg(null), 5000)
  }
}

function FlashBar({ msg }) {
  if (!msg) return null
  const bg = msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-forest/10 text-forest'
  return <div className={`px-4 py-3 rounded-lg text-sm font-medium ${bg}`}>{msg.text}</div>
}

function esc(v) {
  return String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function printInventoryDoc({ title, docNo, meta = [], lines = [] }) {
  const w = window.open('', '_blank', 'width=900,height=800')
  if (!w) return
  const rows = lines
    .map(
      (l, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${esc(l.item_name || '—')}</td>
        <td style="text-align:right">${Number(l.qty || 0)}</td>
        <td style="text-align:right">${Number(l.unit_cost || 0).toFixed(2)}</td>
        <td style="text-align:right">${(Number(l.qty || 0) * Number(l.unit_cost || 0)).toFixed(2)}</td>
      </tr>`,
    )
    .join('')
  const metaRows = meta.map((m) => `<div><b>${esc(m.label)}:</b> ${esc(m.value)}</div>`).join('')
  const html = `<!doctype html>
  <html><head><meta charset="utf-8" /><title>${esc(title)}</title>
  <style>
    body{font-family:Inter,Arial,sans-serif;padding:24px;color:#111}
    h1{font-size:20px;margin:0 0 6px}
    .muted{color:#555;font-size:13px;margin-bottom:14px}
    table{width:100%;border-collapse:collapse;margin-top:10px}
    th,td{border:1px solid #d6d6d6;padding:6px 8px;font-size:12px}
    th{background:#f5f7f6;text-align:left}
  </style></head>
  <body>
    <h1>${esc(title)}</h1>
    <div class="muted"><b>Document:</b> ${esc(docNo)} | <b>Printed:</b> ${new Date().toLocaleString()}</div>
    ${metaRows}
    <table>
      <thead><tr><th>#</th><th>Item</th><th>Qty</th><th>Unit Cost</th><th>Total</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5">No lines</td></tr>'}</tbody>
    </table>
    <script>window.print();</script>
  </body></html>`
  w.document.open()
  w.document.write(html)
  w.document.close()
}

/* ─── main component ─────────────────────────────────────────────────────── */
export default function InventoryHub({
  userName,
  role,
  isAdmin,
  embedded = false,
  controlledTabId = null,
  onTabIdChange = null,
}) {
  const location = useLocation()
  const initialTab = normalizeTabLabel(
    controlledTabId || new URLSearchParams(location.search).get('tab'),
  )
  const [tab, setTab] = useState(initialTab)
  const [msg, setMsg] = useState(null)
  const flash = flash_fn(setMsg)
  const canApprove = isAdmin || role === 'MANAGER'

  const changeTab = (tabLabel) => {
    setTab(tabLabel)
    const tabId = TAB_ID_BY_LABEL[tabLabel]
    if (tabId && onTabIdChange) onTabIdChange(tabId)
  }

  // Sync tab with external route tab
  useEffect(() => {
    if (!controlledTabId) return
    setTab(normalizeTabLabel(controlledTabId))
  }, [controlledTabId])

  // Sync tab with URL param when used as standalone page
  useEffect(() => {
    if (controlledTabId) return
    const t = normalizeTabLabel(new URLSearchParams(location.search).get('tab'))
    setTab(t)
  }, [location.search, controlledTabId])

  // Cross-tab navigation: Requisitions can push user to PO or Transfer tab
  // with a pre-selected requisition
  const [navReq, setNavReq] = useState(null) // { id, req_no, type: 'PO'|'TRF' }
  const goCreatePO = (req) => {
    setNavReq({ ...req, type: 'PO' })
    changeTab('Purchase Orders')
  }
  const goCreateTRF = (req) => {
    setNavReq({ ...req, type: 'TRF' })
    changeTab('Transfers')
  }

  return (
    <div className="space-y-5">
      {!embedded && (
        <>
          <div>
            <h1 className="font-display text-2xl font-bold text-pine flex items-center gap-2">
              <Boxes className="text-forest" /> Inventory & Procurement
            </h1>
            <p className="text-sm text-pine/60">
              Requisition → Purchase Order / Transfer → Goods Receipt — fully integrated procurement
              workflow.
            </p>
          </div>
          <KPICards module="inventory" />
        </>
      )}
      <FlashBar msg={msg} />
      {!embedded && (
        <div className="tab-strip-responsive border-b border-leaf">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => {
                changeTab(t)
                if (t !== 'Purchase Orders' && t !== 'Transfers') setNavReq(null)
              }}
              className={`tab-button-responsive px-4 py-2 text-sm font-semibold rounded-t-lg whitespace-nowrap ${tab === t ? 'bg-white border border-leaf border-b-white text-forest -mb-px' : 'text-pine/60 hover:text-pine'}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      {tab === 'Items & Stock' && <ItemsTab flash={flash} isAdmin={isAdmin} />}
      {tab === 'Vendors' && <VendorsTab flash={flash} isAdmin={isAdmin} />}
      {tab === 'Requisitions' && (
        <RequisitionsTab
          flash={flash}
          userName={userName}
          canApprove={canApprove}
          onCreatePO={goCreatePO}
          onCreateTRF={goCreateTRF}
        />
      )}
      {tab === 'Purchase Orders' && (
        <POTab
          flash={flash}
          userName={userName}
          canApprove={canApprove}
          navReq={navReq}
          clearNav={() => setNavReq(null)}
        />
      )}
      {tab === 'Goods Receipt' && <GRNTab flash={flash} userName={userName} />}
      {tab === 'Transfers' && (
        <TransfersTab
          flash={flash}
          userName={userName}
          navReq={navReq}
          clearNav={() => setNavReq(null)}
        />
      )}
      {tab === 'Returns' && <ReturnsTab flash={flash} userName={userName} />}
    </div>
  )
}

/* ─── useLocations hook ──────────────────────────────────────────────────── */
function useLocations() {
  const [locs, setLocs] = useState([])
  useEffect(() => {
    supabase
      .from('store_locations')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setLocs(data || []))
  }, [])
  return locs
}

/* ─── Items & Stock ──────────────────────────────────────────────────────── */
function ItemsTab({ flash, isAdmin }) {
  const [items, setItems] = useState([])
  const [stock, setStock] = useState([])
  const [search, setSearch] = useState('')
  const [f, setF] = useState({
    code: '',
    name: '',
    unit: 'pc',
    category: 'GENERAL',
    reorder_level: 0,
  })
  const [editId, setEditId] = useState(null)

  const load = async () => {
    const [{ data: it }, { data: sb }] = await Promise.all([
      supabase.from('inv_items').select('*').order('name'),
      supabase.from('v_stock_balance').select('*'),
    ])
    setItems(it || [])
    setStock(sb || [])
  }
  useEffect(() => {
    load()
  }, [])

  const onHand = (id) => +(stock.find((s) => s.id === id)?.on_hand ?? 0)

  const save = async () => {
    if (!f.name.trim()) return
    if (editId) {
      const { error } = await supabase
        .from('inv_items')
        .update({ ...f, reorder_level: +f.reorder_level })
        .eq('id', editId)
      if (error) {
        flash(error.message, 'error')
        return
      }
      setEditId(null)
    } else {
      const { error } = await supabase
        .from('inv_items')
        .insert({ ...f, reorder_level: +f.reorder_level })
      if (error) {
        flash(error.message, 'error')
        return
      }
    }
    setF({ code: '', name: '', unit: 'pc', category: 'GENERAL', reorder_level: 0 })
    load()
  }

  const startEdit = (it) => {
    setEditId(it.id)
    setF({
      code: it.code || '',
      name: it.name,
      unit: it.unit,
      category: it.category,
      reorder_level: it.reorder_level,
    })
  }
  const del = async (id) => {
    const { error } = await supabase.from('inv_items').delete().eq('id', id)
    if (error) flash('Cannot delete — item may be in use.', 'error')
    else load()
  }

  const filtered = items.filter(
    (it) =>
      !search ||
      it.name.toLowerCase().includes(search.toLowerCase()) ||
      (it.code || '').toLowerCase().includes(search.toLowerCase()),
  )
  const lowStock = items.filter(
    (it) => it.reorder_level > 0 && onHand(it.id) <= it.reorder_level,
  ).length

  const itemGridRows = filtered.map((item) => {
    const onHandQty = onHand(item.id)
    const low = item.reorder_level > 0 && onHandQty <= item.reorder_level

    return {
      ...item,
      on_hand: onHandQty,
      stock_status: low ? 'LOW STOCK' : 'AVAILABLE',
    }
  })

  const itemColumns = [
    { accessorKey: 'code', header: 'Code', width: 120 },
    { accessorKey: 'name', header: 'Item', width: 230 },
    { accessorKey: 'unit', header: 'Unit', width: 100 },
    { accessorKey: 'category', header: 'Category', width: 150 },
    { accessorKey: 'reorder_level', header: 'Reorder', type: 'number', width: 120 },
    { accessorKey: 'on_hand', header: 'On Hand', type: 'number', aggregation: 'sum', width: 130 },
    { accessorKey: 'stock_status', header: 'Status', type: 'status', width: 130 },
    {
      accessorKey: 'actions',
      header: 'Actions',
      sortable: false,
      width: 130,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon-xs"
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              startEdit(row)
            }}
            className="text-pine/40 hover:text-forest"
            aria-label={`Edit ${row.name}`}
          >
            <Pencil size={13} />
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon-xs"
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                del(row.id)
              }}
              className="text-red-300 hover:text-red-600"
              aria-label={`Delete ${row.name}`}
            >
              <Trash2 size={13} />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {lowStock > 0 && (
        <div className="px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          ⚠ {lowStock} item{lowStock > 1 ? 's' : ''} at or below reorder level
        </div>
      )}
      <div className="card p-4 space-y-3">
        <h3 className="font-semibold text-pine text-sm">{editId ? '✏ Edit item' : '+ New item'}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          <Input
            placeholder="Code"
            value={f.code}
            onChange={(e) => setF({ ...f, code: e.target.value })}
          />
          <Input
            className="sm:col-span-2"
            placeholder="Item name *"
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
          />
          <Input
            placeholder="Unit"
            value={f.unit}
            onChange={(e) => setF({ ...f, unit: e.target.value })}
          />
          <Input
            placeholder="Category"
            value={f.category}
            onChange={(e) => setF({ ...f, category: e.target.value })}
          />
          <Input
            type="number"
            className="money"
            placeholder="Reorder level"
            value={f.reorder_level}
            onChange={(e) => setF({ ...f, reorder_level: e.target.value })}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={save}>
            {editId ? (
              <>
                <Save size={15} /> Update
              </>
            ) : (
              <>
                <Plus size={15} /> Add item
              </>
            )}
          </Button>
          {editId && (
            <Button
              variant="ghost"
              onClick={() => {
                setEditId(null)
                setF({ code: '', name: '', unit: 'pc', category: 'GENERAL', reorder_level: 0 })
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-pine/30" />
        <Input
          className="pl-9"
          placeholder="Search items…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <AedsDataGrid
        title="Items & Stock"
        subtitle="Inventory master, reorder level and live stock balance"
        data={itemGridRows}
        columns={itemColumns}
        pageSize={100}
        emptyText="No items found."
        getRowId={(row) => row.id}
      />
    </div>
  )
}

/* ─── Vendors ────────────────────────────────────────────────────────────── */
function VendorsTab({ flash, isAdmin }) {
  const [rows, setRows] = useState([])
  const [f, setF] = useState({ name: '', bin: '', phone: '', address: '' })
  const [editId, setEditId] = useState(null)

  const load = async () => {
    const { data } = await supabase.from('vendors').select('*').order('name')
    setRows(data || [])
  }
  useEffect(() => {
    load()
  }, [])

  const save = async () => {
    if (!f.name.trim()) return
    const { error } = editId
      ? await supabase.from('vendors').update(f).eq('id', editId)
      : await supabase.from('vendors').insert(f)
    if (error) {
      flash(error.message, 'error')
      return
    }
    setF({ name: '', bin: '', phone: '', address: '' })
    setEditId(null)
    load()
  }

  const del = async (id) => {
    const { error } = await supabase.from('vendors').delete().eq('id', id)
    if (error) flash('Cannot delete — vendor may be in use.', 'error')
    else load()
  }

  const vendorColumns = [
    { accessorKey: 'name', header: 'Vendor', width: 230 },
    { accessorKey: 'bin', header: 'BIN', width: 160 },
    { accessorKey: 'phone', header: 'Phone', width: 150 },
    { accessorKey: 'address', header: 'Address', width: 280 },
    {
      accessorKey: 'actions',
      header: 'Actions',
      sortable: false,
      width: 130,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon-xs"
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              setEditId(row.id)
              setF({
                name: row.name,
                bin: row.bin || '',
                phone: row.phone || '',
                address: row.address || '',
              })
            }}
            className="text-pine/40 hover:text-forest"
            aria-label={`Edit ${row.name}`}
          >
            <Pencil size={13} />
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon-xs"
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                del(row.id)
              }}
              className="text-red-300 hover:text-red-600"
              aria-label={`Delete ${row.name}`}
            >
              <Trash2 size={13} />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <h3 className="font-semibold text-pine text-sm">
          {editId ? '✏ Edit vendor' : '+ New vendor'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Input
            className="sm:col-span-2"
            placeholder="Vendor name *"
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
          />
          <Input
            className="money"
            placeholder="BIN"
            value={f.bin}
            onChange={(e) => setF({ ...f, bin: e.target.value })}
          />
          <Input
            placeholder="Phone"
            value={f.phone}
            onChange={(e) => setF({ ...f, phone: e.target.value })}
          />
          <Input
            className="sm:col-span-4"
            placeholder="Address"
            value={f.address}
            onChange={(e) => setF({ ...f, address: e.target.value })}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={save}>
            {editId ? (
              <>
                <Save size={15} /> Update
              </>
            ) : (
              <>
                <Plus size={15} /> Add vendor
              </>
            )}
          </Button>
          {editId && (
            <Button
              variant="ghost"
              onClick={() => {
                setEditId(null)
                setF({ name: '', bin: '', phone: '', address: '' })
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      <AedsDataGrid
        title="Vendors"
        subtitle="Supplier master and procurement contacts"
        data={rows}
        columns={vendorColumns}
        pageSize={100}
        emptyText="No vendors found."
        getRowId={(row) => row.id}
      />
    </div>
  )
}

/* ─── shared LineEditor ──────────────────────────────────────────────────── */
function LineEditor({ items, lines, setLines, withCost = false, readOnly = false }) {
  const add = () =>
    setLines([...lines, { item_id: '', item_name: '', qty: 1, unit_cost: 0, unit: '' }])
  const upd = (i, k, v) => {
    const n = [...lines]
    n[i] = { ...n[i], [k]: v }
    if (k === 'item_id') {
      const it = items.find((x) => x.id === v)
      n[i].item_name = it?.name || ''
      n[i].unit = it?.unit || ''
    }
    setLines(n)
  }
  const del = (i) => setLines(lines.filter((_, idx) => idx !== i))

  if (lines.length === 0 && readOnly) return <p className="text-sm text-pine/40">No items.</p>

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-1 text-xs text-pine/50 font-semibold px-1">
        <span className="col-span-5">Item</span>
        <span className="col-span-2 text-right">Qty</span>
        {withCost && (
          <>
            <span className="col-span-2 text-right">Unit cost</span>
            <span className="col-span-2 text-right">Total</span>
          </>
        )}
      </div>
      {lines.map((l, i) => (
        <div key={i} className="grid grid-cols-12 gap-1 items-center">
          {readOnly ? (
            <span className="col-span-5 text-sm">
              {l.item_name || '—'} <span className="text-xs text-pine/40">({l.unit})</span>
            </span>
          ) : (
            <select
              className={`${selectClass} col-span-5 text-sm`}
              value={l.item_id}
              onChange={(e) => upd(i, 'item_id', e.target.value)}
            >
              <option value="">Select item…</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name} ({it.unit})
                </option>
              ))}
            </select>
          )}
          <Input
            type="number"
            readOnly={readOnly}
            className={`col-span-2 money text-right text-sm ${readOnly ? 'bg-leaf/20' : ''}`}
            value={l.qty}
            onChange={(e) => upd(i, 'qty', e.target.value)}
          />
          {withCost && (
            <>
              <Input
                type="number"
                readOnly={readOnly}
                className={`col-span-2 money text-right text-sm ${readOnly ? 'bg-leaf/20' : ''}`}
                value={l.unit_cost}
                onChange={(e) => upd(i, 'unit_cost', e.target.value)}
              />
              <span
                className={`col-span-2 money text-right text-sm px-1 py-1 ${readOnly ? 'text-pine/60' : 'text-pine'}`}
              >
                {(Number(l.qty || 0) * Number(l.unit_cost || 0)).toFixed(2)}
              </span>
            </>
          )}
          {!readOnly && (
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-red-300 hover:text-red-600 col-span-1"
              onClick={() => del(i)}
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      ))}
      {!readOnly && (
        <Button variant="ghost" size="sm" className="text-sm" onClick={add}>
          <Plus size={13} /> Add line
        </Button>
      )}
    </div>
  )
}

/* ─── Requisitions ───────────────────────────────────────────────────────── */
function RequisitionsTab({ flash, userName, canApprove, onCreatePO, onCreateTRF }) {
  const [items, setItems] = useState([])
  const [rows, setRows] = useState([])
  const [dept, setDept] = useState('GENERAL')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [editId, setEditId] = useState(null)

  const load = async () => {
    const [{ data: it }, { data: rq }] = await Promise.all([
      supabase.from('inv_items').select('*').order('name'),
      supabase
        .from('requisitions')
        .select(
          '*, requisition_items(*), purchase_orders(id,po_no,status), stock_transfers(id,trf_no)',
        )
        .order('created_at', { ascending: false }),
    ])
    setItems(it || [])
    setRows(rq || [])
  }
  useEffect(() => {
    load()
  }, [])

  const resetForm = () => {
    setDept('GENERAL')
    setNotes('')
    setLines([])
    setEditId(null)
  }

  const create = async () => {
    if (lines.length === 0) {
      flash('অন্তত একটা item যোগ করুন।', 'error')
      return
    }
    if (lines.some((l) => !l.item_id)) {
      flash('সব line-এ item বেছে নিন।', 'error')
      return
    }
    if (editId) {
      const { error } = await supabase
        .from('requisitions')
        .update({ department: dept, notes: notes || null })
        .eq('id', editId)
      if (error) {
        flash(error.message, 'error')
        return
      }
      await supabase.from('requisition_items').delete().eq('requisition_id', editId)
      await supabase
        .from('requisition_items')
        .insert(
          lines.map((l) => ({
            requisition_id: editId,
            item_id: l.item_id,
            item_name: l.item_name,
            qty: +l.qty,
            notes: l.notes || null,
          })),
        )
      resetForm()
      load()
      flash('Requisition updated.')
      return
    }
    const { data: r, error } = await supabase
      .from('requisitions')
      .insert({ department: dept, requested_by: userName, notes: notes || null })
      .select()
      .single()
    if (error) {
      flash(error.message, 'error')
      return
    }
    await supabase
      .from('requisition_items')
      .insert(
        lines.map((l) => ({
          requisition_id: r.id,
          item_id: l.item_id,
          item_name: l.item_name,
          qty: +l.qty,
          notes: l.notes || null,
        })),
      )
    resetForm()
    load()
    flash(`✓ ${r.req_no} তৈরি হয়েছে — Approve করলে PO বা Transfer তৈরি করা যাবে।`)
  }

  const setStatus = async (id, status) => {
    await supabase
      .from('requisitions')
      .update({ status, approved_by: userName, approved_at: new Date().toISOString() })
      .eq('id', id)
    load()
  }

  // Approve + auto-route: check stock → Transfer if sufficient, PO if not
  const approveWithRouting = async (r) => {
    const itemIds = [
      ...new Set((r.requisition_items || []).map((it) => it.item_id).filter(Boolean)),
    ]
    let sb = []
    if (itemIds.length > 0) {
      const { data, error: sbError } = await supabase
        .from('v_stock_balance')
        .select('id,on_hand')
        .in('id', itemIds)
      if (sbError) {
        flash(sbError.message, 'error')
        return
      }
      sb = data || []
    }

    const stockMap = {}
    sb.forEach((s) => {
      stockMap[s.id] = +(s.on_hand ?? 0)
    })

    const allInStock = (r.requisition_items || []).every(
      (it) => (stockMap[it.item_id] ?? 0) >= +it.qty,
    )
    const routeDecision = allInStock ? 'TRANSFER' : 'PO'

    const { data: approvedReq, error: approveError } = await supabase
      .from('requisitions')
      .update({
        status: 'APPROVED',
        approved_by: userName,
        approved_at: new Date().toISOString(),
        route_decision: routeDecision,
      })
      .eq('id', r.id)
      .eq('status', 'PENDING')
      .select('id')
      .maybeSingle()
    if (approveError) {
      flash(approveError.message, 'error')
      return
    }
    if (!approvedReq) {
      flash(`${r.req_no} is no longer pending approval.`, 'error')
      await load()
      return
    }

    await load()

    if (allInStock) {
      flash(`✓ ${r.req_no} approved — stock is available. Auto-routing to Stock Transfer.`)
      onCreateTRF({ id: r.id, req_no: r.req_no, items: r.requisition_items })
    } else {
      flash(`✓ ${r.req_no} approved — insufficient stock. Auto-routing to Purchase Order.`)
      onCreatePO({ id: r.id, req_no: r.req_no, items: r.requisition_items })
    }
  }

  const statusChip = (s) =>
    ({
      PENDING: 'bg-amber/20 text-amber',
      APPROVED: 'bg-forest/15 text-forest',
      REJECTED: 'bg-red-100 text-red-600',
      CLOSED: 'bg-stone-200 text-stone-500',
      CANCELLED: 'bg-red-100 text-red-600',
    })[s] || 'bg-stone-100 text-stone-500'

  const editReq = (r) => {
    setEditId(r.id)
    setDept(r.department || 'GENERAL')
    setNotes(r.notes || '')
    setLines(
      (r.requisition_items || []).map((it) => ({
        item_id: it.item_id || '',
        item_name: it.item_name || '',
        qty: Number(it.qty || 0),
        unit_cost: 0,
        vat_pct: 0,
        unit: '',
        notes: it.notes || '',
      })),
    )
  }

  const printReq = (r) => {
    printInventoryDoc({
      title: 'Inventory Requisition',
      docNo: r.req_no,
      meta: [
        { label: 'Date', value: fmtDate(r.req_date) },
        { label: 'Department', value: r.department },
        { label: 'Requested By', value: r.requested_by },
        { label: 'Status', value: r.status },
      ],
      lines: r.requisition_items || [],
    })
  }

  const requisitionGridRows = rows.map((row) => ({
    ...row,
    item_count: (row.requisition_items || []).length,
    route: row.route_decision || '—',
    item_summary: (row.requisition_items || [])
      .map((item) => `${item.item_name} (${item.qty})`)
      .join(', '),
  }))

  const requisitionColumns = [
    { accessorKey: 'req_no', header: 'Req No', width: 150 },
    { accessorKey: 'req_date', header: 'Date', type: 'date', width: 130 },
    { accessorKey: 'department', header: 'Department', width: 150 },
    { accessorKey: 'requested_by', header: 'Requested By', width: 170 },
    { accessorKey: 'item_count', header: 'Items', type: 'number', width: 100 },
    { accessorKey: 'route', header: 'Route', width: 120 },
    { accessorKey: 'status', header: 'Status', type: 'status', width: 150 },
    { accessorKey: 'item_summary', header: 'Item Summary', width: 300 },
    {
      accessorKey: 'actions',
      header: 'Actions',
      sortable: false,
      width: 320,
      cell: ({ row }) => {
        const hasPO = (row.purchase_orders || []).length > 0
        const hasTRF = (row.stock_transfers || []).length > 0

        return (
          <div className="flex justify-end gap-1 flex-wrap">
            {row.status === 'PENDING' && canApprove && (
              <>
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-forest text-xs"
                  onClick={(event) => {
                    event.stopPropagation()
                    approveWithRouting(row)
                  }}
                >
                  <Check size={13} /> Approve
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-red-500 text-xs"
                  onClick={(event) => {
                    event.stopPropagation()
                    setStatus(row.id, 'REJECTED')
                  }}
                >
                  <X size={13} /> Reject
                </Button>
              </>
            )}
            {row.status === 'APPROVED' && (
              <>
                {!hasPO && (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-forest text-xs"
                    onClick={(event) => {
                      event.stopPropagation()
                      onCreatePO({ id: row.id, req_no: row.req_no, items: row.requisition_items })
                    }}
                  >
                    <Truck size={13} /> Create PO
                  </Button>
                )}
                {!hasTRF && (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-pine text-xs"
                    onClick={(event) => {
                      event.stopPropagation()
                      onCreateTRF({ id: row.id, req_no: row.req_no, items: row.requisition_items })
                    }}
                  >
                    <ArrowLeftRight size={13} /> Transfer
                  </Button>
                )}
                {(hasPO || hasTRF) && (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-stone-500 text-xs"
                    onClick={(event) => {
                      event.stopPropagation()
                      setStatus(row.id, 'CLOSED')
                    }}
                  >
                    Close
                  </Button>
                )}
              </>
            )}
            {row.status === 'PENDING' && (
              <>
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-pine text-xs"
                  onClick={(event) => {
                    event.stopPropagation()
                    editReq(row)
                  }}
                >
                  <Pencil size={13} /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-red-500 text-xs"
                  onClick={(event) => {
                    event.stopPropagation()
                    setStatus(row.id, 'CANCELLED')
                  }}
                >
                  <X size={13} /> Cancel
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="xs"
              className="text-pine text-xs"
              onClick={(event) => {
                event.stopPropagation()
                printReq(row)
              }}
            >
              <Printer size={13} /> Print
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div className="px-4 py-3 rounded-lg bg-forest/10 border border-forest/20 text-sm text-pine">
        <div className="font-semibold text-forest mb-0.5">
          ⚡ Approval &amp; Auto-routing workflow
        </div>
        <div className="text-xs text-pine/70">
          Create a requisition → ADMIN/MANAGER approves → system checks on-hand stock → auto-routes
          to <b>Stock Transfer</b> (stock available) or <b>Purchase Order</b> (stock insufficient).
        </div>
      </div>
      <div className="card p-4 space-y-3">
        <h3 className="font-display font-semibold text-pine">
          {editId ? 'Edit Requisition' : 'New Requisition'}
        </h3>
        <div className="flex gap-3 flex-wrap">
          <div>
            <label className="label">Department</label>
            <Input
              className="!w-48"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              placeholder="e.g. KITCHEN, HK"
            />
          </div>
          <div className="flex-1">
            <label className="label">Notes</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
            />
          </div>
        </div>
        <LineEditor items={items} lines={lines} setLines={setLines} withCost={false} />
        <div className="flex gap-2">
          <Button onClick={create}>
            {editId ? (
              <>
                <Save size={15} /> Update requisition
              </>
            ) : (
              <>
                <Plus size={15} /> Create requisition
              </>
            )}
          </Button>
          {editId && (
            <Button variant="ghost" onClick={resetForm}>
              Cancel edit
            </Button>
          )}
        </div>
      </div>

      <AedsDataGrid
        title="Requisitions"
        subtitle="Approval, stock routing and procurement initiation"
        data={requisitionGridRows}
        columns={requisitionColumns}
        pageSize={100}
        emptyText="No requisitions found."
        getRowId={(row) => row.id}
      />
    </div>
  )
}

/* ─── Purchase Orders ────────────────────────────────────────────────────── */
function POTab({ flash, userName, canApprove, navReq, clearNav }) {
  const [items, setItems] = useState([])
  const [vendors, setVendors] = useState([])
  const [rows, setRows] = useState([])
  const [vendor, setVendor] = useState('')
  const [reqNo, setReqNo] = useState('')
  const [reqId, setReqId] = useState(null)
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [editId, setEditId] = useState(null)

  const load = async () => {
    const [{ data: it }, { data: v }, { data: po }] = await Promise.all([
      supabase.from('inv_items').select('*').order('name'),
      supabase.from('vendors').select('*').eq('is_active', true).order('name'),
      supabase
        .from('purchase_orders')
        .select('*, vendors(name), po_items(*), requisitions(req_no)')
        .order('created_at', { ascending: false }),
    ])
    setItems(it || [])
    setVendors(v || [])
    setRows(po || [])
  }
  useEffect(() => {
    load()
  }, [])

  // Pre-fill from requisition nav
  useEffect(() => {
    if (!navReq || navReq.type !== 'PO') return
    setReqId(navReq.id)
    setReqNo(navReq.req_no)
    setLines(
      (navReq.items || []).map((it) => ({
        item_id: it.item_id || '',
        item_name: it.item_name,
        qty: it.qty,
        unit_cost: 0,
        vat_pct: 0,
        unit: '',
      })),
    )
    clearNav()
  }, [navReq])

  const resetForm = () => {
    setLines([])
    setVendor('')
    setReqId(null)
    setReqNo('')
    setNotes('')
    setEditId(null)
  }

  const create = async () => {
    if (!vendor) {
      flash('Vendor বেছে নিন।', 'error')
      return
    }
    if (lines.length === 0) {
      flash('অন্তত একটা item যোগ করুন।', 'error')
      return
    }
    if (lines.some((l) => !l.item_id)) {
      flash('সব line-এ item বেছে নিন।', 'error')
      return
    }
    if (editId) {
      const { error } = await supabase
        .from('purchase_orders')
        .update({ vendor_id: vendor, notes: notes || null })
        .eq('id', editId)
      if (error) {
        flash(error.message, 'error')
        return
      }
      await supabase.from('po_items').delete().eq('po_id', editId)
      await supabase
        .from('po_items')
        .insert(
          lines.map((l) => ({
            po_id: editId,
            item_id: l.item_id,
            item_name: l.item_name,
            qty: +l.qty,
            unit_cost: +l.unit_cost,
          })),
        )
      resetForm()
      load()
      flash('Purchase order updated.')
      return
    }
    const { data: po, error } = await supabase
      .from('purchase_orders')
      .insert({
        vendor_id: vendor,
        requisition_id: reqId || null,
        notes: notes || null,
        created_by: userName,
        status: 'PENDING_APPROVAL',
      })
      .select()
      .single()
    if (error) {
      flash(error.message, 'error')
      return
    }
    await supabase
      .from('po_items')
      .insert(
        lines.map((l) => ({
          po_id: po.id,
          item_id: l.item_id,
          item_name: l.item_name,
          qty: +l.qty,
          unit_cost: +l.unit_cost,
        })),
      )
    resetForm()
    load()
    flash(`✓ ${po.po_no} তৈরি হয়েছে${reqNo ? ` (REQ: ${reqNo})` : ''}.`)
  }

  const setStatus = async (id, status) => {
    await supabase.from('purchase_orders').update({ status }).eq('id', id)
    load()
  }
  const approvePO = async (id) => {
    const { data: approvedPO, error } = await supabase
      .from('purchase_orders')
      .update({ status: 'OPEN', approved_by: userName, approved_at: new Date().toISOString() })
      .eq('id', id)
      .eq('status', 'PENDING_APPROVAL')
      .select('id')
      .maybeSingle()
    if (error) {
      flash(error.message, 'error')
      return
    }
    if (!approvedPO) {
      flash('Purchase order is no longer pending approval.', 'error')
      await load()
      return
    }
    load()
    flash('Purchase order approved — now OPEN for goods receipt.')
  }
  const poTotal = (po) => (po.po_items || []).reduce((a, l) => a + +l.qty * +l.unit_cost, 0)
  const statusChip = (s) =>
    ({
      PENDING_APPROVAL: 'bg-amber/20 text-amber',
      OPEN: 'bg-sky-100 text-sky-700',
      PARTIAL: 'bg-sky-100 text-sky-700',
      RECEIVED: 'bg-forest/15 text-forest',
      CANCELLED: 'bg-red-100 text-red-600',
    })[s] || 'bg-stone-100 text-stone-500'

  const editPO = (po) => {
    setEditId(po.id)
    setVendor(po.vendor_id || '')
    setReqId(po.requisition_id || null)
    setReqNo(po.requisitions?.req_no || '')
    setNotes(po.notes || '')
    setLines(
      (po.po_items || []).map((it) => ({
        item_id: it.item_id || '',
        item_name: it.item_name || '',
        qty: Number(it.qty || 0),
        unit_cost: Number(it.unit_cost || 0),
        unit: '',
      })),
    )
  }

  const printPO = (po) => {
    printInventoryDoc({
      title: 'Purchase Order',
      docNo: po.po_no,
      meta: [
        { label: 'Date', value: fmtDate(po.po_date) },
        { label: 'Vendor', value: po.vendors?.name || '—' },
        { label: 'REQ', value: po.requisitions?.req_no || '—' },
        { label: 'Status', value: po.status },
      ],
      lines: po.po_items || [],
    })
  }

  const poGridRows = rows.map((po) => ({
    ...po,
    vendor_name: po.vendors?.name || '—',
    requisition_no: po.requisitions?.req_no || '—',
    total_value: poTotal(po),
    item_summary: (po.po_items || []).map((item) => `${item.item_name} (${item.qty})`).join(', '),
  }))

  const poColumns = [
    { accessorKey: 'po_no', header: 'PO No', width: 150 },
    { accessorKey: 'po_date', header: 'Date', type: 'date', width: 130 },
    { accessorKey: 'vendor_name', header: 'Vendor', width: 210 },
    { accessorKey: 'requisition_no', header: 'REQ', width: 140 },
    {
      accessorKey: 'total_value',
      header: 'Value',
      type: 'currency',
      aggregation: 'sum',
      width: 150,
    },
    { accessorKey: 'status', header: 'Status', type: 'status', width: 160 },
    { accessorKey: 'item_summary', header: 'Item Summary', width: 300 },
    {
      accessorKey: 'actions',
      header: 'Actions',
      sortable: false,
      width: 260,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1 flex-wrap">
          {row.status === 'PENDING_APPROVAL' && canApprove && (
            <Button
              variant="ghost"
              size="xs"
              className="text-forest text-xs"
              onClick={(event) => {
                event.stopPropagation()
                approvePO(row.id)
              }}
            >
              <Check size={13} /> Approve
            </Button>
          )}
          {row.status === 'PENDING_APPROVAL' && (
            <>
              <Button
                variant="ghost"
                size="xs"
                className="text-pine text-xs"
                onClick={(event) => {
                  event.stopPropagation()
                  editPO(row)
                }}
              >
                <Pencil size={13} /> Edit
              </Button>
              <Button
                variant="ghost"
                size="xs"
                className="text-red-500 text-xs"
                onClick={(event) => {
                  event.stopPropagation()
                  setStatus(row.id, 'CANCELLED')
                }}
              >
                <X size={13} /> Cancel
              </Button>
            </>
          )}
          {row.status === 'OPEN' && (
            <Button
              variant="ghost"
              size="xs"
              className="text-red-500 text-xs"
              onClick={(event) => {
                event.stopPropagation()
                setStatus(row.id, 'CANCELLED')
              }}
            >
              <X size={13} /> Cancel
            </Button>
          )}
          <Button
            variant="ghost"
            size="xs"
            className="text-pine text-xs"
            onClick={(event) => {
              event.stopPropagation()
              printPO(row)
            }}
          >
            <Printer size={13} /> Print
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="px-4 py-3 rounded-lg bg-amber/10 border border-amber/30 text-sm text-pine">
        <div className="font-semibold text-amber mb-0.5">⚡ PO approval lifecycle</div>
        <div className="text-xs text-pine/70">
          <b>PENDING_APPROVAL</b> → ADMIN/MANAGER approves → <b>OPEN</b> → post GRN →{' '}
          <b>RECEIVED</b> &nbsp;|&nbsp; Cancel at <b>PENDING_APPROVAL</b> or <b>OPEN</b> stage →{' '}
          <b>CANCELLED</b>
        </div>
      </div>
      <div className="card p-4 space-y-3">
        <h3 className="font-display font-semibold text-pine flex items-center gap-2">
          <Truck size={18} /> {editId ? 'Edit Purchase Order' : 'New Purchase Order'}
          {reqNo && (
            <span className="text-sm font-normal text-forest bg-forest/10 px-2 py-0.5 rounded-full">
              REQ: {reqNo}
            </span>
          )}
        </h3>
        <div className="flex gap-3 flex-wrap">
          <div>
            <label className="label">Vendor *</label>
            <select
              className={`${selectClass} !w-56`}
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
            >
              <option value="">Select vendor…</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="label">Notes</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>
        <p className="text-xs text-pine/40">
          Unit cost (৳) per line — total amount auto-calculated.
        </p>
        <LineEditor items={items} lines={lines} setLines={setLines} withCost={true} />
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button onClick={create}>
              {editId ? (
                <>
                  <Save size={15} /> Update PO
                </>
              ) : (
                <>
                  <Truck size={15} /> Create PO
                </>
              )}
            </Button>
            {editId && (
              <Button variant="ghost" onClick={resetForm}>
                Cancel edit
              </Button>
            )}
          </div>
          <div className="text-sm font-semibold text-pine money">
            Total:{' '}
            {fmtBDT(lines.reduce((a, l) => a + Number(l.qty || 0) * Number(l.unit_cost || 0), 0))}
          </div>
        </div>
      </div>

      <AedsDataGrid
        title="Purchase Orders"
        subtitle="Purchase approval, vendor commitment and receipt status"
        data={poGridRows}
        columns={poColumns}
        pageSize={100}
        emptyText="No purchase orders found."
        getRowId={(row) => row.id}
      />
    </div>
  )
}

/* ─── Goods Receipt ──────────────────────────────────────────────────────── */
function GRNTab({ flash, userName }) {
  const [items, setItems] = useState([])
  const [vendors, setVendors] = useState([])
  const [pos, setPos] = useState([])
  const [rows, setRows] = useState([])
  const locs = useLocations()
  const [h, setH] = useState({
    vendor_id: '',
    po_id: '',
    warehouse: 'STORE',
    vendor_invoice_no: '',
    vendor_invoice_date: todayISO(),
    rebateable: true,
    notes: '',
  })
  const [lines, setLines] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [editId, setEditId] = useState(null)

  const load = async () => {
    const [{ data: it }, { data: v }, { data: po }, { data: grn }] = await Promise.all([
      supabase.from('inv_items').select('*').order('name'),
      supabase.from('vendors').select('*').eq('is_active', true).order('name'),
      supabase
        .from('purchase_orders')
        .select('id, po_no, vendor_id, po_items(*)')
        .in('status', ['OPEN', 'PARTIAL']),
      supabase
        .from('goods_receipts')
        .select('*, vendors(name), grn_items(*), purchase_orders(po_no)')
        .order('created_at', { ascending: false }),
    ])
    setItems(it || [])
    setVendors(v || [])
    setPos(po || [])
    setRows(grn || [])
  }
  useEffect(() => {
    load()
  }, [])

  // When PO is selected, auto-fill vendor + lines
  const onPOSelect = (poId) => {
    setH((prev) => ({ ...prev, po_id: poId }))
    if (!poId) return
    const po = pos.find((p) => p.id === poId)
    if (!po) return
    setH((prev) => ({ ...prev, po_id: poId, vendor_id: po.vendor_id }))
    setLines(
      (po.po_items || []).map((it) => ({
        item_id: it.item_id,
        item_name: it.item_name,
        qty: it.qty,
        unit_cost: it.unit_cost,
        unit: '',
      })),
    )
  }

  const resetForm = () => {
    setEditId(null)
    setLines([])
    setH({
      vendor_id: '',
      po_id: '',
      warehouse: 'STORE',
      vendor_invoice_no: '',
      vendor_invoice_date: todayISO(),
      rebateable: true,
      notes: '',
    })
  }

  const create = async () => {
    if (!h.vendor_id) {
      flash('Vendor বেছে নিন।', 'error')
      return
    }
    if (lines.length === 0) {
      flash('অন্তত একটা item যোগ করুন।', 'error')
      return
    }
    if (editId) {
      const { error } = await supabase
        .from('goods_receipts')
        .update({
          vendor_id: h.vendor_id,
          po_id: h.po_id || null,
          warehouse: h.warehouse || 'STORE',
          vendor_invoice_no: h.vendor_invoice_no || null,
          vendor_invoice_date: h.vendor_invoice_date,
          rebateable: h.rebateable,
          notes: h.notes || null,
        })
        .eq('id', editId)
      if (error) {
        flash(error.message, 'error')
        return
      }
      await supabase.from('grn_items').delete().eq('grn_id', editId)
      await supabase.from('grn_items').insert(
        lines.map((l) => ({
          grn_id: editId,
          item_id: l.item_id,
          item_name: l.item_name,
          qty: +l.qty,
          unit_cost: +l.unit_cost,
          vat_amount: 0,
        })),
      )
      resetForm()
      load()
      flash('GRN updated.')
      return
    }
    const { data: grn, error } = await supabase
      .from('goods_receipts')
      .insert({
        vendor_id: h.vendor_id,
        po_id: h.po_id || null,
        warehouse: h.warehouse || 'STORE',
        vendor_invoice_no: h.vendor_invoice_no || null,
        vendor_invoice_date: h.vendor_invoice_date,
        rebateable: h.rebateable,
        notes: h.notes || null,
        created_by: userName,
      })
      .select()
      .single()
    if (error) {
      flash(error.message, 'error')
      return
    }
    await supabase.from('grn_items').insert(
      lines.map((l) => ({
        grn_id: grn.id,
        item_id: l.item_id,
        item_name: l.item_name,
        qty: +l.qty,
        unit_cost: +l.unit_cost,
        vat_amount: 0,
      })),
    )
    if (h.po_id)
      await supabase.from('purchase_orders').update({ status: 'RECEIVED' }).eq('id', h.po_id)
    resetForm()
    load()
    flash(`✓ ${grn.grn_no} — stock updated.`)
  }

  const grnTotal = (g) => (g.grn_items || []).reduce((a, l) => a + +l.qty * +l.unit_cost, 0)

  const editGRN = (g) => {
    setEditId(g.id)
    setH({
      vendor_id: g.vendor_id || '',
      po_id: g.po_id || '',
      warehouse: g.warehouse || 'STORE',
      vendor_invoice_no: g.vendor_invoice_no || '',
      vendor_invoice_date: g.vendor_invoice_date || todayISO(),
      rebateable: !!g.rebateable,
      notes: g.notes || '',
    })
    setLines(
      (g.grn_items || []).map((it) => ({
        item_id: it.item_id || '',
        item_name: it.item_name || '',
        qty: Number(it.qty || 0),
        unit_cost: Number(it.unit_cost || 0),
        unit: '',
      })),
    )
  }

  const cancelGRN = async (g) => {
    const ok = window.confirm(`Cancel ${g.grn_no}? This will remove this GRN.`)
    if (!ok) return
    await supabase.from('grn_items').delete().eq('grn_id', g.id)
    const { error } = await supabase.from('goods_receipts').delete().eq('id', g.id)
    if (error) {
      flash(error.message, 'error')
      return
    }
    if (editId === g.id) resetForm()
    load()
    flash(`${g.grn_no} cancelled.`)
  }

  const printGRN = (g) => {
    printInventoryDoc({
      title: 'Goods Receipt Note',
      docNo: g.grn_no,
      meta: [
        { label: 'Date', value: fmtDate(g.grn_date) },
        { label: 'Vendor', value: g.vendors?.name || '—' },
        { label: 'PO', value: g.purchase_orders?.po_no || '—' },
        { label: 'Invoice', value: g.vendor_invoice_no || '—' },
      ],
      lines: g.grn_items || [],
    })
  }

  const grnGridRows = rows.map((grn) => ({
    ...grn,
    vendor_name: grn.vendors?.name || '—',
    warehouse_name: grn.warehouse || 'STORE',
    po_no: grn.purchase_orders?.po_no || '—',
    total_value: grnTotal(grn),
    rebate_status: grn.rebateable ? 'ELIGIBLE' : 'NO',
    item_summary: (grn.grn_items || []).map((item) => `${item.item_name} (${item.qty})`).join(', '),
  }))

  const grnColumns = [
    { accessorKey: 'grn_no', header: 'GRN No', width: 150 },
    { accessorKey: 'grn_date', header: 'Date', type: 'date', width: 130 },
    { accessorKey: 'warehouse_name', header: 'Warehouse', width: 150 },
    { accessorKey: 'vendor_name', header: 'Vendor', width: 210 },
    { accessorKey: 'po_no', header: 'PO', width: 140 },
    { accessorKey: 'vendor_invoice_no', header: 'Invoice', width: 160 },
    {
      accessorKey: 'total_value',
      header: 'Value',
      type: 'currency',
      aggregation: 'sum',
      width: 150,
    },
    { accessorKey: 'rebate_status', header: 'Rebate', type: 'status', width: 120 },
    { accessorKey: 'item_summary', header: 'Item Summary', width: 300 },
    {
      accessorKey: 'actions',
      header: 'Actions',
      sortable: false,
      width: 220,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1 flex-wrap">
          <Button
            variant="ghost"
            size="xs"
            className="text-pine text-xs"
            onClick={(event) => {
              event.stopPropagation()
              editGRN(row)
            }}
          >
            <Pencil size={13} /> Edit
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className="text-red-500 text-xs"
            onClick={(event) => {
              event.stopPropagation()
              cancelGRN(row)
            }}
          >
            <X size={13} /> Cancel
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className="text-pine text-xs"
            onClick={(event) => {
              event.stopPropagation()
              printGRN(row)
            }}
          >
            <Printer size={13} /> Print
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <h3 className="font-display font-semibold text-pine flex items-center gap-2">
          <PackageCheck size={18} /> {editId ? 'Edit Goods Receipt (GRN)' : 'Goods Receipt (GRN)'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <label className="label">PO (auto-fill items)</label>
            <select
              className={selectClass}
              value={h.po_id}
              onChange={(e) => onPOSelect(e.target.value)}
            >
              <option value="">Select PO (optional)…</option>
              {pos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.po_no}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Vendor *</label>
            <select
              className={selectClass}
              value={h.vendor_id}
              onChange={(e) => setH({ ...h, vendor_id: e.target.value })}
            >
              <option value="">Select vendor…</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Warehouse *</label>
            <select
              className={selectClass}
              value={h.warehouse}
              onChange={(e) => setH({ ...h, warehouse: e.target.value })}
            >
              <option value="STORE">STORE</option>
              {locs.map((l) => (
                <option key={l.id} value={l.name}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Vendor invoice no</label>
            <Input
              className="money"
              placeholder="Invoice number"
              value={h.vendor_invoice_no}
              onChange={(e) => setH({ ...h, vendor_invoice_no: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Invoice date</label>
            <Input
              type="date"
              value={h.vendor_invoice_date}
              onChange={(e) => setH({ ...h, vendor_invoice_date: e.target.value })}
            />
          </div>
        </div>
        <p className="text-xs text-pine/40">Unit cost (৳) per line — total auto-calculated.</p>
        <LineEditor items={items} lines={lines} setLines={setLines} withCost={true} />
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button onClick={create}>
              {editId ? (
                <>
                  <Save size={15} /> Update GRN
                </>
              ) : (
                <>
                  <PackageCheck size={15} /> Receive goods
                </>
              )}
            </Button>
            {editId && (
              <Button variant="ghost" onClick={resetForm}>
                Cancel edit
              </Button>
            )}
          </div>
          <div className="text-sm font-semibold text-pine money">
            Total:{' '}
            {fmtBDT(lines.reduce((a, l) => a + Number(l.qty || 0) * Number(l.unit_cost || 0), 0))}
          </div>
        </div>
      </div>

      <AedsDataGrid
        title="Goods Receipts"
        subtitle="Vendor delivery, invoice and stock receipt register"
        data={grnGridRows}
        columns={grnColumns}
        pageSize={100}
        emptyText="No goods receipts found."
        getRowId={(row) => row.id}
      />
    </div>
  )
}

/* ─── Transfers ──────────────────────────────────────────────────────────── */
function TransfersTab({ flash, userName, navReq, clearNav }) {
  const [items, setItems] = useState([])
  const [rows, setRows] = useState([])
  const locs = useLocations()
  const [h, setH] = useState({ from_location: '', to_location: '', notes: '' })
  const [lines, setLines] = useState([])
  const [reqNo, setReqNo] = useState('')
  const [reqId, setReqId] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [editId, setEditId] = useState(null)

  const load = async () => {
    const [{ data: it }, { data: tr }] = await Promise.all([
      supabase.from('inv_items').select('*').order('name'),
      supabase
        .from('stock_transfers')
        .select('*, transfer_items(*), requisitions(req_no)')
        .order('created_at', { ascending: false }),
    ])
    setItems(it || [])
    setRows(tr || [])
  }
  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!navReq || navReq.type !== 'TRF') return
    setReqId(navReq.id)
    setReqNo(navReq.req_no)
    setLines(
      (navReq.items || []).map((it) => ({
        item_id: it.item_id || '',
        item_name: it.item_name,
        qty: it.qty,
        unit_cost: 0,
        vat_pct: 0,
        unit: '',
      })),
    )
    clearNav()
  }, [navReq])

  const resetForm = () => {
    setLines([])
    setH({ from_location: '', to_location: '', notes: '' })
    setReqId(null)
    setReqNo('')
    setEditId(null)
  }

  const create = async () => {
    if (!h.from_location || !h.to_location) {
      flash('From / To location দিন।', 'error')
      return
    }
    if (lines.length === 0) {
      flash('অন্তত একটা item যোগ করুন।', 'error')
      return
    }
    if (editId) {
      const { error } = await supabase
        .from('stock_transfers')
        .update({
          from_location: h.from_location,
          to_location: h.to_location,
          notes: h.notes || null,
        })
        .eq('id', editId)
      if (error) {
        flash(error.message, 'error')
        return
      }
      await supabase.from('transfer_items').delete().eq('transfer_id', editId)
      await supabase
        .from('transfer_items')
        .insert(
          lines.map((l) => ({
            transfer_id: editId,
            item_id: l.item_id,
            item_name: l.item_name,
            qty: +l.qty,
          })),
        )
      resetForm()
      load()
      flash('Transfer updated.')
      return
    }
    const { data: tr, error } = await supabase
      .from('stock_transfers')
      .insert({
        from_location: h.from_location,
        to_location: h.to_location,
        requisition_id: reqId || null,
        notes: h.notes || null,
        created_by: userName,
      })
      .select()
      .single()
    if (error) {
      flash(error.message, 'error')
      return
    }
    await supabase
      .from('transfer_items')
      .insert(
        lines.map((l) => ({
          transfer_id: tr.id,
          item_id: l.item_id,
          item_name: l.item_name,
          qty: +l.qty,
        })),
      )
    resetForm()
    load()
    flash(
      `✓ ${tr.trf_no} — stock moved from ${h.from_location} to ${h.to_location}${reqNo ? ` (REQ: ${reqNo})` : ''}.`,
    )
  }

  const locOptions =
    locs.length > 0
      ? locs.map((l) => (
          <option key={l.id} value={l.code}>
            {l.name} ({l.code})
          </option>
        ))
      : null

  const editTransfer = (t) => {
    setEditId(t.id)
    setReqId(t.requisition_id || null)
    setReqNo(t.requisitions?.req_no || '')
    setH({
      from_location: t.from_location || '',
      to_location: t.to_location || '',
      notes: t.notes || '',
    })
    setLines(
      (t.transfer_items || []).map((it) => ({
        item_id: it.item_id || '',
        item_name: it.item_name || '',
        qty: Number(it.qty || 0),
        unit_cost: 0,
        vat_pct: 0,
        unit: '',
      })),
    )
  }

  const cancelTransfer = async (t) => {
    const ok = window.confirm(`Cancel ${t.trf_no}? This will remove this transfer.`)
    if (!ok) return
    await supabase.from('transfer_items').delete().eq('transfer_id', t.id)
    const { error } = await supabase.from('stock_transfers').delete().eq('id', t.id)
    if (error) {
      flash(error.message, 'error')
      return
    }
    if (editId === t.id) resetForm()
    load()
    flash(`${t.trf_no} cancelled.`)
  }

  const printTransfer = (t) => {
    printInventoryDoc({
      title: 'Stock Transfer',
      docNo: t.trf_no,
      meta: [
        { label: 'Date', value: fmtDate(t.trf_date) },
        { label: 'From', value: t.from_location },
        { label: 'To', value: t.to_location },
        { label: 'REQ', value: t.requisitions?.req_no || '—' },
      ],
      lines: t.transfer_items || [],
    })
  }

  const transferGridRows = rows.map((transfer) => ({
    ...transfer,
    route: `${transfer.from_location || '—'} → ${transfer.to_location || '—'}`,
    requisition_no: transfer.requisitions?.req_no || '—',
    item_count: (transfer.transfer_items || []).length,
    item_summary: (transfer.transfer_items || [])
      .map((item) => `${item.item_name} (${item.qty})`)
      .join(', '),
  }))

  const transferColumns = [
    { accessorKey: 'trf_no', header: 'TRF No', width: 150 },
    { accessorKey: 'trf_date', header: 'Date', type: 'date', width: 130 },
    { accessorKey: 'route', header: 'From → To', width: 230 },
    { accessorKey: 'requisition_no', header: 'REQ', width: 140 },
    { accessorKey: 'item_count', header: 'Items', type: 'number', width: 100 },
    { accessorKey: 'created_by', header: 'Created By', width: 170 },
    { accessorKey: 'item_summary', header: 'Item Summary', width: 300 },
    {
      accessorKey: 'actions',
      header: 'Actions',
      sortable: false,
      width: 220,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1 flex-wrap">
          <Button
            variant="ghost"
            size="xs"
            className="text-pine text-xs"
            onClick={(event) => {
              event.stopPropagation()
              editTransfer(row)
            }}
          >
            <Pencil size={13} /> Edit
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className="text-red-500 text-xs"
            onClick={(event) => {
              event.stopPropagation()
              cancelTransfer(row)
            }}
          >
            <X size={13} /> Cancel
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className="text-pine text-xs"
            onClick={(event) => {
              event.stopPropagation()
              printTransfer(row)
            }}
          >
            <Printer size={13} /> Print
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <h3 className="font-display font-semibold text-pine flex items-center gap-2">
          <ArrowLeftRight size={18} /> {editId ? 'Edit Stock Transfer' : 'Stock Transfer'}
          {reqNo && (
            <span className="text-sm font-normal text-forest bg-forest/10 px-2 py-0.5 rounded-full">
              REQ: {reqNo}
            </span>
          )}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div>
            <label className="label">From location *</label>
            <select
              className={selectClass}
              value={h.from_location}
              onChange={(e) => setH({ ...h, from_location: e.target.value })}
            >
              <option value="">Select…</option>
              {locOptions}
            </select>
          </div>
          <div>
            <label className="label">To location *</label>
            <select
              className={selectClass}
              value={h.to_location}
              onChange={(e) => setH({ ...h, to_location: e.target.value })}
            >
              <option value="">Select…</option>
              {locOptions}
              <option value="CONSUMED">CONSUMED (consumption write-off)</option>
            </select>
          </div>
          <div>
            <label className="label">Notes</label>
            <Input
              value={h.notes}
              placeholder="Optional"
              onChange={(e) => setH({ ...h, notes: e.target.value })}
            />
          </div>
        </div>
        <LineEditor items={items} lines={lines} setLines={setLines} withCost={false} />
        <div className="flex gap-2">
          <Button onClick={create}>
            {editId ? (
              <>
                <Save size={15} /> Update transfer
              </>
            ) : (
              <>
                <ArrowLeftRight size={15} /> Post transfer
              </>
            )}
          </Button>
          {editId && (
            <Button variant="ghost" onClick={resetForm}>
              Cancel edit
            </Button>
          )}
        </div>
      </div>

      <AedsDataGrid
        title="Stock Transfers"
        subtitle="Location-to-location stock movement register"
        data={transferGridRows}
        columns={transferColumns}
        pageSize={100}
        emptyText="No transfers found."
        getRowId={(row) => row.id}
      />
    </div>
  )
}

/* ─── Returns ────────────────────────────────────────────────────────────── */
function ReturnsTab({ flash, userName }) {
  const [items, setItems] = useState([])
  const [vendors, setVendors] = useState([])
  const [rows, setRows] = useState([])
  const locs = useLocations()
  const [h, setH] = useState({ return_type: 'TO_STORE', vendor_id: '', from_location: '' })
  const [lines, setLines] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [editId, setEditId] = useState(null)

  const load = async () => {
    const [{ data: it }, { data: v }, { data: rt }] = await Promise.all([
      supabase.from('inv_items').select('*').order('name'),
      supabase.from('vendors').select('*').eq('is_active', true).order('name'),
      supabase
        .from('stock_returns')
        .select('*, vendors(name), return_items(*)')
        .order('created_at', { ascending: false }),
    ])
    setItems(it || [])
    setVendors(v || [])
    setRows(rt || [])
  }
  useEffect(() => {
    load()
  }, [])

  const resetForm = () => {
    setEditId(null)
    setH({ return_type: 'TO_STORE', vendor_id: '', from_location: '' })
    setLines([])
  }

  const create = async () => {
    if (lines.length === 0) {
      flash('অন্তত একটা item যোগ করুন।', 'error')
      return
    }
    if (editId) {
      const { error } = await supabase
        .from('stock_returns')
        .update({
          return_type: h.return_type,
          vendor_id: h.return_type === 'TO_VENDOR' ? h.vendor_id || null : null,
          from_location: h.from_location || null,
        })
        .eq('id', editId)
      if (error) {
        flash(error.message, 'error')
        return
      }
      await supabase.from('return_items').delete().eq('return_id', editId)
      await supabase
        .from('return_items')
        .insert(
          lines.map((l) => ({
            return_id: editId,
            item_id: l.item_id,
            item_name: l.item_name,
            qty: +l.qty,
          })),
        )
      resetForm()
      load()
      flash('Return updated.')
      return
    }
    const { data: rt, error } = await supabase
      .from('stock_returns')
      .insert({
        return_type: h.return_type,
        vendor_id: h.return_type === 'TO_VENDOR' ? h.vendor_id || null : null,
        from_location: h.from_location || null,
        created_by: userName,
      })
      .select()
      .single()
    if (error) {
      flash(error.message, 'error')
      return
    }
    await supabase
      .from('return_items')
      .insert(
        lines.map((l) => ({
          return_id: rt.id,
          item_id: l.item_id,
          item_name: l.item_name,
          qty: +l.qty,
        })),
      )
    resetForm()
    load()
    flash(`✓ ${rt.ret_no} posted.`)
  }

  const locOptions = locs.map((l) => (
    <option key={l.id} value={l.code}>
      {l.name} ({l.code})
    </option>
  ))

  const editReturn = (r) => {
    setEditId(r.id)
    setH({
      return_type: r.return_type || 'TO_STORE',
      vendor_id: r.vendor_id || '',
      from_location: r.from_location || '',
    })
    setLines(
      (r.return_items || []).map((it) => ({
        item_id: it.item_id || '',
        item_name: it.item_name || '',
        qty: Number(it.qty || 0),
        unit_cost: 0,
        vat_pct: 0,
        unit: '',
      })),
    )
  }

  const cancelReturn = async (r) => {
    const ok = window.confirm(`Cancel ${r.ret_no}? This will remove this return.`)
    if (!ok) return
    await supabase.from('return_items').delete().eq('return_id', r.id)
    const { error } = await supabase.from('stock_returns').delete().eq('id', r.id)
    if (error) {
      flash(error.message, 'error')
      return
    }
    if (editId === r.id) resetForm()
    load()
    flash(`${r.ret_no} cancelled.`)
  }

  const printReturn = (r) => {
    printInventoryDoc({
      title: 'Stock Return',
      docNo: r.ret_no,
      meta: [
        { label: 'Date', value: fmtDate(r.ret_date) },
        { label: 'Type', value: r.return_type },
        { label: 'Vendor', value: r.vendors?.name || '—' },
        { label: 'From', value: r.from_location || '—' },
      ],
      lines: r.return_items || [],
    })
  }

  const returnGridRows = rows.map((itemReturn) => ({
    ...itemReturn,
    vendor_name: itemReturn.vendors?.name || '—',
    item_count: (itemReturn.return_items || []).length,
    item_summary: (itemReturn.return_items || [])
      .map((item) => `${item.item_name} (${item.qty})`)
      .join(', '),
  }))

  const returnColumns = [
    { accessorKey: 'ret_no', header: 'RET No', width: 150 },
    { accessorKey: 'ret_date', header: 'Date', type: 'date', width: 130 },
    { accessorKey: 'return_type', header: 'Type', type: 'status', width: 140 },
    { accessorKey: 'vendor_name', header: 'Vendor', width: 210 },
    { accessorKey: 'from_location', header: 'From', width: 160 },
    { accessorKey: 'item_count', header: 'Items', type: 'number', width: 100 },
    { accessorKey: 'item_summary', header: 'Item Summary', width: 300 },
    {
      accessorKey: 'actions',
      header: 'Actions',
      sortable: false,
      width: 220,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1 flex-wrap">
          <Button
            variant="ghost"
            size="xs"
            className="text-pine text-xs"
            onClick={(event) => {
              event.stopPropagation()
              editReturn(row)
            }}
          >
            <Pencil size={13} /> Edit
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className="text-red-500 text-xs"
            onClick={(event) => {
              event.stopPropagation()
              cancelReturn(row)
            }}
          >
            <X size={13} /> Cancel
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className="text-pine text-xs"
            onClick={(event) => {
              event.stopPropagation()
              printReturn(row)
            }}
          >
            <Printer size={13} /> Print
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <h3 className="font-display font-semibold text-pine flex items-center gap-2">
          <Undo2 size={18} /> {editId ? 'Edit Stock Return' : 'Stock Return'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div>
            <label className="label">Return type</label>
            <select
              className={selectClass}
              value={h.return_type}
              onChange={(e) => setH({ ...h, return_type: e.target.value })}
            >
              <option value="TO_STORE">Return to Store (back in stock)</option>
              <option value="TO_VENDOR">Return to Vendor (out of stock)</option>
            </select>
          </div>
          {h.return_type === 'TO_VENDOR' && (
            <div>
              <label className="label">Vendor</label>
              <select
                className={selectClass}
                value={h.vendor_id}
                onChange={(e) => setH({ ...h, vendor_id: e.target.value })}
              >
                <option value="">Select vendor…</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">From location</label>
            <select
              className={selectClass}
              value={h.from_location}
              onChange={(e) => setH({ ...h, from_location: e.target.value })}
            >
              <option value="">Select…</option>
              {locOptions}
            </select>
          </div>
        </div>
        <LineEditor items={items} lines={lines} setLines={setLines} withCost={false} />
        <div className="flex gap-2">
          <Button onClick={create}>
            {editId ? (
              <>
                <Save size={15} /> Update return
              </>
            ) : (
              <>
                <Undo2 size={15} /> Post return
              </>
            )}
          </Button>
          {editId && (
            <Button variant="ghost" onClick={resetForm}>
              Cancel edit
            </Button>
          )}
        </div>
      </div>

      <AedsDataGrid
        title="Stock Returns"
        subtitle="Store and vendor return register"
        data={returnGridRows}
        columns={returnColumns}
        pageSize={100}
        emptyText="No returns found."
        getRowId={(row) => row.id}
      />
    </div>
  )
}
