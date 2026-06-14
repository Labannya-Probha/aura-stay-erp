import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Printer, FileDown } from 'lucide-react'

export default function ReportingPanel() {
  const [reports, setReports] = useState([])
  const [filter, setFilter] = useState('')

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const { data } = await supabase.from('reports_config').select('*')
    setReports(data || [])
  }

  const filteredReports = reports.filter(r => 
    r.report_name.toLowerCase().includes(filter.toLowerCase()) ||
    r.department.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="card p-5">
      <h2 className="text-xl font-bold mb-4">Reporting Panel</h2>
      <input 
        className="input mb-4 w-full" 
        placeholder="Filter by Name or Department..." 
        value={filter} 
        onChange={(e) => setFilter(e.target.value)} 
      />
      
      <table className="w-full">
        <thead>
          <tr>
            <th className="th">Department</th>
            <th className="th">Report Name</th>
            <th className="th">Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredReports.map(r => (
            <tr key={r.id}>
              <td className="td">{r.department}</td>
              <td className="td">{r.report_name}</td>
              <td className="td flex gap-2">
                <button className="text-forest"><Printer size={16}/></button>
                <button className="text-blue-500"><FileDown size={16}/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
