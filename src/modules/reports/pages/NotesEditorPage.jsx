import { useEffect, useState } from 'react'
import { supabase } from 'src/lib/supabase'
import { getTenantId } from 'src/lib/tenant'
import { Button } from 'src/components/ui/button'
import { Plus, Trash2, Save } from 'lucide-react'

const CATEGORIES = [
  'ACCOUNTING_POLICIES', 'CASH', 'RECEIVABLE', 'INVENTORY', 'FIXED_ASSETS',
  'DEPRECIATION', 'BORROWINGS', 'REVENUE_RECOGNITION', 'RELATED_PARTY',
  'COMMITMENTS', 'CONTINGENCIES', 'SUBSEQUENT_EVENTS', 'TAX', 'OTHER',
]

const EMPTY_NOTE = { note_number: '', title: '', category: 'ACCOUNTING_POLICIES', content: '', display_order: 0 }

/**
 * Phase 4 (Notes to Financial Statements) — sprint step 2: frontend CRUD.
 * Standalone page, touches no existing report rendering code. Reads/writes
 * financial_statement_notes directly (RLS-scoped to the current tenant);
 * writes go through the standard Supabase client rather than the
 * read-only get_financial_statement_notes RPC, since RLS already enforces
 * tenant isolation on insert/update/delete.
 */
export default function NotesEditorPage() {
  const tenantId = getTenantId()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('financial_statement_notes')
      .select('*')
      .order('display_order', { ascending: true })
    if (err) setError(err.message)
    else setNotes(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const startNew = () => setEditing({ ...EMPTY_NOTE, display_order: notes.length + 1 })

  const save = async () => {
    if (!editing?.note_number || !editing?.title || !editing?.content) return
    setSaving(true)
    setError(null)
    const payload = { ...editing, tenant_id: tenantId }
    const { error: err } = editing.id
      ? await supabase.from('financial_statement_notes').update(payload).eq('id', editing.id)
      : await supabase.from('financial_statement_notes').insert(payload)
    setSaving(false)
    if (err) { setError(err.message); return }
    setEditing(null)
    load()
  }

  const remove = async (id) => {
    const { error: err } = await supabase.from('financial_statement_notes').delete().eq('id', id)
    if (err) { setError(err.message); return }
    load()
  }

  return (
    <div className="p-6 space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Notes to Financial Statements</h1>
          <p className="text-sm text-slate-500">Manage accounting policy and disclosure notes referenced from financial statement lines.</p>
        </div>
        <Button variant="default" onClick={startNew}>
          <Plus size={15} /> New Note
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {editing && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <input
              className="input col-span-1"
              placeholder="Note #"
              value={editing.note_number}
              onChange={(e) => setEditing({ ...editing, note_number: e.target.value })}
            />
            <input
              className="input col-span-2"
              placeholder="Title"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />
            <select
              className="input col-span-1"
              value={editing.category}
              onChange={(e) => setEditing({ ...editing, category: e.target.value })}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <textarea
            className="input w-full min-h-32"
            placeholder="Note content..."
            value={editing.content}
            onChange={(e) => setEditing({ ...editing, content: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
            <Button variant="default" onClick={save} disabled={saving}>
              <Save size={15} /> {saving ? 'Saving…' : 'Save Note'}
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="px-4 py-4 text-slate-400" colSpan={4}>Loading…</td></tr>}
            {!loading && notes.length === 0 && <tr><td className="px-4 py-4 text-slate-400" colSpan={4}>No notes yet.</td></tr>}
            {notes.map((n) => (
              <tr key={n.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-semibold">{n.note_number}</td>
                <td className="px-4 py-2">{n.title}</td>
                <td className="px-4 py-2 text-xs text-slate-500">{n.category.replace(/_/g, ' ')}</td>
                <td className="px-4 py-2 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(n)}>Edit</Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => remove(n.id)} aria-label={`Delete note ${n.note_number}`}>
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
