export const TENANT_ID = import.meta.env.VITE_TENANT_ID || null

export function withTenantInsert(row = {}) {
  return TENANT_ID ? { ...row, tenant_id: row.tenant_id || TENANT_ID } : row
}

export function withTenantInsertMany(rows = []) {
  if (!TENANT_ID) return rows
  return rows.map((r) => ({ ...r, tenant_id: r.tenant_id || TENANT_ID }))
}
