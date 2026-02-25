/**
 * Notification Settings Component - Multi-Channel (Option B)
 *
 * Notification Strategy:
 * - PRIMARY: In-app notifications (always enabled, no email required)
 * - SECONDARY: Email notifications (optional, user can enable/disable)
 * - TERTIARY: Push notifications (optional fallback)
 */

'use client'

import * as React from 'react'
import { Bell, Mail, Calendar, Save, Loader2, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface NotificationPreferences {
  // In-app notifications (always enabled)
  inAppNotifications: boolean  // Always true, cannot be disabled

  // Email notifications (optional)
  emailNotifications: boolean
  userEmail: string

  // Specific notification types
  taskReminders: boolean
  dueDateAlerts: boolean
  weeklySummary: boolean

  // Push notifications (optional)
  pushNotifications: boolean
}

export function NotificationSettings() {
  const [isSaving, setIsSaving] = React.useState(false)
  const [preferences, setPreferences] = React.useState<NotificationPreferences>({
    inAppNotifications: true,  // Always enabled
    emailNotifications: false,  // Optional
    userEmail: '',
    taskReminders: true,
    dueDateAlerts: true,
    weeklySummary: false,
    pushNotifications: false,
  })

  const [initialPreferences] = React.useState(preferences)

  const handleToggle = (key: keyof NotificationPreferences) => {
    // Prevent disabling in-app notifications
    if (key === 'inAppNotifications') {
      toast.info('In-app notifications are always enabled')
      return
    }

    setPreferences(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleEmailChange = (email: string) => {
    setPreferences(prev => ({ ...prev, userEmail: email }))
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      // Validate email if email notifications are enabled
      if (preferences.emailNotifications && !preferences.userEmail) {
        toast.error('Please provide an email address for email notifications')
        setIsSaving(false)
        return
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // In a real app, you'd call an API to save preferences
      // const result = await updateNotificationPreferences(preferences)

      toast.success('Notification preferences saved!')
    } catch (error) {
      toast.error('Failed to save preferences')
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = JSON.stringify(preferences) !== JSON.stringify(initialPreferences)

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-[#1e293b]/80 to-[#0f1729]/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl transition-all duration-500 hover:shadow-[#00d4b8]/5">
      {/* Decorative background glow */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#00d4b8]/5 blur-3xl transition-all duration-500 group-hover:bg-[#00d4b8]/10" />

      {/* Header */}
      <div className="relative flex items-center gap-5 mb-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00d4b8]/10 shadow-[0_0_20px_rgba(0,212,184,0.15)] ring-1 ring-[#00d4b8]/20">
          <Bell className="h-8 w-8 text-[#00d4b8]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Notification Preferences</h2>
          <p className="text-white/50 mt-1 text-sm font-medium">Configure how and when you receive updates</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="relative mb-6 p-4 rounded-xl bg-[#00d4b8]/10 border border-[#00d4b8]/20">
        <p className="text-sm text-white/80">
          <strong className="text-[#00d4b8]">Multi-Channel Notifications:</strong> In-app notifications are always enabled.
          You can optionally enable email notifications by providing your email address below.
        </p>
      </div>

      {/* Notification Options */}
      <div className="relative space-y-4">
        {/* In-App Notifications (Always Enabled) */}
        <div className="group/item flex items-center justify-between p-5 rounded-2xl bg-[#00d4b8]/10 border border-[#00d4b8]/30">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1.5">
              <div className="h-10 w-10 rounded-xl bg-[#00d4b8]/20 flex items-center justify-center">
                <Bell className="h-5 w-5 text-[#00d4b8]" />
              </div>
              <p className="text-white font-semibold">In-App Notifications</p>
              <span className="text-xs px-2 py-1 rounded-full bg-[#00d4b8]/20 text-[#00d4b8] font-medium">
                PRIMARY
              </span>
            </div>
            <p className="text-sm text-white/70 ml-13">
              Real-time notifications in your browser (always enabled, no email required)
            </p>
          </div>
          <Switch
            checked={preferences.inAppNotifications}
            onCheckedChange={() => handleToggle('inAppNotifications')}
            disabled={true}
            className="data-[state=checked]:bg-[#00d4b8] opacity-100"
          />
        </div>

        {/* Email Notifications (Optional) */}
        <div className="group/item p-5 rounded-2xl bg-[#0f1729]/60 border border-white/5 hover:border-[#00d4b8]/30 hover:bg-[#0f1729]/80 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1.5">
                <div className="h-10 w-10 rounded-xl bg-[#00d4b8]/10 flex items-center justify-center group-hover/item:bg-[#00d4b8]/20 transition-colors">
                  <Mail className="h-5 w-5 text-[#00d4b8]" />
                </div>
                <p className="text-white font-semibold">Email Notifications</p>
                <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60 font-medium">
                  OPTIONAL
                </span>
              </div>
              <p className="text-sm text-white/50 ml-13">
                Receive email updates about your tasks and activity
              </p>
            </div>
            <Switch
              checked={preferences.emailNotifications}
              onCheckedChange={() => handleToggle('emailNotifications')}
              disabled={isSaving}
              className="data-[state=checked]:bg-[#00d4b8] data-[state=unchecked]:bg-[#1a2332] border-2 border-transparent data-[state=unchecked]:border-white/10"
            />
          </div>

          {/* Email Input (shown when email notifications enabled) */}
          {preferences.emailNotifications && (
            <div className="ml-13 mt-3 space-y-2">
              <Label htmlFor="email" className="text-white/70 text-sm">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your-email@example.com"
                value={preferences.userEmail}
                onChange={(e) => handleEmailChange(e.target.value)}
                disabled={isSaving}
                className="bg-[#1a2332] border-white/10 text-white placeholder:text-white/30"
              />
            </div>
          )}
        </div>

        {/* Push Notifications (Optional) */}
        <div className="group/item flex items-center justify-between p-5 rounded-2xl bg-[#0f1729]/60 border border-white/5 hover:border-[#00d4b8]/30 hover:bg-[#0f1729]/80 transition-all duration-300">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1.5">
              <div className="h-10 w-10 rounded-xl bg-[#00d4b8]/10 flex items-center justify-center group-hover/item:bg-[#00d4b8]/20 transition-colors">
                <Smartphone className="h-5 w-5 text-[#00d4b8]" />
              </div>
              <p className="text-white font-semibold">Push Notifications</p>
              <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60 font-medium">
                FALLBACK
              </span>
            </div>
            <p className="text-sm text-white/50 ml-13">
              Browser push notifications (fallback if email fails)
            </p>
          </div>
          <Switch
            checked={preferences.pushNotifications}
            onCheckedChange={() => handleToggle('pushNotifications')}
            disabled={isSaving}
            className="data-[state=checked]:bg-[#00d4b8] data-[state=unchecked]:bg-[#1a2332] border-2 border-transparent data-[state=unchecked]:border-white/10"
          />
        </div>

        <Separator className="bg-white/5 my-6" />

        {/* Notification Types */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Notification Types</h3>

          {/* Task Reminders */}
          <div className="group/item flex items-center justify-between p-5 rounded-2xl bg-[#0f1729]/60 border border-white/5 hover:border-[#00d4b8]/30 hover:bg-[#0f1729]/80 transition-all duration-300">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1.5">
                <div className="h-10 w-10 rounded-xl bg-[#00d4b8]/10 flex items-center justify-center group-hover/item:bg-[#00d4b8]/20 transition-colors">
                  <Bell className="h-5 w-5 text-[#00d4b8]" />
                </div>
                <p className="text-white font-semibold">Task Reminders</p>
              </div>
              <p className="text-sm text-white/50 ml-13">
                Get reminded about upcoming task due dates
              </p>
            </div>
            <Switch
              checked={preferences.taskReminders}
              onCheckedChange={() => handleToggle('taskReminders')}
              disabled={isSaving}
              className="data-[state=checked]:bg-[#00d4b8] data-[state=unchecked]:bg-[#1a2332] border-2 border-transparent data-[state=unchecked]:border-white/10"
            />
          </div>

          {/* Due Date Alerts */}
          <div className="group/item flex items-center justify-between p-5 rounded-2xl bg-[#0f1729]/60 border border-white/5 hover:border-[#00d4b8]/30 hover:bg-[#0f1729]/80 transition-all duration-300">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1.5">
                <div className="h-10 w-10 rounded-xl bg-[#00d4b8]/10 flex items-center justify-center group-hover/item:bg-[#00d4b8]/20 transition-colors">
                  <Calendar className="h-5 w-5 text-[#00d4b8]" />
                </div>
                <p className="text-white font-semibold">Due Date Alerts</p>
              </div>
              <p className="text-sm text-white/50 ml-13">
                Alert me one day before tasks are due
              </p>
            </div>
            <Switch
              checked={preferences.dueDateAlerts}
              onCheckedChange={() => handleToggle('dueDateAlerts')}
              disabled={isSaving}
              className="data-[state=checked]:bg-[#00d4b8] data-[state=unchecked]:bg-[#1a2332] border-2 border-transparent data-[state=unchecked]:border-white/10"
            />
          </div>

          {/* Weekly Summary */}
          <div className="group/item flex items-center justify-between p-5 rounded-2xl bg-[#0f1729]/60 border border-white/5 hover:border-[#00d4b8]/30 hover:bg-[#0f1729]/80 transition-all duration-300">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1.5">
                <div className="h-10 w-10 rounded-xl bg-[#00d4b8]/10 flex items-center justify-center group-hover/item:bg-[#00d4b8]/20 transition-colors">
                  <Mail className="h-5 w-5 text-[#00d4b8]" />
                </div>
                <p className="text-white font-semibold">Weekly Summary</p>
              </div>
              <p className="text-sm text-white/50 ml-13">
                Receive weekly task summary and productivity reports
              </p>
            </div>
            <Switch
              checked={preferences.weeklySummary}
              onCheckedChange={() => handleToggle('weeklySummary')}
              disabled={isSaving}
              className="data-[state=checked]:bg-[#00d4b8] data-[state=unchecked]:bg-[#1a2332] border-2 border-transparent data-[state=unchecked]:border-white/10"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 mt-6 border-t border-white/5">
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="h-12 px-8 bg-[#00d4b8] text-[#0f1729] hover:bg-[#00e5cc] hover:shadow-[0_0_20px_rgba(0,212,184,0.4)] transition-all duration-300 font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
