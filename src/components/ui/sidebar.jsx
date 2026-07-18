import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "src/lib/utils"

const Sidebar = React.forwardRef(({ className, mobile = false, ...props }, ref) => (
  <aside
    ref={ref}
    data-slot="sidebar"
    className={cn(
      mobile
        ? "aeds-sidebar fixed left-0 top-0 z-50 flex h-full w-[300px] max-w-[86vw] flex-col shadow-2xl"
        : "aeds-sidebar sticky top-0 hidden h-screen w-[var(--aeds-sidebar-width)] shrink-0 flex-col overflow-hidden border-r border-white/10 shadow-xl lg:flex",
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
    className={cn("flex items-center gap-3 border-b border-white/15 px-5 py-5", className)}
    {...props}
  />
))
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = React.forwardRef(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div"
  return <Comp ref={ref} data-slot="sidebar-content" className={cn("flex-1 overflow-y-auto", className)} {...props} />
})
SidebarContent.displayName = "SidebarContent"

const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="sidebar-footer" className={cn("border-t border-white/15 px-5 py-4", className)} {...props} />
))
SidebarFooter.displayName = "SidebarFooter"

const SidebarInput = React.forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    data-slot="sidebar-input"
    className={cn(
      "h-8 w-full rounded-lg border border-white/15 bg-white/10 px-8 pr-8 text-sm text-white placeholder:text-white/55 outline-none ring-0 transition-colors focus:border-white/35 focus:bg-white/15",
      className
    )}
    {...props}
  />
))
SidebarInput.displayName = "SidebarInput"

export { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInput }
