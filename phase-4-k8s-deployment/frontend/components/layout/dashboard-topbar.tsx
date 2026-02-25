'use client'

import * as React from 'react'
import { useSession } from '@/lib/auth-client'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'

export function DashboardTopbar() {
  const { data: session } = useSession()

  const getInitials = (name: string | undefined | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
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
    <div className="flex items-center gap-4">
      {/* Theme Toggle - Hidden until website is complete */}
      <div className="hidden">
        <ThemeToggle />
      </div>

      {/* User Profile - Icon Only */}
      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full font-semibold text-sm cursor-pointer",
            "bg-gradient-to-br from-purple-400 to-purple-300 text-white",
            "shadow-md hover:shadow-lg transition-all",
            "hover:scale-110"
          )}>
            {getInitials(session?.user?.name)}
          </div>
        </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className={cn(
              "w-56 rounded-xl border p-2",
              "bg-[#1a1a2e] border-[#2a2a3e]",
              "shadow-xl"
            )}
          >
            <DropdownMenuLabel className="p-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full font-semibold text-sm",
                  "bg-gradient-to-br from-purple-400 to-purple-300 text-white"
                )}>
                  {getInitials(session?.user?.name)}
                </div>
                <div>
                  <p className="font-semibold text-white">{session?.user?.name || 'User'}</p>
                  <p className="text-xs text-gray-400 font-normal">{session?.user?.email || 'user@example.com'}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#2a2a3e]" />
            <DropdownMenuItem
              asChild
              className={cn(
                "cursor-pointer rounded-lg px-3 py-2 text-sm text-gray-300",
                "hover:bg-[#2a2a3e] hover:text-white",
                "focus:bg-[#2a2a3e] focus:text-white"
              )}
            >
              <Link href="/dashboard/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#2a2a3e]" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className={cn(
                "cursor-pointer rounded-lg px-3 py-2 text-sm text-gray-300",
                "hover:bg-[#2a2a3e] hover:text-white",
                "focus:bg-[#2a2a3e] focus:text-white"
              )}
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
    </div>
  )
}
