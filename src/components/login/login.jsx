import { useMemo, useState } from "react"
import LoginBrandPanel from "./LoginBrandPanel"
import LoginVideoBackground from "./LoginVideoBackground"
import LoginCard from "./LoginCard"
import { useTenantBrand } from "./useTenantBrand"
import { cleanSlug } from "./login.constants"
import { getBrandCssVariables } from "./brandThemeMapper"

export default function Login({ slug }) {
  const routeSlug = useMemo(() => cleanSlug(slug), [slug])
  const { brand, loading } = useTenantBrand(routeSlug)
  const [videoReady, setVideoReady] = useState(false)

  return (
    <main
      className="min-h-screen overflow-hidden text-slate-950"
      style={{
        ...getBrandCssVariables(brand),
        background:
          "linear-gradient(135deg, var(--tenant-login-gradient-from) 0%, var(--tenant-login-gradient-to) 100%)",
        fontFamily: "var(--tenant-font)",
        fontSize: "var(--tenant-base-font-size)",
      }}
    >
      <section className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(390px,520px)_1fr]">
        <LoginBrandPanel brand={brand} />

        <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
          <LoginVideoBackground
            brand={brand}
            loading={loading}
            videoReady={videoReady}
            setVideoReady={setVideoReady}
          />

          <LoginCard brand={brand} routeSlug={routeSlug} />
        </section>
      </section>
    </main>
  )
}