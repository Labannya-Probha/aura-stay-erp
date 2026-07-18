import { useEffect, useMemo, useState } from 'react'

const PAYMENT_METHODS = [
  { value: 'card', label: 'Card' },
  { value: 'mobile_banking', label: 'Mobile Banking' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'cash', label: 'Cash' },
  { value: 'gift_voucher', label: 'Gift Voucher' },
  { value: 'credit_account', label: 'Credit Account' },
]

const EMPTY_FORM = {
  terminal_code: '',
  terminal_name: '',
  payment_method: 'card',
  provider_name: '',
  merchant_id: '',
  settlement_account_id: '',
  settlement_delay_days: 1,
  mdr_percent: 0,
  is_auto_settlement: true,
  is_active: true,
}

function normalizeInitialValue(value) {
  if (!value) return EMPTY_FORM

  return {
    terminal_code: value.terminal_code ?? value.code ?? '',
    terminal_name: value.terminal_name ?? value.name ?? '',
    payment_method: value.payment_method ?? 'card',
    provider_name: value.provider_name ?? value.acquirer_name ?? '',
    merchant_id: value.merchant_id ?? '',
    settlement_account_id: value.settlement_account_id ?? '',
    settlement_delay_days: Number(value.settlement_delay_days ?? 1),
    mdr_percent: Number(value.mdr_percent ?? 0),
    is_auto_settlement: value.is_auto_settlement ?? true,
    is_active: value.is_active ?? true,
  }
}

function validate(values) {
  const nextErrors = {}

  if (!values.terminal_code.trim()) nextErrors.terminal_code = 'Terminal code is required.'
  if (!values.terminal_name.trim()) nextErrors.terminal_name = 'Terminal name is required.'
  if (!values.payment_method) nextErrors.payment_method = 'Payment method is required.'

  if (values.payment_method !== 'cash' && !values.settlement_account_id) {
    nextErrors.settlement_account_id = 'Settlement account is required.'
  }

  if (Number(values.settlement_delay_days) < 0) {
    nextErrors.settlement_delay_days = 'Settlement delay cannot be negative.'
  }

  const mdr = Number(values.mdr_percent)
  if (mdr < 0 || mdr > 100) nextErrors.mdr_percent = 'MDR must be between 0 and 100.'

  return nextErrors
}

export default function PaymentTerminalForm({
  initialValue,
  settlementAccounts = [],
  saving = false,
  onCancel,
  onSubmit,
}) {
  const [values, setValues] = useState(() => normalizeInitialValue(initialValue))
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setValues(normalizeInitialValue(initialValue))
    setErrors({})
  }, [initialValue])

  const title = initialValue?.id ? 'Edit payment terminal' : 'Add payment terminal'
  const submitLabel = initialValue?.id ? 'Save changes' : 'Create terminal'

  const selectedAccount = useMemo(
    () => settlementAccounts.find((account) => account.id === values.settlement_account_id),
    [settlementAccounts, values.settlement_account_id],
  )

  const updateField = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) return

    await onSubmit({
      ...values,
      terminal_code: values.terminal_code.trim().toUpperCase(),
      terminal_name: values.terminal_name.trim(),
      provider_name: values.provider_name.trim() || null,
      merchant_id: values.merchant_id.trim() || null,
      settlement_account_id: values.settlement_account_id || null,
      settlement_delay_days: Number(values.settlement_delay_days),
      mdr_percent: Number(values.mdr_percent),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">
          Configure the terminal, settlement account and processing rules.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Terminal code" error={errors.terminal_code} required>
          <input
            value={values.terminal_code}
            onChange={(event) => updateField('terminal_code', event.target.value)}
            placeholder="e.g. POS-01"
            className="aeds-input"
            maxLength={40}
          />
        </Field>

        <Field label="Terminal name" error={errors.terminal_name} required>
          <input
            value={values.terminal_name}
            onChange={(event) => updateField('terminal_name', event.target.value)}
            placeholder="Front Desk Card Terminal"
            className="aeds-input"
            maxLength={100}
          />
        </Field>

        <Field label="Payment method" error={errors.payment_method} required>
          <select
            value={values.payment_method}
            onChange={(event) => updateField('payment_method', event.target.value)}
            className="aeds-input"
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Provider / acquiring bank">
          <input
            value={values.provider_name}
            onChange={(event) => updateField('provider_name', event.target.value)}
            placeholder="e.g. BRAC Bank"
            className="aeds-input"
            maxLength={100}
          />
        </Field>

        <Field label="Merchant ID">
          <input
            value={values.merchant_id}
            onChange={(event) => updateField('merchant_id', event.target.value)}
            placeholder="Optional merchant reference"
            className="aeds-input"
            maxLength={100}
          />
        </Field>

        <Field
          label="Settlement account"
          error={errors.settlement_account_id}
          required={values.payment_method !== 'cash'}
        >
          <select
            value={values.settlement_account_id}
            onChange={(event) => updateField('settlement_account_id', event.target.value)}
            className="aeds-input"
          >
            <option value="">Select bank GL account</option>
            {settlementAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.code ? `${account.code} — ` : ''}{account.name}
              </option>
            ))}
          </select>
          {selectedAccount ? (
            <p className="mt-1 text-xs text-slate-500">
              Settlement will post to {selectedAccount.name}.
            </p>
          ) : null}
        </Field>

        <Field label="Settlement delay (days)" error={errors.settlement_delay_days}>
          <input
            type="number"
            min="0"
            max="365"
            value={values.settlement_delay_days}
            onChange={(event) => updateField('settlement_delay_days', event.target.value)}
            className="aeds-input"
          />
        </Field>

        <Field label="MDR (%)" error={errors.mdr_percent}>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={values.mdr_percent}
            onChange={(event) => updateField('mdr_percent', event.target.value)}
            className="aeds-input"
          />
        </Field>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
        <Toggle
          label="Automatic settlement"
          description="Generate settlement posting automatically after the configured delay."
          checked={values.is_auto_settlement}
          onChange={(checked) => updateField('is_auto_settlement', checked)}
        />
        <Toggle
          label="Active terminal"
          description="Inactive terminals remain in history but cannot be selected for new transactions."
          checked={values.is_active}
          onChange={(checked) => updateField('is_active', checked)}
        />
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
        <button type="button" onClick={onCancel} className="aeds-button-secondary" disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="aeds-button-primary" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

function Field({ label, error, required = false, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}{required ? <span className="ml-1 text-rose-600">*</span> : null}
      </span>
      {children}
      {error ? <span className="mt-1 block text-xs text-rose-600">{error}</span> : null}
    </label>
  )
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
      </span>
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-slate-300"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  )
}
