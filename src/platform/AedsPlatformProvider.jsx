import { createContext, useContext, useMemo } from "react"

import {
  DashboardPersonalizationProvider,
  WorkflowEngineProvider,
} from "../enterprise"

const AedsPlatformContext = createContext(null)

export function useAedsPlatform() {
  const context = useContext(AedsPlatformContext)

  if (!context) {
    throw new Error(
      "useAedsPlatform must be used inside AedsPlatformProvider"
    )
  }

  return context
}

export default function AedsPlatformProvider({ children }) {
  const value = useMemo(
    () => ({
      platform: "Aura Stay ERP",
      architecture: "AEDS v7",
      metadataVersion: 1,
      capabilities: {
        metadataForms: true,
        metadataLists: true,
        workflow: true,
        approvals: true,
        notifications: true,
        audit: true,
        reportBuilder: true,
        dashboardPersonalization: true,
      },
    }),
    []
  )

  return (
    <AedsPlatformContext.Provider value={value}>
      <WorkflowEngineProvider>
        <DashboardPersonalizationProvider>
          {children}
        </DashboardPersonalizationProvider>
      </WorkflowEngineProvider>
    </AedsPlatformContext.Provider>
  )
}
