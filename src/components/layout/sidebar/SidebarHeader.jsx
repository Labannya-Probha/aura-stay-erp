import { X } from 'lucide-react'
import SidebarBrandLogo from './SidebarBrandLogo.jsx'
import { SidebarHeader as SidebarHeaderPrimitive } from 'src/components/ui/sidebar'
import { Button } from 'src/components/ui/button'

export default function SidebarHeader({ company, softwareName, mobile = false, onClose }) {
  return (
    <SidebarHeaderPrimitive className="justify-between gap-3.5 rounded-[20px] border border-white/10 bg-white/[0.05] px-3 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
      <SidebarBrandLogo url={company?.logo_url} softwareName={softwareName} />

      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold leading-tight tracking-[0.01em] text-white">
          {softwareName}
        </div>
        <div className="truncate pt-0.5 text-[11px] font-medium text-white/65">
          {company?.name || company?.tenant_name || ''}
        </div>
      </div>

      {mobile && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Close sidebar"
          onClick={onClose}
          className="shrink-0 text-white/70 hover:bg-white/8 hover:text-white"
        >
          <X size={18} />
        </Button>
      )}
    </SidebarHeaderPrimitive>
  )
}
