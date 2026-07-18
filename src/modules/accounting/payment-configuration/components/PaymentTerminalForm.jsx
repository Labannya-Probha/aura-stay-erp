import { useEffect, useMemo, useRef, useState } from 'react'
import AuditInfoCard from './AuditInfoCard.jsx'
import ValidationSummary from './ValidationSummary.jsx'

const METHODS = ['CARD', 'MOBILE_BANKING', 'BANK_TRANSFER', 'CASH', 'OTHER']
const EMPTY = { terminal_name:'', terminal_code:'', payment_method:'CARD', provider:'', merchant_id:'', terminal_id:'', settlement_account_id:'', is_active:true }

function normalize(value) {
  return { ...EMPTY, ...(value || {}), terminal_name:value?.terminal_name ?? value?.name ?? '', terminal_code:value?.terminal_code ?? value?.code ?? '', settlement_account_id:value?.settlement_account_id ?? '' }
}

export default function PaymentTerminalForm({ initialValue, settlementAccounts=[], isSaving=false, serverError='', onDirtyChange, onCancel, onSubmit }) {
  const initialRef = useRef(normalize(initialValue))
  const [values,setValues]=useState(initialRef.current)
  const [errors,setErrors]=useState({})

  useEffect(()=>{
    const next = normalize(initialValue)
    initialRef.current = next
    setValues(next)
    setErrors({})
    onDirtyChange?.(false)
  },[initialValue,onDirtyChange])

  const isDirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(initialRef.current), [values])
  useEffect(() => onDirtyChange?.(isDirty), [isDirty,onDirtyChange])

  function change(e){
    const {name,value,type,checked}=e.target
    setValues(v=>({...v,[name]:type==='checkbox'?checked:value}))
    setErrors(x=>({...x,[name]:''}))
  }

  async function submit(e){
    e.preventDefault()
    const next={}
    if(!values.terminal_name.trim()) next.terminal_name='Terminal name is required.'
    if(!values.terminal_code.trim()) next.terminal_code='Terminal code is required.'
    if(!values.payment_method) next.payment_method='Payment method is required.'
    if(!values.settlement_account_id) next.settlement_account_id='Settlement account is required.'
    setErrors(next)
    if(Object.keys(next).length){
      requestAnimationFrame(()=>document.querySelector('[aria-invalid="true"]')?.focus())
      return
    }
    await onSubmit({ ...values, terminal_name:values.terminal_name.trim(), terminal_code:values.terminal_code.trim().toUpperCase(), provider:values.provider.trim()||null, merchant_id:values.merchant_id.trim()||null, terminal_id:values.terminal_id.trim()||null, settlement_account_id:values.settlement_account_id||null })
  }

  return <form onSubmit={submit} className="space-y-6" noValidate>
    <div><h2 className="text-lg font-semibold text-slate-950">{initialValue?.id?'Update terminal':'Create terminal'}</h2><p className="mt-1 text-sm text-slate-500">Configure identification, merchant mapping and settlement routing.</p></div>
    <ValidationSummary errors={errors}/>
    {serverError ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div> : null}
    <fieldset disabled={isSaving} className="grid gap-4 sm:grid-cols-2 disabled:opacity-70">
      <Field label="Terminal name" error={errors.terminal_name}><input autoFocus name="terminal_name" value={values.terminal_name} onChange={change} aria-invalid={Boolean(errors.terminal_name)} className={input(errors.terminal_name)} placeholder="Front Desk POS"/></Field>
      <Field label="Terminal code" error={errors.terminal_code}><input name="terminal_code" value={values.terminal_code} onChange={change} aria-invalid={Boolean(errors.terminal_code)} className={input(errors.terminal_code)} placeholder="FD-POS-01"/></Field>
      <Field label="Payment method" error={errors.payment_method}><select name="payment_method" value={values.payment_method} onChange={change} aria-invalid={Boolean(errors.payment_method)} className={input(errors.payment_method)}>{METHODS.map(x=><option key={x} value={x}>{x.replaceAll('_',' ')}</option>)}</select></Field>
      <Field label="Provider"><input name="provider" value={values.provider} onChange={change} className={input()} placeholder="Visa / Mastercard / bKash"/></Field>
      <Field label="Merchant ID"><input name="merchant_id" value={values.merchant_id} onChange={change} className={input()} /></Field>
      <Field label="Terminal ID"><input name="terminal_id" value={values.terminal_id} onChange={change} className={input()} /></Field>
      <Field label="Settlement account" error={errors.settlement_account_id} className="sm:col-span-2"><select name="settlement_account_id" value={values.settlement_account_id} onChange={change} aria-invalid={Boolean(errors.settlement_account_id)} className={input(errors.settlement_account_id)}><option value="">Select bank account</option>{settlementAccounts.map(a=><option key={a.id} value={a.id}>{a.account_code} — {a.account_name}</option>)}</select></Field>
    </fieldset>
    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"><input disabled={isSaving} type="checkbox" name="is_active" checked={values.is_active} onChange={change}/><span><span className="block text-sm font-medium text-slate-800">Active terminal</span><span className="block text-xs text-slate-500">Available for operational payment collection.</span></span></label>
    <AuditInfoCard terminal={initialValue}/>
    <div className="sticky bottom-0 -mx-5 flex justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:-mx-6 sm:px-6"><button type="button" onClick={onCancel} disabled={isSaving} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50">Cancel</button><button disabled={isSaving || !isDirty} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{isSaving?'Saving…':initialValue?.id?'Update terminal':'Create terminal'}</button></div>
  </form>
}
function Field({label,error,className='',children}){return <label className={`block ${className}`}><span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>{children}{error?<span className="mt-1 block text-xs text-red-600">{error}</span>:null}</label>}
function input(error=false){return `min-h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 ${error?'border-red-300 focus:ring-red-100':'border-slate-300 focus:ring-slate-100'}`}
