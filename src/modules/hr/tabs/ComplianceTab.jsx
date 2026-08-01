import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { fmtDate, todayISO } from '../../../lib/helpers'
import { Plus, BookOpen, Users, Eye } from 'lucide-react'
import { Button } from 'src/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'src/components/ui/tabs'
import ComplianceDrawer from '../components/ComplianceDrawer'

function IncidentsView({ flash, userName }) {
  const [rows, setRows] = useState([])
  const [f, setF] = useState({
    incident_date: todayISO(),
    category: 'GENERAL',
    description: '',
    action_taken: '',
  })
  const [viewing, setViewing] = useState(null)

  const load = async () => {
    const { data } = await supabase
      .from('incident_register')
      .select('*')
      .order('incident_date', { ascending: false })
    setRows(data || [])
  }
  useEffect(() => {
    load()
  }, [])

  const add = async () => {
    if (!f.description) return
    const { error } = await supabase
      .from('incident_register')
      .insert({ ...f, reported_by: userName })
    if (error) flash(error.message)
    else {
      setF({ incident_date: todayISO(), category: 'GENERAL', description: '', action_taken: '' })
      load()
    }
  }
  const toggle = async (r) => {
    await supabase
      .from('incident_register')
      .update({ status: r.status === 'OPEN' ? 'CLOSED' : 'OPEN' })
      .eq('id', r.id)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 grid grid-cols-6 gap-2">
        <input
          type="date"
          className="input"
          value={f.incident_date}
          onChange={(e) => setF({ ...f, incident_date: e.target.value })}
        />
        <input
          className="input"
          placeholder="Category"
          value={f.category}
          onChange={(e) => setF({ ...f, category: e.target.value })}
        />
        <input
          className="input col-span-2"
          placeholder="Description"
          value={f.description}
          onChange={(e) => setF({ ...f, description: e.target.value })}
        />
        <input
          className="input"
          placeholder="Action taken"
          value={f.action_taken}
          onChange={(e) => setF({ ...f, action_taken: e.target.value })}
        />
        <Button variant="default" className="justify-center" onClick={add}>
          <Plus size={15} /> Log
        </Button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">Date</th>
              <th className="th">Category</th>
              <th className="th">Description</th>
              <th className="th">Action</th>
              <th className="th">By</th>
              <th className="th">Status</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="td money text-xs">{fmtDate(r.incident_date)}</td>
                <td className="td text-xs">{r.category}</td>
                <td className="td text-sm">{r.description}</td>
                <td className="td text-xs">{r.action_taken || '—'}</td>
                <td className="td text-xs">{r.reported_by}</td>
                <td className="td">
                  <button
                    onClick={() => toggle(r)}
                    className={`status-chip ${r.status === 'OPEN' ? 'bg-amber/20 text-amber' : 'bg-forest/15 text-forest'}`}
                  >
                    {r.status}
                  </button>
                </td>
                <td className="td">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setViewing(r)}
                    aria-label={`View incident from ${fmtDate(r.incident_date)}`}
                  >
                    <Eye size={14} />
                  </Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="td text-pine/40" colSpan={7}>
                  No incidents logged.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ComplianceDrawer item={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}

function PlaceholderView({ icon: Icon, title, desc }) {
  return (
    <div className="card p-8 text-center space-y-3">
      <Icon size={36} className="mx-auto text-forest/40" />
      <h3 className="font-semibold text-pine text-lg">{title}</h3>
      <p className="text-pine/60 text-sm max-w-sm mx-auto">{desc}</p>
      <p className="text-xs text-pine/40 italic">Coming in next phase.</p>
    </div>
  )
}

export default function ComplianceTab({ flash, userName, view, setView }) {
  return (
    <Tabs value={view || ''} onValueChange={setView} className="space-y-4">
      <TabsList>
        <TabsTrigger value="">Incidents</TabsTrigger>
        <TabsTrigger value="employee-register">Employee Register</TabsTrigger>
        <TabsTrigger value="service-book-register">Service Book Register</TabsTrigger>
      </TabsList>

      <TabsContent value="">
        <IncidentsView flash={flash} userName={userName} />
      </TabsContent>
      <TabsContent value="employee-register">
        <PlaceholderView
          icon={Users}
          title="Employee Register"
          desc="Statutory employee register for labour law compliance."
        />
      </TabsContent>
      <TabsContent value="service-book-register">
        <PlaceholderView
          icon={BookOpen}
          title="Service Book Register"
          desc="Service book register across all employees."
        />
      </TabsContent>
    </Tabs>
  )
}
