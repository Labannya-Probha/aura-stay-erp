import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './command'
import { cn } from '../../lib/utils'

export function Combobox({
  items = [],
  value,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No results found.',
  className = '',
  disabled = false,
}) {
  const [open, setOpen] = React.useState(false)
  const selected = items.find(it => it.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'input w-full flex items-center justify-between gap-2 cursor-pointer',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          <span className={selected ? 'text-pine truncate' : 'text-pine/40'}>
            {selected?.label || placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 text-pine/40 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {items.map(it => (
                <CommandItem
                  key={it.value}
                  value={it.label}
                  onSelect={() => {
                    onChange(it.value, it)
                    setOpen(false)
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4 text-forest shrink-0', value === it.value ? 'opacity-100' : 'opacity-0')} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{it.label}</div>
                    {it.sublabel && <div className="text-xs text-pine/40 truncate">{it.sublabel}</div>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
