import { useContext } from "react"
import { AedsDialogContext } from "./AedsDialogProvider"

export function useAedsDialog() {
  const ctx = useContext(AedsDialogContext)

  if (!ctx) {
    throw new Error("useAedsDialog must be used inside AedsDialogProvider")
  }

  return ctx
}
