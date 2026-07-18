import { X } from 'lucide-react'
import SidebarBrandLogo from './SidebarBrandLogo.jsx'
import { SidebarHeader as SidebarHeaderPrimitive } from 'src/components/ui/sidebar'

export default function SidebarHeader({ company, softwareName, mobile = false, onClose }) {
  return (
    <SidebarHeaderPrimitive>
      <SidebarBrandLogo url={company?.logo_url} softwareName={softwareName} />

      <div className="min-w-0 flex-1">
        <div className="truncate font-display font-bold leading-tight text-white">
          {softwareName}
        </div>
        <div className="truncate text-[11px] text-white/70">
          {company?.name || ''}
        </div>
      </div>

      {mobile && (
        <button onClick={onClose} className="shrink-0 text-white/50 hover:text-white">
          <X size={20} />
        </button>
      )}
    </SidebarHeaderPrimitive>
  )
}
