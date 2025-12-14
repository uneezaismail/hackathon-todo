/**
 * E2E Test: Task Toggle Completion (T068)
 *
 * This test verifies that:
 * 1. Users can toggle task completion status
 * 2. Optimistic UI updates checkbox immediately
 * 3. Visual state changes for completed tasks (strikethrough, styling)
 * 4. Toggle state persists after backend confirmation
 */

import { test, expect } from '@playwright/test'

test.describe('Task Toggle Completion', () => {
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

    // Create a test task
    testTaskTitle = `Task to Toggle ${Date.now()}`
    await page.click('button:has-text("Add Task"), button:has-text("Create Task"), button:has-text("New Task")')
    await page.fill('input[name="title"], input[placeholder*="title" i]', testTaskTitle)
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Create Task"), button:has-text("Add")')
    await page.waitForTimeout(1000) // Wait for task to be created

    // Verify task exists
    await expect(page.locator(`text="${testTaskTitle}"`)).toBeVisible()
  })

  test('should toggle task to completed with optimistic UI', async ({ page }) => {
    // Find the task checkbox
    const taskItem = page.locator(`text="${testTaskTitle}"`).locator('..')
    const checkbox = taskItem.locator('input[type="checkbox"], [role="checkbox"]').first()

    // Verify initially unchecked
    await expect(checkbox).not.toBeChecked()

    // Click checkbox to mark as complete
    await checkbox.click()

    // Verify optimistic UI update (checkbox checked immediately)
    await expect(checkbox).toBeChecked({ timeout: 500 })

    // Verify visual state change (strikethrough or other styling)
    const taskTitle = taskItem.locator(`text="${testTaskTitle}"`)
    await expect(taskTitle).toHaveClass(/line-through|completed|done/i).catch(async () => {
      // Alternative: check for strikethrough in computed style
      const hasStrikethrough = await taskTitle.evaluate((el) => {
        const style = window.getComputedStyle(el)
        return style.textDecoration.includes('line-through') ||
               style.textDecorationLine === 'line-through'
      })
      expect(hasStrikethrough).toBe(true)
    })

    // Wait for backend confirmation
    await page.waitForTimeout(2000)
    await expect(checkbox).toBeChecked()
  })

  test('should toggle task back to pending with optimistic UI', async ({ page }) => {
    // Find the task checkbox and check it first
    const taskItem = page.locator(`text="${testTaskTitle}"`).locator('..')
    const checkbox = taskItem.locator('input[type="checkbox"], [role="checkbox"]').first()

    // Mark as complete
    await checkbox.click()
    await expect(checkbox).toBeChecked()
    await page.waitForTimeout(1000)

    // Toggle back to pending
    await checkbox.click()

    // Verify optimistic UI update (checkbox unchecked immediately)
    await expect(checkbox).not.toBeChecked({ timeout: 500 })

    // Verify visual state change (no strikethrough)
    const taskTitle = taskItem.locator(`text="${testTaskTitle}"`)
    await expect(taskTitle).not.toHaveClass(/line-through|completed|done/i).catch(async () => {
      // Alternative: check for no strikethrough in computed style
      const hasStrikethrough = await taskTitle.evaluate((el) => {
        const style = window.getComputedStyle(el)
        return style.textDecoration.includes('line-through') ||
               style.textDecorationLine === 'line-through'
      })
      expect(hasStrikethrough).toBe(false)
    })

    // Wait for backend confirmation
    await page.waitForTimeout(2000)
    await expect(checkbox).not.toBeChecked()
  })

  test('should toggle multiple times rapidly', async ({ page }) => {
    // Find the task checkbox
    const taskItem = page.locator(`text="${testTaskTitle}"`).locator('..')
    const checkbox = taskItem.locator('input[type="checkbox"], [role="checkbox"]').first()

    // Verify initially unchecked
    await expect(checkbox).not.toBeChecked()

    // Toggle multiple times
    await checkbox.click() // -> checked
    await expect(checkbox).toBeChecked({ timeout: 500 })

    await checkbox.click() // -> unchecked
    await expect(checkbox).not.toBeChecked({ timeout: 500 })

    await checkbox.click() // -> checked
    await expect(checkbox).toBeChecked({ timeout: 500 })

    // Wait for all backend updates to settle
    await page.waitForTimeout(3000)

    // Verify final state is checked
    await expect(checkbox).toBeChecked()
  })

  test('should toggle task by clicking on the checkbox label', async ({ page }) => {
    // Find the task
    const taskItem = page.locator(`text="${testTaskTitle}"`).locator('..')
    const checkbox = taskItem.locator('input[type="checkbox"], [role="checkbox"]').first()

    // Verify initially unchecked
    await expect(checkbox).not.toBeChecked()

    // Click on the label/title instead of checkbox directly
    // This tests that the label is properly associated with the checkbox
    const label = taskItem.locator(`label:has-text("${testTaskTitle}"), text="${testTaskTitle}"`)
    await label.click()

    // Verify checkbox is checked
    await expect(checkbox).toBeChecked({ timeout: 500 })

    // Wait for backend confirmation
    await page.waitForTimeout(2000)
    await expect(checkbox).toBeChecked()
  })

  test('should persist toggle state across page refresh', async ({ page }) => {
    // Find the task checkbox
    const taskItem = page.locator(`text="${testTaskTitle}"`).locator('..')
    const checkbox = taskItem.locator('input[type="checkbox"], [role="checkbox"]').first()

    // Mark as complete
    await checkbox.click()
    await expect(checkbox).toBeChecked()

    // Wait for backend confirmation
    await page.waitForTimeout(2000)

    // Refresh the page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Verify task is still marked as complete
    const refreshedTaskItem = page.locator(`text="${testTaskTitle}"`).locator('..')
    const refreshedCheckbox = refreshedTaskItem.locator('input[type="checkbox"], [role="checkbox"]').first()
    await expect(refreshedCheckbox).toBeChecked()
  })

  test('should toggle multiple tasks independently', async ({ page }) => {
    // Create a second task
    const secondTaskTitle = `Second Task to Toggle ${Date.now()}`
    await page.click('button:has-text("Add Task"), button:has-text("Create Task"), button:has-text("New Task")')
    await page.fill('input[name="title"], input[placeholder*="title" i]', secondTaskTitle)
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Create Task"), button:has-text("Add")')
    await page.waitForTimeout(1000)

    // Find both tasks
    const firstTaskItem = page.locator(`text="${testTaskTitle}"`).locator('..')
    const firstCheckbox = firstTaskItem.locator('input[type="checkbox"], [role="checkbox"]').first()

    const secondTaskItem = page.locator(`text="${secondTaskTitle}"`).locator('..')
    const secondCheckbox = secondTaskItem.locator('input[type="checkbox"], [role="checkbox"]').first()

    // Toggle first task
    await firstCheckbox.click()
    await expect(firstCheckbox).toBeChecked()
    await expect(secondCheckbox).not.toBeChecked()

    // Wait a bit
    await page.waitForTimeout(1000)

    // Toggle second task
    await secondCheckbox.click()
    await expect(firstCheckbox).toBeChecked()
    await expect(secondCheckbox).toBeChecked()

    // Wait for backend confirmation
    await page.waitForTimeout(2000)

    // Verify both are still checked
    await expect(firstCheckbox).toBeChecked()
    await expect(secondCheckbox).toBeChecked()
  })

  test('should show visual feedback during toggle', async ({ page }) => {
    // Find the task checkbox
    const taskItem = page.locator(`text="${testTaskTitle}"`).locator('..')
    const checkbox = taskItem.locator('input[type="checkbox"], [role="checkbox"]').first()

    // Click checkbox
    await checkbox.click()

    // Verify immediate visual change (optimistic update)
    await expect(checkbox).toBeChecked({ timeout: 200 })

    // The visual state should remain consistent
    await page.waitForTimeout(500)
    await expect(checkbox).toBeChecked()
  })
})
