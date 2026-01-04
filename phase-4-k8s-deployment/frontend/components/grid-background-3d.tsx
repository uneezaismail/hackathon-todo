'use client'

import { useEffect, useState } from 'react'

interface GridBackground3DProps {
  className?: string
}

export function GridBackground3D({ className = '' }: GridBackground3DProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    // Detect theme from HTML element
    const htmlElement = document.documentElement
    const currentTheme = htmlElement.classList.contains('dark') ? 'dark' : 'light'
    setTheme(currentTheme)

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      const newTheme = htmlElement.classList.contains('dark') ? 'dark' : 'light'
      setTheme(newTheme)
    })

    observer.observe(htmlElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  // Theme-aware colors
  const gridColor = theme === 'dark'
    ? 'rgba(168, 85, 247, 0.08)'  // Purple for dark mode
    : 'rgba(124, 58, 237, 0.06)'   // Purple for light mode

  const dotColor = theme === 'dark'
    ? 'rgba(168, 85, 247, 0.15)'   // Brighter dots for dark
    : 'rgba(124, 58, 237, 0.12)'   // Subtle dots for light

  const glowColor = theme === 'dark'
    ? 'rgba(139, 92, 246, 0.08)'   // Purple glow dark
    : 'rgba(124, 58, 237, 0.04)'   // Lighter glow for light

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} style={{ zIndex: 0 }}>
      {/* Dot Grid Pattern - Modern subtle dots */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `
            radial-gradient(circle, ${dotColor} 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
          backgroundPosition: '0 0, 16px 16px',
        }}
      />

      {/* Line Grid Pattern - Subtle lines for structure */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `
            linear-gradient(to right, ${gridColor} 1px, transparent 1px),
            linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Center glow - subtle focal point */}
      <div
        className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-3xl pointer-events-none"
        style={{
          background: `radial-gradient(ellipse, ${glowColor}, transparent 70%)`,
        }}
      />

      {/* Gradient fade to background at edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: theme === 'dark'
            ? `
              linear-gradient(to bottom, rgba(10, 10, 31, 0) 0%, rgba(10, 10, 31, 0.5) 70%, rgba(10, 10, 31, 1) 100%),
              linear-gradient(to right, rgba(10, 10, 31, 0.8) 0%, rgba(10, 10, 31, 0) 10%, rgba(10, 10, 31, 0) 90%, rgba(10, 10, 31, 0.8) 100%)
            `
            : `
              linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.5) 70%, rgba(255, 255, 255, 1) 100%),
              linear-gradient(to right, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 10%, rgba(255, 255, 255, 0) 90%, rgba(255, 255, 255, 0.8) 100%)
            `
        }}
      />

      {/* Top fade - ensures text is always readable */}
      <div
        className="absolute inset-x-0 top-0 h-32 pointer-events-none"
        style={{
          background: theme === 'dark'
            ? 'linear-gradient(to bottom, rgba(10, 10, 31, 0.95) 0%, rgba(10, 10, 31, 0.6) 50%, transparent 100%)'
            : 'linear-gradient(to bottom, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%)'
        }}
      />
    </div>
  )
}
