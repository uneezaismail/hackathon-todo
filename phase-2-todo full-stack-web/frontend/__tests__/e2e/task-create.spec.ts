/**
 * E2E Test: Task Creation with Optimistic UI (T065)
 *
 * This test verifies that:
 * 1. Users can create new tasks from the dashboard
 * 2. Optimistic UI updates display the task immediately
 * 3. The task persists after backend confirmation
 * 4. Form validation works correctly
 */

import { test, expect } from '@playwright/test'

test.describe('Task Creation with Optimistic UI', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to sign-in page
    await page.goto('/sign-in')

    // Sign in with test credentials
    // NOTE: This assumes a test user exists in the database
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard')
  })

  test('should create a new task with optimistic UI update', async ({ page }) => {
    // Click "Add Task" button
    await page.click('button:has-text("Add Task"), button:has-text("Create Task"), button:has-text("New Task")')

    // Fill in task form
    const taskTitle = `Test Task ${Date.now()}`
    const taskDescription = 'This is a test task description'

    await page.fill('input[name="title"], input[placeholder*="title" i]', taskTitle)
    await page.fill('textarea[name="description"], textarea[placeholder*="description" i]', taskDescription)

    // Submit the form
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Create Task"), button:has-text("Add")')

    // Verify optimistic UI update (task appears immediately)
    await expect(page.locator(`text="${taskTitle}"`)).toBeVisible({ timeout: 500 })
    await expect(page.locator(`text="${taskDescription}"`)).toBeVisible({ timeout: 500 })

    // Wait for backend confirmation (task should still be visible)
    await page.waitForTimeout(2000)
    await expect(page.locator(`text="${taskTitle}"`)).toBeVisible()

    // Verify task appears in the list as pending (unchecked)
    const taskItem = page.locator(`[data-task-title="${taskTitle}"]`).or(page.locator(`text="${taskTitle}">`).locator('..'))
    const checkbox = taskItem.locator('input[type="checkbox"]').or(taskItem.locator('[role="checkbox"]'))
    await expect(checkbox).not.toBeChecked()
  })

  test('should show validation error for empty title', async ({ page }) => {
    // Click "Add Task" button
    await page.click('button:has-text("Add Task"), button:has-text("Create Task"), button:has-text("New Task")')

    // Try to submit without title
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Create Task"), button:has-text("Add")')

    // Verify validation error appears
    await expect(page.locator('text=/title.*required/i, text=/required/i')).toBeVisible()
  })

  test('should show validation error for title exceeding max length', async ({ page }) => {
    // Click "Add Task" button
    await page.click('button:has-text("Add Task"), button:has-text("Create Task"), button:has-text("New Task")')

    // Fill with title exceeding 200 characters
    const longTitle = 'A'.repeat(201)
    await page.fill('input[name="title"], input[placeholder*="title" i]', longTitle)

    // Try to submit
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Create Task"), button:has-text("Add")')

    // Verify validation error appears
    await expect(page.locator('text=/200.*character/i, text=/too long/i, text=/max/i')).toBeVisible()
  })

  test('should allow creating task with only title (no description)', async ({ page }) => {
    // Click "Add Task" button
    await page.click('button:has-text("Add Task"), button:has-text("Create Task"), button:has-text("New Task")')

    // Fill in only title
    const taskTitle = `Minimal Task ${Date.now()}`
    await page.fill('input[name="title"], input[placeholder*="title" i]', taskTitle)

    // Submit the form
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Create Task"), button:has-text("Add")')

    // Verify task appears
    await expect(page.locator(`text="${taskTitle}"`)).toBeVisible({ timeout: 500 })

    // Wait for backend confirmation
    await page.waitForTimeout(2000)
    await expect(page.locator(`text="${taskTitle}"`)).toBeVisible()
  })

  test('should show loading state during task creation', async ({ page }) => {
    // Click "Add Task" button
    await page.click('button:has-text("Add Task"), button:has-text("Create Task"), button:has-text("New Task")')

    // Fill in task form
    const taskTitle = `Loading Test Task ${Date.now()}`
    await page.fill('input[name="title"], input[placeholder*="title" i]', taskTitle)

    // Submit the form
    const submitButton = page.locator('button[type="submit"]:has-text("Create"), button:has-text("Create Task"), button:has-text("Add")').first()
    await submitButton.click()

    // Verify loading state (button should be disabled or show loading text)
    await expect(submitButton).toBeDisabled().or(expect(submitButton).toContainText(/creating|loading|\.\.\.$/i))
  })

  test('should close form after successful task creation', async ({ page }) => {
    // Click "Add Task" button
    await page.click('button:has-text("Add Task"), button:has-text("Create Task"), button:has-text("New Task")')

    // Verify form is visible
    await expect(page.locator('input[name="title"], input[placeholder*="title" i]')).toBeVisible()

    // Fill in task form
    const taskTitle = `Auto-close Test ${Date.now()}`
    await page.fill('input[name="title"], input[placeholder*="title" i]', taskTitle)

    // Submit the form
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Create Task"), button:has-text("Add")')

    // Wait for form to close (input should disappear)
    await expect(page.locator('input[name="title"], input[placeholder*="title" i]')).not.toBeVisible({ timeout: 3000 })

    // Verify task was created
    await expect(page.locator(`text="${taskTitle}"`)).toBeVisible()
  })
})
