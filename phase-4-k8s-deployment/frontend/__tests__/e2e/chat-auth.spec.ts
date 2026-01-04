/**
 * E2E Test: Chat Authentication Requirement (T087)
 *
 * Tests that the /chat route requires authentication:
 * 1. Access /chat without auth
 * 2. Verify redirect to sign-in page
 * 3. Verify proper callback URL after sign-in
 *
 * Requirements from tasks.md (T087):
 * - Access /chat without auth
 * - Verify redirect to sign-in
 */

import { test, expect, type Page } from '@playwright/test';

/**
 * Helper: Clear authentication state
 */
async function clearAuthState(page: Page, context: any) {
  // Clear all cookies
  await context.clearCookies();

  // Clear localStorage and sessionStorage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Helper: Wait for redirect to sign-in
 */
async function waitForSignInRedirect(page: Page, expectedCallback?: string) {
  // Wait for URL to contain sign-in
  await page.waitForURL(/\/sign-in/, { timeout: 5000 });

  // Verify sign-in page is loaded
  await expect(page.locator('h1')).toContainText(/Sign In|Sign in/i, { timeout: 5000 });

  // If callback URL expected, verify it's present
  if (expectedCallback) {
    await expect(page).toHaveURL(expect.stringContaining(expectedCallback));
  }
}

/**
 * Test: Authentication requirement for /chat (T087)
 *
 * Verifies:
 * 1. Unauthenticated users are redirected to sign-in
 * 2. Callback URL is preserved for post-login redirect
 * 3. After sign-in, user can access /chat
 */
test.describe('Chat Authentication Requirement (T087)', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear auth state before each test
    await clearAuthState(page, context);
  });

  test('should redirect to sign-in when accessing /chat without auth', async ({ page }) => {
    /**
     * T087: Verify redirect to sign-in when accessing /chat without auth
     *
     * Steps:
     * 1. Clear all authentication state
     * 2. Navigate to /chat
     * 3. Verify redirect to /sign-in
     * 4. Verify callback URL is preserved
     */

    // Navigate to /chat without being authenticated
    await page.goto('/chat');

    // Should redirect to sign-in
    await waitForSignInRedirect(page, '/chat');
  });

  test('should preserve callback URL for redirect after login', async ({ page }) => {
    /**
     * Verify that the callback URL is preserved in the redirect
     */

    // Navigate to /chat (will redirect to sign-in)
    await page.goto('/chat');

    // Verify redirect happened and callback URL is preserved
    await page.waitForURL(/\/sign-in.*callbackUrl.*chat/, { timeout: 5000 });

    // Verify sign-in page has the form
    await expect(page.locator('form')).toBeVisible({ timeout: 5000 });
  });

  test('should redirect to /chat after successful sign-in', async ({ page }) => {
    /**
     * Verify that after signing in, user is redirected back to /chat
     */

    // Navigate to /chat (redirects to sign-in)
    await page.goto('/chat');
    await page.waitForURL(/\/sign-in/, { timeout: 5000 });

    // Fill in sign-in credentials
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'testpassword123');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to /chat after successful login
    await page.waitForURL(/\/chat/, { timeout: 10000 });

    // Verify chat page is loaded
    await expect(page.locator('h1')).toContainText('AI Chat Assistant', { timeout: 5000 });
  });

  test('should show chat widget after authentication', async ({ page }) => {
    /**
     * Verify that the chat widget is visible after authentication
     */

    // Navigate to /chat (redirects to sign-in)
    await page.goto('/chat');
    await page.waitForURL(/\/sign-in/, { timeout: 5000 });

    // Sign in
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // Wait for chat page
    await page.waitForURL(/\/chat/, { timeout: 10000 });

    // Wait for chat widget to load
    await expect(page.locator('[data-testid="chatkit-widget"]')).toBeVisible({ timeout: 10000 });
  });

  test('should not allow access to /chat with invalid session', async ({ page, context }) => {
    /**
     * Verify that invalid/expired sessions also trigger redirect
     */

    // Set an invalid session token
    await page.evaluate(() => {
      localStorage.setItem('better-auth.session_token', 'invalid-token-12345');
    });

    // Try to access /chat
    await page.goto('/chat');

    // Should redirect to sign-in (session validation fails)
    await page.waitForURL(/\/sign-in/, { timeout: 10000 });
  });

  test('should handle session expiry gracefully', async ({ page, context }) => {
    /**
     * Test that session expiry triggers re-authentication
     */

    // First, authenticate normally
    await page.goto('/sign-in');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // Now clear session but keep page state
    await page.evaluate(() => {
      localStorage.removeItem('better-auth.session_token');
      localStorage.removeItem('better-auth.user');
    });

    // Try to navigate to /chat
    await page.goto('/chat');

    // Should redirect to sign-in
    await waitForSignInRedirect(page);
  });

  test('should redirect from /chat to sign-in for various auth states', async ({ page }) => {
    /**
     * Test redirect behavior with different invalid auth scenarios
     */

    // Test 1: No session data
    await page.goto('/chat');
    await page.waitForURL(/\/sign-in/, { timeout: 5000 });

    // Test 2: Empty session token
    await page.goto('/sign-in');
    await page.evaluate(() => {
      localStorage.setItem('better-auth.session_token', '');
    });
    await page.goto('/chat');
    await page.waitForURL(/\/sign-in/, { timeout: 5000 });

    // Test 3: Malformed session data
    await page.goto('/sign-in');
    await page.evaluate(() => {
      localStorage.setItem('better-auth.session_token', 'not-a-valid-jwt');
      localStorage.setItem('better-auth.user', '{invalid json');
    });
    await page.goto('/chat');
    await page.waitForURL(/\/sign-in/, { timeout: 5000 });
  });

  test('should work with rememberMe flow', async ({ page, context }) => {
    /**
     * Test that "remember me" functionality works with chat page
     */

    // Navigate to /chat (redirects to sign-in)
    await page.goto('/chat');
    await page.waitForURL(/\/sign-in/, { timeout: 5000 });

    // Sign in with remember me (typically a checkbox)
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'testpassword123');

    // Check if remember me checkbox exists and check it
    const rememberMeCheckbox = page.locator('[name="remember"]');
    if (await rememberMeCheckbox.count() > 0) {
      await rememberMeCheckbox.check();
    }

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to /chat after successful login
    await page.waitForURL(/\/chat/, { timeout: 10000 });

    // Verify localStorage has session data for remember me
    const sessionToken = await page.evaluate(() => {
      return localStorage.getItem('better-auth.session_token');
    });
    expect(sessionToken).toBeTruthy();
  });
});
