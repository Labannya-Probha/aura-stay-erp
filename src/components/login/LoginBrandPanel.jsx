import BrandLogo from "./BrandLogo"

export default function LoginBrandPanel({ brand = {} }) {
  return (
    <aside className="relative hidden min-h-screen overflow-hidden lg:flex">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(145deg, var(--tenant-login-gradient-from), var(--tenant-secondary) 52%, var(--tenant-login-gradient-to))",
        }}
      />

      <div className="absolute inset-0 bg-white/10" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/35" />

      <div className="relative z-10 flex min-h-screen w-full flex-col justify-between px-10 py-10 xl:px-14 xl:py-12">
        <div className="flex items-center gap-4">
          <BrandLogo brand={brand} />
          <div>
            <h1 className="text-xl font-black text-white">
              {brand.software || "Aura Stay ERP"}
            </h1>
            <p className="text-sm font-semibold text-white/75">
              {brand.name || "Aura Stay"}
            </p>
          </div>
        </div>

        <div className="max-w-[420px]">
          <h2 className="text-[44px] font-black leading-[1.08] tracking-tight text-white xl:text-[56px]">
            Hospitality
            <br />
            management,
            <br />
            simplified.
          </h2>

          <p className="mt-8 text-[16px] font-medium leading-8 text-white/82">
            A complete ERP platform for hotels, resorts and hospitality groups —
            from reservations to accounting.
          </p>
        </div>

        <p className="text-sm font-medium text-white/55">
          © 2026 Aura Stay  ·  Powered by {brand.software || "Aura Stay ERP"}
        </p>
      </div>
    </aside>
  )
}