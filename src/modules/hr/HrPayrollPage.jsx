import { useState } from 'react'
import { Users } from 'lucide-react'
import { HR_TABS } from './hr.config'
import { useHrTabs } from './hooks/useHrTabs'
import EmployeesTab    from './tabs/EmployeesTab'
import AttendanceTab   from './tabs/AttendanceTab'
import LeaveTab        from './tabs/LeaveTab'
import PayrollTab      from './tabs/PayrollTab'
import LettersDocumentsTab from './tabs/LettersDocumentsTab'
import ComplianceTab   from './tabs/ComplianceTab'

export default function HrPayrollPage({ userName, role, isAdmin }) {
  const { tab, view, setTab, setView } = useHrTabs('employees')
  const [msg, setMsg] = useState('')
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 5000) }
  const canApprove = isAdmin || role === 'MANAGER' || role === 'HR'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-pine flex items-center gap-2">
          <Users className="text-forest" /> HR &amp; Payroll
        </h1>
        <p className="text-sm text-pine/60">
          Employees, attendance, leave, payroll, documents and compliance — all in one place.
        </p>
      </div>

      {msg && <div className="px-4 py-3 rounded-lg bg-forest/10 text-forest text-sm font-medium">{msg}</div>}

      {/* Main tab bar */}
      <div className="flex gap-0.5 border-b border-leaf flex-wrap">
        {HR_TABS.map((t) => {
          const Icon = t.icon
          return (
            <button key={t.key}
              onClick={() => setTab(t.key, '')}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg flex items-center gap-1.5 transition-colors
                ${tab === t.key
                  ? 'bg-white border border-leaf border-b-white text-forest -mb-px'
                  : 'text-pine/60 hover:text-pine'}`}>
              <Icon size={14} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {tab === 'employees'  && <EmployeesTab flash={flash} isAdmin={isAdmin} />}
      {tab === 'attendance' && <AttendanceTab flash={flash} />}
      {tab === 'leave'      && <LeaveTab flash={flash} userName={userName} canApprove={canApprove} view={view} setView={setView} />}
      {tab === 'payroll'    && <PayrollTab view={view} setView={setView} />}
      {tab === 'letters'    && <LettersDocumentsTab flash={flash} userName={userName} view={view} setView={setView} />}
      {tab === 'compliance' && <ComplianceTab flash={flash} userName={userName} view={view} setView={setView} />}
    </div>
  )
}
