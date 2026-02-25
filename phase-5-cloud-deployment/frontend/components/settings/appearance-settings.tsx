/**
 * Appearance Settings Component
 *
 * Handles theme and appearance preferences
 */

'use client'

import * as React from 'react'
import { Palette, Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#1e293b]/40 backdrop-blur-xl p-8 shadow-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-[#1a2332]/50 rounded-2xl" />
          <div className="h-24 bg-[#1a2332]/50 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-[#1e293b]/80 to-[#0f1729]/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl transition-all duration-500 hover:shadow-[#00d4b8]/5">
      {/* Decorative background glow */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#00d4b8]/5 blur-3xl transition-all duration-500 group-hover:bg-[#00d4b8]/10" />

      {/* Header */}
      <div className="relative flex items-center gap-5 mb-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00d4b8]/10 shadow-[0_0_20px_rgba(0,212,184,0.15)] ring-1 ring-[#00d4b8]/20">
          <Palette className="h-8 w-8 text-[#00d4b8]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Appearance</h2>
          <p className="text-white/50 mt-1 text-sm font-medium">Customize your visual experience</p>
        </div>
      </div>

      <Separator className="bg-white/10 mb-8" />

      {/* Theme Options */}
      <div className="relative space-y-6">
        <p className="text-sm font-bold text-white/90 uppercase tracking-wider mb-4 pl-1">
          Theme Selection
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Light Theme */}
          <button
            onClick={() => setTheme('light')}
            className={cn(
              'group/btn flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden',
              theme === 'light'
                ? 'bg-[#00d4b8]/10 border-[#00d4b8] shadow-[0_0_20px_rgba(0,212,184,0.2)]'
                : 'bg-[#0f1729]/60 border-white/5 hover:border-[#00d4b8]/30 hover:bg-[#0f1729]/80'
            )}
          >
            <div
              className={cn(
                'h-14 w-14 rounded-2xl flex items-center justify-center transition-all',
                theme === 'light'
                  ? 'bg-[#00d4b8]/20 border-2 border-[#00d4b8]/40'
                  : 'bg-white/5 group-hover/btn:bg-[#00d4b8]/10'
              )}
            >
              <Sun
                className={cn(
                  'h-7 w-7 transition-colors',
                  theme === 'light' ? 'text-[#00d4b8]' : 'text-white/40 group-hover/btn:text-[#00d4b8]'
                )}
              />
            </div>
            <div className="text-center relative z-10">
              <p
                className={cn(
                  'font-bold transition-colors mb-1',
                  theme === 'light' ? 'text-[#00d4b8]' : 'text-white group-hover/btn:text-white'
                )}
              >
                Light
              </p>
              <p className="text-xs text-white/40 group-hover/btn:text-white/60">Bright theme</p>
            </div>
          </button>

          {/* Dark Theme */}
          <button
            onClick={() => setTheme('dark')}
            className={cn(
              'group/btn flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden',
              theme === 'dark'
                ? 'bg-[#00d4b8]/10 border-[#00d4b8] shadow-[0_0_20px_rgba(0,212,184,0.2)]'
                : 'bg-[#0f1729]/60 border-white/5 hover:border-[#00d4b8]/30 hover:bg-[#0f1729]/80'
            )}
          >
            <div
              className={cn(
                'h-14 w-14 rounded-2xl flex items-center justify-center transition-all',
                theme === 'dark'
                  ? 'bg-[#00d4b8]/20 border-2 border-[#00d4b8]/40'
                  : 'bg-white/5 group-hover/btn:bg-[#00d4b8]/10'
              )}
            >
              <Moon
                className={cn(
                  'h-7 w-7 transition-colors',
                  theme === 'dark' ? 'text-[#00d4b8]' : 'text-white/40 group-hover/btn:text-[#00d4b8]'
                )}
              />
            </div>
            <div className="text-center relative z-10">
              <p
                className={cn(
                  'font-bold transition-colors mb-1',
                  theme === 'dark' ? 'text-[#00d4b8]' : 'text-white group-hover/btn:text-white'
                )}
              >
                Dark
              </p>
              <p className="text-xs text-white/40 group-hover/btn:text-white/60">Dark theme</p>
            </div>
          </button>

          {/* System Theme */}
          <button
            onClick={() => setTheme('system')}
            className={cn(
              'group/btn flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden',
              theme === 'system'
                ? 'bg-[#00d4b8]/10 border-[#00d4b8] shadow-[0_0_20px_rgba(0,212,184,0.2)]'
                : 'bg-[#0f1729]/60 border-white/5 hover:border-[#00d4b8]/30 hover:bg-[#0f1729]/80'
            )}
          >
            <div
              className={cn(
                'h-14 w-14 rounded-2xl flex items-center justify-center transition-all',
                theme === 'system'
                  ? 'bg-[#00d4b8]/20 border-2 border-[#00d4b8]/40'
                  : 'bg-white/5 group-hover/btn:bg-[#00d4b8]/10'
              )}
            >
              <Monitor
                className={cn(
                  'h-7 w-7 transition-colors',
                  theme === 'system' ? 'text-[#00d4b8]' : 'text-white/40 group-hover/btn:text-[#00d4b8]'
                )}
              />
            </div>
            <div className="text-center relative z-10">
              <p
                className={cn(
                  'font-bold transition-colors mb-1',
                  theme === 'system' ? 'text-[#00d4b8]' : 'text-white group-hover/btn:text-white'
                )}
              >
                System
              </p>
              <p className="text-xs text-white/40 group-hover/btn:text-white/60">Auto theme</p>
            </div>
          </button>
        </div>

        {/* Current Theme Info */}
        <div className="mt-6 p-4 rounded-xl bg-[#0f1729]/40 border border-white/5 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-[#00d4b8] animate-pulse" />
          <p className="text-sm text-white/60">
            Current active theme: <span className="font-bold text-[#00d4b8] capitalize">{theme}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
