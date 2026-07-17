import { createContext, useMemo, useState } from "react"
import AedsDialogRoot from "./AedsDialogRoot"
import "./aeds-dialog-engine.css"

export const AedsDialogContext = createContext(null)

export function AedsDialogProvider({ children }) {
  const [dialogs, setDialogs] = useState([])

  const close = (id) => {
    setDialogs((current) => current.filter((dialog) => dialog.id !== id))
  }

  const open = (type, payload = {}) => {
    const id = payload.id || `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`
    setDialogs((current) => [...current, { id, type, ...payload }])
    return id
  }

  const api = useMemo(() => ({
    open,
    close,
    drawer: (payload) => open("drawer", payload),
    confirm: (payload) => open("confirm", payload),
    preview: (payload) => open("preview", payload),
    approval: (payload) => open("approval", payload),
    printPreview: (payload) => open("print", payload),
  }), [])

  return (
    <AedsDialogContext.Provider value={api}>
      {children}
      <AedsDialogRoot dialogs={dialogs} close={close} />
    </AedsDialogContext.Provider>
  )
}
