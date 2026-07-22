import { Eye, EyeOff, Settings2 } from "lucide-react"
import { Button } from "src/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "src/components/ui/dropdown-menu"

function columnKey(column) {
  return column?.accessorKey || column?.id || String(column?.header || "column")
}

export default function AedsDataGridColumnMenu({ columns, columnVisibility, setColumnVisibility }) {
  const toggle = (key) => {
    setColumnVisibility((current) => ({ ...current, [key]: current[key] === false }))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm"><Settings2 size={16} /> Columns</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {columns.map((column) => {
          const key = columnKey(column)
          const visible = columnVisibility[key] !== false
          return (
            <DropdownMenuItem key={key} onSelect={(event) => { event.preventDefault(); toggle(key) }}>
              {visible ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>{column.header}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
