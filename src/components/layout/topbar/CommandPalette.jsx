import { Search, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useEffect, useRef } from "react"
import { useGlobalSearch } from "./hooks/useGlobalSearch"

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const { query, setQuery, results } = useGlobalSearch()

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => inputRef.current?.focus(), 0)
    return () => clearTimeout(timer)
  }, [open])

  if (!open) return null

  function go(path) {
    onClose()
    navigate(path)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/35 p-4 backdrop-blur-sm">
      <div className="mx-auto mt-[8vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <Search size={18} className="text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search command, guest, reservation, module..."
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
          />
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <X size={17} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm font-semibold text-slate-400">
              No command found
            </div>
          ) : (
            results.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.path)}
                className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition hover:bg-slate-50"
              >
                <div>
                  <div className="text-sm font-black text-slate-800">{item.title}</div>
                  <div className="mt-0.5 text-xs font-semibold text-slate-400">{item.group}</div>
                </div>
                <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-400">
                  Enter
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
