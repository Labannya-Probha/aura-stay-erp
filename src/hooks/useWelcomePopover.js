import { useState, useEffect } from 'react'

const SESSION_KEY = 'aura_welcome_shown'

export function useWelcomePopover() {
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    // Check if welcome has been shown in current session
    const wasShown = sessionStorage.getItem(SESSION_KEY)
    if (!wasShown) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setShowWelcome(true)
        sessionStorage.setItem(SESSION_KEY, 'true')
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [])

  return { showWelcome, setShowWelcome }
}
