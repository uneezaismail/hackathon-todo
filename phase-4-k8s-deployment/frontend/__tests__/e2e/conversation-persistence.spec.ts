/**
 * E2E tests for conversation persistence across browser sessions.
 *
 * Tests that conversations and messages persist when:
 * - User closes browser and reopens
 * - Server restarts
 * - User navigates away and returns
 *
 * Requires running Next.js dev server and FastAPI backend.
 */
import { test, expect, type Page } from '@playwright/test';

// Helper to wait for ChatKit widget to load
async function waitForChatWidget(page: Page) {
  await page.waitForSelector('[data-testid="chatkit-widget"]', { timeout: 10000 });
}

// Helper to send message in chat
async function sendChatMessage(page: Page, message: string) {
  const input = page.locator('[data-testid="chat-input"]');
  await input.fill(message);
  await input.press('Enter');
}

// Helper to get all messages in chat
async function getChatMessages(page: Page) {
  await page.waitForSelector('[data-testid="chat-message"]', { timeout: 5000 });
  const messages = await page.locator('[data-testid="chat-message"]').allTextContents();
  return messages;
}

test.describe('Conversation Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/sign-in');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('conversation persists after browser close and reopen', async ({ page, context }) => {
    // Open chat page
    await page.goto('/dashboard/chat');
    await waitForChatWidget(page);

    // Send initial message
    await sendChatMessage(page, 'Add task to buy groceries');
    await page.waitForTimeout(2000); // Wait for AI response

    // Get conversation ID from URL or localStorage
    const conversationId = await page.evaluate(() => {
      return localStorage.getItem('current_conversation_id');
    });

    // Verify messages are visible
    const messages1 = await getChatMessages(page);
    expect(messages1.length).toBeGreaterThan(0);
    expect(messages1.some(m => m.includes('groceries'))).toBeTruthy();

    // Close and reopen browser (simulate by closing page and creating new one)
    await page.close();
    const newPage = await context.newPage();

    // Login again
    await newPage.goto('/sign-in');
    await newPage.fill('[name="email"]', 'test@example.com');
    await newPage.fill('[name="password"]', 'testpassword123');
    await newPage.click('button[type="submit"]');
    await newPage.waitForURL('/dashboard');

    // Navigate to chat with same conversation ID
    await newPage.goto(`/dashboard/chat?conversation_id=${conversationId}`);
    await waitForChatWidget(newPage);

    // Verify previous messages are visible
    const messages2 = await getChatMessages(newPage);
    expect(messages2.length).toBeGreaterThan(0);
    expect(messages2.some(m => m.includes('groceries'))).toBeTruthy();
  });

  test('messages persist when navigating away and returning', async ({ page }) => {
    // Open chat page
    await page.goto('/dashboard/chat');
    await waitForChatWidget(page);

    // Send message
    await sendChatMessage(page, 'Show my tasks');
    await page.waitForTimeout(2000);

    // Save conversation ID
    const conversationId = await page.evaluate(() => {
      return localStorage.getItem('current_conversation_id');
    });

    // Verify messages exist
    const messages1 = await getChatMessages(page);
    const messageCount = messages1.length;
    expect(messageCount).toBeGreaterThan(0);

    // Navigate away
    await page.goto('/dashboard');
    await page.waitForTimeout(500);

    // Navigate back
    await page.goto(`/dashboard/chat?conversation_id=${conversationId}`);
    await waitForChatWidget(page);

    // Verify same messages still visible
    const messages2 = await getChatMessages(page);
    expect(messages2.length).toBe(messageCount);
  });

  test('conversation continues seamlessly after refresh', async ({ page }) => {
    // Open chat page
    await page.goto('/dashboard/chat');
    await waitForChatWidget(page);

    // Send first message
    await sendChatMessage(page, 'Hello');
    await page.waitForTimeout(2000);

    // Get conversation ID
    const conversationId = await page.evaluate(() => {
      return localStorage.getItem('current_conversation_id');
    });

    // Refresh page
    await page.reload();
    await waitForChatWidget(page);

    // Verify conversation ID is restored
    const restoredConversationId = await page.evaluate(() => {
      return localStorage.getItem('current_conversation_id');
    });
    expect(restoredConversationId).toBe(conversationId);

    // Send second message (should append to same conversation)
    await sendChatMessage(page, 'Add task to call dentist');
    await page.waitForTimeout(2000);

    // Verify both messages are in conversation
    const messages = await getChatMessages(page);
    expect(messages.some(m => m.includes('Hello'))).toBeTruthy();
    expect(messages.some(m => m.includes('dentist'))).toBeTruthy();
  });

  test('multiple conversations are maintained separately', async ({ page }) => {
    // Create first conversation
    await page.goto('/dashboard/chat');
    await waitForChatWidget(page);
    await sendChatMessage(page, 'Add task to buy milk');
    await page.waitForTimeout(2000);

    const conv1Id = await page.evaluate(() => {
      return localStorage.getItem('current_conversation_id');
    });

    // Create second conversation (new chat)
    await page.click('[data-testid="new-chat-button"]');
    await waitForChatWidget(page);
    await sendChatMessage(page, 'Add task to pay bills');
    await page.waitForTimeout(2000);

    const conv2Id = await page.evaluate(() => {
      return localStorage.getItem('current_conversation_id');
    });

    // Verify different conversation IDs
    expect(conv1Id).not.toBe(conv2Id);

    // Switch back to first conversation
    await page.goto(`/dashboard/chat?conversation_id=${conv1Id}`);
    await waitForChatWidget(page);

    // Verify first conversation content
    const messages1 = await getChatMessages(page);
    expect(messages1.some(m => m.includes('milk'))).toBeTruthy();
    expect(messages1.some(m => m.includes('bills'))).toBeFalsy();

    // Switch to second conversation
    await page.goto(`/dashboard/chat?conversation_id=${conv2Id}`);
    await waitForChatWidget(page);

    // Verify second conversation content
    const messages2 = await getChatMessages(page);
    expect(messages2.some(m => m.includes('bills'))).toBeTruthy();
    expect(messages2.some(m => m.includes('milk'))).toBeFalsy();
  });

  test('conversation history loads in chronological order', async ({ page }) => {
    // Open chat page
    await page.goto('/dashboard/chat');
    await waitForChatWidget(page);

    // Send multiple messages
    await sendChatMessage(page, 'First message');
    await page.waitForTimeout(1000);
    await sendChatMessage(page, 'Second message');
    await page.waitForTimeout(1000);
    await sendChatMessage(page, 'Third message');
    await page.waitForTimeout(2000);

    // Refresh page to force history reload
    await page.reload();
    await waitForChatWidget(page);

    // Get messages
    const messages = await page.locator('[data-testid="chat-message"]').allTextContents();

    // Find indices of our messages
    const firstIndex = messages.findIndex(m => m.includes('First message'));
    const secondIndex = messages.findIndex(m => m.includes('Second message'));
    const thirdIndex = messages.findIndex(m => m.includes('Third message'));

    // Verify chronological order
    expect(firstIndex).toBeGreaterThanOrEqual(0);
    expect(secondIndex).toBeGreaterThan(firstIndex);
    expect(thirdIndex).toBeGreaterThan(secondIndex);
  });

  test('empty conversation shows no messages', async ({ page }) => {
    // Create new conversation (no messages)
    await page.goto('/dashboard/chat');
    await waitForChatWidget(page);

    // Verify no messages displayed
    const messageCount = await page.locator('[data-testid="chat-message"]').count();
    expect(messageCount).toBe(0);

    // Verify empty state message or placeholder
    const emptyState = await page.locator('[data-testid="chat-empty-state"]').isVisible();
    expect(emptyState).toBeTruthy();
  });

  test('conversation list shows recent conversations', async ({ page }) => {
    // Create multiple conversations
    await page.goto('/dashboard/chat');
    await waitForChatWidget(page);
    await sendChatMessage(page, 'Conversation 1');
    await page.waitForTimeout(1000);

    await page.click('[data-testid="new-chat-button"]');
    await waitForChatWidget(page);
    await sendChatMessage(page, 'Conversation 2');
    await page.waitForTimeout(1000);

    // Open conversation list
    await page.click('[data-testid="conversation-list-button"]');

    // Verify at least 2 conversations shown
    const conversationItems = await page.locator('[data-testid="conversation-item"]').count();
    expect(conversationItems).toBeGreaterThanOrEqual(2);
  });
});
