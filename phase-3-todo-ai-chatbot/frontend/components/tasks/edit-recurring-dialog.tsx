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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Recurring Task</DialogTitle>
          <DialogDescription>
            &quot;{taskTitle}&quot; is a recurring task. How would you like to edit it?
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={editType}
          onValueChange={(value: string) => setEditType(value as 'this' | 'all')}
          className="space-y-3 py-4"
        >
          <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
            <RadioGroupItem value="this" id="edit-this" className="mt-0.5" />
            <div className="flex-1">
              <Label htmlFor="edit-this" className="flex items-center gap-2 cursor-pointer font-medium">
                <FileEdit className="h-4 w-4" />
                Edit only this instance
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Changes will only apply to this single occurrence. Future instances will remain unchanged.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
            <RadioGroupItem value="all" id="edit-all" className="mt-0.5" />
            <div className="flex-1">
              <Label htmlFor="edit-all" className="flex items-center gap-2 cursor-pointer font-medium">
                <Files className="h-4 w-4" />
                Edit all future instances
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
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
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
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
