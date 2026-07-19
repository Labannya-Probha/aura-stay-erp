import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "src/lib/utils"

const Sidebar = React.forwardRef(({ className, mobile = false, ...props }, ref) => (
  <aside
    ref={ref}
    data-slot="sidebar"
    className={cn(
      mobile
        ? "aeds-sidebar fixed inset-y-0 left-0 z-50 flex h-full w-[min(18.75rem,86vw)] flex-col overflow-hidden border-r border-[color-mix(in_srgb,var(--sidebar-text)_12%,transparent)] shadow-[0_40px_100px_rgba(15,23,42,0.5)] backdrop-blur-2xl"
        : "aeds-sidebar sticky top-0 hidden h-screen w-[var(--aeds-sidebar-width)] shrink-0 flex-col overflow-hidden border-r border-[color-mix(in_srgb,var(--sidebar-text)_10%,transparent)] shadow-[0_30px_70px_rgba(15,23,42,0.24)] lg:flex",
      className
    )}
    {...props}
  />
))
Sidebar.displayName = "Sidebar"

const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="sidebar-header"
    className={cn(
      "relative z-[1] flex items-center gap-3 border-b border-[color-mix(in_srgb,var(--sidebar-text)_12%,transparent)] px-4 py-4",
      className
    )}
    {...props}
  />
))
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = React.forwardRef(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div"
  return <Comp ref={ref} data-slot="sidebar-content" className={cn("flex-1 min-h-0 overflow-y-auto overflow-x-hidden", className)} {...props} />
})
SidebarContent.displayName = "SidebarContent"

const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="sidebar-footer"
    className={cn(
      "relative z-[1] border-t border-[color-mix(in_srgb,var(--sidebar-text)_12%,transparent)] px-4 py-4",
      className
    )}
    {...props}
  />
))
SidebarFooter.displayName = "SidebarFooter"

const SidebarInput = React.forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    data-slot="sidebar-input"
    className={cn(
      "h-10 w-full rounded-xl border border-[color-mix(in_srgb,var(--sidebar-text)_14%,transparent)] bg-white/10 px-3 text-sm text-white placeholder:text-white/55 outline-none transition-[background-color,border-color,box-shadow,transform] focus:border-[color-mix(in_srgb,var(--sidebar-text)_30%,transparent)] focus:bg-white/16 focus:shadow-[0_10px_24px_rgba(0,0,0,0.12)] focus:ring-2 focus:ring-white/10",
      className
    )}
    {...props}
  />
))
SidebarInput.displayName = "SidebarInput"

export { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInput }
