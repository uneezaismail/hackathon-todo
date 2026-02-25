'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
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
  delay?: number
}

export function StatCard({
  title,
  value,
  iconName,
  description,
  trend,
  delay = 0
}: StatCardProps) {
  const Icon = iconMap[iconName]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        'group relative rounded-2xl p-6 overflow-hidden',
        'border transition-all duration-300',
        'dark:bg-[#1a1a2e] dark:border-[#2a2a3e]',
        'light:bg-white light:border-[#e5e5ea]',
        'hover:shadow-lg',
        'dark:hover:shadow-purple-500/10',
        'light:hover:shadow-purple-500/5'
      )}
    >
      {/* Content */}
      <div className="relative z-10">
        {/* Header with icon and trend */}
        <div className="flex items-center justify-between mb-4">
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl',
              'bg-purple-600/10',
              'dark:bg-purple-600/10',
              'light:bg-purple-50',
              'transition-all duration-300'
            )}
          >
            <Icon className={cn(
              "h-6 w-6",
              "text-purple-500",
              "dark:text-purple-400",
              "light:text-purple-600"
            )} />
          </div>
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold',
                'bg-purple-500/10 text-purple-600 border border-purple-500/20',
                'dark:text-purple-400 dark:border-purple-500/20',
                'light:text-purple-700 light:bg-purple-50 light:border-purple-200'
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
        <h3 className={cn(
          "text-sm font-medium mb-2 uppercase tracking-wide",
          "text-gray-500",
          "dark:text-gray-400",
          "light:text-gray-600"
        )}>
          {title}
        </h3>

        {/* Value */}
        <div className={cn(
          "text-4xl font-bold mb-1 transition-colors",
          "dark:text-white",
          "light:text-gray-900"
        )}>
          {value.toLocaleString()}
        </div>

        {/* Description */}
        {description && (
          <p className={cn(
            "text-xs mt-2 leading-relaxed",
            "text-gray-500",
            "dark:text-gray-400",
            "light:text-gray-600"
          )}>
            {description}
          </p>
        )}
      </div>
    </motion.div>
  )
}
