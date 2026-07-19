import { tenantConfig } from "@/config/tenant.config"

export default function TenantLogo({ className = "h-12" }) {
  return (
    <img
      src={tenantConfig.logo}
      alt={tenantConfig.name}
      className={className}
      loading="eager"
      decoding="async"
    />
  )
}
