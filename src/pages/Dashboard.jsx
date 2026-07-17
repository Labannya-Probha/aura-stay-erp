import Dashboard from "../components/dashboard/Dashboard"

export default function DashboardPage({
  company,
  userName,
}) {
  return (
    <Dashboard
      company={company}
      userName={userName}
    />
  )
}