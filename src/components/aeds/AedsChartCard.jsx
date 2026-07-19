import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"

export default function AedsChartCard({ title, children, action = "Monthly", className = "" }) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Badge>{action}</Badge>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
