export function getCompanyLogo(company) {
  return company?.logo_url || company?.logo || company?.brand_logo || company?.logoUrl || ""
}

export function getCompanyName(company) {
  return company?.software_name || company?.company_name || company?.name || "Company"
}

export function getTenantDisplayName(company) {
  return company?.tenant_name || company?.name || "Tenant"
}
