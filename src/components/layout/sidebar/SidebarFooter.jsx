import { LogOut } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { getTenantId } from '../../../lib/tenant'
import { ROLE_LABELS } from '../../../lib/roles'
import { SidebarFooter as SidebarFooterPrimitive } from 'src/components/ui/sidebar'
import { Button } from 'src/components/ui/button'

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
    <SidebarFooterPrimitive className="text-xs text-white/72">
      <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-white">{userName}</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
              {ROLE_LABELS[role] || role}
            </div>
            <div className="mt-1 truncate text-[10px] text-white/55">
              {company?.name || company?.tenant_name || 'Tenant'}
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Sign out"
            onClick={handleLogout}
            className="shrink-0 text-white/65 hover:bg-white/10 hover:text-white"
          >
            <LogOut size={15} />
          </Button>
        </div>
      </div>
    </SidebarFooterPrimitive>
  )
}
