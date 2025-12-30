/**
 * T066: Calendar Page Error Boundary
 *
 * Catches errors in the calendar page and displays a user-friendly message
 */

'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Calendar } from 'lucide-react'

export default function CalendarError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console (in production, send to error tracking service)
    console.error('Calendar error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[600px] p-4">
      <Card className="max-w-md w-full border-red-500/30 bg-[#131929]/95">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-4 rounded-full bg-red-500/10">
            <AlertTriangle className="h-10 w-10 text-red-400" />
          </div>
          <CardTitle className="text-xl text-white">
            Calendar Error
          </CardTitle>
          <CardDescription className="text-white/60">
            Something went wrong while loading the calendar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error.message && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-300 font-mono break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={reset}
              className="flex-1 bg-[#00d4b8] text-[#0b1121] hover:bg-[#00d4b8]/90 gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1 border-white/10 text-white hover:bg-white/5 gap-2"
            >
              <Calendar className="h-4 w-4" />
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
