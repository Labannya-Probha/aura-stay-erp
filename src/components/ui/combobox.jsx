import * as React from "react"
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react"
import { cn } from "src/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "src/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "src/components/ui/command"

function normalizeItem(item) {
  if (typeof item === "string") {
    return { value: item, label: item }
  }

  return item ?? { value: "", label: "" }
}

function itemMatchesQuery(item, query) {
  if (!query) return true

  const haystack = [item.label, item.sublabel, item.value]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return haystack.includes(query.toLowerCase())
}

function Combobox({
  items = [],
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  disabled = false,
  className,
  clearable = false,
  allowCreate = false,
  onCreate,
  createLabel = "Create",
  closeOnSelect = true,
  searchValue,
  onSearchValueChange,
  isLoading = false,
  loadingText = "Searching...",
  triggerClassName,
  contentClassName,
}) {
  const normalizedItems = React.useMemo(() => items.map(normalizeItem), [items])
  const selectedItem = React.useMemo(
    () => normalizedItems.find((item) => item.value === value) ?? null,
    [normalizedItems, value]
  )

  const [open, setOpen] = React.useState(false)
  const [internalQuery, setInternalQuery] = React.useState("")
  const [creating, setCreating] = React.useState(false)
  const query = searchValue ?? internalQuery

  const setQuery = React.useCallback(
    (nextValue) => {
      if (onSearchValueChange) {
        onSearchValueChange(nextValue)
        return
      }

      setInternalQuery(nextValue)
    },
    [onSearchValueChange]
  )

  React.useEffect(() => {
    if (!open) {
      if (searchValue === undefined) {
        setInternalQuery("")
      }
      setCreating(false)
    }
  }, [open, searchValue])

  const filteredItems = React.useMemo(
    () => normalizedItems.filter((item) => itemMatchesQuery(item, query)),
    [normalizedItems, query]
  )

  const canCreate =
    allowCreate &&
    query.trim() &&
    !normalizedItems.some((item) => item.label?.toLowerCase() === query.trim().toLowerCase())

  async function handleCreate() {
    if (!onCreate || !canCreate || creating) return

    try {
      setCreating(true)
      const createdValue = await onCreate(query.trim())
      onChange?.(createdValue ?? query.trim(), {
        value: createdValue ?? query.trim(),
        label: query.trim(),
      })
      setOpen(false)
    } finally {
      setCreating(false)
    }
  }

  function handleSelect(item) {
    onChange?.(item.value, item)
    if (closeOnSelect) {
      setOpen(false)
    }
  }

  function handleClear(event) {
    event.preventDefault()
    event.stopPropagation()
    onChange?.("", null)
    setQuery("")
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("w-full", className)}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            role="combobox"
            aria-expanded={open}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-left text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60",
              open && "ring-2 ring-emerald-500/30",
              triggerClassName
            )}>
            <span className={cn("truncate", !selectedItem && "text-slate-400")}>
              {selectedItem?.label || placeholder}
            </span>
            <span className="ml-2 flex items-center gap-1">
              {clearable && selectedItem ? (
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={handleClear}
                  className="rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                  <XIcon className="size-4" />
                </span>
              ) : null}
              <ChevronDownIcon className="size-4 text-slate-400" />
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className={cn("z-50 mt-2 w-[var(--radix-popover-trigger-width)] min-w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-xl", contentClassName)}>
          <Command shouldFilter={false} className="rounded-none bg-transparent p-0" onKeyDown={handleKeyDown}>
            <div className="border-b border-slate-100 p-2">
              <CommandInput
                value={query}
                onValueChange={setQuery}
                placeholder={searchPlaceholder}
                className="h-8"
              />
            </div>

            <CommandList className="max-h-64 p-1">
              {isLoading ? <div className="px-3 py-2 text-xs font-semibold text-slate-400">{loadingText}</div> : null}

              {!isLoading ? (
                <CommandGroup>
                  {filteredItems.map((item) => {
                    const isSelected = item.value === value

                    return (
                      <CommandItem
                        key={String(item.value)}
                        value={`${item.label ?? ""} ${item.sublabel ?? ""} ${item.value ?? ""}`.trim()}
                        data-checked={isSelected ? "true" : undefined}
                        onSelect={() => handleSelect(item)}
                        className={cn(
                          "flex min-h-8 items-start justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-50",
                          isSelected && "bg-emerald-50 text-emerald-900"
                        )}>
                        <span className="min-w-0">
                          <span className="block truncate">{item.label}</span>
                          {item.sublabel ? (
                            <span className="mt-0.5 block truncate text-xs text-slate-500">{item.sublabel}</span>
                          ) : null}
                        </span>
                        {isSelected ? <CheckIcon className="mt-0.5 size-4 shrink-0" /> : null}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              ) : null}

              {!isLoading && !filteredItems.length && canCreate ? (
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="m-1 flex w-[calc(100%-0.5rem)] items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-50 disabled:opacity-60">
                  <span>{createLabel} "{query.trim()}"</span>
                  {creating ? <span className="text-xs text-slate-500">Saving...</span> : null}
                </button>
              ) : null}

              {!isLoading && !filteredItems.length && !canCreate ? (
                <CommandEmpty className="px-3 py-6 text-center text-sm text-slate-500">{emptyText}</CommandEmpty>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </div>
    </Popover>
  )
}

export { Combobox }
