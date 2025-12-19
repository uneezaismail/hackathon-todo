'use client'

import * as React from 'react'
import { CheckCircle2, Zap, Shield, Rocket, Users, TrendingUp, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
  iconColor: string
  iconBg: string
}

const features: Feature[] = [
  {
    icon: CheckCircle2,
    title: 'Simple Task Management',
    description: 'Create, edit, and organize tasks with an intuitive interface. Focus on what matters most.',
    iconColor: 'text-brand-cyan',
    iconBg: 'bg-brand-cyan/20',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Instant updates and blazing fast performance. Your tasks are always up to date.',
    iconColor: 'text-brand-purple',
    iconBg: 'bg-brand-purple/20',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data is encrypted and secure. We respect your privacy always.',
    iconColor: 'text-brand-magenta',
    iconBg: 'bg-brand-magenta/20',
  },
  {
    icon: Users,
    title: 'Personal Workspace',
    description: 'Each user gets their own private workspace with complete data isolation.',
    iconColor: 'text-brand-cyan',
    iconBg: 'bg-brand-cyan/20',
  },
  {
    icon: Rocket,
    title: 'Smart Filtering',
    description: 'Filter tasks by status, priority, and due date to stay focused on what\'s important.',
    iconColor: 'text-brand-purple',
    iconBg: 'bg-brand-purple/20',
  },
  {
    icon: TrendingUp,
    title: 'Progress Tracking',
    description: 'Visualize your productivity with real-time statistics and completion rates.',
    iconColor: 'text-brand-magenta',
    iconBg: 'bg-brand-magenta/20',
  },
]

interface FeaturesProps {
  className?: string
}

export function Features({ className }: FeaturesProps) {
  return (
    <section
      id="features"
      className={cn(
        'relative py-20 md:py-32',
        'bg-[#0f1729] border-t border-white/5',
        className
      )}
    >
      {/* Decorative diagonal accent */}
      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-[#8b5cf6]/30 via-[#00d4b8]/40 to-[#ec4899]/30" />

      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2
            className="mb-4 text-4xl font-bold text-white md:text-5xl"
            style={{
              textShadow: '0 0 30px rgba(0, 229, 204, 0.3)',
            }}
          >
            Powerful Features
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-white/70">
            Everything you need to manage tasks efficiently in a beautiful,
            futuristic interface
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className={cn(
                'group relative rounded-2xl p-8',
                'border-2 bg-[#131929]/90',
                'backdrop-blur-md transition-all duration-500',
                'hover:bg-[#1a2332]/95',
                'hover:shadow-[0_0_50px_rgba(0,212,184,0.3)]',
                'hover:-translate-y-2',
                'overflow-hidden',
                // Different border colors per card
                index % 3 === 0 && 'border-[#00d4b8]/30 hover:border-[#00d4b8]/80',
                index % 3 === 1 && 'border-[#8b5cf6]/30 hover:border-[#8b5cf6]/80',
                index % 3 === 2 && 'border-[#ec4899]/30 hover:border-[#ec4899]/80'
              )}
            >
              {/* Animated gradient border on hover */}
              <div className={cn(
                'absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100',
                'bg-linear-to-br p-0.5',
                index % 3 === 0 && 'from-[#00d4b8] via-[#00d4b8]/50 to-transparent',
                index % 3 === 1 && 'from-[#8b5cf6] via-[#8b5cf6]/50 to-transparent',
                index % 3 === 2 && 'from-[#ec4899] via-[#ec4899]/50 to-transparent'
              )}>
                <div className="h-full w-full rounded-2xl bg-[#1a2332]/95" />
              </div>

              {/* Corner accent decorations */}
              {/* <div className="absolute top-0 right-0 w-20 h-20 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                <div className={cn(
                  'absolute top-0 right-0 w-full h-full',
                  'bg-gradient-to-bl rounded-2xl',
                  index % 3 === 0 && 'from-[#00d4b8]/30',
                  index % 3 === 1 && 'from-[#8b5cf6]/30',
                  index % 3 === 2 && 'from-[#ec4899]/30',
                  'to-transparent'
                )} />
              </div> */}

              {/* Subtle inner glow on hover */}
              <div className={cn(
                'absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100',
                'bg-linear-to-br to-transparent',
                index % 3 === 0 && 'from-[#00d4b8]/10 via-[#00d4b8]/5',
                index % 3 === 1 && 'from-[#8b5cf6]/10 via-[#8b5cf6]/5',
                index % 3 === 2 && 'from-[#ec4899]/10 via-[#ec4899]/5'
              )} />

              {/* Icon with enhanced design */}
              <div className="relative z-10 mb-6">
                <div className="relative inline-block">
                  {/* Icon glow effect */}
                  <div className={cn(
                    'absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-all duration-500',
                    index % 3 === 0 && 'bg-[#00d4b8]/40',
                    index % 3 === 1 && 'bg-[#8b5cf6]/40',
                    index % 3 === 2 && 'bg-[#ec4899]/40'
                  )} />

                  <div
                    className={cn(
                      'relative flex h-18 w-18 items-center justify-center rounded-2xl',
                      'border-2 transition-all duration-500',
                      'shadow-lg group-hover:shadow-2xl',
                      'group-hover:scale-110 group-hover:rotate-3',
                      feature.iconBg,
                      // Enhanced border colors
                      index % 3 === 0 && 'border-[#00d4b8]/20 group-hover:border-[#00d4b8]/60',
                      index % 3 === 1 && 'border-[#8b5cf6]/20 group-hover:border-[#8b5cf6]/60',
                      index % 3 === 2 && 'border-[#ec4899]/20 group-hover:border-[#ec4899]/60'
                    )}
                  >
                    {/* Inner gradient layer */}
                    <div className={cn(
                      'absolute inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                      'bg-linear-to-br',
                      index % 3 === 0 && 'from-[#00d4b8]/20',
                      index % 3 === 1 && 'from-[#8b5cf6]/20',
                      index % 3 === 2 && 'from-[#ec4899]/20',
                      'to-transparent'
                    )} />

                    <feature.icon className={cn(
                      'h-9 w-9 relative z-10 transition-all duration-500',
                      'group-hover:scale-110',
                      feature.iconColor
                    )} />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10">
                <h3 className="mb-3 text-xl font-semibold text-white transition-colors duration-300 group-hover:text-white">
                  {feature.title}
                </h3>
                <p className="text-white/70 leading-relaxed group-hover:text-white/80 transition-colors duration-300">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
