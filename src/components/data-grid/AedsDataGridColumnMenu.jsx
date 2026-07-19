import { Eye, EyeOff, Settings2 } from "lucide-react"
import { Button } from "src/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "src/components/ui/dropdown-menu"

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
          const visible = columnVisibility[column.accessorKey] !== false
          return (
            <DropdownMenuItem key={column.accessorKey} onSelect={(event) => { event.preventDefault(); toggle(column.accessorKey) }}>
              {visible ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>{column.header}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
