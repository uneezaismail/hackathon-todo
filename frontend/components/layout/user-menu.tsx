/**
 * User Menu Component
 *
 * Client Component that displays:
 * - User avatar with initials
 * - Dropdown menu with user info and logout option
 * - Click-outside to close dropdown
 *
 * Features:
 * - Avatar initials generation from user name (first + last)
 * - Dropdown menu using shadcn/ui DropdownMenu
 * - Logout functionality using Better Auth
 * - Proper loading and error states
 *
 * @task T091: Create user menu component
 * @task T092: Implement avatar initials generation
 * @task T093: Add dropdown menu with user info and logout
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import { toast } from 'sonner'
import { useSession, signOut } from '@/lib/auth-client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

/**
 * Generate user initials from name
 * Rules:
 * - First letter of first name + first letter of last name
 * - If only one name, use first letter
 * - If no name, use first letter of email
 * - Always uppercase
 *
 * @task T092: Implement avatar initials generation
 */
function getInitials(name: string | null | undefined, email?: string): string {
  if (!name || name.trim() === '') {
    // Fallback to email first letter if no name
    return email ? email.charAt(0).toUpperCase() : 'U'
  }

  const nameParts = name.trim().split(/\s+/)

  if (nameParts.length === 1) {
    // Single name: return first letter
    return nameParts[0].charAt(0).toUpperCase()
  }

  // Multiple names: first letter of first name + first letter of last name
  const firstInitial = nameParts[0].charAt(0).toUpperCase()
  const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase()

  return firstInitial + lastInitial
}

/**
 * User Menu Component
 *
 * @task T091: Create user menu component (Client Component)
 * @task T097: Implement click-outside to close dropdown (handled by Radix UI)
 */
export default function UserMenu() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Don't render if no session or loading
  if (isPending || !session?.user) {
    return null
  }

  const user = session.user
  const initials = getInitials(user.name, user.email)

  /**
   * Handle logout
   * @task T094: Implement logout Server Action (using Better Auth client)
   */
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)

      // Call Better Auth signOut
      const result = await signOut()

      if (result.error) {
        toast.error(`Failed to logout: ${result.error.message}`)
        setIsLoggingOut(false)
        return
      }

      // Success
      toast.success('Successfully logged out')

      // Redirect to landing page
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('An error occurred during logout. Please try again.')
      setIsLoggingOut(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full p-0 hover:bg-transparent group"
          aria-label="User menu"
        >
          <div className="relative">
            {/* Glow effect on hover */}
            <div className="absolute inset-0 rounded-full bg-[#00d4b8]/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Avatar with gradient border */}
            <div className="relative rounded-full p-[2px] bg-gradient-to-br from-[#00d4b8] via-[#8b5cf6] to-[#ec4899] group-hover:shadow-[0_0_20px_rgba(0,212,184,0.5)] transition-all duration-300">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-gradient-to-br from-[#00d4b8] to-[#00b8a3] text-[#0f1729] font-bold text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 border-2 border-[#00d4b8]/30 bg-[#131929]/98 backdrop-blur-xl shadow-[0_0_40px_rgba(0,212,184,0.2)]"
        align="end"
        forceMount
        sideOffset={8}
      >
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex items-center gap-3">
            {/* Avatar in dropdown */}
            <div className="rounded-full p-[2px] bg-gradient-to-br from-[#00d4b8] to-[#8b5cf6]">
              <div className="rounded-full bg-[#131929] p-2">
                <User className="h-5 w-5 text-[#00d4b8]" />
              </div>
            </div>

            {/* User info */}
            <div className="flex flex-col space-y-1 flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user.name || 'User'}
              </p>
              <p className="text-xs text-white/60 truncate">
                {user.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-white/10" />

        <div className="p-1">
          <DropdownMenuItem
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="cursor-pointer rounded-lg px-3 py-2.5 text-white/80 hover:text-white hover:bg-red-500/10 focus:bg-red-500/10 focus:text-white border-2 border-transparent hover:border-red-500/30 transition-all duration-200"
          >
            <LogOut className="mr-3 h-4 w-4 text-red-400" />
            <span className="font-medium">
              {isLoggingOut ? 'Logging out...' : 'Log out'}
            </span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
