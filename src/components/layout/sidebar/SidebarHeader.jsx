import { X } from 'lucide-react'
import SidebarBrandLogo from './SidebarBrandLogo.jsx'
import { SidebarHeader as SidebarHeaderPrimitive } from 'src/components/ui/sidebar'
import { Button } from 'src/components/ui/button'

export default function SidebarHeader({ company, softwareName, mobile = false, onClose }) {
  return (
    <SidebarHeaderPrimitive className="justify-between gap-3.5">
      <SidebarBrandLogo url={company?.logo_url} softwareName={softwareName} />

      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-extrabold leading-tight tracking-[0.01em] text-white">
          {softwareName}
        </div>
        <div className="truncate pt-0.5 text-[11px] font-semibold text-white/62">
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
