import ConfigView   from './payroll/ConfigView'
import GenerateView from './payroll/GenerateView'
import RegisterView from './payroll/RegisterView'
import ApproveView  from './payroll/ApproveView'
import { Button } from 'src/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'src/components/ui/tabs'

const SUB_VIEWS = [
  { key: '',         label: 'Overview'  },
  { key: 'config',   label: 'Config'    },
  { key: 'generate', label: 'Generate'  },
  { key: 'register', label: 'Register'  },
  { key: 'approve',  label: 'Approve'   },
]

export default function PayrollTab({ view, setView, flash, userName, canApprove }) {
  return (
    <Tabs value={view || ''} onValueChange={setView} className="space-y-4">
      <TabsList>
        {SUB_VIEWS.map((sv) => (
          <TabsTrigger key={sv.key} value={sv.key}>
            {sv.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="">
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-5 space-y-1">
            <div className="text-xs font-semibold text-pine/50 uppercase tracking-wide">Config</div>
            <div className="text-sm text-pine/70">Set per-designation allowances that feed into payroll generation.</div>
            <Button variant="link" size="sm" className="mt-2" onClick={() => setView('config')}>Open Config →</Button>
          </div>
          <div className="card p-5 space-y-1">
            <div className="text-xs font-semibold text-pine/50 uppercase tracking-wide">Generate</div>
            <div className="text-sm text-pine/70">Compute monthly salary for all active employees and create a draft payroll run.</div>
            <Button variant="link" size="sm" className="mt-2" onClick={() => setView('generate')}>Generate →</Button>
          </div>
          <div className="card p-5 space-y-1">
            <div className="text-xs font-semibold text-pine/50 uppercase tracking-wide">Register</div>
            <div className="text-sm text-pine/70">View all payroll runs and individual payslips. Print payroll register.</div>
            <Button variant="link" size="sm" className="mt-2" onClick={() => setView('register')}>View Register →</Button>
          </div>
          <div className="card p-5 space-y-1">
            <div className="text-xs font-semibold text-pine/50 uppercase tracking-wide">Approve &amp; Post</div>
            <div className="text-sm text-pine/70">Approve draft runs and post to the general ledger (EXPENSE + LIABILITY).</div>
            <Button variant="link" size="sm" className="mt-2" onClick={() => setView('approve')}>Approve →</Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="config"><ConfigView flash={flash} /></TabsContent>
      <TabsContent value="generate"><GenerateView flash={flash} userName={userName} /></TabsContent>
      <TabsContent value="register"><RegisterView /></TabsContent>
      <TabsContent value="approve"><ApproveView flash={flash} userName={userName} canApprove={canApprove} /></TabsContent>
    </Tabs>
  )
}
