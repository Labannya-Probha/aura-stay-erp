import { useMemo, useState } from 'react'
import LoginBrandPanel from './LoginBrandPanel'
import LoginVideoBackground from './LoginVideoBackground'
import LoginCard from './LoginCard'
import { useTenantBrand } from './useTenantBrand'
import { cleanSlug } from './login.constants'
import { getBrandCssVariables } from './brandThemeMapper'

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
          'linear-gradient(135deg, var(--tenant-login-gradient-from) 0%, var(--tenant-login-gradient-to) 100%)',
        fontFamily: 'var(--tenant-font)',
        fontSize: 'var(--tenant-base-font-size)',
      }}
    >
      <section className="grid min-h-screen grid-cols-1 min-[992px]:grid-cols-[minmax(420px,560px)_1fr]">
        <LoginBrandPanel brand={brand} />

        <section className="relative flex min-h-screen items-start justify-center overflow-hidden px-3 py-4 sm:items-center sm:px-8 sm:py-6 lg:px-12">
          <LoginVideoBackground
            brand={brand}
            loading={loading}
            videoReady={videoReady}
            setVideoReady={setVideoReady}
          />

          <div className="pointer-events-none absolute -right-24 top-8 h-72 w-72 rounded-full bg-white/24 blur-3xl" />
          <div className="pointer-events-none absolute left-[-92px] top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-emerald-200/22 blur-3xl" />
          <div className="pointer-events-none absolute bottom-8 right-1/3 h-36 w-36 rounded-full border border-white/35" />

          <div className="w-full max-w-[540px] sm:max-w-[560px]">
            <LoginCard brand={brand} routeSlug={routeSlug} />
          </div>
        </section>
      </section>
    </main>
  )
}
