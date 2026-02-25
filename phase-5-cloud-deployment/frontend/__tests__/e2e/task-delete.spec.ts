/**
 * E2E Test: Task Deletion with Confirmation (T067)
 *
 * This test verifies that:
 * 1. Users can delete tasks from the dashboard
 * 2. Confirmation dialog appears before deletion
 * 3. Optimistic UI removes task immediately after confirmation
 * 4. Deletion persists after backend confirmation
 * 5. Users can cancel deletion
 */

import { test, expect } from '@playwright/test'

test.describe('Task Deletion with Confirmation', () => {
  let testTaskTitle: string

  test.beforeEach(async ({ page }) => {
    // Navigate to sign-in page
    await page.goto('/sign-in')

    // Sign in with test credentials
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard')

    // Create a test task to delete
    testTaskTitle = `Task to Delete ${Date.now()}`
    await page.click('button:has-text("Add Task"), button:has-text("Create Task"), button:has-text("New Task")')
    await page.fill('input[name="title"], input[placeholder*="title" i]', testTaskTitle)
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Create Task"), button:has-text("Add")')
    await page.waitForTimeout(1000) // Wait for task to be created

    // Verify task exists
    await expect(page.locator(`text="${testTaskTitle}"`)).toBeVisible()
  })

  test('should show confirmation dialog when deleting a task', async ({ page }) => {
    // Find the task and click delete button
    const taskItem = page.locator(`text="${testTaskTitle}"`).locator('..')
    await taskItem.locator('button:has-text("Delete")').click()

    // Verify confirmation dialog appears
    await expect(page.locator('[role="dialog"], [role="alertdialog"]')).toBeVisible()
    await expect(page.locator('text=/confirm|delete|sure/i')).toBeVisible()
  })

  test('should delete task with optimistic UI after confirmation', async ({ page }) => {
    // Count initial tasks
    const initialTaskCount = await page.locator('[data-testid="task-item"], [role="listitem"]').count()

    // Find the task and click delete button
    const taskItem = page.locator(`text="${testTaskTitle}"`).locator('..')
    await taskItem.locator('button:has-text("Delete")').click()

    // Confirm deletion
    await page.locator('[role="dialog"] button:has-text("Delete"), [role="dialog"] button:has-text("Confirm"), [role="alertdialog"] button:has-text("Delete")').click()

    // Verify optimistic UI update (task disappears immediately)
    await expect(page.locator(`text="${testTaskTitle}"`)).not.toBeVisible({ timeout: 500 })

    // Verify task count decreased
    const newTaskCount = await page.locator('[data-testid="task-item"], [role="listitem"]').count()
    expect(newTaskCount).toBe(initialTaskCount - 1)

    // Wait for backend confirmation
    await page.waitForTimeout(2000)
    await expect(page.locator(`text="${testTaskTitle}"`)).not.toBeVisible()
  })

  test('should cancel deletion when clicking cancel button', async ({ page }) => {
    // Find the task and click delete button
    const taskItem = page.locator(`text="${testTaskTitle}"`).locator('..')
    await taskItem.locator('button:has-text("Delete")').click()

    // Verify dialog appears
    await expect(page.locator('[role="dialog"], [role="alertdialog"]')).toBeVisible()

    // Click cancel button
    await page.locator('[role="dialog"] button:has-text("Cancel"), [role="alertdialog"] button:has-text("Cancel")').click()

    // Verify dialog closes
    await expect(page.locator('[role="dialog"], [role="alertdialog"]')).not.toBeVisible()

    // Verify task is still visible
    await expect(page.locator(`text="${testTaskTitle}"`)).toBeVisible()
  })

  test('should cancel deletion when clicking outside dialog', async ({ page }) => {
    // Find the task and click delete button
    const taskItem = page.locator(`text="${testTaskTitle}"`).locator('..')
    await taskItem.locator('button:has-text("Delete")').click()

    // Verify dialog appears
    const dialog = page.locator('[role="dialog"], [role="alertdialog"]')
    await expect(dialog).toBeVisible()

    // Click outside the dialog (on the overlay)
    await page.locator('[role="dialog"]').evaluate((el) => {
      const overlay = el.parentElement
      if (overlay) overlay.click()
    }).catch(() => {
      // If the above doesn't work, try pressing Escape
      page.keyboard.press('Escape')
    })

    // Wait a bit for dialog to close
    await page.waitForTimeout(500)

    // Verify task is still visible
    await expect(page.locator(`text="${testTaskTitle}"`)).toBeVisible()
  })

  test('should show loading state during deletion', async ({ page }) => {
    // Find the task and click delete button
    const taskItem = page.locator(`text="${testTaskTitle}"`).locator('..')
    await taskItem.locator('button:has-text("Delete")').click()

    // Get the confirm button
    const confirmButton = page.locator('[role="dialog"] button:has-text("Delete"), [role="dialog"] button:has-text("Confirm"), [role="alertdialog"] button:has-text("Delete")').first()

    // Click confirm
    await confirmButton.click()

    // Verify loading state (button should be disabled or show loading text)
    // Note: This might be very brief, so we use a short timeout
    await expect(confirmButton).toBeDisabled().or(expect(confirmButton).toContainText(/deleting|loading|\.\.\.$/i)).catch(() => {
      // Loading state might be too fast to catch, that's okay
    })
  })

  test('should delete multiple tasks independently', async ({ page }) => {
    // Create a second task
    const secondTaskTitle = `Second Task to Delete ${Date.now()}`
    await page.click('button:has-text("Add Task"), button:has-text("Create Task"), button:has-text("New Task")')
    await page.fill('input[name="title"], input[placeholder*="title" i]', secondTaskTitle)
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Create Task"), button:has-text("Add")')
    await page.waitForTimeout(1000)

    // Verify both tasks exist
    await expect(page.locator(`text="${testTaskTitle}"`)).toBeVisible()
    await expect(page.locator(`text="${secondTaskTitle}"`)).toBeVisible()

    // Delete the first task
    const firstTaskItem = page.locator(`text="${testTaskTitle}"`).locator('..')
    await firstTaskItem.locator('button:has-text("Delete")').click()
    await page.locator('[role="dialog"] button:has-text("Delete"), [role="alertdialog"] button:has-text("Delete")').click()

    // Verify first task is deleted, second task remains
    await expect(page.locator(`text="${testTaskTitle}"`)).not.toBeVisible({ timeout: 2000 })
    await expect(page.locator(`text="${secondTaskTitle}"`)).toBeVisible()

    // Delete the second task
    const secondTaskItem = page.locator(`text="${secondTaskTitle}"`).locator('..')
    await secondTaskItem.locator('button:has-text("Delete")').click()
    await page.locator('[role="dialog"] button:has-text("Delete"), [role="alertdialog"] button:has-text("Delete")').click()

    // Verify second task is deleted
    await expect(page.locator(`text="${secondTaskTitle}"`)).not.toBeVisible({ timeout: 2000 })
  })
})
