import { useCallback, useState } from 'react'
import paymentPostingEngine from '../PaymentPostingEngine.js'
import paymentPostingQueueProcessor from '../queue/PaymentPostingQueueProcessor.js'

export default function usePaymentPosting(tenantId) {
  const [isPosting, setIsPosting] = useState(false)
  const [error, setError] = useState(null)
  const [lastResult, setLastResult] = useState(null)

  const run = useCallback(async (operation) => {
    setIsPosting(true)
    setError(null)
    try {
      const result = await operation()
      setLastResult(result)
      return result
    } catch (cause) {
      setError(cause?.message || 'Payment posting failed.')
      throw cause
    } finally {
      setIsPosting(false)
    }
  }, [])

  const postNow = useCallback(
    (payment) => run(() => paymentPostingEngine.post({ tenantId, payment })),
    [run, tenantId],
  )

  const queue = useCallback(
    (payment) => run(() => paymentPostingQueueProcessor.enqueue({ tenantId, payment })),
    [run, tenantId],
  )

  const processQueue = useCallback(
    (limit = 25) => run(() => paymentPostingQueueProcessor.drain({ tenantId, limit })),
    [run, tenantId],
  )

  return { postNow, queue, processQueue, isPosting, error, lastResult, clearError: () => setError(null) }
}
