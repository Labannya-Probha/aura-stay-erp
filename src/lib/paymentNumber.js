import { supabase } from '../supabase'
import { getTenantId } from './tenant'

const PAYMENT_PATTERN = /^RP-([A-Z0-9]+)-\d{8,}$/

function normalizeTenantCode(value) {
  const code = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12)
  return code || 'TENANT'
}

async function getTenantCode() {
  const tenantId = getTenantId()
  if (!tenantId) return 'TENANT'

  const { data } = await supabase
    .from('properties')
    .select('slug')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return normalizeTenantCode(data?.slug || String(tenantId).slice(0, 8))
}

export async function generateReservationPaymentNo() {
  const { data, error } = await supabase.rpc('next_payment_reference')
  if (!error && data) return String(data)

  // Backward-compatible fallback for deployments where the migration has not run yet.
  const tenantCode = await getTenantCode()
  const { data: seqData } = await supabase.rpc('next_tenant_seq', {
    p_seq_name: 'reservation_payment',
  })
  const seq = Number(seqData) || Number(String(Date.now()).slice(-8))
  return `RP-${tenantCode}-${String(seq).padStart(8, '0')}`
}

export function toPaymentReference(paymentNo, trxRef) {
  const cleanRef = String(trxRef || '').trim()
  if (!paymentNo) return cleanRef || null
  return cleanRef ? `${paymentNo} | ${cleanRef}` : paymentNo
}

export function parsePaymentReference(reference) {
  const raw = String(reference || '').trim()
  if (!raw) return { paymentNo: '', reference: '' }

  const parts = raw.split('|').map((value) => value.trim())
  const first = parts[0] || ''
  if (PAYMENT_PATTERN.test(first)) {
    return { paymentNo: first, reference: parts.slice(1).join(' | ') }
  }

  return { paymentNo: '', reference: raw }
}
