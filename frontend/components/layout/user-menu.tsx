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
          className="relative h-10 w-10 rounded-full"
          aria-label="User menu"
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
