"use client"

import * as React from "react"
import * as radixUi from "radix-ui"
import { cn } from "src/lib/utils.js";

/**
 * A-003 fix: this project had no shared Tabs primitive, so every tab
 * strip in the app (HR module's sub-view switchers, Reservations, etc.)
 * was hand-rolled with its own conditional active-state classNames,
 * inconsistent styling, and no keyboard/ARIA behavior beyond whatever
 * each author happened to add. This wraps radix-ui's Tabs (already an
 * installed dependency — no new package needed) with the same
 * data-slot/cn styling convention as the other primitives in this folder,
 * and gets real roving-tabindex keyboard navigation and ARIA semantics
 * for free from Radix.
 */
function Tabs({ className, ...props }) {
  return (
    <radixUi.Tabs.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({ className, ...props }) {
  return (
    <radixUi.Tabs.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-9 w-fit items-center justify-center gap-0.5 rounded-lg border-b border-[--border-color] bg-transparent p-0",
        className
      )}
      {...props} />
  );
}

function TabsTrigger({ className, ...props }) {
  return (
    <radixUi.Tabs.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-t-lg border border-transparent border-b-0 px-4 py-2 text-sm font-semibold text-pine/60 transition-colors outline-none",
        "hover:text-pine",
        "data-[state=active]:-mb-px data-[state=active]:border-[--border-color] data-[state=active]:border-b-white data-[state=active]:bg-white data-[state=active]:text-forest",
        "focus-visible:ring-3 focus-visible:ring-ring/30",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props} />
  );
}

function TabsContent({ className, ...props }) {
  return (
    <radixUi.Tabs.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props} />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
