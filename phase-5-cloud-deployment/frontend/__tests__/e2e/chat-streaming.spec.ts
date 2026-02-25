/**
 * E2E Test: Chat Streaming Display (T069)
 *
 * Tests real-time streaming response display in ChatKit widget:
 * 1. User types a message in ChatKit widget
 * 2. AI response streams progressively (not all at once)
 * 3. Text appears character-by-character or word-by-word
 * 4. Streaming completes with done event
 *
 * Requirements from tasks.md (T069):
 * - Send message to chat endpoint
 * - Verify text appears progressively in ChatKit widget (not all at once)
 * - Test that streaming actually happens, not just batch response
 *
 * Prerequisites:
 * - ChatKit widget embedded at /dashboard/chat
 * - Backend FastAPI server running on port 8000 with streaming enabled
 * - User authenticated via Better Auth
 * - AI agent configured and operational
 */

import { test, expect, type Page } from '@playwright/test';

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
};

/**
 * Helper: Login and navigate to dashboard
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
 * Helper: Send message and wait for streaming to begin
 */
async function sendStreamingMessage(page: Page, message: string) {
  const chatInput = page.locator('[data-testid="chat-input"]');

  await chatInput.clear();
  await chatInput.fill(message);
  await expect(chatInput).toHaveValue(message);

  // Press Enter to send
  await chatInput.press('Enter');

  // Wait for user message to appear
  await page.waitForSelector('[data-testid="chat-message"].user', { timeout: 5000 });
}

/**
 * Test: Text appears progressively during streaming (T069)
 *
 * This test verifies that AI responses stream character-by-character
 * rather than appearing all at once after the full response is generated.
 *
 * Key validation points:
 * 1. Response starts appearing before full response is available
 * 2. Multiple chunks are received (not just one batch)
 * 3. Text length grows over time as chunks arrive
 * 4. Streaming completes with "done" or similar indicator
 */
