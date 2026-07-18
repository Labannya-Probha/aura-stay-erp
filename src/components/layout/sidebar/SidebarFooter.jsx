import { LogOut } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { getTenantId } from '../../../lib/tenant'
import { ROLE_LABELS } from '../../../lib/roles'
import { SidebarFooter as SidebarFooterPrimitive } from 'src/components/ui/sidebar'

export default function SidebarFooter({ company, role, userName }) {
  async function handleLogout() {
    const tenantId = getTenantId()
    await supabase.auth.signOut()

    const { data: prop } = await supabase
      .from('properties')
      .select('slug')
      .eq('id', tenantId)
      .maybeSingle()

    const slug = company?.slug || prop?.slug
    window.location.href = slug ? `/${slug}/login` : '/login'
  }

  return (
    <SidebarFooterPrimitive className="text-xs text-white/70">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-semibold text-white">{userName}</div>
          <div className="text-[10px] text-white/60">{ROLE_LABELS[role] || role}</div>
        </div>

        <button
          title="Sign out"
          onClick={handleLogout}
          className="shrink-0 text-white/65 hover:text-white"
        >
          <LogOut size={15} />
        </button>
      </div>
    </SidebarFooterPrimitive>
  )
}
