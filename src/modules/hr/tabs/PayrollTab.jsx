import { Settings2, PlayCircle, ClipboardList, CheckSquare } from 'lucide-react'

const SUB_VIEWS = [
  { key: '',         label: 'Configuration', icon: Settings2,     desc: 'Configure payroll components, salary structures, and deductions.' },
  { key: 'generate', label: 'Generate',      icon: PlayCircle,    desc: 'Generate monthly payroll for all active employees.' },
  { key: 'register', label: 'Register',      icon: ClipboardList, desc: 'View payroll register and salary slips by month.' },
  { key: 'approve',  label: 'Approve',       icon: CheckSquare,   desc: 'Approve and post payroll to accounting journal.' },
]

export default function PayrollTab({ view, setView }) {
  const active = SUB_VIEWS.find((sv) => sv.key === view) || SUB_VIEWS[0]
  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-leaf/60">
        {SUB_VIEWS.map((sv) => (
          <button key={sv.key} onClick={() => setView(sv.key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t flex items-center gap-1.5 ${sv.key === (view || '') ? 'bg-white border border-leaf border-b-white text-forest -mb-px' : 'text-pine/60 hover:text-pine'}`}>
            <sv.icon size={12} /> {sv.label}
          </button>
        ))}
      </div>
      <div className="card p-8 text-center space-y-3">
        <active.icon size={36} className="mx-auto text-forest/40" />
        <h3 className="font-semibold text-pine text-lg">{active.label}</h3>
        <p className="text-pine/60 text-sm max-w-sm mx-auto">{active.desc}</p>
        <p className="text-xs text-pine/40 mt-2 italic">Payroll module — coming in next phase.</p>
      </div>
    </div>
  )
}
