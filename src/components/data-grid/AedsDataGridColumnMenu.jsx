import { Eye, EyeOff, Settings2 } from "lucide-react"

export default function AedsDataGridColumnMenu({ columns, columnVisibility, setColumnVisibility }) {
  const toggle = (key) => {
    setColumnVisibility((current) => ({ ...current, [key]: current[key] === false }))
  }

  return (
    <details className="aeds-grid-column-menu">
      <summary className="aeds-grid-btn"><Settings2 size={16} /> Columns</summary>
      <div className="aeds-grid-column-panel">
        {columns.map((column) => {
          const visible = columnVisibility[column.accessorKey] !== false
          return (
            <button type="button" key={column.accessorKey} onClick={() => toggle(column.accessorKey)}>
              {visible ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>{column.header}</span>
            </button>
          )
        })}
      </div>
    </details>
  )
}
