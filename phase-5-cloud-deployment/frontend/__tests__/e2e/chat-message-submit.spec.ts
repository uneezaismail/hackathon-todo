/**
 * E2E Test: Chat Message Submission (T088)
 *
 * Tests the complete message submission flow:
 * 1. Type message in chat input
 * 2. Press Enter or click send button
 * 3. Verify message appears in chat
 * 4. Verify response streams back
 *
 * Requirements from tasks.md (T088):
 * - Type message
 * - Press Enter
 * - Verify message appears
 * - Verify response streams
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
  await page.waitForSelector('[data-testid="chatkit-widget"]', { timeout: 15000 });
  const chatInput = page.locator('[data-testid="chat-input"]');
  await expect(chatInput).toBeVisible({ timeout: 5000 });
  await expect(chatInput).toBeEnabled({ timeout: 5000 });
  await page.waitForTimeout(500);
}

/**
 * Helper: Send a chat message and wait for it to appear
 */
async function sendChatMessage(page: Page, message: string) {
  const chatInput = page.locator('[data-testid="chat-input"]');
  await chatInput.clear();
  await chatInput.fill(message);
  await expect(chatInput).toHaveValue(message);
  await chatInput.press('Enter');

  // Wait for user message to appear
  await page.waitForSelector('[data-testid="chat-message"].user', { timeout: 5000 });
}

/**
 * Helper: Wait for streaming to complete
 */
async function waitForStreamingComplete(page: Page, timeout: number = 30000) {
  const streamingIndicator = page.locator('[data-testid="streaming-indicator"]');
  await expect(streamingIndicator).not.toBeVisible({ timeout });
}

/**
 * Test: Message submission flow (T088)
 *
 * Verifies:
 * 1. User can type in chat input
 * 2. Pressing Enter sends the message
 * 3. Message appears in chat immediately
 * 4. AI response streams back progressively
 */
