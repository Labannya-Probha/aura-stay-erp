import ModuleErrorBoundary from 'src/components/boundary/ModuleErrorBoundary'

export default function FrontOfficeRouteBoundary({ routeKey, children }) {
  return (
    <ModuleErrorBoundary moduleName="Front Office" routeKey={routeKey}>
      {children}
    </ModuleErrorBoundary>
  )
}
