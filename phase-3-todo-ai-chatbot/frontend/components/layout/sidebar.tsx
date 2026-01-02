/**
 * Dashboard Sidebar Component
 *
 * Features:
 * - Minimal 80px width design
 * - Circular icons with lavender/purple colors
 * - Supports collapsed state (icons only with tooltips)
 * - Glow effect on active state
 */

'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ListTodo,
  Settings,
  LogOut,
  Calendar,
  BarChart3
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'All Tasks', href: '/dashboard/tasks', icon: ListTodo },
  { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

interface SidebarProps {
  className?: string
  forceCollapsed?: boolean
  onClose?: () => void
}

export function Sidebar({ className, forceCollapsed = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null)

  const handleSignOut = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = '/sign-in'
          },
          onError: (ctx) => {
            console.error('Sign out error:', ctx.error)
            window.location.href = '/sign-in'
          }
        }
      })
    } catch (error) {
      console.error('Sign out error:', error)
      window.location.href = '/sign-in'
    }
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-full',
        'bg-[#1a1a2e] border-r border-[#2a2a3e]',
        'transition-all duration-300',
        className
      )}
    >
      <div className={cn(
        "flex flex-col h-full py-6 transition-all duration-300",
        forceCollapsed ? "items-center" : "items-start px-4"
      )}>
        {/* Logo */}
        <Link href="/dashboard" className={cn(
          "mb-8 flex-shrink-0 transition-all duration-300",
          forceCollapsed ? "" : "ml-2"
        )}>
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full",
            "bg-gradient-to-br from-purple-400 to-purple-300",
            "shadow-lg shadow-purple-400/30 hover:shadow-purple-400/50",
            "transition-all duration-300 hover:scale-110"
          )}>
            <span className="text-2xl font-bold text-white">T</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 flex flex-col gap-3 w-full transition-all duration-300",
          forceCollapsed ? "px-3" : "px-0"
        )}>
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            const isHovered = hoveredItem === item.name

            return (
              <div
                key={item.name}
                className={cn(
                  "relative flex",
                  forceCollapsed ? "justify-center" : "justify-start"
                )}
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-300 rounded-r-full shadow-[0_0_10px_rgba(192,132,252,0.6)]"
                  />
                )}

                {/* Tooltip - only show when collapsed */}
                {isHovered && forceCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 rounded-lg bg-[#2a2a3e] text-white text-sm font-medium whitespace-nowrap z-50 shadow-lg border border-[#3a3a4e]"
                  >
                    {item.name}
                  </motion.div>
                )}

                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 transition-all duration-200 group',
                    forceCollapsed
                      ? 'h-12 w-12 rounded-full justify-center'
                      : 'h-12 px-4 rounded-lg w-full',
                    isActive
                      ? 'bg-purple-400/20 text-purple-300 shadow-[0_0_15px_rgba(192,132,252,0.4)]'
                      : 'text-gray-400 hover:bg-purple-400/10 hover:text-purple-300'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!forceCollapsed && (
                    <span className="text-sm font-medium whitespace-nowrap">
                      {item.name}
                    </span>
                  )}
                </Link>
              </div>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div
          className={cn(
            "relative flex mt-auto",
            forceCollapsed ? "justify-center" : "justify-start w-full"
          )}
          onMouseEnter={() => setHoveredItem('Sign Out')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          {/* Tooltip - only show when collapsed */}
          {hoveredItem === 'Sign Out' && forceCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 rounded-lg bg-[#2a2a3e] text-white text-sm font-medium whitespace-nowrap z-50 shadow-lg border border-[#3a3a4e]"
            >
              Sign Out
            </motion.div>
          )}

          <Button
            onClick={handleSignOut}
            variant="ghost"
            size={forceCollapsed ? "icon" : "default"}
            className={cn(
              "bg-purple-400/10 text-purple-300",
              "hover:bg-purple-400/20 hover:text-purple-200",
              "transition-all duration-200",
              forceCollapsed
                ? "h-12 w-12 rounded-full"
                : "h-12 w-full rounded-lg justify-start gap-3 px-4"
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!forceCollapsed && (
              <span className="text-sm font-medium whitespace-nowrap">
                Sign Out
              </span>
            )}
          </Button>
        </div>
      </div>
    </aside>
  )
}
