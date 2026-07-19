import { useEffect, useState } from "react"
import { Plus, RefreshCw } from "lucide-react"

import AedsDataGrid from "../../../components/data-grid/AedsDataGrid"
import { Button } from "../../../components/ui/button"
import { supabase } from "../../../lib/supabase"
import { withTenantScope } from "../../../lib/companySettings"

const EMPTY = {
  item_name: "",
  room_no: "",
  found_location: "",
  storage_location: "",
  status: "FOUND",
  notes: "",
}

export default function LostFoundPage({ userName }) {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  async function load() {
    setLoading(true)
    const { data, error } = await withTenantScope(
      supabase
        .from("lost_found_items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000)
    )
    setRows(data || [])
    setMessage(error?.message || "")
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function save() {
    if (!form.item_name.trim()) {
      setMessage("Item name is required.")
      return
    }

    const { error } = await supabase.from("lost_found_items").insert({
      ...form,
      item_name: form.item_name.trim(),
      found_by: userName || null,
    })

    if (error) {
      setMessage(error.message)
      return
    }

    setForm(EMPTY)
    setOpen(false)
    await load()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw size={16} /> Refresh
        </Button>
        <Button onClick={() => setOpen((value) => !value)}>
          <Plus size={16} /> New Item
        </Button>
      </div>

      {open && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[
              ["item_name", "Item Name"],
              ["room_no", "Room No."],
              ["found_location", "Found Location"],
              ["storage_location", "Storage Location"],
              ["notes", "Notes"],
            ].map(([key, label]) => (
              <label key={key}>
                <span className="label">{label}</span>
                <input
                  className="input"
                  value={form[key]}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, [key]: event.target.value }))
                  }
                />
              </label>
            ))}
            <label>
              <span className="label">Status</span>
              <select
                className="input"
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({ ...current, status: event.target.value }))
                }
              >
                <option value="FOUND">Found</option>
                <option value="STORED">Stored</option>
                <option value="CLAIMED">Claimed</option>
                <option value="DISPOSED">Disposed</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={save}>Save Item</Button>
          </div>
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
          {message}
        </div>
      )}

      <AedsDataGrid
        title="Lost & Found Register"
        subtitle="Found item, storage, claim and disposal tracking"
        data={rows}
        columns={[
          { accessorKey: "created_at", header: "Reported At", type: "date", width: 160 },
          { accessorKey: "item_name", header: "Item", width: 220 },
          { accessorKey: "room_no", header: "Room", width: 100 },
          { accessorKey: "found_location", header: "Found Location", width: 190 },
          { accessorKey: "storage_location", header: "Storage", width: 170 },
          { accessorKey: "found_by", header: "Found By", width: 160 },
          { accessorKey: "status", header: "Status", type: "status", width: 130 },
          { accessorKey: "notes", header: "Notes", width: 300 },
        ]}
        loading={loading}
        pageSize={100}
        emptyText="No lost and found items recorded."
        getRowId={(row) => row.id}
      />
    </div>
  )
}
