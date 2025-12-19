/**
 * Empty State Component (T080)
 *
 * Displays a friendly message when the user has no tasks
 */

import { FileText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  onCreateTask?: () => void
}

export function EmptyState({ onCreateTask }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="rounded-full bg-muted p-4 mb-4" aria-hidden="true">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>

        <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>

        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Get started by creating your first task. Stay organized and productive by tracking your
          todo items here.
        </p>

        {onCreateTask && (
          <Button onClick={onCreateTask} size="sm" aria-label="Create your first task">
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Create your first task
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
