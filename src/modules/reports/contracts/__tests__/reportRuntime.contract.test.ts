import { describe, expect, it } from 'vitest'
import {
  createEmptyReportRuntimePayload,
  normalizeReportRuntimePayload,
} from '../reportRuntime.contract'

describe('normalizeReportRuntimePayload', () => {
  it('normalizes the current PostgreSQL rows/summary envelope', () => {
    const result = normalizeReportRuntimePayload({
      rows: [{ account_code: '1000', debit: 10 }],
      summary: {
        generated_at: '2026-08-02T10:00:00Z',
        source_function: 'rpt_trial_balance',
        total_rows: 1,
      },
    })

    expect(result.rows).toHaveLength(1)
    expect(result.summary.total_rows).toBe(1)
    expect(result.generated_at).toBe('2026-08-02T10:00:00Z')
    expect(result.meta.engine).toBe('rpt_trial_balance')
    expect(result.approval).toEqual({})
    expect(result.snapshot).toEqual({})
  })

  it('preserves rich future reporting metadata without fabricating values', () => {
    const result = normalizeReportRuntimePayload({
      rows: [],
      validation: { valid: true, balanced: true },
      mapping: { complete: true },
      approval: { status: 'Approved' },
      snapshot: { id: 'SNP-1', version: 2 },
      versions: [{ version: 1 }, { version: 2 }],
      history: [{ action: 'approved' }],
      meta: { engine: 'AEDS Python Reporting Engine', execution_ms: 840 },
    })

    expect(result.validation.valid).toBe(true)
    expect(result.approval.status).toBe('Approved')
    expect(result.snapshot.id).toBe('SNP-1')
    expect(result.versions).toHaveLength(2)
    expect(result.meta.execution_ms).toBe(840)
  })

  it('normalizes summary errors into a stable runtime error', () => {
    const result = normalizeReportRuntimePayload({
      rows: [],
      summary: { error: 'report engine unavailable' },
    })

    expect(result.error?.code).toBe('REPORT_ENGINE_ERROR')
    expect(result.error?.message).toBe('report engine unavailable')
  })

  it('returns safe arrays and objects for an empty response', () => {
    const result = createEmptyReportRuntimePayload()
    expect(result.rows).toEqual([])
    expect(result.summary).toEqual({})
    expect(result.comparisonRows).toEqual([])
    expect(result.comparisonSummary.enabled).toBe(false)
  })
})
