/**
 * Header Component
 *
 * Client Component that displays:
 * - Logo/brand name on left
 * - Auth buttons (Sign In, Get Started) when not authenticated
 * - User menu with avatar when authenticated
 * - Responsive layout
 *
 * Features:
 * - Checks Better Auth session to determine authenticated state
 * - Conditionally renders auth buttons OR user menu
 * - Sticky header with backdrop blur
 *
 * @task T095: Update Header component to conditionally show user menu or auth buttons
 * @task T096: Add session check in Header to determine authenticated state
 */

'use client'

import Link from 'next/link'
import { CheckCircle2, Menu } from 'lucide-react'
import { useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import UserMenu from '@/components/layout/user-menu'
import { useState } from 'react'

export default function Header() {
  // T096: Add session check to determine authenticated state
  const { data: session, isPending } = useSession()
  const isAuthenticated = !isPending && session?.user
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Todo App</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              // Show Dashboard link + user menu when authenticated - desktop only
              <div className="hidden md:flex items-center gap-4">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <UserMenu />
              </div>
            ) : (
              // Show auth buttons when not authenticated - desktop only
              <div className="hidden md:flex items-center gap-2 sm:gap-4">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-sm font-medium"
                >
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="text-sm font-medium"
                >
                  <Link href="/sign-up">Get Started</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu - Always show hamburger icon on small screens */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open mobile menu"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  {isAuthenticated ? (
                    <>
                      <Button
                        asChild
                        variant="default"
                        size="lg"
                        className="w-full"
                      >
                        <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                          Go to Dashboard
                        </Link>
                      </Button>
                      <div className="border-t pt-4 mt-2">
                        <UserMenu />
                      </div>
                    </>
                  ) : (
                    <>
                      <Button
                        asChild
                        variant="ghost"
                        size="lg"
                        className="w-full justify-start"
                      >
                        <Link href="/sign-in" onClick={() => setIsOpen(false)}>
                          Sign In
                        </Link>
                      </Button>
                      <Button
                        asChild
                        size="lg"
                        className="w-full"
                      >
                        <Link href="/sign-up" onClick={() => setIsOpen(false)}>
                          Get Started
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
