# AEDS Report Runtime Contract v1

The frontend accepts both the current PostgreSQL envelope and the future Python reporting envelope.

## Minimum response

```json
{
  "rows": [],
  "summary": {}
}
```

## Recommended authoritative response

```json
{
  "rows": [],
  "summary": {},
  "period": {
    "start_date": "2026-08-01",
    "end_date": "2026-08-31",
    "label": "August 2026"
  },
  "formatting": {
    "reporting_currency": "BDT",
    "currency_symbol": "৳",
    "decimal_places": 2,
    "negative_format": "parentheses",
    "zero_format": "dash"
  },
  "validation": {
    "valid": true,
    "balanced": true,
    "errors": [],
    "warnings": []
  },
  "mapping": {
    "complete": true,
    "unmappedCount": 0
  },
  "approval": {
    "status": "Approved",
    "approved_by_name": "Finance Controller",
    "steps": []
  },
  "snapshot": {
    "id": "RPT-SNP-0001",
    "version": 1,
    "status": "Approved",
    "locked": true,
    "dataset_hash": "sha256..."
  },
  "versions": [],
  "history": [],
  "context": {
    "tenant_id": "uuid",
    "businessUnit": "Resort Operations",
    "location_id": "uuid"
  },
  "meta": {
    "engine": "AEDS Python Reporting Engine",
    "generated_at": "2026-08-02T16:00:00Z",
    "execution_ms": 840,
    "freshness_label": "Ledger through 02 Aug 2026"
  },
  "comparisonRows": [],
  "comparisonSummary": {
    "enabled": false,
    "compareTo": "Off",
    "currentPeriodLabel": "August 2026",
    "previousPeriodLabel": ""
  }
}
```

## Rules

- Tenant context must come from the authenticated session.
- Approval, snapshot and audit fields must be authoritative server data.
- React must not calculate financial balances.
- Unknown metadata must remain absent or unknown.
- PDF, Excel and screen preview must consume the same validated dataset or immutable snapshot.
