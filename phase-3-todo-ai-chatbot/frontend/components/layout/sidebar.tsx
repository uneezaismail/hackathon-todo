'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ListTodo,
  Settings,
  LogOut,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from 'lucide-react'
import { useSession } from '@/lib/auth-client'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'All Tasks', href: '/dashboard/tasks', icon: ListTodo },
  // AI Chat removed from sidebar per user requirement - accessible via /chat URL or Global FAB
  // { name: 'AI Chat', href: '/chat', icon: MessageSquare },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

interface SidebarProps {
  className?: string
  forceCollapsed?: boolean
  onClose?: () => void
}

export function Sidebar({ className, forceCollapsed = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [internalCollapsed, setInternalCollapsed] = React.useState(false)

  const collapsed = forceCollapsed || internalCollapsed

  // Load collapsed state from localStorage
  React.useEffect(() => {
    if (!forceCollapsed) {
      const saved = localStorage.getItem('sidebar-collapsed')
      if (saved) {
        setInternalCollapsed(saved === 'true')
      }
    }
  }, [forceCollapsed])

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    if (forceCollapsed) return
    const newState = !internalCollapsed
    setInternalCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', String(newState))
    window.dispatchEvent(new Event('storage'))
  }

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
        'fixed left-0 top-0 h-full transition-all duration-300 ease-in-out z-40',
        'bg-[#0b1121] backdrop-blur-xl border-r border-white/5 shadow-[4px_0_24px_rgba(0,0,0,0.2)]',
        collapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo and Toggle */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/5 bg-[#0b1121]/50">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-cyan shadow-[0_0_15px_rgba(0,229,204,0.3)] transition-transform group-hover:scale-105">
                <CheckCircle2 className="h-5 w-5 text-brand-navy" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight group-hover:text-[#00d4b8] transition-colors">TaskFlow</span>
            </Link>
          )}
          {collapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-cyan shadow-[0_0_15px_rgba(0,229,204,0.3)] mx-auto hover:scale-105 transition-transform">
              <CheckCircle2 className="h-5 w-5 text-brand-navy" />
            </div>
          )}
          
          {/* Show toggle button only if not forced collapsed */}
          {!forceCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapsed}
              className={cn(
                'text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all h-8 w-8',
                collapsed && 'absolute right-2'
              )}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 px-3 py-6">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden',
                  isActive
                    ? 'bg-[#00d4b8]/10 text-[#00d4b8]'
                    : 'text-white/60 hover:bg-white/5 hover:text-white',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? item.name : undefined}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00d4b8] rounded-r-full shadow-[0_0_10px_#00d4b8]" />
                )}
                <item.icon className={cn("h-5 w-5 flex-shrink-0 transition-colors", isActive ? "text-[#00d4b8]" : "group-hover:text-[#00d4b8]")} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="border-t border-white/5 p-4 space-y-3 bg-[#0b1121]/50">
          {!collapsed ? (
            <>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#0f1729] border border-white/5 group hover:border-[#00d4b8]/30 transition-all cursor-default">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00d4b8]/10 text-[#00d4b8] font-bold text-sm border border-[#00d4b8]/20 group-hover:bg-[#00d4b8] group-hover:text-[#0b1121] transition-all">
                  {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate group-hover:text-[#00d4b8] transition-colors">
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="text-xs text-white/40 truncate">
                    {session?.user?.email || 'user@example.com'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle className="flex-1 bg-[#0f1729] border border-white/5 hover:border-white/20 text-white/60 hover:text-white" />
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  className="flex-1 justify-start gap-2 text-white/60 hover:text-red-400 hover:bg-red-400/10 transition-all bg-[#0f1729] border border-white/5 hover:border-red-400/20"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-xs">Sign Out</span>
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00d4b8]/10 text-[#00d4b8] font-bold text-sm border border-[#00d4b8]/20 hover:bg-[#00d4b8] hover:text-[#0b1121] transition-all cursor-default">
                {session?.user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <ThemeToggle className="h-9 w-9" />
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="icon"
                className="text-white/60 hover:text-red-400 hover:bg-red-400/10 h-9 w-9"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
