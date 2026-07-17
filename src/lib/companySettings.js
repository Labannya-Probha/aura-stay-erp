import { supabase } from '../supabase'
import { getTenantId } from './tenant'

// If tenantId can't be resolved (session still loading, storage cleared,
// etc.) we must NOT silently return an unscoped query — that previously let
// callers like getCompany() fall through to whichever tenant's row happened
// to sort first (e.g. Demo Resort's print layout briefly showing "Novem Eco
// Resort"). Fail safe instead: filter to a sentinel tenant_id that matches
// no rows, so the caller gets an empty result rather than another tenant's data.
const NO_TENANT_SENTINEL = '00000000-0000-0000-0000-000000000000'

export function withTenantScope(query, tenantId = getTenantId()) {
  return query.eq('tenant_id', tenantId || NO_TENANT_SENTINEL)
}

export function getCompanySettingsQuery(columns = '*', tenantId = getTenantId()) {
  return withTenantScope(supabase.from('company_settings').select(columns), tenantId)
}

export function getPrintBrandProps(company) {
  return {
    primaryColor: company?.primary_color || company?.brand_primary,
    accentColor: company?.accent_color || company?.brand_accent,
  }
}

export function withTenantInsert(data) {
  // NOTE: previously read a 'tenant_id' key that getTenantId() never writes
  // (it uses 'aura_tenant_id' in sessionStorage) — this always returned
  // tenant_id: null. Now delegates to the single real source of truth.
  return {
    tenant_id: getTenantId(),
    ...data,
  }
}