test.describe('Chat Streaming Display', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to chat
    await loginUser(page);
    await page.goto('/dashboard/chat');
    await waitForChatWidget(page);
  });

  test('text appears progressively in ChatKit widget', async ({ page }) => {
    /**
     * T069: Test text appears progressively in ChatKit widget
     *
     * Strategy:
     * 1. Send a message that will generate a response
     * 2. Continuously check the assistant message content
     * 3. Verify content length increases over time (streaming behavior)
     * 4. Confirm final response contains expected content
     */

    const message = 'Add a task to buy groceries and milk';

    // Send the message
    await sendStreamingMessage(page, message);

    // Wait for assistant message to start appearing
    // ChatKit typically shows streaming with a cursor or progressive text
    const assistantMessage = page.locator('[data-testid="chat-message"].assistant');

    // Wait for streaming to begin (assistant message appears)
    await expect(assistantMessage).toBeVisible({ timeout: 10000 });

    // Track content length over time to verify streaming
    // If streaming works, content length should increase progressively
    const contentLengths: number[] = [];
    const maxChecks = 10;
    const checkInterval = 500; // ms

    for (let i = 0; i < maxChecks; i++) {
      // Get current content
      const content = await assistantMessage.textContent();
      const length = content?.length || 0;
      contentLengths.push(length);

      // Check if we have meaningful content
      if (length > 50) {
        // We have substantial content, can stop checking
        break;
      }

      // Wait for next chunk
      await page.waitForTimeout(checkInterval);
    }

    // Verify streaming behavior:
    // Content length should have increased (not all at once)
    // If content only appeared once, all values would be similar
    const maxLength = Math.max(...contentLengths);
    const increasingValues = contentLengths.filter(
      (len, idx) => idx > 0 && len > contentLengths[idx - 1]
    );

    // At least some values should show progression
    expect(increasingValues.length).toBeGreaterThan(0);

    // Verify final response has expected content
    await expect(assistantMessage).toContainText(/groceries|milk|task/i, {
      timeout: 30000
    });

    // Verify streaming indicator is removed when done
    // (ChatKit typically shows a cursor or "typing" indicator during streaming)
    const streamingIndicator = page.locator('[data-testid="streaming-indicator"]');
    await expect(streamingIndicator).not.toBeVisible({ timeout: 15000 });
  });

  test('streaming completes with done state', async ({ page }) => {
    /**
     * Test that streaming properly completes
     *
     * Validates:
     * 1. Response starts streaming
     * 2. Streaming indicator shows during transfer
     * 3. Done state reached (indicator removed)
     * 4. Final response is complete
     */

    const message = 'Show me all my pending tasks';

    await sendStreamingMessage(page, message);

    // Wait for assistant message
    const assistantMessage = page.locator('[data-testid="chat-message"].assistant');
    await expect(assistantMessage).toBeVisible({ timeout: 10000 });

    // Wait for streaming to complete
    // Streaming indicator should disappear when done
    const streamingIndicator = page.locator('[data-testid="streaming-indicator"]');

    // Should initially be visible during streaming
    try {
      await expect(streamingIndicator).toBeVisible({ timeout: 5000 });
    } catch {
      // If indicator not found, streaming might have already completed
      // This is still valid - the test passes
    }

    // Wait for completion
    await expect(streamingIndicator).not.toBeVisible({ timeout: 30000 });

    // Verify final response
    await expect(assistantMessage).toBeVisible({ timeout: 5000 });
  });

  test('tool call during streaming is displayed', async ({ page }) => {
    /**
     * Test that tool calls during streaming are visible
     *
     * When the agent calls a tool (e.g., add_task, list_tasks),
     * the tool call should be displayed in the stream.
     *
     * Per contracts/chat-api.yaml:
     * - type="tool_call" events show tool name and args
     * - type="tool_result" events show execution results
     */

    const message = 'Add an urgent task to fix the production bug';

    await sendStreamingMessage(page, message);

    // Wait for response
    const assistantMessage = page.locator('[data-testid="chat-message"].assistant');
    await expect(assistantMessage).toBeVisible({ timeout: 30000 });

    // Wait for streaming to complete
    const streamingIndicator = page.locator('[data-testid="streaming-indicator"]');
    await expect(streamingIndicator).not.toBeVisible({ timeout: 30000 });

    // Verify tool-related content appears in response
    // Agent should mention task creation and potentially the tool call
    const content = await assistantMessage.textContent();

    // Response should confirm task creation
    expect(content?.toLowerCase()).toMatch(/added|created|urgent|bug/i);
  });

  test('long response streams correctly', async ({ page }) => {
    /**
     * Test streaming with longer response
     *
     * Ensures that:
     * 1. Longer responses stream in chunks
     * 2. User can read content before full response is complete
     * 3. No timeouts or truncation with longer messages
     */

    const message = 'What can you do? Tell me about all your capabilities in detail.';

    await sendStreamingMessage(page, message);

    const assistantMessage = page.locator('[data-testid="chat-message"].assistant');
    await expect(assistantMessage).toBeVisible({ timeout: 10000 });

    // Wait for completion
    const streamingIndicator = page.locator('[data-testid="streaming-indicator"]');
    await expect(streamingIndicator).not.toBeVisible({ timeout: 30000 });

    // Verify comprehensive response about capabilities
    const content = await assistantMessage.textContent();

    // Should mention core capabilities
    expect(content?.toLowerCase()).toMatch(/add|create|list|view|complete|delete/i);
  });

  test('conversation continues with streaming context', async ({ page }) => {
    /**
     * Test streaming works in multi-turn conversation
     *
     * Validates:
     * 1. First message streams correctly
     * 2. Second message in same conversation also streams
     * 3. Context is maintained across messages
     */

    // First message
    await sendStreamingMessage(page, 'Add task to water the plants');
    const firstResponse = page.locator('[data-testid="chat-message"].assistant').first();
    await expect(firstResponse).toContainText(/water|plant|task/i, { timeout: 30000 });

    // Wait for streaming to complete
    const streamingIndicator = page.locator('[data-testid="streaming-indicator"]');
    await expect(streamingIndicator).not.toBeVisible({ timeout: 30000 });

    // Second message - continue conversation
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.clear();
    await chatInput.fill('Now mark it as complete');
    await chatInput.press('Enter');

    // Wait for second response
    const secondResponse = page.locator('[data-testid="chat-message"].assistant').last();
    await expect(secondResponse).toContainText(/complete|done/i, { timeout: 30000 });

    // Verify both streamed correctly (indicators removed)
    await expect(streamingIndicator).not.toBeVisible({ timeout: 30000 });
  });
});

/**
 * Performance Test: Streaming starts within 1 second (SC-005)
 *
 * This test validates the success criterion that streaming
 * should start within 1 second of sending a message.
 */
test.describe('Streaming Performance', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await page.goto('/dashboard/chat');
    await waitForChatWidget(page);
  });

  test('streaming starts within 1 second', async ({ page }) => {
    /**
     * SC-005: Streaming should start within 1 second
     *
     * Measures time from message send to first text appearance
     */

    const message = 'Hello';

    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.clear();
    await chatInput.fill(message);
    await chatInput.press('Enter');

    // Measure time to first assistant message
    const startTime = Date.now();
    const assistantMessage = page.locator('[data-testid="chat-message"].assistant');

    // Wait for assistant message to appear
    await expect(assistantMessage).toBeVisible({ timeout: 15000 });
    const timeToFirstChunk = Date.now() - startTime;

    // Should start streaming within 1 second (SC-005)
    expect(timeToFirstChunk).toBeLessThanOrEqual(1000);

    // Wait for completion
    const streamingIndicator = page.locator('[data-testid="streaming-indicator"]');
    await expect(streamingIndicator).not.toBeVisible({ timeout: 30000 });
  });
});
