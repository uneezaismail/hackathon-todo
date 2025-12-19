'use client'

import * as React from 'react'
import Link from 'next/link'
import { CheckCircle2, Github, Twitter, Linkedin } from 'lucide-react'
import { useSession } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

interface FooterProps {
  className?: string
}

export function Footer({ className }: FooterProps) {
  const { data: session, isPending } = useSession()
  const isAuthenticated = !isPending && session?.user
  const currentYear = new Date().getFullYear()

  return (
    <footer
      className={cn(
        'w-full border-t border-white/5 bg-[#020617] py-12',
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00d4b8] border-2 border-[#00d4b8]/50 shadow-[0_0_20px_rgba(0,212,184,0.4)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,212,184,0.6)] hover:scale-110">
                <CheckCircle2 className="h-5 w-5 text-[#0f1729]" />
              </div>
              <span className="text-lg font-bold text-white">TaskFlow</span>
            </Link>
            <p className="mb-4 max-w-md text-sm text-white/70">
              Organize your work and life with our intuitive task management
              app. Stay productive and achieve your goals with ease.
            </p>
            <div className="flex gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition-all duration-300 hover:border-[#00d4b8]/50 hover:bg-[#00d4b8]/10 hover:text-[#00d4b8] hover:shadow-[0_0_15px_rgba(0,212,184,0.2)]"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition-all duration-300 hover:border-[#00d4b8]/50 hover:bg-[#00d4b8]/10 hover:text-[#00d4b8] hover:shadow-[0_0_15px_rgba(0,212,184,0.2)]"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition-all duration-300 hover:border-[#00d4b8]/50 hover:bg-[#00d4b8]/10 hover:text-[#00d4b8] hover:shadow-[0_0_15px_rgba(0,212,184,0.2)]"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="#features"
                  className="text-white/70 transition-all duration-200 hover:text-[#00d4b8] hover:translate-x-1"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#how-it-works"
                  className="text-white/70 transition-all duration-200 hover:text-[#00d4b8] hover:translate-x-1"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-white/70 transition-all duration-200 hover:text-[#00d4b8] hover:translate-x-1"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Account</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={isAuthenticated ? '/dashboard' : '/sign-up'}
                  className="text-white/70 transition-all duration-200 hover:text-[#00d4b8] hover:translate-x-1"
                >
                  Sign Up
                </Link>
              </li>
              <li>
                <Link
                  href={isAuthenticated ? '/dashboard' : '/sign-in'}
                  className="text-white/70 transition-all duration-200 hover:text-[#00d4b8] hover:translate-x-1"
                >
                  Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t-2 border-[#00d4b8]/10 pt-8 text-center text-sm text-white/60">
          <p>
            &copy; {currentYear} TaskFlow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
