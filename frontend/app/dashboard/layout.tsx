/**
 * Dashboard Layout (T082)
 *
 * Layout wrapper for dashboard pages with authentication
 */

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

interface DashboardLayoutProps {
  children: React.ReactNode
}

/**
 * T082: Dashboard Layout
 * Ensures user is authenticated before rendering dashboard pages
 */
export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect('/sign-in?callbackUrl=/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <main>{children}</main>
    </div>
  )
}
