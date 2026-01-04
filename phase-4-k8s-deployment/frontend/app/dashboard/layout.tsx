/**
 * Dashboard Layout
 *
 * Layout wrapper for dashboard pages with authentication and sidebar
 */

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { DashboardLayout as DashboardLayoutComponent } from '@/components/dashboard/dashboard-layout'

interface DashboardLayoutProps {
  children: React.ReactNode
}

/**
 * Dashboard Layout
 * Ensures user is authenticated before rendering dashboard pages
 * Uses custom sidebar layout component
 */
export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect('/sign-in?callbackUrl=/dashboard')
  }

  return <DashboardLayoutComponent>{children}</DashboardLayoutComponent>
}
