import { LogOut } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { getTenantId, setTenantId } from '../../../lib/tenant'
import { ROLE_LABELS } from '../../../lib/roles'
import { SidebarFooter as SidebarFooterPrimitive } from 'src/components/ui/sidebar'
import { Button } from 'src/components/ui/button'

export default function SidebarFooter({ company, role, userName }) {
  async function handleLogout() {
    const tenantId = getTenantId()
    await supabase.auth.signOut()
    setTenantId(null)
    try {
      sessionStorage.removeItem('aura_tenant_slug')
    } catch {
      // ignore storage errors
    }

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
      <div className="rounded-2xl border border-white/9 bg-white/[0.05] p-3.5 shadow-[0_10px_22px_rgba(0,0,0,0.14)] backdrop-blur-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-extrabold text-white">{userName}</div>
            <div className="pt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/54">
              {ROLE_LABELS[role] || role}
            </div>
            <div className="mt-1.5 truncate text-[10px] text-white/55">
              {company?.name || company?.tenant_name || 'Tenant'}
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Sign out"
            onClick={handleLogout}
            className="shrink-0 text-white/65 hover:bg-white/8 hover:text-white"
          >
            <LogOut size={15} />
          </Button>
        </div>
      </div>
    </SidebarFooterPrimitive>
  )
}
