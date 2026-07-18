import { useCallback, useEffect, useMemo, useState } from 'react'
import paymentConfigurationService from '../services/paymentConfiguration.service.js'

export default function usePaymentConfiguration() {
  const [records, setRecords] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async ({ refresh = false } = {}) => {
    setError('')
    refresh ? setIsRefreshing(true) : setIsLoading(true)
    try {
      const data = await paymentConfigurationService.listTerminals()
      setRecords(Array.isArray(data) ? data : [])
    } catch (requestError) {
      setError(requestError?.message || 'Unable to load payment configuration. Please try again.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const terminals = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) return records
    return records.filter((terminal) => [terminal.name, terminal.code, terminal.payment_method, terminal.merchant_id, terminal.terminal_id, terminal.settlement_account_name, terminal.settlement_account_code].filter(Boolean).join(' ').toLowerCase().includes(normalizedSearch))
  }, [records, search])

  const refresh = useCallback(() => load({ refresh: true }), [load])

  const toggleTerminalStatus = useCallback(async (terminal) => {
    setError('')
    try {
      const updated = await paymentConfigurationService.updateTerminal(terminal.id, { is_active: !terminal.is_active })
      setRecords((current) => current.map((item) => item.id === terminal.id ? { ...item, ...updated } : item))
    } catch (requestError) {
      setError(requestError?.message || 'Unable to update terminal status.')
      throw requestError
    }
  }, [])

  const removeTerminal = useCallback(async (terminalId) => {
    setError('')
    try {
      await paymentConfigurationService.removeTerminal(terminalId)
      setRecords((current) => current.filter((terminal) => terminal.id !== terminalId))
    } catch (requestError) {
      setError(requestError?.message || 'Unable to remove payment terminal.')
      throw requestError
    }
  }, [])

  return { terminals, search, setSearch, isLoading, isRefreshing, error, refresh, toggleTerminalStatus, removeTerminal }
}
