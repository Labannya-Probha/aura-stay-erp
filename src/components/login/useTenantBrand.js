import { useEffect, useState } from "react"
import { FALLBACK_BRAND } from "./login.constants"
import { loadTenantBrand } from "./loginBrandService"

export function useTenantBrand(routeSlug) {
  const [brand, setBrand] = useState(FALLBACK_BRAND)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    async function load() {
      setLoading(true)

      try {
        const nextBrand = await loadTenantBrand(routeSlug)
        if (alive) setBrand(nextBrand)
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()

    return () => {
      alive = false
    }
  }, [routeSlug])

  return { brand, loading }
}