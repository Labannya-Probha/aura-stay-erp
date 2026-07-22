import { useCallback, useEffect, useState } from 'react'
import DrawerForm from 'src/components/forms/DrawerForm'
import LoadingOverlay from './LoadingOverlay.jsx'
import PaymentTerminalForm from './PaymentTerminalForm.jsx'
import UnsavedChangesDialog from './UnsavedChangesDialog.jsx'

export default function PaymentTerminalDialog({
  open,
  terminal,
  settlementAccounts,
  isSaving,
  error,
  onClose,
  onSubmit,
}) {
  const [dirty, setDirty] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)

  const requestClose = useCallback(() => {
    if (isSaving) return
    if (dirty) setConfirmClose(true)
    else onClose()
  }, [dirty, isSaving, onClose])

  useEffect(() => {
    if (!open) {
      setDirty(false)
      setConfirmClose(false)
    }
  }, [open])
  if (!open) return null

  return (
    <>
      <DrawerForm
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) requestClose()
        }}
        title={terminal?.id ? terminal.name || terminal.terminal_name : 'New terminal'}
        subtitle="Payment Configuration"
        size="lg"
        className="sm:max-w-2xl"
      >
        <div className="relative">
          <LoadingOverlay visible={isSaving} />
          <PaymentTerminalForm
            initialValue={terminal}
            settlementAccounts={settlementAccounts}
            isSaving={isSaving}
            serverError={error}
            onDirtyChange={setDirty}
            onCancel={requestClose}
            onSubmit={onSubmit}
          />
        </div>
      </DrawerForm>
      <UnsavedChangesDialog
        open={confirmClose}
        onContinue={() => setConfirmClose(false)}
        onDiscard={() => {
          setConfirmClose(false)
          setDirty(false)
          onClose()
        }}
      />
    </>
  )
}
