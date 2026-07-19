import { useMemo, useState } from "react"
import { CheckCircle2, Search, UserPlus } from "lucide-react"

const STEPS = ["Guest", "Stay", "Rate", "Payment", "Confirmation"]
const SALUTATIONS = ["Mr.", "Ms.", "Mrs.", "Dr.", "Prof.", "Engr."]

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function tomorrowISO(baseDate) {
  const dt = new Date(`${baseDate}T00:00:00`)
  dt.setDate(dt.getDate() + 1)
  return dt.toISOString().slice(0, 10)
}

export default function NewReservationWizard({ userName, onCancel, onCreate, onOpenGuestSearch }) {
  const initialDate = useMemo(() => todayISO(), [])
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("info")
  const [busy, setBusy] = useState(false)

  const [form, setForm] = useState({
    salutation: "Mr.",
    guestType: "Individual",
    reservationName: "",
    guestName: "",
    phone: "",
    email: "",
    checkIn: initialDate,
    checkOut: tomorrowISO(initialDate),
    adults: 2,
    children: 0,
    source: "Phone",
    notes: "",
  })

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const showMessage = (type, text) => {
    setMessageType(type)
    setMessage(text)
  }

  const validate = () => {
    if (!form.reservationName.trim()) return "Reservation Name is required"
    if (!form.guestName.trim()) return "Guest Name is required"
    if (form.checkOut <= form.checkIn) return "Check-out must be after check-in"
    return ""
  }

  const handleSaveDraft = () => {
    const key = "aeds.newReservationWizard.draft"
    const payload = {
      ...form,
      savedAt: new Date().toISOString(),
      savedBy: userName || "User",
    }
    localStorage.setItem(key, JSON.stringify(payload))
    showMessage("success", "Draft saved successfully")
  }

  const handleCreate = async () => {
    const error = validate()
    if (error) {
      showMessage("error", error)
      return
    }

    setBusy(true)
    try {
      await onCreate?.(form)
      showMessage("success", "Reservation query prepared successfully")
    } catch {
      showMessage("error", "Could not create reservation query")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-pine">New Reservation</h2>
          <p className="mt-1 text-sm text-pine/60">Reservation form shell. Prepared by {userName || "User"}.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-ghost text-sm"
            onClick={() => {
              onOpenGuestSearch?.()
              showMessage("info", "Guest search opened")
            }}
          >
            <Search size={14} /> Search Existing Guest
          </button>
          <button type="button" className="btn-primary text-sm" onClick={handleSaveDraft}>
            <CheckCircle2 size={14} /> Save Draft
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-5">
        {STEPS.map((step, index) => (
          <div key={step} className="rounded-xl border border-leaf bg-leaf/30 px-3 py-2">
            <span className="text-[10px] font-black uppercase tracking-wide text-pine/50">Step {index + 1}</span>
            <div className="mt-0.5 text-sm font-black text-pine">{step}</div>
          </div>
        ))}
      </div>

      {message && (
        <div
          className={`mt-4 rounded-lg px-3 py-2 text-sm font-semibold ${
            messageType === "error"
              ? "bg-red-50 text-red-700"
              : messageType === "success"
                ? "bg-forest/10 text-forest"
                : "bg-pine/10 text-pine"
          }`}
        >
          {message}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Salutation</label>
          <select className="input" value={form.salutation} onChange={(e) => setField("salutation", e.target.value)}>
            {SALUTATIONS.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Guest Type</label>
          <div className="flex h-[38px] gap-2">
            {["Individual", "Company"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setField("guestType", type)}
                className={`flex-1 rounded-lg border text-sm font-semibold transition-colors ${
                  form.guestType === type ? "border-pine bg-pine text-white" : "border-leaf text-pine/70 hover:border-forest/40"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="label">Reservation Name *</label>
          <input
            className="input"
            value={form.reservationName}
            onChange={(e) => setField("reservationName", e.target.value)}
            placeholder="Enter reservation name"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Guest Name *</label>
          <input
            className="input"
            value={form.guestName}
            onChange={(e) => setField("guestName", e.target.value)}
            placeholder="Enter guest full name"
          />
        </div>

        <div>
          <label className="label">Phone (WhatsApp)</label>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value)}
            placeholder="01XXXXXXXXX"
          />
        </div>

        <div>
          <label className="label">Email</label>
          <input
            className="input"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="guest@email.com"
          />
        </div>

        <div>
          <label className="label">Check In</label>
          <input type="date" className="input" value={form.checkIn} onChange={(e) => setField("checkIn", e.target.value)} />
        </div>

        <div>
          <label className="label">Check Out</label>
          <input type="date" className="input" value={form.checkOut} onChange={(e) => setField("checkOut", e.target.value)} />
        </div>

        <div>
          <label className="label">Adults</label>
          <input type="number" min="1" className="input" value={form.adults} onChange={(e) => setField("adults", e.target.value)} />
        </div>

        <div>
          <label className="label">Children</label>
          <input type="number" min="0" className="input" value={form.children} onChange={(e) => setField("children", e.target.value)} />
        </div>

        <div>
          <label className="label">Source</label>
          <select className="input" value={form.source} onChange={(e) => setField("source", e.target.value)}>
            {[
              "Phone",
              "WhatsApp",
              "Walk-in",
              "Email",
              "Facebook",
              "OTA",
              "Agent",
            ].map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="label">Notes / Special Requests</label>
          <textarea
            className="input"
            rows={2}
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
            placeholder="Any special request for this reservation"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={() => onCancel?.()}>
          Cancel
        </button>
        <button type="button" className="btn-ghost" onClick={handleSaveDraft}>
          Save Draft
        </button>
        <button type="button" className="btn-primary" onClick={handleCreate} disabled={busy}>
          <UserPlus size={14} /> {busy ? "Creating..." : "Create Query"}
        </button>
      </div>
    </section>
  )
}
