/**
 * E2E Test: Chat Page Rendering (T086)
 *
 * Tests that the ChatKit widget loads correctly on the /chat route:
 * 1. Navigate to /chat
 * 2. Verify ChatKit widget container is present
 * 3. Verify widget loads without errors
 * 4. Verify key UI elements are visible
 *
 * Requirements from tasks.md (T086):
 * - Navigate to /chat
 * - Verify ChatKit widget loads
 */

import { test, expect, type Page } from '@playwright/test';

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
};

/**
 * Helper: Login and navigate to chat
 */
async function loginUser(page: Page) {
  await page.goto('/sign-in');
  await page.fill('[name="email"]', TEST_USER.email);
  await page.fill('[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

/**
 * Helper: Wait for ChatKit widget to fully load
 */
async function waitForChatWidget(page: Page) {
  // Wait for ChatKit widget container
  await page.waitForSelector('[data-testid="chatkit-widget"]', { timeout: 15000 });

  // Wait for chat input to be visible and enabled
  const chatInput = page.locator('[data-testid="chat-input"]');
  await expect(chatInput).toBeVisible({ timeout: 5000 });
  await expect(chatInput).toBeEnabled({ timeout: 5000 });

  // Small delay to ensure widget is fully initialized
  await page.waitForTimeout(500);
}

/**
 * Test: Chat page renders correctly (T086)
 *
 * Verifies:
 * 1. /chat route loads successfully
 * 2. Page title and description are visible
 * 3. ChatKit widget container is present
 * 4. Chat input is ready for user interaction
 */
test.describe('Chat Page Rendering (T086)', () => {
  test.beforeEach(async ({ page }) => {
    // Login user before each test
    await loginUser(page);
  });

  test('should render chat page with ChatKit widget', async ({ page }) => {
    /**
     * T086: Verify ChatKit widget loads on /chat route
     *
     * Steps:
     * 1. Navigate to /chat
     * 2. Verify page header is visible
     * 3. Verify ChatKit widget container exists
     * 4. Verify chat input is ready
     */

    // Navigate to chat page
    await page.goto('/chat');

    // Verify page header
    await expect(page.locator('h1')).toContainText('AI Chat Assistant', { timeout: 5000 });
    await expect(page.locator('p.text-muted-foreground')).toBeVisible({ timeout: 5000 });

    // Verify ChatKit widget container
    await expect(page.locator('[data-testid="chatkit-widget"]')).toBeVisible({ timeout: 10000 });

    // Verify chat input is ready
    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible({ timeout: 5000 });
    await expect(chatInput).toBeEnabled({ timeout: 5000 });

    // Verify character counter is visible
    await expect(page.locator('text=/\\d+\\/2000 characters/')).toBeVisible({ timeout: 5000 });
  });

  test('should show empty state when no messages', async ({ page }) => {
    /**
     * Verify empty state is shown when no messages exist
     */

    await page.goto('/chat');
    await waitForChatWidget(page);

    // Verify empty state message
    const emptyState = page.locator('text=/Start a conversation/Ask me to help/i');
    await expect(emptyState).toBeVisible({ timeout: 5000 });
  });

  test('should display user message after sending', async ({ page }) => {
    /**
     * Verify user messages appear in the chat
     */

    await page.goto('/chat');
    await waitForChatWidget(page);

    // Send a simple message
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill('Hello, this is a test message');
    await chatInput.press('Enter');

    // Verify user message appears
    await expect(page.locator('[data-testid="chat-message"].user')).toBeVisible({ timeout: 5000 });
  });

  test('should handle page reload gracefully', async ({ page }) => {
    /**
     * Verify chat page reloads without errors
     */

    await page.goto('/chat');
    await waitForChatWidget(page);

    // Reload the page
    await page.reload();

    // Verify page loads correctly after reload
    await expect(page.locator('h1')).toContainText('AI Chat Assistant', { timeout: 10000 });
    await expect(page.locator('[data-testid="chatkit-widget"]')).toBeVisible({ timeout: 10000 });
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    /**
     * Verify chat page is responsive on mobile
     */

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/chat');

    // Verify page content is visible on mobile
    await expect(page.locator('h1')).toContainText('AI Chat Assistant', { timeout: 5000 });

    // Verify widget container is visible
    await expect(page.locator('[data-testid="chatkit-widget"]')).toBeVisible({ timeout: 10000 });

    // Verify input is accessible on mobile
    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible({ timeout: 5000 });
  });

  test('should not have console errors on page load', async ({ page }) => {
    /**
     * Verify no critical console errors on page load
     */

    const consoleErrors: string[] = [];

    // Collect console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/chat');
    await waitForChatWidget(page);

    // Wait a bit for any async errors
    await page.waitForTimeout(2000);

    // Filter out known non-critical errors
    const criticalErrors = consoleErrors.filter(
      (error) =>
        !error.includes('favicon') &&
        !error.includes('Download the React DevTools') &&
        !error.includes('Warning:')
    );

    // Should have no critical console errors
    expect(criticalErrors.length).toBe(0);
  });
});
