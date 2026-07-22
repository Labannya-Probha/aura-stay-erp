import { useEffect, useState } from 'react'
import { Users, UserCheck, CalendarClock, ClipboardList } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { todayISO } from '../../lib/helpers'
import Breadcrumb from 'src/components/layout/Breadcrumb'
import ModuleLayout from 'src/components/shared/ModuleLayout'
import { HR_TABS } from './hr.config'
import { useHrTabs } from './hooks/useHrTabs'
import EmployeesTab from './tabs/EmployeesTab'
import AttendanceTab from './tabs/AttendanceTab'
import LeaveTab from './tabs/LeaveTab'
import PayrollTab from './tabs/PayrollTab'
import LettersDocumentsTab from './tabs/LettersDocumentsTab'
import ComplianceTab from './tabs/ComplianceTab'

function KpiStrip() {
  const [kpi, setKpi] = useState({
    headcount: null,
    present: null,
    total: null,
    pendingLeave: null,
  })

  useEffect(() => {
    const load = async () => {
      const today = todayISO()
      const [{ count: headcount }, { data: att }, { count: pendingLeave }] = await Promise.all([
        supabase
          .from('employees')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'ACTIVE'),
        supabase.from('attendance_records').select('status').eq('att_date', today),
        supabase
          .from('leave_applications')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'PENDING'),
      ])
      const present = (att || []).filter((r) => r.status === 'P').length
      const total = (att || []).length
      setKpi({ headcount, present, total, pendingLeave })
    }
    load()
  }, [])

  const attPct = kpi.total > 0 ? Math.round((kpi.present / kpi.total) * 100) : null

  const tiles = [
    {
      label: 'Active Employees',
      value: kpi.headcount ?? '—',
      icon: Users,
      color: 'text-forest',
      bg: 'bg-forest/10',
    },
    {
      label: "Today's Attendance",
      value: attPct != null ? `${attPct}%` : kpi.total === 0 ? 'Not marked' : '—',
      sub: kpi.total > 0 ? `${kpi.present} / ${kpi.total} present` : null,
      icon: UserCheck,
      color: attPct != null && attPct < 70 ? 'text-red-600' : 'text-forest',
      bg: 'bg-forest/10',
    },
    {
      label: 'Leave Pending',
      value: kpi.pendingLeave ?? '—',
      icon: CalendarClock,
      color: kpi.pendingLeave > 0 ? 'text-amber' : 'text-forest',
      bg: kpi.pendingLeave > 0 ? 'bg-amber/10' : 'bg-forest/10',
    },
    {
      label: 'Payroll',
      value: 'Phase 2',
      icon: ClipboardList,
      color: 'text-pine/40',
      bg: 'bg-leaf/30',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {tiles.map((t) => (
        <div key={t.label} className={`rounded-xl p-4 ${t.bg} flex items-start gap-3`}>
          <div className={`mt-0.5 ${t.color}`}>
            <t.icon size={18} />
          </div>
          <div className="min-w-0">
            <div className={`text-xl font-bold ${t.color} metric-value`}>{t.value}</div>
            {t.sub && <div className="text-[10px] text-pine/50 leading-tight">{t.sub}</div>}
            <div className="text-[11px] text-pine/50 mt-0.5">{t.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function HrPayrollPage({ userName, role, isAdmin }) {
  const { tab, view, setTab, setView } = useHrTabs('employees')
  const [msg, setMsg] = useState('')
  const flash = (m) => {
    setMsg(m)
    setTimeout(() => setMsg(''), 5000)
  }
  const canApprove = isAdmin || role === 'MANAGER' || role === 'HR'

  const breadcrumb = [
    { label: 'Modules' },
    { label: 'HR & Payroll' },
    { label: HR_TABS.find((item) => item.key === tab)?.label || 'Overview', current: true },
  ]

  return (
    <ModuleLayout
      moduleName="HR & Payroll"
      routeKey="hr-payroll"
      eyebrow="People & Compliance"
      title="HR & Payroll"
      description="Employees, attendance, leave, payroll, documents and compliance in one workspace."
      icon={Users}
      breadcrumb={<Breadcrumb items={breadcrumb} />}
      kpis={<KpiStrip />}
      tabs={
        <div className="tab-strip-responsive border-b border-leaf gap-0.5">
          {HR_TABS.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key, '')}
                className={`tab-button-responsive px-4 py-2 text-sm font-semibold rounded-t-lg flex items-center gap-1.5 transition-colors
                  ${
                    tab === t.key
                      ? 'bg-white border border-leaf border-b-white text-forest -mb-px'
                      : 'text-pine/60 hover:text-pine'
                  }`}
              >
                <Icon size={14} /> {t.label}
              </button>
            )
          })}
        </div>
      }
    >
      {msg && (
        <div className="rounded-lg bg-forest/10 px-4 py-3 text-sm font-medium text-forest">
          {msg}
        </div>
      )}
      {tab === 'employees' && <EmployeesTab flash={flash} isAdmin={isAdmin} userName={userName} />}
      {tab === 'attendance' && <AttendanceTab flash={flash} />}
      {tab === 'leave' && (
        <LeaveTab
          flash={flash}
          userName={userName}
          canApprove={canApprove}
          view={view}
          setView={setView}
        />
      )}
      {tab === 'payroll' && (
        <PayrollTab
          view={view}
          setView={setView}
          flash={flash}
          userName={userName}
          canApprove={canApprove}
        />
      )}
      {tab === 'letters' && (
        <LettersDocumentsTab flash={flash} userName={userName} view={view} setView={setView} />
      )}
      {tab === 'compliance' && (
        <ComplianceTab flash={flash} userName={userName} view={view} setView={setView} />
      )}
    </ModuleLayout>
  )
}
