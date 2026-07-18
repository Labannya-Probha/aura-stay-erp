import { useCallback, useMemo, useState } from 'react'
import { CreditCard, Plus } from 'lucide-react'
import { getTenantId } from '../../../lib/tenant.js'
import ConfirmDeleteDialog from './components/ConfirmDeleteDialog.jsx'
import EmptyState from './components/EmptyState.jsx'
import PaymentTerminalDialog from './components/PaymentTerminalDialog.jsx'
import PaymentTerminalTable from './components/PaymentTerminalTable.jsx'
import PaymentTerminalToolbar from './components/PaymentTerminalToolbar.jsx'
import usePaymentConfiguration from './hooks/usePaymentConfiguration.js'

export default function PaymentConfigurationPage(){
 const tenantId=getTenantId(); const [notice,setNotice]=useState(''); const [editorOpen,setEditorOpen]=useState(false); const [selectedTerminal,setSelectedTerminal]=useState(null); const [deleteTarget,setDeleteTarget]=useState(null)
 const {terminals,settlementAccounts,search,setSearch,isLoading,isRefreshing,isSaving,pendingTerminalId,error,refresh,createTerminal,updateTerminal,toggleTerminalStatus,removeTerminal}=usePaymentConfiguration(tenantId)
 const summary=useMemo(()=>{const total=terminals.length,active=terminals.filter(x=>x.is_active).length,mappedAccounts=new Set(terminals.map(x=>x.settlement_account_id).filter(Boolean)).size;return{total,active,inactive:total-active,mappedAccounts}},[terminals])
 const showNotice=useCallback(m=>{setNotice(m);window.setTimeout(()=>setNotice(''),2800)},[])
 const create=()=>{setSelectedTerminal(null);setEditorOpen(true)}; const edit=t=>{setSelectedTerminal(t);setEditorOpen(true)}
 const save=async payload=>{try{if(selectedTerminal?.id){await updateTerminal(selectedTerminal.id,payload);showNotice('Payment terminal updated successfully.')}else{await createTerminal(payload);showNotice('Payment terminal created successfully.')}setEditorOpen(false);setSelectedTerminal(null)}catch{}}
 const toggle=async t=>{try{await toggleTerminalStatus(t);showNotice(`${t.name||t.terminal_name} ${t.is_active?'deactivated':'activated'}.`)}catch{}}
 const confirmDelete=async()=>{if(!deleteTarget?.id)return;try{await removeTerminal(deleteTarget.id);showNotice('Payment terminal deleted successfully.');setDeleteTarget(null)}catch{}}
 return <section className="space-y-5">
  <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between"><div className="flex gap-4"><div className="grid h-11 w-11 place-items-center rounded-xl border bg-slate-50"><CreditCard className="h-5 w-5"/></div><div><h1 className="text-2xl font-semibold">Payment Configuration</h1><p className="mt-1 text-sm text-slate-500">Configure terminals, merchant references and settlement accounts.</p></div></div><button onClick={create} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4"/>New Terminal</button></div><div className="grid border-t bg-slate-50/70 sm:grid-cols-4"><Summary label="Configured" value={summary.total}/><Summary label="Active" value={summary.active}/><Summary label="Inactive" value={summary.inactive}/><Summary label="Settlement accounts" value={summary.mappedAccounts}/></div></header>
  {notice?<div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>:null}{error?<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>:null}
  <div className="overflow-hidden rounded-2xl border bg-white shadow-sm"><PaymentTerminalToolbar search={search} onSearchChange={setSearch} onRefresh={refresh} onCreate={create} isRefreshing={isRefreshing}/>{isLoading?<Skeleton/>:terminals.length?<PaymentTerminalTable terminals={terminals} pendingTerminalId={pendingTerminalId} onEdit={edit} onToggleStatus={toggle} onDelete={setDeleteTarget}/>:<EmptyState onCreate={create}/>}</div>
  <PaymentTerminalDialog open={editorOpen} terminal={selectedTerminal} settlementAccounts={settlementAccounts} isSaving={isSaving} onClose={()=>{if(!isSaving){setEditorOpen(false);setSelectedTerminal(null)}}} onSubmit={save}/><ConfirmDeleteDialog open={Boolean(deleteTarget)} terminal={deleteTarget} isDeleting={pendingTerminalId===deleteTarget?.id} onCancel={()=>setDeleteTarget(null)} onConfirm={confirmDelete}/></section>
}
function Summary({label,value}){return <div className="border-b px-5 py-4 sm:border-b-0 sm:border-r"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>}
function Skeleton(){return <div className="animate-pulse p-5"><div className="h-10 rounded bg-slate-100"/><div className="mt-3 space-y-3">{[1,2,3,4].map(x=><div key={x} className="h-14 rounded bg-slate-100"/>)}</div></div>}
