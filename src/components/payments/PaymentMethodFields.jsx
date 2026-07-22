import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getTenantId } from '../../lib/tenant'

const CARD_TYPES = ['VISA', 'MASTERCARD', 'AMEX', 'UNIONPAY', 'DBBL NEXUS', 'OTHER']
const TRANSFER_METHODS = new Set(['BANK', 'BANK_TRANSFER'])

export function validatePaymentMethodDetails(values) {
  const method = String(values?.method || '').toUpperCase()
  const errors = {}

  if (TRANSFER_METHODS.has(method) && !values?.bank_account_id) {
    errors.bank_account_id = 'Receiving bank GL account is required.'
  }
  if (method === 'CARD') {
    if (!values?.pos_terminal_id) errors.pos_terminal_id = 'POS terminal is required.'
    if (!values?.card_type) errors.card_type = 'Card type is required.'
  }
  if (method === 'CHEQUE') {
    if (!values?.payer_bank_name) errors.payer_bank_name = 'Cheque bank is required.'
    if (!values?.payer_branch_name) errors.payer_branch_name = 'Cheque branch is required.'
    if (!values?.cheque_number?.trim()) errors.cheque_number = 'Cheque number is required.'
    if (!values?.cheque_date) errors.cheque_date = 'Cheque date is required.'
    if (!values?.bank_account_id) errors.bank_account_id = 'Deposit-to GL account is required.'
  }

  return errors
}

function FieldError({ children }) {
  return children ? <span className="mt-1 block text-xs text-red-600">{children}</span> : null
}

