/**
 * Settings Page
 *
 * Manages user account settings and preferences with a professional tabbed interface
 */

'use client'

import { useState } from 'react'
import { User, Shield, Bell, Palette, Construction, Sparkles } from 'lucide-react'
// Temporarily commented out - Coming Soon
// import { ProfileSettings } from '@/components/settings/profile-settings'
// import { SecuritySettings } from '@/components/settings/security-settings'
// import { NotificationSettings } from '@/components/settings/notification-settings'
// import { AppearanceSettings } from '@/components/settings/appearance-settings'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
] as const

type TabId = typeof TABS[number]['id']

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile')

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">Settings</h1>
        <p className="text-white/60 mt-2 text-lg">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Sidebar Navigation - Commented out for Coming Soon */}
      {/*
        Sidebar with tab navigation commented out
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 shrink-0">
            Tab navigation buttons here
          </aside>
        </div>
      */}

      {/* Content Area - Coming Soon Only */}
      <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Tab content components commented out */}
        {/* <ProfileSettings /> */}
        {/* <SecuritySettings /> */}
        {/* <NotificationSettings /> */}
        {/* <AppearanceSettings /> */}

        {/* Coming Soon Message - Professional Design */}
        <div className="bg-gradient-to-br from-[#A855F7]/5 to-[#A855F7]/10 border-2 border-[#A855F7]/20 rounded-2xl p-12 text-center shadow-lg hover:shadow-xl hover:border-[#A855F7]/30 transition-all duration-300">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-[#A855F7]/30 blur-3xl rounded-full animate-pulse" />
              <div className="relative bg-gradient-to-br from-[#A855F7]/30 to-[#A855F7]/10 p-8 rounded-2xl border-2 border-[#A855F7]/40 backdrop-blur-sm">
                <Construction className="h-20 w-20 text-[#A855F7]" />
              </div>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Sparkles className="h-9 w-9 text-[#A855F7]" />
            Coming Soon
          </h2>

          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8 font-medium">
            We're working hard to bring you powerful settings to customize your experience.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
            <div className="flex items-center gap-3 text-gray-200 bg-gradient-to-br from-[#A855F7]/10 to-transparent px-4 py-4 rounded-xl border border-[#A855F7]/20 hover:border-[#A855F7]/40 transition-all duration-200 group">
              <div className="w-2.5 h-2.5 bg-[#A855F7] rounded-full animate-pulse flex-shrink-0" />
              <span className="text-sm font-medium">Profile customization</span>
            </div>
            <div className="flex items-center gap-3 text-gray-200 bg-gradient-to-br from-[#A855F7]/10 to-transparent px-4 py-4 rounded-xl border border-[#A855F7]/20 hover:border-[#A855F7]/40 transition-all duration-200 group">
              <div className="w-2.5 h-2.5 bg-[#A855F7] rounded-full animate-pulse flex-shrink-0" />
              <span className="text-sm font-medium">Security settings</span>
            </div>
            <div className="flex items-center gap-3 text-gray-200 bg-gradient-to-br from-[#A855F7]/10 to-transparent px-4 py-4 rounded-xl border border-[#A855F7]/20 hover:border-[#A855F7]/40 transition-all duration-200 group">
              <div className="w-2.5 h-2.5 bg-[#A855F7] rounded-full animate-pulse flex-shrink-0" />
              <span className="text-sm font-medium">Notification preferences</span>
            </div>
            <div className="flex items-center gap-3 text-gray-200 bg-gradient-to-br from-[#A855F7]/10 to-transparent px-4 py-4 rounded-xl border border-[#A855F7]/20 hover:border-[#A855F7]/40 transition-all duration-200 group">
              <div className="w-2.5 h-2.5 bg-[#A855F7] rounded-full animate-pulse flex-shrink-0" />
              <span className="text-sm font-medium">Theme & appearance</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#A855F7]/20">
            <p className="text-gray-400 text-sm font-medium">
              Stay tuned for updates! ✨
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
