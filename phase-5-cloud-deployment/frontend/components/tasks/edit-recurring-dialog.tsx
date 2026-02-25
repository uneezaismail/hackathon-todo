/**
 * Edit Recurring Dialog Component (T041)
 *
 * Dialog for editing recurring tasks with options to:
 * - Edit only this instance
 * - Edit all future instances
 */

'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, FileEdit, Files } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

interface EditRecurringDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditThisInstance: () => void
  onEditAllInstances: () => void
  taskTitle: string
}

export function EditRecurringDialog({
  open,
  onOpenChange,
  onEditThisInstance,
  onEditAllInstances,
  taskTitle,
}: EditRecurringDialogProps) {
  const [editType, setEditType] = useState<'this' | 'all'>('this')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      if (editType === 'this') {
        onEditThisInstance()
      } else {
        onEditAllInstances()
      }
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to proceed with edit')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "sm:max-w-md rounded-2xl border-2 transition-all duration-200",
        "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
        "dark:shadow-[0_0_40px_rgba(168,85,247,0.1)]",
        "light:bg-white light:border-purple-200",
        "light:shadow-xl"
      )}>
        <DialogHeader>
          <DialogTitle className={cn(
            "text-xl font-bold",
            "dark:text-white light:text-gray-900"
          )}>
            Edit Recurring Task
          </DialogTitle>
          <DialogDescription className={cn(
            "dark:text-gray-400 light:text-gray-600"
          )}>
            &quot;{taskTitle}&quot; is a recurring task. How would you like to edit it?
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={editType}
          onValueChange={(value: string) => setEditType(value as 'this' | 'all')}
          className="space-y-3 py-4"
        >
          <div className={cn(
            "flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200",
            "dark:border-[#2a2a3e] dark:hover:bg-[#2a2a3e]/50 dark:hover:border-purple-500/40",
            "light:border-gray-200 light:hover:bg-purple-50 light:hover:border-purple-300",
            editType === 'this' && cn(
              "dark:border-purple-500/60 dark:bg-purple-500/10",
              "light:border-purple-500 light:bg-purple-50"
            )
          )}>
            <RadioGroupItem value="this" id="edit-this" className="mt-0.5" />
            <div className="flex-1">
              <Label htmlFor="edit-this" className={cn(
                "flex items-center gap-2 cursor-pointer font-medium",
                "dark:text-white light:text-gray-900"
              )}>
                <FileEdit className="h-4 w-4 dark:text-purple-400 light:text-purple-600" />
                Edit only this instance
              </Label>
              <p className={cn(
                "text-sm mt-1",
                "dark:text-gray-400 light:text-gray-600"
              )}>
                Changes will only apply to this single occurrence. Future instances will remain unchanged.
              </p>
            </div>
          </div>

          <div className={cn(
            "flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200",
            "dark:border-[#2a2a3e] dark:hover:bg-[#2a2a3e]/50 dark:hover:border-purple-500/40",
            "light:border-gray-200 light:hover:bg-purple-50 light:hover:border-purple-300",
            editType === 'all' && cn(
              "dark:border-purple-500/60 dark:bg-purple-500/10",
              "light:border-purple-500 light:bg-purple-50"
            )
          )}>
            <RadioGroupItem value="all" id="edit-all" className="mt-0.5" />
            <div className="flex-1">
              <Label htmlFor="edit-all" className={cn(
                "flex items-center gap-2 cursor-pointer font-medium",
                "dark:text-white light:text-gray-900"
              )}>
                <Files className="h-4 w-4 dark:text-purple-400 light:text-purple-600" />
                Edit all future instances
              </Label>
              <p className={cn(
                "text-sm mt-1",
                "dark:text-gray-400 light:text-gray-600"
              )}>
                Changes will apply to this instance and all future occurrences of this recurring task.
              </p>
            </div>
          </div>
        </RadioGroup>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className={cn(
              "h-11 rounded-xl border-2 font-medium transition-all duration-200",
              "dark:bg-transparent dark:border-[#2a2a3e] dark:text-white",
              "dark:hover:bg-[#2a2a3e] dark:hover:border-purple-500/40",
              "light:bg-white light:border-gray-200 light:text-gray-900",
              "light:hover:bg-gray-50 light:hover:border-purple-400"
            )}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={cn(
              "h-11 rounded-xl font-medium transition-all duration-200 shadow-lg",
              "bg-purple-500 text-white hover:bg-purple-600",
              "dark:bg-purple-500 dark:hover:bg-purple-600 dark:shadow-purple-500/20",
              "light:bg-purple-600 light:hover:bg-purple-700 light:shadow-purple-600/20"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
