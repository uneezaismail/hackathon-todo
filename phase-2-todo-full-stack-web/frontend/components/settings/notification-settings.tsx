/**
 * Notification Settings Component
 *
 * Handles notification preferences
 */

'use client'

import * as React from 'react'
import { Bell, Mail, Calendar, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface NotificationPreferences {
  emailNotifications: boolean
  taskReminders: boolean
  weeklySummary: boolean
  dueDateAlerts: boolean
}

export function NotificationSettings() {
  const [isSaving, setIsSaving] = React.useState(false)
  const [preferences, setPreferences] = React.useState<NotificationPreferences>({
    emailNotifications: true,
    taskReminders: true,
    weeklySummary: false,
    dueDateAlerts: true,
  })

  const [initialPreferences] = React.useState(preferences)

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
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

      {/* Notification Options */}
      <div className="relative space-y-4">
        {/* Email Notifications */}
        <div className="group/item flex items-center justify-between p-5 rounded-2xl bg-[#0f1729]/60 border border-white/5 hover:border-[#00d4b8]/30 hover:bg-[#0f1729]/80 transition-all duration-300">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1.5">
              <div className="h-10 w-10 rounded-xl bg-[#00d4b8]/10 flex items-center justify-center group-hover/item:bg-[#00d4b8]/20 transition-colors">
                <Mail className="h-5 w-5 text-[#00d4b8]" />
              </div>
              <p className="text-white font-semibold">Email Notifications</p>
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
