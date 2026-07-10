import AedsNavigationShell from "../../../components/navigation-engine/AedsNavigationShell"

export default function NavigationEngineDemo({ userName, role = "ADMIN" }) {
  return (
    <AedsNavigationShell role={role} userName={userName}>
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black tracking-tight text-slate-950">AEDS v5 Navigation Engine</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Dynamic sidebar, RBAC-aware menus, favorites, recent pages, breadcrumb and Ctrl+K command palette.
        </p>
      </section>
    </AedsNavigationShell>
  )
}
