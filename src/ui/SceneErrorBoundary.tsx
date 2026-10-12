import { Component, Suspense, type ErrorInfo, type ReactNode } from 'react'

type SceneErrorBoundaryProps = {
  children: ReactNode
  fallback: ReactNode
  onError?: (error: Error) => void
}

type SceneErrorBoundaryState = {
  error: Error | null
}

export class SceneErrorBoundary extends Component<SceneErrorBoundaryProps, SceneErrorBoundaryState> {
  state: SceneErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): SceneErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Falló la escena 3D', { error, componentStack: info.componentStack })
    this.props.onError?.(error)
  }

  render(): ReactNode {
    // Suspense covers the lazily loaded scene chunk; a failed download lands in the error fallback.
    return this.state.error === null
      ? <Suspense fallback={null}>{this.props.children}</Suspense>
      : this.props.fallback
  }
}
