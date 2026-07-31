import BrandLogo from './BrandLogo'

export default function LoginBrandPanel({ brand = {} }) {
  return (
    <aside className="relative hidden h-screen overflow-y-auto overflow-x-hidden min-[992px]:flex">
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(145deg, var(--tenant-login-gradient-from), var(--tenant-secondary) 52%, var(--tenant-login-gradient-to))',
        }}
      />

      <div className="absolute inset-0 bg-white/10" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/35" />

      <div className="relative z-10 flex min-h-screen w-full flex-col justify-between px-10 py-10 xl:px-14 xl:py-12">
        <div className="flex items-center gap-4">
          <BrandLogo brand={brand} />
          <div>
            <h1 className="text-xl font-black text-white">{brand.software || 'Aura Stay ERP'}</h1>
            <p className="text-sm font-semibold text-white/75">{brand.name || 'Aura Stay'}</p>
          </div>
        </div>

        <div className="max-w-[450px]">
          <p className="inline-flex rounded-full border border-white/35 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90">
            Luxury Hospitality Platform
          </p>

          <h2 className="mt-5 text-[40px] font-black leading-[1.06] tracking-[-0.02em] text-white xl:text-[52px]">
            Designed for Luxury Hospitality.
            <br />
            Engineered for Enterprise Operations.
          </h2>

          <p className="mt-7 text-[15px] font-medium leading-7 text-white/82">
            A complete ERP platform for hotels, resorts and hospitality groups — from reservations
            to accounting.
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
              Multi-tenant Security
            </span>
            <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
              Unified Operations
            </span>
            <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
              Real-time Finance
            </span>
          </div>
        </div>

        <p className="text-sm font-medium text-white/55">
          © 2026 Aura Stay · Powered by {brand.software || 'Aura Stay ERP'}
        </p>
      </div>
    </aside>
  )
}
