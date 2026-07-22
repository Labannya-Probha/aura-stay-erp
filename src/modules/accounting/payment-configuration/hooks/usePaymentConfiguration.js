import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import paymentConfigurationService from '../services/paymentConfiguration.service.js'

function getErrorMessage(error, fallback) {
  return error instanceof Error && error.message ? error.message : fallback
}

export default function usePaymentConfiguration(tenantId) {
  const mountedRef = useRef(true)
  const requestIdRef = useRef(0)

  const [records, setRecords] = useState([])
  const [settlementAccounts, setSettlementAccounts] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingTerminalId, setPendingTerminalId] = useState(null)
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const load = useCallback(
    async ({ refresh = false } = {}) => {
      if (!tenantId) {
        setRecords([])
        setSettlementAccounts([])
        setError('Tenant context is unavailable.')
        setIsLoading(false)
        setIsRefreshing(false)
        return
      }

      const requestId = ++requestIdRef.current
      setError('')
      refresh ? setIsRefreshing(true) : setIsLoading(true)

      try {
        const [terminals, accounts] = await Promise.all([
          paymentConfigurationService.listTerminals(tenantId),
          paymentConfigurationService.listSettlementAccounts(tenantId),
        ])

        if (!mountedRef.current || requestId !== requestIdRef.current) return

        setRecords(Array.isArray(terminals) ? terminals : [])
        setSettlementAccounts(Array.isArray(accounts) ? accounts : [])
        setLastRefresh(new Date())
      } catch (requestError) {
        if (!mountedRef.current || requestId !== requestIdRef.current) return

        setError(
          getErrorMessage(
            requestError,
            'Unable to load payment configuration. Please try again.',
          ),
        )
      } finally {
        if (mountedRef.current && requestId === requestIdRef.current) {
          setIsLoading(false)
          setIsRefreshing(false)
        }
      }
    },
    [tenantId],
  )

  useEffect(() => {
    load()
  }, [load])

  const terminals = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) return records

    return records.filter((terminal) =>
      [
        terminal.name,
        terminal.terminal_name,
        terminal.code,
        terminal.terminal_code,
        terminal.payment_method,
        terminal.provider,
        terminal.merchant_id,
        terminal.terminal_id,
        terminal.settlement_account_name,
        terminal.settlement_account_code,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch),
    )
  }, [records, search])

  const refresh = useCallback(() => load({ refresh: true }), [load])

  const createTerminal = useCallback(
    async (payload) => {
      setError('')
      setIsSaving(true)

      try {
        const created = await paymentConfigurationService.createTerminal(
          tenantId,
          payload,
        )

        if (mountedRef.current) {
          setRecords((current) => [created, ...current])
        }

        return created
      } catch (requestError) {
        const message = getErrorMessage(
          requestError,
          'Unable to create the payment terminal.',
        )
        if (mountedRef.current) setError(message)
        throw requestError
      } finally {
        if (mountedRef.current) setIsSaving(false)
      }
    },
    [tenantId],
  )

  const updateTerminal = useCallback(
    async (terminalId, payload) => {
      setError('')
      setIsSaving(true)
      setPendingTerminalId(terminalId)

      try {
        const updated = await paymentConfigurationService.updateTerminal(
          tenantId,
          terminalId,
          payload,
        )

        if (mountedRef.current) {
          setRecords((current) =>
            current.map((item) => (item.id === terminalId ? updated : item)),
          )
        }

        return updated
      } catch (requestError) {
        const message = getErrorMessage(
          requestError,
          'Unable to update the payment terminal.',
        )
        if (mountedRef.current) setError(message)
        throw requestError
      } finally {
        if (mountedRef.current) {
          setIsSaving(false)
          setPendingTerminalId(null)
        }
      }
    },
    [tenantId],
  )

  const toggleTerminalStatus = useCallback(
    (terminal) =>
      updateTerminal(terminal.id, {
        is_active: !terminal.is_active,
      }),
    [updateTerminal],
  )

  const removeTerminal = useCallback(
    async (terminalId) => {
      setError('')
      setPendingTerminalId(terminalId)

      try {
        await paymentConfigurationService.removeTerminal(tenantId, terminalId)

        if (mountedRef.current) {
          setRecords((current) =>
            current.filter((terminal) => terminal.id !== terminalId),
          )
        }
      } catch (requestError) {
        const message = getErrorMessage(
          requestError,
          'Unable to remove the payment terminal.',
        )
        if (mountedRef.current) setError(message)
        throw requestError
      } finally {
        if (mountedRef.current) setPendingTerminalId(null)
      }
    },
    [tenantId],
  )

  const clearError = useCallback(() => setError(''), [])

  return {
    terminals,
    settlementAccounts,
    search,
    setSearch,
    isLoading,
    isRefreshing,
    isSaving,
    pendingTerminalId,
    error,
    lastRefresh,
    clearError,
    refresh,
    createTerminal,
    updateTerminal,
    toggleTerminalStatus,
    removeTerminal,
  }
}
