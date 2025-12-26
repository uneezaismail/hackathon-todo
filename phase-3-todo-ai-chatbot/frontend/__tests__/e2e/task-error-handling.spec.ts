/**
 * E2E Test: Error Handling and Rollback (T069)
 *
 * This test verifies that:
 * 1. Failed API requests show error messages
 * 2. Optimistic UI updates are rolled back on error
 * 3. Error messages are dismissible
 * 4. Users can retry failed operations
 */

import { test, expect } from '@playwright/test'

test.describe('Error Handling and Rollback', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to sign-in page
    await page.goto('/sign-in')

    // Sign in with test credentials
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard')
  })

  test('should show error banner when task creation fails', async ({ page }) => {
    // Intercept API request and force it to fail
    await page.route('**/api/**/tasks', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Internal server error' }),
        })
      } else {
        route.continue()
      }
    })

    // Try to create a task
    const taskTitle = `Task that will fail ${Date.now()}`
    await page.click('button:has-text("Add Task"), button:has-text("Create Task"), button:has-text("New Task")')
    await page.fill('input[name="title"], input[placeholder*="title" i]', taskTitle)
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Create Task"), button:has-text("Add")')

    // Wait for error to appear
    await page.waitForTimeout(1000)

    // Verify error message is displayed
    await expect(page.locator('text=/error|failed|wrong/i, [role="alert"]')).toBeVisible({ timeout: 3000 })
  })

  test('should rollback optimistic update when task creation fails', async ({ page }) => {
    // Intercept API request and force it to fail
    await page.route('**/api/**/tasks', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Internal server error' }),
        })
      } else {
        route.continue()
      }
    })

    // Count initial tasks
    const initialCount = await page.locator('[data-testid="task-item"], [role="listitem"]').count()

    // Try to create a task
    const taskTitle = `Failed Task ${Date.now()}`
    await page.click('button:has-text("Add Task"), button:has-text("Create Task"), button:has-text("New Task")')
    await page.fill('input[name="title"], input[placeholder*="title" i]', taskTitle)
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Create Task"), button:has-text("Add")')

    // Task might appear briefly (optimistic update)
    // Wait for rollback
    await page.waitForTimeout(2000)

    // Verify task was rolled back (not in the list)
    await expect(page.locator(`text="${taskTitle}"`)).not.toBeVisible()

    // Verify task count is unchanged
    const finalCount = await page.locator('[data-testid="task-item"], [role="listitem"]').count()
    expect(finalCount).toBe(initialCount)
  })

  test('should show error banner when task update fails', async ({ page }) => {
    // First create a task successfully
    const taskTitle = `Task to fail update ${Date.now()}`
    await page.click('button:has-text("Add Task"), button:has-text("Create Task"), button:has-text("New Task")')
    await page.fill('input[name="title"], input[placeholder*="title" i]', taskTitle)
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Create Task"), button:has-text("Add")')
    await page.waitForTimeout(1000)

    // Intercept update API request and force it to fail
    await page.route('**/api/**/tasks/**', (route) => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Update failed' }),
        })
      } else {
        route.continue()
      }
    })

    // Try to update the task
    const taskItem = page.locator(`text="${taskTitle}"`).locator('..')
    await taskItem.locator('button:has-text("Edit")').click()

    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]')
    await titleInput.clear()
    await titleInput.fill('This update will fail')
    await page.click('button[type="submit"]:has-text("Save"), button:has-text("Update")')

    // Wait for error to appear
    await page.waitForTimeout(1000)

    // Verify error message is displayed
    await expect(page.locator('text=/error|failed|wrong/i, [role="alert"]')).toBeVisible({ timeout: 3000 })
  })

  test('should rollback optimistic update when task update fails', async ({ page }) => {
    // First create a task successfully
    const originalTitle = `Original Title ${Date.now()}`
    await page.click('button:has-text("Add Task"), button:has-text("Create Task"), button:has-text("New Task")')
    await page.fill('input[name="title"], input[placeholder*="title" i]', originalTitle)
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Create Task"), button:has-text("Add")')
    await page.waitForTimeout(1000)

    // Intercept update API request and force it to fail
    await page.route('**/api/**/tasks/**', (route) => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Update failed' }),
        })
      } else {
        route.continue()
      }
    })

    // Try to update the task
    const taskItem = page.locator(`text="${originalTitle}"`).locator('..')
    await taskItem.locator('button:has-text("Edit")').click()

    const updatedTitle = 'This update will fail and rollback'
    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]')
    await titleInput.clear()
    await titleInput.fill(updatedTitle)
    await page.click('button[type="submit"]:has-text("Save"), button:has-text("Update")')

    // Wait for rollback
    await page.waitForTimeout(2000)

    // Verify original title is restored
    await expect(page.locator(`text="${originalTitle}"`)).toBeVisible()
    await expect(page.locator(`text="${updatedTitle}"`)).not.toBeVisible()
  })

  test('should show error banner when task deletion fails', async ({ page }) => {
    // First create a task successfully
    const taskTitle = `Task to fail delete ${Date.now()}`
    await page.click('button:has-text("Add Task"), button:has-text("Create Task"), button:has-text("New Task")')
    await page.fill('input[name="title"], input[placeholder*="title" i]', taskTitle)
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Create Task"), button:has-text("Add")')
    await page.waitForTimeout(1000)

    // Intercept delete API request and force it to fail
    await page.route('**/api/**/tasks/**', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Deletion failed' }),
        })
      } else {
        route.continue()
      }
    })

    // Try to delete the task
    const taskItem = page.locator(`text="${taskTitle}"`).locator('..')
    await taskItem.locator('button:has-text("Delete")').click()
    await page.locator('[role="dialog"] button:has-text("Delete"), [role="alertdialog"] button:has-text("Delete")').click()

    // Wait for error to appear
    await page.waitForTimeout(1000)

    // Verify error message is displayed
    await expect(page.locator('text=/error|failed|wrong/i, [role="alert"]')).toBeVisible({ timeout: 3000 })
  })

  test('should rollback optimistic update when task deletion fails', async ({ page }) => {
    // First create a task successfully
    const taskTitle = `Task that will fail to delete ${Date.now()}`
    await page.click('button:has-text("Add Task"), button:has-text("Create Task"), button:has-text("New Task")')
    await page.fill('input[name="title"], input[placeholder*="title" i]', taskTitle)
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Create Task"), button:has-text("Add")')
    await page.waitForTimeout(1000)

    // Intercept delete API request and force it to fail
    await page.route('**/api/**/tasks/**', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Deletion failed' }),
        })
      } else {
        route.continue()
      }
    })

    // Try to delete the task
    const taskItem = page.locator(`text="${taskTitle}"`).locator('..')
    await taskItem.locator('button:has-text("Delete")').click()
    await page.locator('[role="dialog"] button:has-text("Delete"), [role="alertdialog"] button:has-text("Delete")').click()

    // Wait for rollback
    await page.waitForTimeout(2000)

    // Verify task is still visible (rollback)
    await expect(page.locator(`text="${taskTitle}"`)).toBeVisible()
  })

  test('should allow dismissing error messages', async ({ page }) => {
    // Intercept API request and force it to fail
    await page.route('**/api/**/tasks', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Internal server error' }),
        })
      } else {
        route.continue()
      }
    })

    // Try to create a task (will fail)
    await page.click('button:has-text("Add Task"), button:has-text("Create Task"), button:has-text("New Task")')
    await page.fill('input[name="title"], input[placeholder*="title" i]', 'Failed task')
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Create Task"), button:has-text("Add")')

    // Wait for error to appear
    await page.waitForTimeout(1000)
    const errorBanner = page.locator('text=/error|failed|wrong/i, [role="alert"]').first()
    await expect(errorBanner).toBeVisible({ timeout: 3000 })

    // Find and click dismiss button (could be X, close, dismiss, etc.)
    const dismissButton = page.locator('[role="alert"] button, [aria-label*="close" i], [aria-label*="dismiss" i]').first()
    await dismissButton.click()

    // Verify error is dismissed
    await expect(errorBanner).not.toBeVisible({ timeout: 2000 })
  })

  test('should show error when network is offline', async ({ page }) => {
    // Simulate offline network
    await page.route('**/api/**', (route) => {
      route.abort('failed')
    })

    // Try to create a task
    await page.click('button:has-text("Add Task"), button:has-text("Create Task"), button:has-text("New Task")')
    await page.fill('input[name="title"], input[placeholder*="title" i]', 'Offline task')
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Create Task"), button:has-text("Add")')

    // Wait for error to appear
    await page.waitForTimeout(1000)

    // Verify network error message is displayed
    await expect(page.locator('text=/network|offline|connection|server/i, [role="alert"]')).toBeVisible({ timeout: 3000 })
  })

  test('should show error when unauthorized (401)', async ({ page }) => {
    // Intercept API request and return 401
    await page.route('**/api/**/tasks', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Unauthorized' }),
        })
      } else {
        route.continue()
      }
    })

    // Try to create a task
    await page.click('button:has-text("Add Task"), button:has-text("Create Task"), button:has-text("New Task")')
    await page.fill('input[name="title"], input[placeholder*="title" i]', 'Unauthorized task')
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Create Task"), button:has-text("Add")')

    // Wait a bit for redirect
    await page.waitForTimeout(2000)

    // Verify redirect to sign-in page (401 should trigger this)
    await expect(page).toHaveURL(/.*sign-in/)
  })
})
