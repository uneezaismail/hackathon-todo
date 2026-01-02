# Quickstart: Modern UI Redesign with Dual-Theme Support

**Feature**: Modern UI Redesign with Dual-Theme Support (008-ui-redesign-modern)
**Date**: 2025-12-31
**Phase**: 1 - Research Complete

---

## Getting Started

This quickstart guide helps you implement the modern UI redesign for the Todo AI Chatbot application (Phase 3). Follow these steps to set up the design system, implement the themes, and add animations.

### Prerequisites

1. **Install Dependencies**
```bash
npm install framer-motion lucide-react
npm install @radix-ui/react-slot @radix-ui/react-dropdown-menu
npm install @radix-ui/react-toast
npm install class-variance-authority
npm install clsx tailwind-merge
```

2. **Install shadcn Components**
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add toast
npx shadcn@latest add skeleton
npx shadcn@latest add avatar
npx shadcn@latest add badge
npx shadcn@latest add sheet
npx shadcn@latest add separator
npx shadcn@latest add chart        # Dashboard charts with recharts
npx shadcn@latest add sidebar      # Collapsible sidebar
```

3. **Add Icons & Chart Library**
```bash
npm install lucide-react
npm install recharts              # Required by shadcn chart component
```

### Design System Setup

#### 1. Update tailwind.config.js

Add EXACT design tokens from reference images:

```javascript
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Light Mode (LinkedIn Wrapped 2025) - EXACT colors
        light: {
          background: '#FFFFFF',
          foreground: '#1F2937',
          card: '#FFFFFF',
          muted: '#F1F5F9',
          border: '#E5E7EB',
          primary: '#7C3AED',
          secondary: '#C4B5FD',
          accent: '#A855F7',
          text: {
            primary: '#1F2937',
            secondary: '#475569',
            muted: '#64748B',
          },
        },
        // Dark Mode (Regulatis AI Dashboard 2025) - EXACT from dark-lavander.png
        dark: {
          background: '#0A0A1F',      // Main background (dark navy/purple)
          card: '#141428',            // Card/widget backgrounds (dark blue-grey)
          elevated: '#1A1A32',        // Elevated elements
          muted: '#1E293B',           // Muted backgrounds
          border: 'rgba(168, 85, 247, 0.2)',  // Semi-transparent purple borders
          borderSubtle: 'rgba(255, 255, 255, 0.05)',  // Very subtle white borders
          purpleLight: '#8B5CF6',     // Light purple for accents
          purpleMedium: '#A855F7',    // Medium purple (primary)
          purpleDark: '#C084FC',      // Darker purple for highlights
          primary: '#A855F7',
          secondary: '#C4B5FD',
          accent: '#A855F7',
          text: {
            primary: '#FFFFFF',
            secondary: '#E0E7FF',     // Light purple tint
            muted: '#94A3B8',
          },
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #C084FC 100%)',
        'gradient-hero': 'linear-gradient(135deg, #A855F7 0%, #C084FC 100%)',
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.5s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0)', opacity: '0.6' },
          '50%': { transform: 'scale(1.1)', opacity: '0.3' },
          '100%': { transform: 'scale(1.2)', opacity: '0' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '200% 0%' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '300ms',
        'slow': '500ms',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

#### 2. Create Theme Context

Create `context/ThemeContext.tsx`:

```typescript
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(savedTheme)
    }
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
```

### Initial Loader Animation

Create `components/initial-loader.tsx`:

```typescript
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'

export function InitialLoader({ show }: { show: boolean }) {
  const { theme } = useTheme()

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 flex items-center justify-center bg-background dark:bg-gray-900 z-50"
        >
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -5 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative"
          >
            {/* Logo */}
            <motion.svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="relative z-10"
            >
              <motion.path
                d="M9 11l3 3L22 4"
                stroke={theme === 'dark' ? '#A855F7' : '#7C3AED'}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
              />
              <motion.path
                d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
                stroke={theme === 'dark' ? '#A855F7' : '#7C3AED'}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: 0.3, ease: 'easeInOut' }}
              />
            </motion.svg>

            {/* Pulse Rings */}
            {[0, 1].map((i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                style={{
                  borderColor: theme === 'dark' ? '#A855F7' : '#7C3AED',
                  width: 80 + i * 40,
                  height: 80 + i * 40,
                }}
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{
                  scale: [1, 1.2, 1.3],
                  opacity: [0.6, 0.3, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeOut',
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

### Skeleton Loading States

Create `components/skeleton-loading.tsx`:

```typescript
'use client'

import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  height?: string
  width?: string
}

export function Skeleton({ className = '', height = 'h-16', width = 'w-full' }: SkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-lg ${height} ${width} ${className} animate-shimmer bg-[length:200%_100%]`}
    />
  )
}

export function TaskListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
        >
          <Skeleton height="h-20" width="w-full" />
        </motion.div>
      ))}
    </div>
  )
}

export function AnalyticsCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-slate-100 dark:bg-gray-800 rounded-lg p-6 h-48 w-full"
    >
      <div className="space-y-4">
        <Skeleton height="h-4" width="w-1/2" />
        <Skeleton height="h-8" width="w-3/4" />
        <div className="flex justify-between items-center mt-auto">
          <Skeleton height="h-4" width="w-24" />
          <Skeleton height="h-4" width="w-20" />
        </div>
      </div>
    </motion.div>
  )
}
```

### Common Animation Patterns

#### Fade In Animation
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content here
</motion.div>
```

#### Staggered List Animation
```typescript
{items.map((item, i) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: i * 0.1 }}
  >
    {item.content}
  </motion.div>
))}
```

#### Button Hover Effect
```typescript
<motion.button
  whileHover={{
    scale: 1.02,
    boxShadow: '0 10px 20px rgba(124, 58, 237, 0.3)'
  }}
  whileTap={{ scale: 0.98 }}
  className="px-6 py-3 bg-primary text-white rounded-lg"
>
  Click Me
</motion.button>
```

### Dashboard Components

#### 3D Perspective Grid Background

Create `components/grid-background-3d.tsx`:

```typescript
'use client'

import { useEffect, useRef } from 'react'

export function GridBackground3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      drawGrid()
    }

    const drawGrid = () => {
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)

      // Grid parameters
      const spacing = 40
      const lineColor = 'rgba(139, 92, 246, 0.3)' // Purple
      const curvature = 0.15

      ctx.strokeStyle = lineColor
      ctx.lineWidth = 1

      // Vertical lines with pincushion distortion
      for (let x = 0; x <= width; x += spacing) {
        const normalizedX = (x / width - 0.5) * 2
        ctx.beginPath()

        for (let y = 0; y <= height; y += 5) {
          const normalizedY = y / height
          const curveFactor = (normalizedY - 0.5) * 2
          const horizontalOffset = curvature * width * 0.12 * curveFactor * Math.abs(normalizedX)

          if (y === 0) {
            ctx.moveTo(x + horizontalOffset, y)
          } else {
            ctx.lineTo(x + horizontalOffset, y)
          }
        }
        ctx.stroke()
      }

      // Horizontal lines
      for (let y = 0; y <= height; y += spacing) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: 'transparent' }}
      />
    </div>
  )
}
```

#### Hero Section Component

Create `components/landing/hero-section.tsx`:

```typescript
'use client'

import { motion } from 'framer-motion'
import { GridBackground3D } from '@/components/grid-background-3d'
import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="relative min-h-[500px] sm:min-h-[600px] lg:min-h-[650px] flex items-start justify-center overflow-hidden bg-dark-background pt-28 sm:pt-32 lg:pt-36">
      {/* 3D Perspective Grid Background */}
      <GridBackground3D />

      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-5xl">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full bg-white/5 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-purple-300 border border-purple-500/20 mb-4 sm:mb-6"
        >
          <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400" />
          <span className="whitespace-nowrap">AI-Powered Task Management</span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-3 sm:mb-4 leading-tight tracking-tight px-2"
        >
          <span className="text-white block mb-1 sm:mb-2">
            Make Task
          </span>
          <span className="text-white block">
           Management Effortless
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-sm sm:text-base md:text-lg text-gray-400 max-w-xl sm:max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4"
        >
          AI-powered productivity. Natural language commands. Zero busywork.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex justify-center mb-8 sm:mb-10 lg:mb-12"
        >
          <Link href="/sign-up">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group px-6 py-3 sm:px-8 sm:py-4 rounded-lg sm:rounded-xl bg-white text-dark-background font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-2 text-base sm:text-lg"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
```

#### Stat Card Widget

Create `components/dashboard/stat-card.tsx`:

```typescript
'use client'

import { motion } from 'framer-motion'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  value: number | string
  label: string
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    value: string
  }
  icon: LucideIcon
  delay?: number
}

export function StatCard({ value, label, trend, icon: Icon, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{
        scale: 1.02,
        boxShadow: '0 20px 40px rgba(168, 85, 247, 0.25)',
      }}
      className="relative group"
    >
      {/* Glassmorphism Card */}
      <div className="bg-white/80 dark:bg-[#141428]/80 backdrop-blur-md border border-gray-200 dark:border-[rgba(168,85,247,0.2)] rounded-xl p-6 transition-all duration-300">
        {/* Icon */}
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-gradient-primary rounded-lg">
            <Icon className="w-6 h-6 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${
              trend.direction === 'up' ? 'text-green-500' :
              trend.direction === 'down' ? 'text-red-500' :
              'text-gray-500'
            }`}>
              {trend.direction === 'up' ? <TrendingUp className="w-4 h-4" /> :
               trend.direction === 'down' ? <TrendingDown className="w-4 h-4" /> : null}
              <span className="font-medium">{trend.value}</span>
            </div>
          )}
        </div>

        {/* Value */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: delay + 0.2 }}
          className="text-4xl font-bold text-gray-900 dark:text-white mb-2"
        >
          {value}
        </motion.div>

        {/* Label */}
        <div className="text-sm text-gray-600 dark:text-dark-text-muted">
          {label}
        </div>
      </div>
    </motion.div>
  )
}
```

