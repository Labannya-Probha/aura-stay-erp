import ModuleDialogShell from 'src/components/shared/ModuleDialogShell'

export default function FrontOfficeDialogShell({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
}) {
  return (
    <ModuleDialogShell
      open={open}
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      footer={footer}
    >
      {children}
    </ModuleDialogShell>
  )
}
