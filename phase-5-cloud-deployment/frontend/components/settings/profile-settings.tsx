/**
 * Profile Settings Component
 *
 * Handles user profile information updates
 */

'use client'

import * as React from 'react'
import { User, Save, Loader2 } from 'lucide-react'
import { useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export function ProfileSettings() {
  const { data: session, isPending } = useSession()
  const [isSaving, setIsSaving] = React.useState(false)
  const [name, setName] = React.useState(session?.user?.name || '')

  React.useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name)
    }
  }, [session])

  const handleSave = async () => {
    setIsSaving(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // In a real app, you'd call an API to update the profile
      // const result = await updateProfile({ name })

      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = name !== (session?.user?.name || '')

  if (isPending) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#1e293b]/40 backdrop-blur-xl p-8 shadow-2xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#00d4b8]" />
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
          <User className="h-8 w-8 text-[#00d4b8]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Profile Settings</h2>
          <p className="text-white/50 mt-1 text-sm font-medium">Manage your personal information and account details</p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="relative space-y-8">
        <div className="grid grid-cols-1 gap-6">
          {/* Name Field */}
          <div className="space-y-3">
            <Label htmlFor="profile-name" className="text-sm font-medium text-white/80">
              Display Name
            </Label>
            <div className="relative">
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-14 bg-[#0f1729]/60 border-2 border-white/5 text-white placeholder:text-white/20 focus:border-[#00d4b8]/50 focus:bg-[#0f1729] focus:ring-0 transition-all duration-300 rounded-xl px-4 text-base"
                placeholder="Enter your full name"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Email Field (Disabled) */}
          <div className="space-y-3">
            <Label htmlFor="profile-email" className="text-sm font-medium text-white/80">
              Email Address
            </Label>
            <div className="relative opacity-70">
              <Input
                id="profile-email"
                type="email"
                value={session?.user?.email || ''}
                className="h-14 bg-[#0f1729]/40 border-2 border-white/5 text-white/60 cursor-not-allowed pr-12 rounded-xl px-4 text-base"
                disabled
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <User className="h-5 w-5 text-white/20" />
              </div>
            </div>
            <p className="text-xs text-white/30 pl-1">
              Contact support to change your email address
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/5">
          {hasChanges && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setName(session?.user?.name || '')}
              disabled={isSaving}
              className="h-12 px-6 text-white/60 hover:text-white hover:bg-white/5 font-medium rounded-xl transition-all"
            >
              Discard
            </Button>
          )}
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
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
