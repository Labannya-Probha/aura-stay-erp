import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Printer, Trash2, Plus, Edit3 } from 'lucide-react'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

export default function VDSCertificates() {
  const [certs, setCerts] = useState([])
  const [editId, setEditId] = useState(null)
  const [f, setF] = useState({ 
    vendor_name: '', bin_number: '', invoice_amount: '', 
    vat_deducted: '', cert_no: '', challan_no: '', challan_date: '', vds_rate: '' 
  })

  const load = async () => {
    const { data } = await supabase.from('vds_certificates').select('*').order('id', { ascending: false })
    setCerts(data || [])
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!f.vendor_name || !f.bin_number) {
      alert("Vendor Name and BIN are required!")
      return
    }

    const payload = {
      vendor_name: f.vendor_name,
      party_name: f.vendor_name,
      bin_number: f.bin_number,
      party_bin: f.bin_number,
      invoice_amount: parseFloat(f.invoice_amount) || 0,
      vat_deducted: parseFloat(f.vat_deducted) || 0,
      vds_amount: parseFloat(f.vat_deducted) || 0,
      vds_rate: parseFloat(f.vds_rate) || 0,
      cert_no: f.cert_no || 'N/A',
      challan_no: f.challan_no || 'N/A',
      challan_date: f.challan_date || null,
      created_by: 'Admin',
      direction: 'OUTGOING'
    }

    if (editId) {
      await supabase.from('vds_certificates').update(payload).eq('id', editId)
      setEditId(null)
    } else {
      await supabase.from('vds_certificates').insert(payload)
    }

    setF({ vendor_name: '', bin_number: '', invoice_amount: '', vat_deducted: '', cert_no: '', challan_no: '', challan_date: '', vds_rate: '' })
    load()
  }

  const startEdit = (c) => {
    setEditId(c.id)
    setF(c)
  }

  const del = async (id) => {
    await supabase.from('vds_certificates').delete().eq('id', id)
    load()
  }

  const printMushak66 = (c) => {
    const doc = new jsPDF()
    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.text('মূসক ৬.৬', 105, 15, { align: 'center' })
    doc.setFontSize(12)
    doc.text('উৎসে কর কর্তন সনদপত্র', 105, 22, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`সরবরাহকারীর নাম: ${c.vendor_name || 'N/A'}`, 20, 35)
    doc.text(`সরবরাহকারীর বিআইএন (BIN): ${c.bin_number || 'N/A'}`, 20, 42)
    const tableColumn = ["ক্রমিক", "বিবরণ", "চালান নম্বর ও তারিখ", "ভ্যাট কর্তনের পরিমাণ (টাকা)"]
    const tableRows = [["১", "পণ্য বা সেবার বিবরণ", `${c.challan_no || 'N/A'} / ${c.challan_date || 'N/A'}`, c.vat_deducted || '0']]
    doc.autoTable({ startY: 50, head: [tableColumn], body: tableRows, theme: 'grid', styles: { font: "helvetica", fontSize: 10 } })
    const finalY = doc.lastAutoTable.finalY
    doc.text(`জমাকৃত ট্রেজারি চালানের নম্বর: ${c.challan_no || 'N/A'}`, 20, finalY + 10)
    doc.text(`তারিখ: ${c.challan_date || 'N/A'}`, 20, finalY + 17)
    doc.text('কর্তনকারী কর্তৃপক্ষের স্বাক্ষর ও সিল', 150, finalY + 30, { align: 'center' })
    doc.save(`Mushak6.6_${c.cert_no || 'cert'}.pdf`)
  }

  return (
    <div className="card p-5">
      <h2 className="text-xl font-bold mb-4">VDS Certificates</h2>
      <div className="grid grid-cols-4 gap-2 mb-4">
        <input className="input" placeholder="Vendor" value={f.vendor_name} onChange={(e) => setF({...f, vendor_name: e.target.value})} />
        <input className="input" placeholder="BIN" value={f.bin_number} onChange={(e) => setF({...f, bin_number: e.target.value})} />
        <input className="input" placeholder="Amount" value={f.invoice_amount} onChange={(e) => setF({...f, invoice_amount: e.target.value})} />
        <input className="input" placeholder="VAT" value={f.vat_deducted} onChange={(e) => setF({...f, vat_deducted: e.target.value})} />
        <input className="input" placeholder="Rate %" value={f.vds_rate} onChange={(e) => setF({...f, vds_rate: e.target.value})} />
        <input className="input" placeholder="Cert No" value={f.cert_no} onChange={(e) => setF({...f, cert_no: e.target.value})} />
        <input className="input" placeholder="Challan No" value={f.challan_no} onChange={(e) => setF({...f, challan_no: e.target.value})} />
        <input type="date" className="input" value={f.challan_date} onChange={(e) => setF({...f, challan_date: e.target.value})} />
        <button className="btn-primary col-span-4" onClick={save}>{editId ? 'Update' : 'Add'} Certificate</button>
      </div>

      <table className="w-full">
        <thead>
          <tr>
            <th className="th">DATE</th>
            <th className="th">DIR</th>
            <th className="th">CERT</th>
            <th className="th">PARTY</th>
            <th className="th">BASE</th>
            <th className="th">RATE</th>
            <th className="th">VDS</th>
            <th className="th">CHALLAN</th>
            <th className="th">ACTION</th>
          </tr>
        </thead>
        <tbody>
          {certs.map(c => (
            <tr key={c.id}>
              <td className="td">{c.challan_date}</td>
              <td className="td">{c.direction}</td>
              <td className="td">{c.cert_no}</td>
              <td className="td">{c.vendor_name}</td>
              <td className="td">{c.invoice_amount}</td>
              <td className="td">{c.vds_rate}%</td>
              <td className="td font-bold">{c.vds_amount}</td>
              <td className="td">{c.challan_no}</td>
              <td className="td flex gap-2">
                <button onClick={() => printMushak66(c)} className="text-forest"><Printer size={16}/></button>
                <button onClick={() => startEdit(c)} className="text-blue-500"><Edit3 size={16}/></button>
                <button onClick={() => del(c.id)} className="text-red-500"><Trash2 size={16}/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
