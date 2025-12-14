/**
 * E2E Test: Task Update Flow (T066)
 *
 * This test verifies that:
 * 1. Users can edit existing tasks
 * 2. Optimistic UI updates display changes immediately
 * 3. Changes persist after backend confirmation
 * 4. Form validation works during editing
 */

import { test, expect } from '@playwright/test'

test.describe('Task Update Flow', () => {
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

    // Create a test task to edit
    testTaskTitle = `Task to Edit ${Date.now()}`
    await page.click('button:has-text("Add Task"), button:has-text("Create Task"), button:has-text("New Task")')
    await page.fill('input[name="title"], input[placeholder*="title" i]', testTaskTitle)
    await page.fill('textarea[name="description"], textarea[placeholder*="description" i]', 'Original description')
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Create Task"), button:has-text("Add")')
    await page.waitForTimeout(1000) // Wait for task to be created

    // Verify task exists
    await expect(page.locator(`text="${testTaskTitle}"`)).toBeVisible()
  })

  test('should update task title with optimistic UI', async ({ page }) => {
    // Find the task and click edit button
    const taskItem = page.locator(`text="${testTaskTitle}"`).locator('..')
    await taskItem.locator('button:has-text("Edit")').click()

    // Update the title
    const updatedTitle = `${testTaskTitle} - Updated`
    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]')
    await titleInput.clear()
    await titleInput.fill(updatedTitle)

    // Submit the update
    await page.click('button[type="submit"]:has-text("Save"), button:has-text("Update")')

    // Verify optimistic UI update (new title appears immediately)
    await expect(page.locator(`text="${updatedTitle}"`)).toBeVisible({ timeout: 500 })
    await expect(page.locator(`text="${testTaskTitle}"`).first()).not.toBeVisible()

    // Wait for backend confirmation
    await page.waitForTimeout(2000)
    await expect(page.locator(`text="${updatedTitle}"`)).toBeVisible()
  })

  test('should update task description with optimistic UI', async ({ page }) => {
    // Find the task and click edit button
    const taskItem = page.locator(`text="${testTaskTitle}"`).locator('..')
    await taskItem.locator('button:has-text("Edit")').click()

    // Update the description
    const updatedDescription = 'Updated description with new content'
    const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="description" i]')
    await descriptionInput.clear()
    await descriptionInput.fill(updatedDescription)

    // Submit the update
    await page.click('button[type="submit"]:has-text("Save"), button:has-text("Update")')

    // Verify optimistic UI update
    await expect(page.locator(`text="${updatedDescription}"`)).toBeVisible({ timeout: 500 })

    // Wait for backend confirmation
    await page.waitForTimeout(2000)
    await expect(page.locator(`text="${updatedDescription}"`)).toBeVisible()
  })

  test('should update both title and description simultaneously', async ({ page }) => {
    // Find the task and click edit button
    const taskItem = page.locator(`text="${testTaskTitle}"`).locator('..')
    await taskItem.locator('button:has-text("Edit")').click()

    // Update both fields
    const updatedTitle = `${testTaskTitle} - Both Updated`
    const updatedDescription = 'Both title and description updated'

    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]')
    await titleInput.clear()
    await titleInput.fill(updatedTitle)

    const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="description" i]')
    await descriptionInput.clear()
    await descriptionInput.fill(updatedDescription)

    // Submit the update
    await page.click('button[type="submit"]:has-text("Save"), button:has-text("Update")')

    // Verify both updates appear
    await expect(page.locator(`text="${updatedTitle}"`)).toBeVisible({ timeout: 500 })
    await expect(page.locator(`text="${updatedDescription}"`)).toBeVisible({ timeout: 500 })

    // Wait for backend confirmation
    await page.waitForTimeout(2000)
    await expect(page.locator(`text="${updatedTitle}"`)).toBeVisible()
    await expect(page.locator(`text="${updatedDescription}"`)).toBeVisible()
  })

  test('should show validation error when updating with empty title', async ({ page }) => {
    // Find the task and click edit button
    const taskItem = page.locator(`text="${testTaskTitle}"`).locator('..')
    await taskItem.locator('button:has-text("Edit")').click()

    // Clear the title
    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]')
    await titleInput.clear()

    // Try to submit
    await page.click('button[type="submit"]:has-text("Save"), button:has-text("Update")')

    // Verify validation error
    await expect(page.locator('text=/title.*required/i, text=/required/i')).toBeVisible()

    // Verify original task is still visible
    await expect(page.locator(`text="${testTaskTitle}"`)).toBeVisible()
  })

  test('should allow cancelling edit without saving changes', async ({ page }) => {
    // Find the task and click edit button
    const taskItem = page.locator(`text="${testTaskTitle}"`).locator('..')
    await taskItem.locator('button:has-text("Edit")').click()

    // Make changes
    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]')
    await titleInput.clear()
    await titleInput.fill('This change should be cancelled')

    // Click cancel button
    await page.click('button:has-text("Cancel")')

    // Verify original task is still unchanged
    await expect(page.locator(`text="${testTaskTitle}"`)).toBeVisible()
    await expect(page.locator('text="This change should be cancelled"')).not.toBeVisible()
  })

  test('should show loading state during task update', async ({ page }) => {
    // Find the task and click edit button
    const taskItem = page.locator(`text="${testTaskTitle}"`).locator('..')
    await taskItem.locator('button:has-text("Edit")').click()

    // Update the title
    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]')
    await titleInput.clear()
    await titleInput.fill(`${testTaskTitle} - Loading Test`)

    // Submit and check loading state
    const submitButton = page.locator('button[type="submit"]:has-text("Save"), button:has-text("Update")').first()
    await submitButton.click()

    // Verify loading state
    await expect(submitButton).toBeDisabled().or(expect(submitButton).toContainText(/saving|updating|loading|\.\.\.$/i))
  })
})