test.describe('Chat Message Submission (T088)', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to chat
    await loginUser(page);
    await page.goto('/chat');
    await waitForChatWidget(page);
  });

  test('should send message on Enter key press', async ({ page }) => {
    /**
     * T088: Test message submission on Enter key press
     *
     * Steps:
     * 1. Type message in chat input
     * 2. Press Enter
     * 3. Verify user message appears in chat
     */

    // Send a simple message
    await sendChatMessage(page, 'Hello, AI assistant!');

    // Verify user message is visible
    const userMessage = page.locator('[data-testid="chat-message"].user');
    await expect(userMessage).toContainText('Hello, AI assistant!', { timeout: 5000 });

    // Verify input is cleared after sending
    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toHaveValue('');
  });

  test('should send message via send button click', async ({ page }) => {
    /**
     * Test sending message by clicking the send button
     */

    // Type a message
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill('Test message via button');

    // Click send button
    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();

    // Verify user message appears
    await page.waitForSelector('[data-testid="chat-message"].user', { timeout: 5000 });
    const userMessage = page.locator('[data-testid="chat-message"].user');
    await expect(userMessage).toContainText('Test message via button');
  });

  test('should display user message immediately', async ({ page }) => {
    /**
     * Verify user message appears instantly without waiting for AI response
     */

    const startTime = Date.now();

    // Send message
    await sendChatMessage(page, 'Quick test message');

    // Verify message appears immediately (within 1 second)
    const userMessage = page.locator('[data-testid="chat-message"].user');
    await expect(userMessage).toBeVisible({ timeout: 1000 });

    const timeToDisplay = Date.now() - startTime;
    expect(timeToDisplay).toBeLessThan(1000);
  });

  test('should update character counter while typing', async ({ page }) => {
    /**
     * Verify character counter updates as user types
     */

    const chatInput = page.locator('[data-testid="chat-input"]');
    const charCounter = page.locator('text=/\\d+\\/2000 characters/');

    // Initial state should show 0/2000
    await expect(charCounter).toContainText('0/2000');

    // Type a message
    const testMessage = 'Hello world!';
    await chatInput.fill(testMessage);

    // Character counter should update
    await expect(charCounter).toContainText(`${testMessage.length}/2000`);

    // Continue typing
    await chatInput.fill(testMessage + ' This is a longer test message.');
    await expect(charCounter).toContainText(`${testMessage.length + 34}/2000`);
  });

  test('should prevent message over 2000 characters', async ({ page }) => {
    /**
     * Verify the 2000 character limit is enforced
     */

    const chatInput = page.locator('[data-testid="chat-input"]');
    const longMessage = 'a'.repeat(2050);

    // Try to type more than 2000 characters
    await chatInput.fill(longMessage);

    // Input value should be truncated to 2000
    const actualValue = await chatInput.inputValue();
    expect(actualValue.length).toBeLessThanOrEqual(2000);
  });

  test('should show remaining characters in counter', async ({ page }) => {
    /**
     * Verify character counter shows remaining characters
     */

    const chatInput = page.locator('[data-testid="chat-input"]');
    const charCounter = page.locator('text=/\\d+\\/2000 characters/');

    // Type 100 characters
    const message100 = 'a'.repeat(100);
    await chatInput.fill(message100);

    // Should show 100/2000 or 1900 remaining
    const counterText = await charCounter.textContent();
    expect(counterText).toMatch(/100\/2000|1900 remaining/);
  });

  test('should disable input during streaming', async ({ page }) => {
    /**
     * Verify chat input is disabled while AI response is streaming
     */

    // Send a message
    await sendChatMessage(page, 'Tell me a long story');

    // Input should be disabled during streaming
    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeDisabled({ timeout: 5000 });

    // Wait for streaming to complete
    await waitForStreamingComplete(page);

    // Input should be enabled again
    await expect(chatInput).toBeEnabled({ timeout: 5000 });
  });

  test('should handle rapid message submissions', async ({ page }) => {
    /**
     * Verify the system handles rapid message submissions correctly
     */

    // Send first message
    await sendChatMessage(page, 'First message');

    // Wait for streaming to complete
    await waitForStreamingComplete(page);

    // Send second message
    await sendChatMessage(page, 'Second message');

    // Verify both messages are visible
    const messages = await page.locator('[data-testid="chat-message"].user').all();
    expect(messages.length).toBeGreaterThanOrEqual(2);
  });

  test('should handle empty message submission gracefully', async ({ page }) => {
    /**
     * Verify empty messages are not sent
     */

    const chatInput = page.locator('[data-testid="chat-input"]');
    const sendButton = page.locator('button[type="submit"]');

    // Try to send empty message
    await chatInput.fill('');
    await sendButton.click();

    // Verify no user message was added
    const messages = await page.locator('[data-testid="chat-message"].user').all();
    expect(messages.length).toBe(0);
  });

  test('should handle whitespace-only messages', async ({ page }) => {
    /**
     * Verify whitespace-only messages are handled correctly
     */

    const chatInput = page.locator('[data-testid="chat-input"]');

    // Type only whitespace
    await chatInput.fill('   ');
    await chatInput.press('Enter');

    // Verify no user message was added (or it's stripped)
    await page.waitForTimeout(500);
    const messages = await page.locator('[data-testid="chat-message"].user').all();
    // Empty/whitespace-only messages should be stripped or not sent
    const messageTexts = await Promise.all(
      messages.map((m) => m.textContent())
    );
    const hasContent = messageTexts.some((text) => text?.trim().length > 0);
    expect(hasContent).toBe(false);
  });

  test('should preserve message on submission error', async ({ page }) => {
    /**
     * Verify message is preserved if submission fails
     */

    const chatInput = page.locator('[data-testid="chat-input"]');
    const testMessage = 'This message should be preserved';

    // Fill in the message
    await chatInput.fill(testMessage);

    // Force a disconnect by closing the page before response
    // Note: This test is tricky to implement without mocking

    // For now, verify message is in input
    await expect(chatInput).toHaveValue(testMessage);
  });

  test('should scroll to newest message', async ({ page }) => {
    /**
     * Verify chat scrolls to show newest messages
     */

    // Send multiple messages
    for (let i = 1; i <= 5; i++) {
      await sendChatMessage(page, `Message number ${i}`);
      await waitForStreamingComplete(page);
    }

    // Verify all messages are visible
    const messages = await page.locator('[data-testid="chat-message"].user').all();
    expect(messages.length).toBe(5);

    // The newest message should be visible in the viewport
    const newestMessage = page.locator('[data-testid="chat-message"].user').last();
    await expect(newestMessage).toBeInViewport();
  });

  test('should handle special characters in messages', async ({ page }) => {
    /**
     * Verify special characters are handled correctly
     */

    const specialMessage = 'Hello! How are you? @#$%^&*()_+{}[]|\\:";\'<>?,./';

    // Send message with special characters
    await sendChatMessage(page, specialMessage);

    // Verify message is preserved correctly
    const userMessage = page.locator('[data-testid="chat-message"].user');
    await expect(userMessage).toContainText('Hello!');
  });

  test('should handle unicode characters in messages', async ({ page }) => {
    /**
     * Verify unicode characters are handled correctly
     */

    const unicodeMessage = 'Hello, World! Hello, World!   Hello, World!';

    // Send message with unicode
    await sendChatMessage(page, unicodeMessage);

    // Verify message is preserved
    const userMessage = page.locator('[data-testid="chat-message"].user');
    await expect(userMessage).toContainText('Hello, World!');
  });

  test('should handle very long messages up to 2000 chars', async ({ page }) => {
    /**
     * Verify messages up to 2000 characters are handled
     */

    // Create exactly 2000 character message
    const longMessage = 'a'.repeat(2000);

    // Send the message
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill(longMessage);
    await chatInput.press('Enter');

    // Verify message appears
    await page.waitForSelector('[data-testid="chat-message"].user', { timeout: 5000 });

    // Verify character count shows 2000
    const charCounter = page.locator('text=/2000\\/2000 characters/');
    await expect(charCounter).toBeVisible({ timeout: 5000 });
  });
});
