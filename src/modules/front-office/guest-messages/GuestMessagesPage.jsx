import { useCallback, useEffect, useState } from 'react'
import { MessageSquareText } from 'lucide-react'
import { supabase } from '../../../supabase'
import { withTenantScope } from '../../../lib/companySettings'
import { fmtDate } from '../../../lib/helpers'

export default function GuestMessagesPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      if (!supabase) throw new Error('Supabase is not configured.')
      const { data, error: queryError } = await withTenantScope(supabase.from('guest_messages').select('*')).order('created_at', { ascending: false }).limit(200)
      if (queryError) throw queryError
      setRows(data || [])
    } catch (err) { setError(err.message || 'Could not load guest messages.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  return <div className="rounded-xl border border-slate-200 bg-white">
    <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4"><div className="flex gap-3"><span className="rounded-lg bg-slate-100 p-2 text-slate-600"><MessageSquareText className="h-5 w-5" /></span><div><h2 className="font-semibold text-slate-900">Guest Message Board</h2><p className="mt-1 text-sm text-slate-500">Guest requests, internal handover notes and follow-up status.</p></div></div><button onClick={load} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Refresh</button></div>
    {error ? <div className="m-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</div> : null}
    <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200 text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Message</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan="5" className="px-4 py-10 text-center text-slate-500">Loading guest messages…</td></tr> : rows.length === 0 ? <tr><td colSpan="5" className="px-4 py-10 text-center text-slate-500">No guest messages.</td></tr> : rows.map((row) => <tr key={row.id}><td className="px-4 py-3 font-medium text-slate-900">{row.subject || row.message_type || 'Guest message'}</td><td className="max-w-xl px-4 py-3 text-slate-600">{row.message || '—'}</td><td className="px-4 py-3 text-slate-600">{row.priority || 'NORMAL'}</td><td className="px-4 py-3 text-slate-600">{row.status || 'UNREAD'}</td><td className="px-4 py-3 text-slate-600">{fmtDate(row.created_at)}</td></tr>)}</tbody></table></div>
  </div>
}