export default function PaymentMethodFields({ value, onChange, errors = {}, disabled = false }) {
  const [bankAccounts, setBankAccounts] = useState([])
  const [terminals, setTerminals] = useState([])
  const [banks, setBanks] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(false)
  const method = String(value?.method || '').toUpperCase()
  const needsCoaBank = TRANSFER_METHODS.has(method) || method === 'CHEQUE'

  useEffect(() => {
    let active = true
    const tenantId = getTenantId()
    const load = async () => {
      setLoading(true)
      const jobs = []
      if (needsCoaBank) {
        let query = supabase.from('chart_of_accounts').select('id,code,name').eq('is_active', true).eq('is_bank_account', true).order('code')
        if (tenantId) query = query.eq('tenant_id', tenantId)
        jobs.push(query.then(({ data, error }) => { if (active) setBankAccounts(error ? [] : (data || [])) }))
      }
      if (method === 'CARD') {
        let query = supabase.from('payment_terminals').select('id,terminal_name,merchant_id,terminal_code,bank_name,chart_of_accounts:coa_account_id(id,code,name)').eq('is_active', true).order('terminal_name')
        if (tenantId) query = query.eq('tenant_id', tenantId)
        jobs.push(query.then(({ data, error }) => { if (active) setTerminals(error ? [] : (data || [])) }))
      }
      if (method === 'CHEQUE') {
        jobs.push(supabase.from('bank_directory').select('bank_name').order('bank_name').then(({ data, error }) => {
          if (active) setBanks(error ? [] : [...new Set((data || []).map((row) => row.bank_name))])
        }))
      }
      await Promise.all(jobs)
      if (active) setLoading(false)
    }
    load()
    return () => { active = false }
  }, [method, needsCoaBank])

  useEffect(() => {
    if (method !== 'CHEQUE' || !value?.payer_bank_name) { setBranches([]); return }
    let active = true
    supabase.from('bank_directory')
      .select('branch_name,district_name,routing_number')
      .eq('bank_name', value.payer_bank_name)
      .order('district_name').order('branch_name')
      .then(({ data, error }) => { if (active) setBranches(error ? [] : (data || [])) })
    return () => { active = false }
  }, [method, value?.payer_bank_name])

  const selectedTerminal = useMemo(
    () => terminals.find((terminal) => terminal.id === value?.pos_terminal_id),
    [terminals, value?.pos_terminal_id],
  )

  if (!needsCoaBank && method !== 'CARD' && method !== 'CHEQUE') return null

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {needsCoaBank && (
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-pine/70">
            {method === 'CHEQUE' ? 'Deposit To (Tenant COA)' : 'Bank Account (Tenant COA)'}
          </span>
          <select className="input w-full" value={value?.bank_account_id || ''}
            onChange={(event) => onChange({ ...value, bank_account_id: event.target.value })}
            disabled={disabled || loading} required>
            <option value="">{loading ? 'Loading accounts…' : 'Select bank GL account'}</option>
            {bankAccounts.map((account) => <option key={account.id} value={account.id}>{account.code} — {account.name}</option>)}
          </select>
          <FieldError>{errors.bank_account_id}</FieldError>
        </label>
      )}

      {method === 'CARD' && (
        <>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-pine/70">POS Terminal</span>
            <select className="input w-full" value={value?.pos_terminal_id || ''}
              onChange={(event) => onChange({ ...value, pos_terminal_id: event.target.value, bank_account_id: '' })}
              disabled={disabled || loading} required>
              <option value="">{loading ? 'Loading terminals…' : 'Select POS terminal'}</option>
              {terminals.map((terminal) => <option key={terminal.id} value={terminal.id}>{terminal.terminal_name}</option>)}
            </select>
            <FieldError>{errors.pos_terminal_id}</FieldError>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-pine/70">Card Type</span>
            <select className="input w-full" value={value?.card_type || ''}
              onChange={(event) => onChange({ ...value, card_type: event.target.value })} disabled={disabled} required>
              <option value="">Select card type</option>
              {CARD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <FieldError>{errors.card_type}</FieldError>
          </label>
          {selectedTerminal && (
            <div className="md:col-span-2 rounded-xl border border-leaf bg-mist/50 px-3 py-2 text-xs text-pine">
              <div className="font-semibold">Settlement mapping (read only)</div>
              <div>{selectedTerminal.bank_name || 'Bank'} · {selectedTerminal.chart_of_accounts?.code || '—'} — {selectedTerminal.chart_of_accounts?.name || 'Unmapped'}</div>
              {(selectedTerminal.merchant_id || selectedTerminal.terminal_code) && <div className="text-pine/60">Merchant: {selectedTerminal.merchant_id || '—'} · Terminal: {selectedTerminal.terminal_code || '—'}</div>}
            </div>
          )}
        </>
      )}

      {method === 'CHEQUE' && (
        <>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-pine/70">Cheque Bank</span>
            <select className="input w-full" value={value?.payer_bank_name || ''}
              onChange={(event) => onChange({ ...value, payer_bank_name: event.target.value, payer_branch_name: '', payer_routing_number: '' })}
              disabled={disabled || loading} required>
              <option value="">Select issuing bank</option>
              {banks.map((bank) => <option key={bank} value={bank}>{bank}</option>)}
            </select>
            <FieldError>{errors.payer_bank_name}</FieldError>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-pine/70">Branch</span>
            <select className="input w-full" value={value?.payer_routing_number || ''}
              onChange={(event) => {
                const branch = branches.find((item) => String(item.routing_number) === event.target.value)
                onChange({ ...value, payer_branch_name: branch?.branch_name || '', payer_routing_number: event.target.value })
              }} disabled={disabled || !value?.payer_bank_name} required>
              <option value="">Select branch</option>
              {branches.map((branch) => <option key={branch.routing_number} value={branch.routing_number}>{branch.branch_name} — {branch.district_name}</option>)}
            </select>
            <FieldError>{errors.payer_branch_name}</FieldError>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-pine/70">Routing Number</span>
            <input className="input w-full" value={value?.payer_routing_number || ''} readOnly disabled />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-pine/70">Cheque Number</span>
            <input className="input w-full" value={value?.cheque_number || ''}
              onChange={(event) => onChange({ ...value, cheque_number: event.target.value })} disabled={disabled} required />
            <FieldError>{errors.cheque_number}</FieldError>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-pine/70">Cheque Date</span>
            <input type="date" className="input w-full" value={value?.cheque_date || ''}
              onChange={(event) => onChange({ ...value, cheque_date: event.target.value })} disabled={disabled} required />
            <FieldError>{errors.cheque_date}</FieldError>
          </label>
        </>
      )}
    </div>
  )
}
