import { Sidebar } from "src/components/ui/sidebar"

export default function SidebarShell({ children, mobile = false }) {
  return <Sidebar mobile={mobile}>{children}</Sidebar>
}