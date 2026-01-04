/**
 * Security Settings Component
 *
 * Handles password change functionality
 */

'use client'

import * as React from 'react'
import { Lock, Shield, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export function SecuritySettings() {
  const [isChanging, setIsChanging] = React.useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false)
  const [showNewPassword, setShowNewPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)

  const [formData, setFormData] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleChangePassword = async () => {
    // Validation
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error('All fields are required')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (formData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setIsChanging(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      // In a real app, you'd call an API to change password
      // const result = await changePassword(formData)

      toast.success('Password changed successfully!')

      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error) {
      toast.error('Failed to change password')
    } finally {
      setIsChanging(false)
    }
  }

  const hasData = formData.currentPassword || formData.newPassword || formData.confirmPassword

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-[#1e293b]/80 to-[#0f1729]/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl transition-all duration-500 hover:shadow-[#00d4b8]/5">
      {/* Decorative background glow */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#00d4b8]/5 blur-3xl transition-all duration-500 group-hover:bg-[#00d4b8]/10" />

      {/* Header */}
      <div className="relative flex items-center gap-5 mb-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00d4b8]/10 shadow-[0_0_20px_rgba(0,212,184,0.15)] ring-1 ring-[#00d4b8]/20">
          <Shield className="h-8 w-8 text-[#00d4b8]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Security Settings</h2>
          <p className="text-white/50 mt-1 text-sm font-medium">Manage your password and security preferences</p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="relative space-y-8">
        {/* Current Password */}
        <div className="space-y-3">
          <Label htmlFor="current-password" className="text-sm font-medium text-white/80">
            Current Password
          </Label>
          <div className="relative">
            <Input
              id="current-password"
              type={showCurrentPassword ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={(e) => handleInputChange('currentPassword', e.target.value)}
              className="h-14 pr-14 bg-[#0f1729]/60 border-2 border-white/5 text-white placeholder:text-white/20 focus:border-[#00d4b8]/50 focus:bg-[#0f1729] focus:ring-0 transition-all duration-300 rounded-xl px-4 text-base"
              placeholder="Enter current password"
              disabled={isChanging}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-white/40 hover:bg-white/5 hover:text-[#00d4b8] transition-colors rounded-lg"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* New Password Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* New Password */}
          <div className="space-y-3">
            <Label htmlFor="new-password" className="text-sm font-medium text-white/80">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                className="h-14 pr-14 bg-[#0f1729]/60 border-2 border-white/5 text-white placeholder:text-white/20 focus:border-[#00d4b8]/50 focus:bg-[#0f1729] focus:ring-0 transition-all duration-300 rounded-xl px-4 text-base"
                placeholder="Enter new password"
                disabled={isChanging}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-white/40 hover:bg-white/5 hover:text-[#00d4b8] transition-colors rounded-lg"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-white/30 pl-1">
              Minimum 8 characters
            </p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-3">
            <Label htmlFor="confirm-password" className="text-sm font-medium text-white/80">
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="h-14 pr-14 bg-[#0f1729]/60 border-2 border-white/5 text-white placeholder:text-white/20 focus:border-[#00d4b8]/50 focus:bg-[#0f1729] focus:ring-0 transition-all duration-300 rounded-xl px-4 text-base"
                placeholder="Confirm new password"
                disabled={isChanging}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-white/40 hover:bg-white/5 hover:text-[#00d4b8] transition-colors rounded-lg"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/5">
          {hasData && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })}
              disabled={isChanging}
              className="h-12 px-6 text-white/60 hover:text-white hover:bg-white/5 font-medium rounded-xl transition-all"
            >
              Clear Form
            </Button>
          )}
          <Button
            onClick={handleChangePassword}
            disabled={isChanging || !hasData}
            className="h-12 px-8 bg-[#00d4b8] text-[#0f1729] hover:bg-[#00e5cc] hover:shadow-[0_0_20px_rgba(0,212,184,0.4)] transition-all duration-300 font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isChanging ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-5 w-5" />
                Update Password
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
