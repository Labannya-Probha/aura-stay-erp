import ModuleRouteBoundary from 'src/components/shared/ModuleRouteBoundary'

export default function FrontOfficeRouteBoundary({ routeKey, children }) {
  return (
    <ModuleRouteBoundary moduleName="Front Office" routeKey={routeKey}>
      {children}
    </ModuleRouteBoundary>
  )
}
