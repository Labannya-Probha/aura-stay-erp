export function getCompanyLogo(company) {
  return company?.logo_url || company?.logo || company?.brand_logo || company?.logoUrl || ""
}

export function getCompanyName(company) {
  return company?.software_name || company?.name || "Aura Stay"
}

export function getTenantDisplayName(company) {
  return company?.name || company?.tenant_name || "Aura Stay"
}
