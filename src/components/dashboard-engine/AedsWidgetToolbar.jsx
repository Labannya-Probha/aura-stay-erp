import { LayoutGrid, Plus, RefreshCcw, Save } from "lucide-react"

export default function AedsWidgetToolbar({ onReset, onRefresh, onSave }) {
  return (
    <div className="aeds-dashboard-toolbar">
      <button type="button" className="aeds-widget-btn primary">
        <Plus size={16} />
        Add Widget
      </button>

      <button type="button" className="aeds-widget-btn" onClick={onRefresh}>
        <RefreshCcw size={16} />
        Refresh
      </button>

      <button type="button" className="aeds-widget-btn" onClick={onReset}>
        <LayoutGrid size={16} />
        Reset Layout
      </button>

      <button type="button" className="aeds-widget-btn" onClick={onSave}>
        <Save size={16} />
        Save View
      </button>
    </div>
  )
}
