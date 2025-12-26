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
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0f1729]/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">TaskFlow</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-6">
              {/* Always show Features and How It Works links */}
              {/* <Link
                href="/#features"
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
              >
                Features
              </Link>
              <Link
                href="/#how-it-works"
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
              >
                How It Works
              </Link> */}

              {isAuthenticated ? (
                // Show user menu when authenticated
                <UserMenu />
              ) : (
                // Show auth buttons when not authenticated
                <div className="flex items-center gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="text-sm font-medium border-2 border-[#00d4b8] bg-transparent text-[#00d4b8] hover:bg-[#00d4b8]/10 hover:text-[#00d4b8] transition-all duration-300"
                  >
                    <Link href="/sign-in">Sign In</Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="text-sm font-semibold bg-[#00d4b8] text-[#0f1729] hover:bg-[#00e5cc] hover:shadow-[0_0_20px_rgba(0,212,184,0.5)] transition-all duration-300"
                  >
                    <Link href="/sign-up">Get Started</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu - Always show hamburger icon on small screens */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open mobile menu"
                  suppressHydrationWarning
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-75 sm:w-100">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  {/* Always show Features and How It Works in mobile menu */}
                  <Button
                    asChild
                    variant="ghost"
                    size="lg"
                    className="w-full justify-start"
                  >
                    <Link href="/#features" onClick={() => setIsOpen(false)}>
                      Features
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    size="lg"
                    className="w-full justify-start"
                  >
                    <Link href="/#how-it-works" onClick={() => setIsOpen(false)}>
                      How It Works
                    </Link>
                  </Button>

                  {isAuthenticated ? (
                    <UserMenu />
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
