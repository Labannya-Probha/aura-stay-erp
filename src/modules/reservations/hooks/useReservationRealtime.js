import { useEffect, useRef, useState } from "react"
import { subscribeToReservationChanges } from "../realtime/reservationRealtime"

export function useReservationRealtime(onChange, { debounceMs = 250 } = {}) {
  const onChangeRef = useRef(onChange)
  const timerRef = useRef(null)
  const [status, setStatus] = useState("connecting")

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    const unsubscribe = subscribeToReservationChanges({
      onStatus: setStatus,
      onChange: (payload) => {
        window.clearTimeout(timerRef.current)
        timerRef.current = window.setTimeout(() => {
          onChangeRef.current?.(payload)
        }, debounceMs)
      },
    })

    return () => {
      window.clearTimeout(timerRef.current)
      unsubscribe()
    }
  }, [debounceMs])

  return {
    status,
    isLive: status === "subscribed",
  }
}
