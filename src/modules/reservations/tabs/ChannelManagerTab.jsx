import {
  useCallback,
  useEffect,
  useState,
} from "react"
import {
  Globe2,
  Plus,
  RefreshCw,
  Save,
  X,
} from "lucide-react"

import AedsDataGrid from "../../../components/data-grid/AedsDataGrid"
import { supabase } from "../../../supabase"
import {
  withTenantScope,
} from "../../../lib/companySettings"

const EMPTY_FORM = {
  provider: "",
  connection_name: "",
  property_code: "",
  endpoint_url: "",
  mode: "PULL_PUSH",
  sync_inventory: true,
  sync_rates: true,
  sync_reservations: true,
  is_active: true,
}

const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"

const secondaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"

export default function ChannelManagerTab() {
  const [rows, setRows] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [form, setForm] = useState(EMPTY_FORM)

  const load = useCallback(async () => {
    setLoading(true)
    setMessage("")

    const [
      connectionResult,
      logResult,
    ] = await Promise.all([
      withTenantScope(
        supabase
          .from("channel_connections")
          .select("*")
          .order("created_at", {
            ascending: false,
          })
      ),
      withTenantScope(
        supabase
          .from("channel_sync_logs")
          .select("*")
          .order("created_at", {
            ascending: false,
          })
          .limit(300)
      ),
    ])

    if (connectionResult.error) {
      setMessage(connectionResult.error.message)
    }

    setRows(connectionResult.data || [])
    setLogs(logResult.data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function saveConnection() {
    if (
      !form.provider.trim() ||
      !form.connection_name.trim() ||
      !form.property_code.trim()
    ) {
      setMessage(
        "Provider Name, Connection Name and Property Code are required."
      )
      return
    }

    setSaving(true)
    setMessage("")

    const { error } = await supabase
      .from("channel_connections")
      .insert({
        provider: form.provider.trim(),
        connection_name:
          form.connection_name.trim(),
        property_code:
          form.property_code.trim(),
        endpoint_url:
          form.endpoint_url.trim() || null,
        mode: form.mode,
        sync_inventory:
          form.sync_inventory,
        sync_rates:
          form.sync_rates,
        sync_reservations:
          form.sync_reservations,
        is_active:
          form.is_active,
        connection_status:
          "PENDING_SETUP",
        secret_configured:
          false,
      })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage(
        "Connection created successfully."
      )
      setForm(EMPTY_FORM)
      setFormOpen(false)
      await load()
    }

    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-50 text-sky-700">
              <Globe2 size={22} />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-950">
                Channels & OTA Integration
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Configure OTA, travel agent, CRS and direct website connections.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={secondaryButton}
              onClick={load}
              disabled={loading}
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              className={primaryButton}
              onClick={() =>
                setFormOpen(true)
              }
            >
              <Plus size={17} />
              New Connection
            </button>
          </div>
        </div>
      </div>

      {formOpen && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-950">
                Create Channel Connection
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Enter the provider name manually.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setFormOpen(false)
              }
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Close connection form"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Provider Name">
              <input
                className="input"
                value={form.provider}
                onChange={(event) =>
                  updateField(
                    "provider",
                    event.target.value
                  )
                }
                placeholder="Booking.com, Agoda, Travel Agent..."
              />
            </Field>

            <Field label="Connection Name">
              <input
                className="input"
                value={form.connection_name}
                onChange={(event) =>
                  updateField(
                    "connection_name",
                    event.target.value
                  )
                }
                placeholder="Main Property Connection"
              />
            </Field>

            <Field label="Property Code">
              <input
                className="input"
                value={form.property_code}
                onChange={(event) =>
                  updateField(
                    "property_code",
                    event.target.value
                  )
                }
                placeholder="Provider property ID"
              />
            </Field>

            <Field label="API Endpoint / Webhook">
              <input
                className="input"
                value={form.endpoint_url}
                onChange={(event) =>
                  updateField(
                    "endpoint_url",
                    event.target.value
                  )
                }
                placeholder="https://..."
              />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            {[
              ["sync_inventory", "Inventory"],
              ["sync_rates", "Rates"],
              [
                "sync_reservations",
                "Reservations",
              ],
            ].map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-2 text-sm font-bold text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(event) =>
                    updateField(
                      key,
                      event.target.checked
                    )
                  }
                />
                Sync {label}
              </label>
            ))}

            <button
              type="button"
              className={primaryButton}
              onClick={saveConnection}
              disabled={saving}
            >
              <Save size={17} />
              {saving
                ? "Saving..."
                : "Create Connection"}
            </button>
          </div>
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm">
          {message}
        </div>
      )}

      <AedsDataGrid
        title="Channel Connections"
        subtitle="OTA, booking agent, CRS and direct website connections"
        data={rows}
        columns={[
          {
            accessorKey: "provider",
            header: "Provider Name",
            width: 220,
          },
          {
            accessorKey: "connection_name",
            header: "Connection",
            width: 230,
          },
          {
            accessorKey: "property_code",
            header: "Property Code",
            width: 170,
          },
          {
            accessorKey: "connection_status",
            header: "Status",
            type: "status",
            width: 170,
          },
          {
            accessorKey: "secret_configured",
            header: "Credentials",
            type: "status",
            width: 160,
            cell: ({ row }) =>
              row.secret_configured
                ? "CONFIGURED"
                : "NOT CONFIGURED",
          },
          {
            accessorKey: "last_success_at",
            header: "Last Success",
            type: "date",
            width: 170,
          },
          {
            accessorKey: "last_error",
            header: "Last Error",
            width: 320,
          },
        ]}
        pageSize={100}
        loading={loading}
        emptyText="No channel connection configured."
        getRowId={(row) => row.id}
      />

      <AedsDataGrid
        title="Channel Sync Log"
        subtitle="Inbound and outbound availability, rate and reservation events"
        data={logs}
        columns={[
          {
            accessorKey: "created_at",
            header: "Timestamp",
            type: "date",
            width: 170,
          },
          {
            accessorKey: "provider",
            header: "Provider",
            width: 190,
          },
          {
            accessorKey: "direction",
            header: "Direction",
            type: "status",
            width: 130,
          },
          {
            accessorKey: "event_type",
            header: "Event",
            width: 190,
          },
          {
            accessorKey: "external_reference",
            header: "External Ref.",
            width: 190,
          },
          {
            accessorKey: "status",
            header: "Status",
            type: "status",
            width: 130,
          },
          {
            accessorKey: "message",
            header: "Message",
            width: 360,
          },
        ]}
        pageSize={100}
        loading={loading}
        emptyText="No synchronization events recorded."
        getRowId={(row, index) =>
          row.id || index
        }
      />
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label>
      <span className="label">{label}</span>
      {children}
    </label>
  )
}
