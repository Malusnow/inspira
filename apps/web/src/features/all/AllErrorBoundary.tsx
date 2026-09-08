import { Component, type ReactNode } from "react"
import { Alert, Button } from "tdesign-react"

import { toErrorMessage } from "./noteFormat"

export interface AllErrorBoundaryProps {
  children: ReactNode
}

interface AllErrorBoundaryState {
  error: string | null
}

/**
 * Surfaces owner-scoped query / render failures as a visible error state without
 * implying other modules. Serves the "Load failure is visible" requirement: if
 * the All query throws (e.g. request timed out), an error panel shows
 * instead of raw crash or another user's data. Retry re-subscribes the query.
 */
export class AllErrorBoundary extends Component<
  AllErrorBoundaryProps,
  AllErrorBoundaryState
> {
  state: AllErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: unknown): AllErrorBoundaryState {
    return { error: toErrorMessage(error) }
  }

  private handleRetry = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <main className="grid min-h-svh place-items-center bg-canvas p-6 text-ink">
          <section className="flex w-full max-w-md flex-col items-start gap-4 rounded-lg border border-danger-soft bg-danger-soft/40 p-6">
            <p className="text-base font-medium text-ink-strong">
              Couldn’t load your notes
            </p>
            <Alert theme="error" message={this.state.error} />
            <Button theme="primary" size="small" onClick={this.handleRetry}>
              Retry
            </Button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
