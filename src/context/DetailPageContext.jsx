import { createContext, useContext, useState } from 'react'

/**
 * DetailPageContext - Manages state for detail/preview pages (reservations, invoices, etc.)
 * Allows nested tabs to be rendered in sidebar when viewing a detail
 */
const DetailPageContext = createContext()

export function DetailPageProvider({ children }) {
  const [detailState, setDetailState] = useState({
    isDetailView: false,
    detailType: null, // 'reservation', 'invoice', 'quotation', etc.
    tabs: [],
    activeTab: null,
  })

  const setDetailView = (isDetailView, detailType = null, tabs = [], activeTab = null) => {
    setDetailState({
      isDetailView,
      detailType,
      tabs,
      activeTab,
    })
  }

  const setActiveTab = (tabId) => {
    setDetailState((prev) => ({
      ...prev,
      activeTab: tabId,
    }))
  }

  return (
    <DetailPageContext.Provider value={{ detailState, setDetailView, setActiveTab }}>
      {children}
    </DetailPageContext.Provider>
  )
}

export function useDetailPage() {
  const context = useContext(DetailPageContext)
  if (!context) {
    throw new Error('useDetailPage must be used within DetailPageProvider')
  }
  return context
}
