import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { Card, CardContent } from "../ui/card"

export default function AedsMetricCard({ title, value, delta, icon: Icon, tone = "success" }) {
  const positive = !String(delta || "").includes("-")
  const ToneIcon = positive ? ArrowUpRight : ArrowDownRight

  return (
    <Card className="transition hover:-translate-y-0.5 hover:shadow-[0_22px_70px_rgba(15,23,42,.08)]">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`aeds-metric-icon ${tone}`}>{Icon && <Icon size={24} />}</div>
        <div>
          <p className="text-xs font-bold text-slate-500">{title}</p>
          <div className="mt-1 text-2xl font-black tracking-tight text-slate-950">{value}</div>
          <div className={`mt-1 flex items-center gap-1 text-xs font-bold ${positive ? "text-emerald-600" : "text-red-600"}`}>
            <ToneIcon size={13} />
            <span>{delta}</span>
            <span className="text-slate-400">vs last month</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
