import Dashboard from "./Dashboard"
import { useDashboard } from "./hooks/useDashboard"

export default function DashboardPage({ company, userName }) {
  const dashboard = useDashboard({ realtime: true })

  return (
    <Dashboard
      company={company}
      userName={userName}
      {...dashboard}
    />
  )
}
