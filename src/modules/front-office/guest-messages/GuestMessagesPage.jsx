import { useEffect, useState } from "react"
import { Plus, RefreshCw } from "lucide-react"

import AedsDataGrid from "../../../components/data-grid/AedsDataGrid"
import { Button } from "../../../components/ui/button"
import { supabase } from "../../../supabase"
import { withTenantScope } from "../../../lib/companySettings"

const EMPTY = {
  guest_name: "",
  room_no: "",
  message_type: "MESSAGE",
  message: "",
  priority: "NORMAL",
}

export default function GuestMessagesPage({ userName }) {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  async function load() {
    setLoading(true)
    const { data, error } = await withTenantScope(
      supabase
        .from("guest_messages")
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
    if (!form.message.trim()) {
      setMessage("Message is required.")
      return
    }

    const { error } = await supabase.from("guest_messages").insert({
      ...form,
      created_by: userName || null,
      status: "OPEN",
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
          <Plus size={16} /> New Message
        </Button>
      </div>

      {open && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <label>
              <span className="label">Guest Name</span>
              <input className="input" value={form.guest_name} onChange={(event) => setForm((current) => ({ ...current, guest_name: event.target.value }))} />
            </label>
            <label>
              <span className="label">Room No.</span>
              <input className="input" value={form.room_no} onChange={(event) => setForm((current) => ({ ...current, room_no: event.target.value }))} />
            </label>
            <label>
              <span className="label">Type</span>
              <select className="input" value={form.message_type} onChange={(event) => setForm((current) => ({ ...current, message_type: event.target.value }))}>
                <option value="MESSAGE">Message</option>
                <option value="WAKE_UP_CALL">Wake-up Call</option>
                <option value="ALERT">Guest Alert</option>
                <option value="HANDOVER">Handover</option>
              </select>
            </label>
            <label>
              <span className="label">Priority</span>
              <select className="input" value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="label">Message</span>
              <textarea className="input min-h-24" value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={save}>Save Message</Button>
          </div>
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
          {message}
        </div>
      )}

      <AedsDataGrid
        title="Guest Messages"
        subtitle="Messages, wake-up calls, alerts and shift handover"
        data={rows}
        columns={[
          { accessorKey: "created_at", header: "Created At", type: "date", width: 160 },
          { accessorKey: "guest_name", header: "Guest Name", width: 220 },
          { accessorKey: "room_no", header: "Room", width: 100 },
          { accessorKey: "message_type", header: "Type", width: 160 },
          { accessorKey: "message", header: "Message", width: 380 },
          { accessorKey: "priority", header: "Priority", type: "status", width: 130 },
          { accessorKey: "status", header: "Status", type: "status", width: 130 },
          { accessorKey: "created_by", header: "Created By", width: 170 },
        ]}
        loading={loading}
        pageSize={100}
        emptyText="No guest messages recorded."
        getRowId={(row) => row.id}
      />
    </div>
  )
}
