'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface GeometricBackgroundProps {
  className?: string
  children?: React.ReactNode
}

export function GeometricBackground({
  className,
  children,
}: GeometricBackgroundProps) {
  return (
    <div className={cn('relative min-h-screen overflow-hidden bg-[#020617]', className)}>
      {/* Subtle cyan gradient overlay - Top only for Hero */}
      <div className="absolute top-0 left-0 right-0 h-[800px] bg-linear-to-b from-[#00d4b8]/5 via-transparent to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
