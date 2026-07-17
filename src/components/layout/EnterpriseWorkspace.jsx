import { Sparkles } from "lucide-react"
import "../../styles/aeds-v6-workspaces.css"

export default function EnterpriseWorkspace({
  title,
  subtitle,
  eyebrow = "AEDS v6 Enterprise Workspace",
  icon: Icon,
  actions,
  kpis,
  tabs,
  children,
  className = "",
}) {
  return (
    <section className={`aeds-v6-workspace ${className}`}>
      <header className="aeds-v6-workspace-header">
        <div className="aeds-v6-workspace-heading">
          {Icon && (
            <div className="aeds-v6-workspace-icon">
              <Icon size={22} aria-hidden="true" />
            </div>
          )}

          <div>
            <div className="aeds-v6-workspace-eyebrow">
              <Sparkles size={13} aria-hidden="true" />
              {eyebrow}
            </div>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>

        {actions && (
          <div className="aeds-v6-workspace-actions">
            {actions}
          </div>
        )}
      </header>

      {kpis && <div className="aeds-v6-workspace-kpis">{kpis}</div>}
      {tabs && <div className="aeds-v6-workspace-tabs">{tabs}</div>}

      <div className="aeds-v6-workspace-content">
        {children}
      </div>
    </section>
  )
}
