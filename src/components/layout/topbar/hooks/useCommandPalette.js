import { useCallback, useEffect, useState } from "react"

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    function handleKeyDown(event) {
      const isCommand = event.ctrlKey || event.metaKey
      if (isCommand && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setIsOpen(true)
      }
      if (event.key === "Escape") setIsOpen(false)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return { isOpen, open, close }
}
