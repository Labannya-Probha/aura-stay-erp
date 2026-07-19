import AedsSideDrawer from "./AedsSideDrawer"
import AedsConfirmDialog from "./AedsConfirmDialog"
import AedsPreviewDialog from "./AedsPreviewDialog"
import AedsApprovalDialog from "./AedsApprovalDialog"
import AedsPrintPreview from "./AedsPrintPreview"

export default function AedsDialogRoot({ dialogs = [], close }) {
  return (
    <>
      {dialogs.map((dialog) => {
        if (dialog.type === "drawer") {
          return <AedsSideDrawer key={dialog.id} dialog={dialog} onClose={() => close(dialog.id)} />
        }

        if (dialog.type === "confirm") {
          return <AedsConfirmDialog key={dialog.id} dialog={dialog} onClose={() => close(dialog.id)} />
        }

        if (dialog.type === "preview") {
          return <AedsPreviewDialog key={dialog.id} dialog={dialog} onClose={() => close(dialog.id)} />
        }

        if (dialog.type === "approval") {
          return <AedsApprovalDialog key={dialog.id} dialog={dialog} onClose={() => close(dialog.id)} />
        }

        if (dialog.type === "print") {
          return <AedsPrintPreview key={dialog.id} dialog={dialog} onClose={() => close(dialog.id)} />
        }

        return null
      })}
    </>
  )
}
