function escapeCsv(value) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function exportPaymentTerminalsCsv(terminals = []) {
  const headers = [
    'Terminal Name',
    'Terminal Code',
    'Payment Method',
    'Provider',
    'Merchant ID',
    'Terminal ID',
    'Settlement Account Code',
    'Settlement Account Name',
    'Status',
  ]

  const rows = terminals.map((terminal) => [
    terminal.name ?? terminal.terminal_name,
    terminal.code ?? terminal.terminal_code,
    terminal.payment_method,
    terminal.provider,
    terminal.merchant_id,
    terminal.terminal_id,
    terminal.settlement_account_code,
    terminal.settlement_account_name,
    terminal.is_active ? 'Active' : 'Inactive',
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\r\n')

  const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)

  link.href = url
  link.download = `payment-terminals-${date}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
