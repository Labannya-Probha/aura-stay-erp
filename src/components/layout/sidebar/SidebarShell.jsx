export default function SidebarShell({ children, mobile = false }) {
  return (
    <aside
      className={
        mobile
          ? "aeds-sidebar fixed left-0 top-0 z-50 flex h-full w-[300px] max-w-[86vw] flex-col shadow-2xl"
          : "aeds-sidebar sticky top-0 hidden h-screen w-[var(--aeds-sidebar-width)] shrink-0 flex-col overflow-hidden border-r border-white/10 shadow-xl lg:flex"
      }
    >
      {children}
    </aside>
  )
}