'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CTASectionProps {
  className?: string
}

export function CTASection({ className }: CTASectionProps) {
  const { data: session, isPending } = useSession()
  const isAuthenticated = !isPending && session?.user

  return (
    <section
      className={cn(
        'relative py-20 md:py-32',
        'bg-[#0f1729] border-t border-white/5',
        className
      )}
    >
      {/* Decorative radial glow at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-linear-to-r from-transparent via-[#00d4b8]/50 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-[#00d4b8]/5 blur-3xl" />

      <div className="container mx-auto px-4">
        <div
          className={cn(
            'relative mx-auto max-w-4xl overflow-hidden rounded-3xl',
            'border-2 border-[#00d4b8]/30 bg-[#131929]/95',
            'p-12 text-center backdrop-blur-md md:p-16',
            'shadow-[0_0_60px_rgba(0,212,184,0.2)]',
            'transition-all duration-500',
            'hover:border-[#00d4b8]/50 hover:shadow-[0_0_80px_rgba(0,212,184,0.3)]'
          )}
        >
          {/* Decorative glow - enhanced cyan theme */}
          <div className="absolute -left-24 -top-24 h-48 w-48 rounded-full bg-[#00d4b8]/25 blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-[#8b5cf6]/20 blur-3xl animate-pulse [animation-delay:1s]" />

          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="h-full w-full" style={{
              backgroundImage: 'linear-gradient(#00d4b8 1px, transparent 1px), linear-gradient(90deg, #00d4b8 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }} />
          </div>

          {/* Content */}
          <div className="relative z-10">
            <h2
              className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl"
              style={{
                textShadow: '0 0 30px rgba(0, 229, 204, 0.3)',
              }}
            >
              Start Accomplishing More Today
            </h2>
            <p className="mb-8 text-lg text-white/80 md:text-xl">
              Join users who are conquering their to-do lists and achieving their goals with smart task management.
            </p>
            <Link href={isAuthenticated ? '/dashboard' : '/sign-up'}>
              <Button
                size="lg"
                className={cn(
                  'group relative h-14 bg-[#00d4b8] px-10 text-lg font-semibold text-[#0f1729]',
                  'border-2 border-[#00d4b8]/50',
                  'hover:bg-[#00e5cc] hover:border-[#00e5cc] hover:shadow-[0_0_30px_rgba(0,212,184,0.6)]',
                  'transition-all duration-300 rounded-lg',
                  'active:scale-95'
                )}
              >
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <p className="mt-6 text-sm text-white/60">
              Free forever • No credit card required • Start in 30 seconds
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
