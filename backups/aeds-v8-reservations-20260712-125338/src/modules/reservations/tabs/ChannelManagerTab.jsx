import {
  useCallback,
  useEffect,
  useState,
} from "react"
import {
  Globe2,
  RefreshCw,
  Save,
} from "lucide-react"

import AedsDataGrid from "../../../components/data-grid/AedsDataGrid"
import { Button } from "../../../components/ui/button"
import { supabase } from "../../../supabase"
import {
  withTenantInsert,
  withTenantScope,
} from "../../../lib/companySettings"

const PROVIDERS = [
  "BOOKING_COM",
  "EXPEDIA",
  "AGODA",
  "AIRBNB",
  "TRIP_COM",
  "GOOGLE_HOTEL_ADS",
  "DIRECT_WEBSITE",
  "TRAVEL_AGENT_API",
  "CUSTOM",
]

export default function ChannelManagerTab() {
  const [rows, setRows] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [form, setForm] = useState({
    provider: "BOOKING_COM",
    connection_name: "",
    property_code: "",
    endpoint_url: "",
    mode: "PULL_PUSH",
    is_active: true,
    sync_inventory: true,
    sync_rates: true,
    sync_reservations: true,
  })

  const load = useCallback(async () => {
    setLoading(true)

    const [
      { data: connections },
      { data: syncLogs },
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
          .limit(200)
      ),
    ])

    setRows(connections || [])
    setLogs(syncLogs || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const save = async () => {
    if (
      !form.connection_name ||
      !form.property_code
    ) {
      setMessage(
        "Connection name and property code are required."
      )
      return
    }

    setSaving(true)
    setMessage("")

    const { error } = await supabase
      .from("channel_connections")
      .insert(
        withTenantInsert({
          ...form,
          secret_configured: false,
          connection_status: "PENDING_SETUP",
        })
      )

    if (error) {
      setMessage(error.message)
    } else {
      setMessage(
        "Connection saved. Configure provider credentials in the Supabase Edge Function environment before enabling live synchronization."
      )

      setForm((current) => ({
        ...current,
        connection_name: "",
        property_code: "",
        endpoint_url: "",
      }))

      await load()
    }

    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="aeds-card p-5">
        <div className="flex items-center gap-2">
          <Globe2 size={20} />
          <div>
            <h2 className="text-lg font-black">
              Channels & OTA Integration
            </h2>

            <p className="text-sm text-slate-500">
              Real-time room availability, rates
              and reservation synchronization.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Provider">
            <select
              className="input"
              value={form.provider}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  provider:
                    event.target.value,
                }))
              }
            >
              {PROVIDERS.map((provider) => (
                <option
                  key={provider}
                  value={provider}
                >
                  {provider.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Connection Name">
            <input
              className="input"
              value={form.connection_name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  connection_name:
                    event.target.value,
                }))
              }
            />
          </Field>

          <Field label="Provider Property Code">
            <input
              className="input"
              value={form.property_code}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  property_code:
                    event.target.value,
                }))
              }
            />
          </Field>

          <Field label="API Endpoint / Webhook URL">
            <input
              className="input"
              value={form.endpoint_url}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  endpoint_url:
                    event.target.value,
                }))
              }
            />
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
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
              className="flex items-center gap-2 text-sm font-bold"
            >
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    [key]:
                      event.target.checked,
                  }))
                }
              />
              Sync {label}
            </label>
          ))}

          <Button
            onClick={save}
            disabled={saving}
          >
            <Save size={16} />
            {saving
              ? "Saving..."
              : "Save Connection"}
          </Button>

          <Button
            variant="outline"
            onClick={load}
          >
            <RefreshCw size={16} />
            Refresh
          </Button>
        </div>

        {message && (
          <p className="mt-3 rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
            {message}
          </p>
        )}
      </div>

      <AedsDataGrid
        title="Channel Connections"
        subtitle="OTA, agent and direct website integrations"
        data={rows}
        columns={[
          {
            accessorKey: "provider",
            header: "Provider",
            width: 190,
          },
          {
            accessorKey: "connection_name",
            header: "Connection",
            width: 220,
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
            width: 150,
            cell: ({ row }) =>
              row.secret_configured
                ? "CONFIGURED"
                : "NOT CONFIGURED",
          },
          {
            accessorKey: "last_success_at",
            header: "Last Success",
            type: "date",
            width: 160,
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
        subtitle="Inbound and outbound inventory, rate and reservation events"
        data={logs}
        columns={[
          {
            accessorKey: "created_at",
            header: "Date & Time",
            type: "date",
            width: 170,
          },
          {
            accessorKey: "provider",
            header: "Provider",
            width: 180,
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
        emptyText="No channel synchronization event recorded."
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
