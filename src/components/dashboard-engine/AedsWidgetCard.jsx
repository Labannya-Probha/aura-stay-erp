import { GripVertical, Maximize2, MoreHorizontal, X } from "lucide-react"

export default function AedsWidgetCard({ title, subtitle, span = 4, children, onRemove }) {
  return (
    <section className={`aeds-widget-card span-${span}`}>
      <header className="aeds-widget-header">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>

        <div className="aeds-widget-menu">
          <button type="button" title="Drag">
            <GripVertical size={15} />
          </button>
          <button type="button" title="Expand">
            <Maximize2 size={15} />
          </button>
          <button type="button" title="More">
            <MoreHorizontal size={15} />
          </button>
          {onRemove && (
            <button type="button" title="Remove" onClick={onRemove}>
              <X size={15} />
            </button>
          )}
        </div>
      </header>

      <div className="aeds-widget-body">{children}</div>
    </section>
  )
}
