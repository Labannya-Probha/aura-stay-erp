import { AlertTriangle } from 'lucide-react'
import ModuleDialogShell from 'src/components/shared/ModuleDialogShell'
import { Button } from 'src/components/ui/button'

export default function ConfirmDeleteDialog({
  open,
  terminal,
  isDeleting = false,
  onCancel,
  onConfirm,
}) {
  if (!open || !terminal) return null

  return (
    <ModuleDialogShell
      open={open}
      onClose={isDeleting ? undefined : onCancel}
      title="Delete payment terminal?"
      subtitle="This action cannot be undone."
      footer={
        <>
          <Button variant="outline" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete terminal'}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-red-50 text-red-600">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="text-sm leading-6 text-slate-600">
          <strong>{terminal.name || terminal.terminal_name}</strong> will be removed.
        </p>
      </div>
    </ModuleDialogShell>
  )
}
