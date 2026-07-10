import LoginForm from "./LoginForm"
import BrandLogo from "./BrandLogo"

export default function LoginCard({ brand = {}, routeSlug }) {
  return (
    <div className="relative z-10 w-full max-w-[480px] animate-[loginFloat_.65s_ease-out]">
      <div
        className="border border-white/55 p-6 shadow-2xl backdrop-blur-[34px] sm:p-8"
        style={{
          background: "rgba(255,255,255,0.92)",
          borderRadius: "var(--tenant-card-radius)",
          boxShadow: "var(--tenant-shadow-lg)",
        }}
      >
        <div className="mb-7 flex items-center gap-3">
          <BrandLogo compact brand={brand} />
          <div>
            <h1 className="text-lg font-black text-slate-950">
              {brand.software || "Aura Stay ERP"}
            </h1>
            <p className="text-sm font-medium text-slate-500">
              {brand.name || "Aura Stay"}
            </p>
          </div>
        </div>

        <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          {brand.loginTitle || "Welcome back"}
        </h2>

        <p className="mt-2 text-sm font-medium text-slate-600">
          {brand.loginSubtitle || "Sign in to your account to continue"}
        </p>

        <LoginForm brand={brand} routeSlug={routeSlug} />
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