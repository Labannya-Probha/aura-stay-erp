import AedsWidgetCard from "./AedsWidgetCard"

export default function AedsTableWidget({ widget }) {
  const columns = widget.columns || []
  const rows = widget.rows || []

  return (
    <AedsWidgetCard title={widget.title} subtitle={widget.subtitle} span={widget.span || 6}>
      <table className="aeds-widget-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || index}>
              {columns.map((column) => (
                <td key={column.key}>{row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </AedsWidgetCard>
  )
}
