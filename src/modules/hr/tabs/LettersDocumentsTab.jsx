import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { fmtDate, todayISO } from '../../../lib/helpers'
import { FileText, Plus, Eye } from 'lucide-react'
import { Button } from 'src/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'src/components/ui/tabs'
import HrLetterDrawer from '../components/HrLetterDrawer'

const DOC_TYPES = ['LETTER', 'MEMO', 'NOTICE', 'CIRCULAR', 'INWARD', 'OUTWARD']

function DocRegisterView({ flash, userName, view }) {
  const [rows, setRows] = useState([])
  const [f, setF] = useState({
    doc_date: todayISO(),
    department: 'GEN',
    doc_type: view && DOC_TYPES.includes(view) ? view : 'LETTER',
    subject: '',
    party: '',
  })
  const [viewing, setViewing] = useState(null)

  const load = async () => {
    let q = supabase.from('doc_register').select('*').order('created_at', { ascending: false })
    if (view && DOC_TYPES.includes(view)) q = q.eq('doc_type', view)
    const { data } = await q
    setRows(data || [])
  }
  useEffect(() => {
    load()
  }, [view])

  const add = async () => {
    if (!f.subject) return
    const { error } = await supabase.from('doc_register').insert({ ...f, created_by: userName })
    if (error) flash(error.message)
    else {
      setF({
        doc_date: todayISO(),
        department: 'GEN',
        doc_type: f.doc_type,
        subject: '',
        party: '',
      })
      load()
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 grid grid-cols-6 gap-2">
        <input
          type="date"
          className="input"
          value={f.doc_date}
          onChange={(e) => setF({ ...f, doc_date: e.target.value })}
        />
        <input
          className="input"
          placeholder="Dept"
          value={f.department}
          onChange={(e) => setF({ ...f, department: e.target.value })}
        />
        <select
          className="input"
          value={f.doc_type}
          onChange={(e) => setF({ ...f, doc_type: e.target.value })}
        >
          {DOC_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <input
          className="input"
          placeholder="Subject"
          value={f.subject}
          onChange={(e) => setF({ ...f, subject: e.target.value })}
        />
        <input
          className="input"
          placeholder="Party"
          value={f.party}
          onChange={(e) => setF({ ...f, party: e.target.value })}
        />
        <Button variant="default" className="justify-center" onClick={add}>
          <Plus size={15} /> Register
        </Button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">Docket No</th>
              <th className="th">Date</th>
              <th className="th">Type</th>
              <th className="th">Subject</th>
              <th className="th">Party</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="td money text-xs font-semibold">{r.doc_no}</td>
                <td className="td money text-xs">{fmtDate(r.doc_date)}</td>
                <td className="td text-xs">{r.doc_type}</td>
                <td className="td text-sm">{r.subject}</td>
                <td className="td text-xs">{r.party || '—'}</td>
                <td className="td">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setViewing(r)}
                    aria-label={`View ${r.doc_no}`}
                  >
                    <Eye size={14} />
                  </Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="td text-pine/40" colSpan={6}>
                  No documents registered.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <HrLetterDrawer item={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}

export default function LettersDocumentsTab({ flash, userName, view, setView }) {
  return (
    <Tabs value={view || ''} onValueChange={setView} className="space-y-4">
      <TabsList className="flex-wrap">
        <TabsTrigger value="">
          <FileText size={11} /> All
        </TabsTrigger>
        {DOC_TYPES.map((t) => (
          <TabsTrigger key={t} value={t}>
            <FileText size={11} /> {t}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value={view || ''}>
        <DocRegisterView flash={flash} userName={userName} view={view} />
      </TabsContent>
    </Tabs>
  )
}
