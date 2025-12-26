'use client'

import * as React from 'react'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ListTodo,
  LucideIcon,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

const iconMap: Record<string, LucideIcon> = {
  ListTodo,
  CheckCircle2,
  Clock,
  AlertCircle,
}

interface StatCardProps {
  title: string
  value: number
  iconName: keyof typeof iconMap
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  iconColor?: string
  iconBgColor?: string
}

export function StatCard({
  title,
  value,
  iconName,
  description,
  trend,
  iconColor = 'text-[#00d4b8]',
  iconBgColor = 'bg-[#00d4b8]/10'
}: StatCardProps) {
  const Icon = iconMap[iconName]

  return (
    <div
      className={cn(
        'group relative rounded-2xl p-6 overflow-hidden',
        'bg-[#131929]/40 border-2 border-[#00d4b8]/20',
        'backdrop-blur-md transition-all duration-300',
        'hover:bg-[#131929]/60 hover:border-[#00d4b8]/40',
        'hover:shadow-[0_0_30px_rgba(0,212,184,0.15)]',
        'hover:scale-105 transform'
      )}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00d4b8]/5 via-transparent to-[#00d4b8]/5 rounded-2xl" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header with icon and trend */}
        <div className="flex items-center justify-between mb-4">
          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-xl',
              iconBgColor,
              'border border-[#00d4b8]/30',
              'shadow-lg group-hover:shadow-[0_0_20px_rgba(0,212,184,0.3)]',
              'transition-all duration-300'
            )}
          >
            <Icon className={cn('h-7 w-7', iconColor)} />
          </div>
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium',
                trend.isPositive
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
          {title}
        </h3>

        {/* Value */}
        <div className="text-4xl font-bold text-foreground mb-1 transition-colors group-hover:text-[#00d4b8]">
          {value.toLocaleString()}
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-muted-foreground mt-2">
            {description}
          </p>
        )}
      </div>

      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#00d4b8]/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  )
}
