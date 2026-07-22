import type { ReactNode } from 'react'
import ModuleErrorBoundary from 'src/components/boundary/ModuleErrorBoundary'

type ModuleRouteBoundaryProps = {
  moduleName: string
  routeKey?: string
  children: ReactNode
}

export default function ModuleRouteBoundary({
  moduleName,
  routeKey,
  children,
}: ModuleRouteBoundaryProps) {
  return (
    <ModuleErrorBoundary moduleName={moduleName} routeKey={routeKey}>
      {children}
    </ModuleErrorBoundary>
  )
}
