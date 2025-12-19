/**
 * Settings Page
 *
 * Manages user account settings and preferences with a professional tabbed interface
 */

'use client'

import { useState } from 'react'
import { User, Shield, Bell, Palette } from 'lucide-react'
import { ProfileSettings } from '@/components/settings/profile-settings'
import { SecuritySettings } from '@/components/settings/security-settings'
import { NotificationSettings } from '@/components/settings/notification-settings'
import { AppearanceSettings } from '@/components/settings/appearance-settings'
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

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:w-64 shrink-0">
          <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-none">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 whitespace-nowrap min-w-35 lg:min-w-0',
                    isActive
                      ? 'bg-[#00d4b8]/10 text-[#00d4b8] border-2 border-[#00d4b8]/20 shadow-[0_0_15px_rgba(0,212,184,0.1)]'
                      : 'text-white/60 hover:text-white hover:bg-white/5 border-2 border-transparent'
                  )}
                >
                  <tab.icon className={cn('h-5 w-5', isActive ? 'text-[#00d4b8]' : 'text-current')} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            {activeTab === 'profile' && <ProfileSettings />}
            {activeTab === 'security' && <SecuritySettings />}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'appearance' && <AppearanceSettings />}
          </div>
        </div>
      </div>
    </div>
  )
}
