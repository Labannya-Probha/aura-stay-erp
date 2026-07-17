import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import AedsWidgetCard from "./AedsWidgetCard"

export default function AedsKpiWidget({ widget }) {
  const Icon = widget.icon
  const down = String(widget.delta || "").includes("-")
  const DeltaIcon = down ? ArrowDownRight : ArrowUpRight

  return (
    <AedsWidgetCard title={widget.title} subtitle={widget.subtitle} span={widget.span || 3}>
      <div className="aeds-kpi-body">
        <div className={`aeds-kpi-icon ${widget.tone || ""}`}>
          {Icon && <Icon size={24} />}
        </div>

        <div>
          <div className="aeds-kpi-value">{widget.value}</div>
          <div className={`aeds-kpi-delta ${down ? "down" : ""}`}>
            <DeltaIcon size={14} />
            <span>{widget.delta}</span>
            <small>{widget.caption || "vs previous period"}</small>
          </div>
        </div>
      </div>
    </AedsWidgetCard>
  )
}