#### Chart Widget (shadcn)

Create `components/dashboard/chart-widget.tsx`:

```typescript
'use client'

import { motion } from 'framer-motion'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ChartWidgetProps {
  title: string
  data: Array<Record<string, string | number>>
  xAxisKey: string
  yAxisKey: string
  delay?: number
}

export function ChartWidget({ title, data, xAxisKey, yAxisKey, delay = 0 }: ChartWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="bg-white/80 dark:bg-[#141428]/80 backdrop-blur-md border-gray-200 dark:border-[rgba(168,85,247,0.2)]">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8} />
                  <stop offset="50%" stopColor="#A855F7" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#C084FC" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey={xAxisKey}
                stroke="#94A3B8"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#94A3B8"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141428',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey={yAxisKey}
                stroke="#A855F7"
                strokeWidth={2}
                fill="url(#colorGradient)"
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}
```

### Glassmorphism Styles

Add to `globals.css`:

```css
/* Glassmorphism Base */
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.dark .glass-card {
  background: rgba(20, 20, 40, 0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(168, 85, 247, 0.2);
}

/* Glassmorphism with Purple Glow */
.glass-card-purple {
  background: rgba(168, 85, 247, 0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(168, 85, 247, 0.2);
  box-shadow: 0 8px 32px rgba(168, 85, 247, 0.1);
}

.dark .glass-card-purple {
  background: rgba(20, 20, 40, 0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(168, 85, 247, 0.2);
  box-shadow: 0 8px 32px rgba(168, 85, 247, 0.15);
}

/* Hover Glow Effect */
.glow-hover:hover {
  box-shadow: 0 20px 40px rgba(168, 85, 247, 0.25);
  transform: scale(1.02);
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Landing Page Layout

Create `app/page.tsx` (Landing page with multiple sections):

```typescript
'use client'

import { motion } from 'framer-motion'
import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { HowItWorksSection } from '@/components/landing/how-it-works-section'
import { CTASection } from '@/components/landing/cta-section'
import { LandingHeader } from '@/components/layout/landing-header'
import { LandingFooter } from '@/components/layout/landing-footer'

export default function Home() {
  return (
    <>
      <div className="min-h-screen bg-dark-background">
        <LandingHeader />
        <HeroSection />

        {/* Product Mockup Section - Half visible in hero */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 lg:-mt-24">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative max-w-6xl mx-auto"
          >
            {/* Glow Effects */}
            <div className="absolute -top-10 sm:-top-16 lg:-top-20 left-1/2 -translate-x-1/2 w-[300px] sm:w-[450px] lg:w-[600px] h-[150px] sm:h-[225px] lg:h-[300px] bg-purple-500/20 blur-3xl -z-10" />

            {/* Mockup Container */}
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-purple-500/30 bg-gradient-to-b from-purple-500/10 to-transparent p-0.5 sm:p-1 shadow-2xl shadow-purple-500/20">
              <div className="rounded-lg sm:rounded-xl bg-dark-background/90 backdrop-blur-xl p-4 sm:p-6 lg:p-8 min-h-[300px] sm:min-h-[400px] lg:min-h-[600px] flex items-center justify-center">
                {/* Product screenshot will be added here */}
              </div>
            </div>
          </motion.div>
        </section>

        {/* Extra spacing after mockup */}
        <div className="h-16 sm:h-24 lg:h-32" />
      </div>

      {/* New Sections */}
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />

      <LandingFooter />
    </>
  )
}
```

### Next Steps

1. **Set up the theme context** - Add ThemeProvider to your root layout
2. **Implement the initial loader** - Show loader during app initialization
3. **Create skeleton components** - Use them where content is loading
4. **Update existing pages** - Apply new design tokens and themes
5. **Test responsive design** - Verify mobile, tablet, desktop breakpoints
6. **Check accessibility** - Ensure WCAG AA contrast ratios

---

## Branding

### Website Name Options

1. **TaskFlow AI** - Emphasizes workflow and AI integration
2. **FlowTasks** - Simple, memorable, action-oriented
3. **Nexus Tasks** - Modern, connected, intelligent
4. **PulseTask** - Active, energetic, alive
5. **Zenith Tasks** - Peak productivity, aspirational

**Recommended**: **TaskFlow AI** - Best balance of clarity, modernity, and purpose

### Logo Concept

Simple checkmark icon inside a rounded square:
- Checkmark represents task completion
- Square represents organization and structure
- Colors: Primary purple (#7C3AED) in light mode, brighter purple (#A855F7) in dark mode

---

## Resources

- [Framer Motion Docs](https://www.framer.com/motion)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [WCAG AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
