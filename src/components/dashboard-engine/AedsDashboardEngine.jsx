import { useState } from "react"
import AedsWidgetToolbar from "./AedsWidgetToolbar"
import { WIDGET_REGISTRY } from "./dashboardWidgetRegistry"
import "./aeds-dashboard-engine.css"

export default function AedsDashboardEngine({
  title = "Executive Dashboard",
  subtitle = "Metadata-driven dashboard widgets for Aura Stay ERP.",
  widgets = [],
}) {
  const [activeWidgets, setActiveWidgets] = useState(widgets)
  const [version, setVersion] = useState(0)

  const resetLayout = () => setActiveWidgets(widgets)
  const refresh = () => setVersion((value) => value + 1)
  const save = () => {
    localStorage.setItem("aeds.dashboard.layout", JSON.stringify(activeWidgets.map((item) => item.id)))
  }

  return (
    <section className="aeds-dashboard-engine" key={version}>
      <header className="aeds-dashboard-header">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        <AedsWidgetToolbar
          onReset={resetLayout}
          onRefresh={refresh}
          onSave={save}
        />
      </header>

      <div className="aeds-widget-grid">
        {activeWidgets.map((widget) => {
          const WidgetComponent = WIDGET_REGISTRY[widget.type]
          if (!WidgetComponent) return null

          return (
            <WidgetComponent
              key={widget.id}
              widget={widget}
              onRemove={() => setActiveWidgets((current) => current.filter((item) => item.id !== widget.id))}
            />
          )
        })}
      </div>
    </section>
  )
}
