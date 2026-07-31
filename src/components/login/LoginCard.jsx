import LoginForm from './LoginForm'
import BrandLogo from './BrandLogo'

export default function LoginCard({ brand = {}, routeSlug }) {
  return (
    <div className="relative z-10 w-full max-w-[520px] animate-[loginFloat_.65s_ease-out]">
      <div
        className="border border-white/60 p-4 shadow-2xl backdrop-blur-[34px] sm:p-7 lg:p-9"
        style={{
          background: 'linear-gradient(160deg, rgba(255,255,255,0.95), rgba(245,250,252,0.9))',
          borderRadius: 'var(--tenant-card-radius)',
          boxShadow: 'var(--tenant-shadow-lg)',
        }}
      >
        <div className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-white/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600 sm:mb-5 sm:px-3">
          Tenant login · {String(routeSlug || '').toUpperCase()}
        </div>

        <div className="mb-5 flex items-center gap-3 sm:mb-7">
          <BrandLogo compact brand={brand} />
          <div>
            <h1 className="text-base font-black leading-none text-slate-950 sm:text-lg">
              {brand.software || 'Aura Stay ERP'}
            </h1>
            <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
              {brand.name || 'Aura Stay'}
            </p>
          </div>
        </div>

        <h2 className="text-[1.75rem] font-black leading-[1.08] tracking-[-0.015em] text-slate-950 sm:text-[2.1rem] lg:text-[2.35rem]">
          {brand.loginTitle || 'Welcome back'}
        </h2>

        <p className="mt-2 text-[14px] font-medium leading-6 text-slate-600 sm:text-[15px]">
          {brand.loginSubtitle || 'Sign in to your account to continue'}
        </p>

        <LoginForm brand={brand} routeSlug={routeSlug} />

        <div className="mt-5 border-t border-slate-200/85 pt-3 text-[10px] font-medium tracking-[0.01em] text-slate-500 sm:mt-6 sm:pt-4 sm:text-[11px]">
          Designed for Luxury Hospitality. Engineered for Enterprise Operations.
        </div>
      </div>

      <style>{`
        @keyframes loginFloat {
          from { opacity: 0; transform: translateY(18px) scale(.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
