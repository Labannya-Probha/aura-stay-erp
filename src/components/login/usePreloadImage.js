import { useEffect, useState } from "react"

export function usePreloadImage(src) {
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setReady(false)
    setFailed(false)

    if (!src) return

    let alive = true
    const image = new Image()

    image.onload = () => alive && setReady(true)
    image.onerror = () => alive && setFailed(true)
    image.src = src

    return () => {
      alive = false
    }
  }, [src])

  return { ready, failed }
}