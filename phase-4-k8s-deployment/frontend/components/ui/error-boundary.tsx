/**
 * T066: Error Boundary Component
 *
 * Provides error boundaries for React components to gracefully handle errors
 * and display fallback UI instead of crashing the entire page.
 */

'use client'

import * as React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onReset?: () => void
  /** Optional title for the error card */
  title?: string
  /** Optional description for the error card */
  description?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Class-based error boundary (required by React)
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
          title={this.props.title}
          description={this.props.description}
        />
      )
    }

    return this.props.children
  }
}

/**
 * Default error fallback UI
 */
interface ErrorFallbackProps {
  error: Error | null
  onReset?: () => void
  title?: string
  description?: string
}

export function ErrorFallback({
  error,
  onReset,
  title = 'Something went wrong',
  description = 'An error occurred while loading this section.',
}: ErrorFallbackProps) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="text-destructive/80">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-md bg-muted/50 text-sm font-mono text-muted-foreground overflow-auto max-h-24">
            {error.message}
          </div>
        )}
        {onReset && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Calendar-specific error fallback
 */
export function CalendarErrorFallback({ onReset }: { onReset?: () => void }) {
  return (
    <ErrorFallback
      error={null}
      onReset={onReset}
      title="Calendar Error"
      description="Unable to load the calendar view. Please try again."
    />
  )
}

/**
 * Analytics-specific error fallback
 */
export function AnalyticsErrorFallback({ onReset }: { onReset?: () => void }) {
  return (
    <ErrorFallback
      error={null}
      onReset={onReset}
      title="Analytics Error"
      description="Unable to load analytics data. Please try again."
    />
  )
}
