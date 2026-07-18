import { useEffect, useState } from 'react'

const METHODS = ['CARD', 'MOBILE_BANKING', 'BANK_TRANSFER', 'CASH', 'OTHER']
const EMPTY = { terminal_name:'', terminal_code:'', payment_method:'CARD', provider:'', merchant_id:'', terminal_id:'', settlement_account_id:'', is_active:true }

export default function PaymentTerminalForm({ initialValue, settlementAccounts=[], isSaving=false, onCancel, onSubmit }) {
  const [values,setValues]=useState(EMPTY)
  const [errors,setErrors]=useState({})

  useEffect(()=>{
    setValues({ ...EMPTY, ...(initialValue||{}), terminal_name:initialValue?.terminal_name??initialValue?.name??'', terminal_code:initialValue?.terminal_code??initialValue?.code??'', settlement_account_id:initialValue?.settlement_account_id??'' })
    setErrors({})
  },[initialValue])

  function change(e){ const {name,value,type,checked}=e.target; setValues(v=>({...v,[name]:type==='checkbox'?checked:value})); setErrors(x=>({...x,[name]:''})) }
  async function submit(e){
    e.preventDefault()
    const next={}
    if(!values.terminal_name.trim()) next.terminal_name='Terminal name is required.'
    if(!values.terminal_code.trim()) next.terminal_code='Terminal code is required.'
    if(!values.payment_method) next.payment_method='Payment method is required.'
    if(!values.settlement_account_id) next.settlement_account_id='Settlement account is required.'
    setErrors(next); if(Object.keys(next).length) return
    await onSubmit({ ...values, terminal_name:values.terminal_name.trim(), terminal_code:values.terminal_code.trim().toUpperCase(), provider:values.provider.trim()||null, merchant_id:values.merchant_id.trim()||null, terminal_id:values.terminal_id.trim()||null, settlement_account_id:values.settlement_account_id||null })
  }

  return <form onSubmit={submit} className="space-y-6">
    <div><h2 className="text-lg font-semibold text-slate-950">{initialValue?.id?'Update terminal':'Create terminal'}</h2><p className="mt-1 text-sm text-slate-500">Configure identification, merchant mapping and settlement routing.</p></div>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Terminal name" error={errors.terminal_name}><input autoFocus name="terminal_name" value={values.terminal_name} onChange={change} className={input(errors.terminal_name)} placeholder="Front Desk POS"/></Field>
      <Field label="Terminal code" error={errors.terminal_code}><input name="terminal_code" value={values.terminal_code} onChange={change} className={input(errors.terminal_code)} placeholder="FD-POS-01"/></Field>
      <Field label="Payment method" error={errors.payment_method}><select name="payment_method" value={values.payment_method} onChange={change} className={input(errors.payment_method)}>{METHODS.map(x=><option key={x} value={x}>{x.replaceAll('_',' ')}</option>)}</select></Field>
      <Field label="Provider"><input name="provider" value={values.provider} onChange={change} className={input()} placeholder="Visa / Mastercard / bKash"/></Field>
      <Field label="Merchant ID"><input name="merchant_id" value={values.merchant_id} onChange={change} className={input()} /></Field>
      <Field label="Terminal ID"><input name="terminal_id" value={values.terminal_id} onChange={change} className={input()} /></Field>
      <Field label="Settlement account" error={errors.settlement_account_id} className="sm:col-span-2"><select name="settlement_account_id" value={values.settlement_account_id} onChange={change} className={input(errors.settlement_account_id)}><option value="">Select bank account</option>{settlementAccounts.map(a=><option key={a.id} value={a.id}>{a.account_code} — {a.account_name}</option>)}</select></Field>
    </div>
    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"><input type="checkbox" name="is_active" checked={values.is_active} onChange={change}/><span><span className="block text-sm font-medium text-slate-800">Active terminal</span><span className="block text-xs text-slate-500">Available for operational payment collection.</span></span></label>
    <div className="flex justify-end gap-3 border-t border-slate-200 pt-5"><button type="button" onClick={onCancel} disabled={isSaving} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold">Cancel</button><button disabled={isSaving} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">{isSaving?'Saving…':initialValue?.id?'Update terminal':'Create terminal'}</button></div>
  </form>
}
function Field({label,error,className='',children}){return <label className={`block ${className}`}><span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>{children}{error?<span className="mt-1 block text-xs text-red-600">{error}</span>:null}</label>}
function input(error=false){return `min-h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 ${error?'border-red-300 focus:ring-red-100':'border-slate-300 focus:ring-slate-100'}`}
