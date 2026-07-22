import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from 'src/components/ui/button'

type ModuleErrorBoundaryProps = {
  moduleName: string
  routeKey?: string
  onReset?: () => void
  children: ReactNode
}

type ModuleErrorBoundaryState = {
  error: Error | null
}

export default class ModuleErrorBoundary extends Component<
  ModuleErrorBoundaryProps,
  ModuleErrorBoundaryState
> {
  state: ModuleErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ModuleErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[${this.props.moduleName}] render failure`, error, info)
  }

  componentDidUpdate(prevProps: ModuleErrorBoundaryProps): void {
    if (prevProps.routeKey !== this.props.routeKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  private handleReset = () => {
    this.setState({ error: null })
    this.props.onReset?.()
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <section
        role="alert"
        aria-live="assertive"
        className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-900"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 text-red-700" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="text-base font-semibold">{this.props.moduleName} could not render</h2>
            <p className="mt-1 text-sm text-red-700">
              {this.state.error.message || 'A rendering failure occurred in this module.'}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Button variant="outline" onClick={this.handleReset}>
                <RotateCcw className="size-4" aria-hidden="true" />
                Retry module
              </Button>
              <Button variant="ghost" onClick={() => window.location.reload()}>
                Reload app
              </Button>
            </div>
          </div>
        </div>
      </section>
    )
  }
}
