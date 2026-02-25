/**
 * Dashboard Layout Component
 *
 * Features:
 * - Collapsible sidebar with smooth transitions (desktop)
 * - Compact mobile sidebar that slides in from left
 * - Dark background matching hero page (#0A0A1F)
 * - User profile and theme toggle in top right
 */

'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardTopbar } from '@/components/layout/dashboard-topbar'
import { Button } from '@/components/ui/button'
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false)

  // Close mobile sidebar when route changes
  React.useEffect(() => {
    setMobileSidebarOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-[#0A0A1F]">
      {/* Desktop Sidebar - Collapsible */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarCollapsed ? 80 : 256,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden md:flex fixed left-0 top-0 h-full z-40 flex-col"
      >
        {/* Sidebar container with toggle */}
        <div className="relative h-full">
          <Sidebar
            className="h-full"
            forceCollapsed={sidebarCollapsed}
          />

          {/* Collapse Toggle Button - Floating on the right edge */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              "absolute right-0 top-20 translate-x-1/2 z-50",
              "flex h-8 w-8 items-center justify-center rounded-full",
              "bg-[#1a1a2e] border border-[#2a2a3e]",
              "text-purple-400 hover:text-purple-300",
              "shadow-lg hover:shadow-purple-500/20",
              "transition-all duration-200 hover:scale-110"
            )}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar - Slides in from left (icons only) */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-y-0 left-0 z-50 md:hidden"
          >
            <div className={cn(
              "h-full w-20 flex flex-col",
              "bg-[#1a1a2e] border-r border-[#2a2a3e]",
              "relative"
            )}>
              {/* Close button floating outside on the right */}
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className={cn(
                  "absolute -right-12 top-4 z-50",
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  "bg-[#1a1a2e] border border-[#2a2a3e]",
                  "text-gray-400 hover:text-white",
                  "transition-colors"
                )}
              >
                <X className="h-5 w-5" />
              </button>

              <Sidebar
                className="w-full h-full"
                forceCollapsed={true}
                onClose={() => setMobileSidebarOpen(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div
        className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "md:pl-20" : "md:pl-64"
        )}
      >
        {/* Mobile header with user profile and theme toggle */}
        <header className={cn(
          "sticky top-0 z-30 flex h-16 items-center justify-between gap-4 px-4 md:hidden",
          "bg-[#0A0A1F]"
        )}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSidebarOpen(true)}
            className="text-gray-400 hover:text-white hover:bg-purple-400/10"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex-1" />
          {/* User profile and theme toggle - same as desktop topbar */}
          <DashboardTopbar />
        </header>

        {/* Top bar with user profile - Desktop */}
        <div className={cn(
          "hidden md:block sticky top-0 z-30 h-16 bg-[#0A0A1F]"
        )}>
          <div className="flex h-full items-center justify-end px-6">
            <DashboardTopbar />
          </div>
        </div>

        {/* Page content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
