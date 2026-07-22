import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase as appSupabase } from '../../../lib/supabase.js'

export type AgingLedgerType = 'ALL' | 'AP' | 'AR'

export interface AgingBucketRow {
  ledger_type: 'AP' | 'AR'
  entity_id: string | null
  entity_name: string
  document_id: string | null
  document_no: string | null
  document_date: string | null
  due_date: string | null
  days_overdue: number
  outstanding: number
  bucket_0_30: number
  bucket_31_60: number
  bucket_61_90: number
  bucket_91_plus: number
}

export interface ReconciliationSessionInput {
  tenant_id: string
  bank_account_id: string
  statement_start_date: string
  statement_end_date: string
  opening_balance?: number | null
  closing_balance?: number | null
  opened_by?: string | null
  notes?: string | null
}

export interface StatementLineInput {
  session_id: string
  tenant_id: string
  txn_date: string
  value_date?: string | null
  reference?: string | null
  description?: string | null
  debit?: number
  credit?: number
  statement_balance?: number | null
  external_txn_id?: string | null
}

function ensureClient(client?: SupabaseClient): SupabaseClient {
  const resolved = client ?? (appSupabase as unknown as SupabaseClient | null)
  if (!resolved) throw new Error('Supabase is not configured.')
  return resolved
}

function throwIfError(error: { message?: string } | null, fallback: string): void {
  if (!error) return
  throw new Error(error.message || fallback)
}

export class AgingAndReconciliationService {
  private readonly db: SupabaseClient

  constructor(client?: SupabaseClient) {
    this.db = ensureClient(client)
  }

  async getAgingBuckets(
    tenantId: string,
    asOf?: string | null,
    ledger: AgingLedgerType = 'ALL',
  ): Promise<AgingBucketRow[]> {
    const { data, error } = await this.db.rpc('get_aging_buckets', {
      p_tenant_id: tenantId,
      p_as_of: asOf ?? null,
      p_ledger: ledger,
    })
    throwIfError(error, 'Failed to load aging buckets.')
    return (data ?? []) as AgingBucketRow[]
  }

  async createReconciliationSession(input: ReconciliationSessionInput) {
    const { data, error } = await this.db
      .from('reconciliation_sessions')
      .insert(input)
      .select('*')
      .single()
    throwIfError(error, 'Failed to create reconciliation session.')
    return data
  }

  async addStatementLines(lines: StatementLineInput[]) {
    if (!lines.length) return []
    const { data, error } = await this.db.from('bank_statement_lines').insert(lines).select('*')
    throwIfError(error, 'Failed to add bank statement lines.')
    return data ?? []
  }

  async autoMatchStatementLine(statementLineId: string, matchedBy?: string, tolerance = 0.05) {
    const { data, error } = await this.db.rpc('auto_match_bank_statement_line', {
      p_statement_line_id: statementLineId,
      p_matched_by: matchedBy ?? null,
      p_tolerance: tolerance,
    })
    throwIfError(error, 'Failed to auto-match bank statement line.')
    return data as {
      status: string
      statement_line_id: string
      journal_line_id?: string
      journal_entry_id?: string
      confidence?: number
    }
  }
}

export const agingAndReconciliationService = new AgingAndReconciliationService()
