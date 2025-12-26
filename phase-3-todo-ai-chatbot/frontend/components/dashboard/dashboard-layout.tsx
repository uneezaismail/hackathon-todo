/**
 * Dashboard Layout Component
 *
 * Wraps dashboard pages with responsive sidebar and mobile menu.
 * Includes floating chat widget for AI assistant access.
 */

'use client'

import * as React from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [collapsed, setCollapsed] = React.useState(false)

  // Listen for sidebar collapse state changes
  React.useEffect(() => {
    const handleStorageChange = () => {
      const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true'
      setCollapsed(isCollapsed)
    }

    window.addEventListener('storage', handleStorageChange)
    handleStorageChange()

    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-20 transform bg-background/95 backdrop-blur-md border-r border-border transition-transform md:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar 
          className="relative w-full border-none" 
          forceCollapsed={true} 
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main content */}
      <div
        className={cn(
          'transition-all duration-300',
          collapsed ? 'md:pl-20' : 'md:pl-64'
        )}
      >
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/95 backdrop-blur-md px-4 md:hidden">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="text-foreground"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <span className="text-xl font-bold text-foreground">TaskFlow</span>
          </div>
          <ThemeToggle />
        </header>

        {/* Page content */}
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </div>

      {/* GlobalChatButton is rendered in app/layout.tsx for all authenticated pages */}
    </div>
  )
}
