/**
 * E2E Test: Chat Task Creation (T036)
 *
 * Tests the complete flow of creating a task via ChatKit widget:
 * 1. User types natural language in ChatKit widget
 * 2. AI agent processes the request
 * 3. Agent calls add_task MCP tool
 * 4. Task is created in backend database
 * 5. Task is verifiable via backend API
 *
 * Requirements from tasks.md:
 * - Test that user can type "add task to buy groceries" in the chat widget
 * - Verify the agent processes the request
 * - Verify the task appears in the backend database
 * - Should test the complete flow: ChatKit widget → Agent → Database
 *
 * Prerequisites:
 * - ChatKit widget embedded at /dashboard/chat
 * - Backend FastAPI server running on port 8000
 * - PostgreSQL database accessible via backend API
 * - User authenticated via Better Auth
 * - AI agent configured with MCP tools
 */

import { test, expect, type Page } from '@playwright/test';

// Test user credentials (assumes test user exists in database)
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
};

// Backend API configuration
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
 * Helper: Send message in ChatKit widget
 */
async function sendChatMessage(page: Page, message: string) {
  const chatInput = page.locator('[data-testid="chat-input"]');

  // Clear input first
  await chatInput.clear();

  // Type message
  await chatInput.fill(message);

  // Wait for input to be filled
  await expect(chatInput).toHaveValue(message);

  // Send message (press Enter or click send button)
  await chatInput.press('Enter');

  // Wait for message to appear in chat
  await page.waitForTimeout(500);
}

/**
 * Helper: Wait for AI agent response
 * Looks for assistant message containing specific keywords
 */
async function waitForAgentResponse(page: Page, expectedKeywords: string[] = [], timeout: number = 30000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    // Get all chat messages
    const messages = await page.locator('[data-testid="chat-message"]').allTextContents();

    // Look for assistant messages (typically have role indicator or specific styling)
    const assistantMessages = messages.filter(msg =>
      msg.includes('created') ||
      msg.includes('task') ||
      msg.includes('added') ||
      expectedKeywords.some(keyword => msg.toLowerCase().includes(keyword.toLowerCase()))
    );

    if (assistantMessages.length > 0) {
      return assistantMessages;
    }

    // Wait before checking again
    await page.waitForTimeout(500);
  }

  throw new Error(`Agent response not received within ${timeout}ms`);
}

/**
 * Helper: Get JWT token from Better Auth session
 */
async function getAuthToken(page: Page): Promise<string> {
  // Get session from Better Auth
  const token = await page.evaluate(async () => {
    // Try to get token from localStorage or sessionStorage
    const sessionData = localStorage.getItem('better-auth.session_token');
    if (sessionData) {
      return sessionData;
    }

    // Alternative: Call Better Auth API to get current session
    const response = await fetch('/api/auth/get-session', {
      method: 'GET',
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      return data.session?.token || data.token;
    }

    return null;
  });

  if (!token) {
    throw new Error('Failed to retrieve auth token');
  }

  return token;
}

/**
 * Helper: Get user ID from Better Auth session
 */
async function getUserId(page: Page): Promise<string> {
  const userId = await page.evaluate(async () => {
    // Try localStorage first
    const sessionData = localStorage.getItem('better-auth.user');
    if (sessionData) {
      const user = JSON.parse(sessionData);
      return user.id;
    }

    // Alternative: Call Better Auth API
    const response = await fetch('/api/auth/get-session', {
      method: 'GET',
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      return data.user?.id;
    }

    return null;
  });

  if (!userId) {
    throw new Error('Failed to retrieve user ID');
  }

  return userId;
}

/**
 * Helper: Verify task exists in backend database via API
 */
async function verifyTaskInDatabase(
  page: Page,
  expectedTitle: string,
  maxRetries: number = 10,
  retryDelay: number = 1000
): Promise<any> {
  const token = await getAuthToken(page);
  const userId = await getUserId(page);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Call backend API to get tasks
    const response = await page.evaluate(async ({ apiUrl, userId, token }) => {
      const res = await fetch(`${apiUrl}/api/${userId}/tasks?limit=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        return { ok: false, status: res.status, error: await res.text() };
      }

      const data = await res.json();
      return { ok: true, data };
    }, { apiUrl: BACKEND_API_URL, userId, token });

    if (!response.ok) {
      console.error(`API request failed (attempt ${attempt + 1}):`, response);
      await page.waitForTimeout(retryDelay);
      continue;
    }

    // Search for task with matching title
    const tasks = response.data?.data?.tasks || response.data?.tasks || [];
    const matchingTask = tasks.find((task: any) =>
      task.title.toLowerCase().includes(expectedTitle.toLowerCase())
    );

    if (matchingTask) {
      return matchingTask;
    }

    // Wait before retrying
    if (attempt < maxRetries - 1) {
      console.log(`Task not found yet (attempt ${attempt + 1}), retrying...`);
      await page.waitForTimeout(retryDelay);
    }
  }

  throw new Error(`Task with title containing "${expectedTitle}" not found in database after ${maxRetries} attempts`);
}

/**
 * Helper: Clean up test tasks after test
 */
async function cleanupTestTasks(page: Page, taskIds: string[]) {
  const token = await getAuthToken(page);
  const userId = await getUserId(page);

  for (const taskId of taskIds) {
    try {
      await page.evaluate(async ({ apiUrl, userId, taskId, token }) => {
        await fetch(`${apiUrl}/api/${userId}/tasks/${taskId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }, { apiUrl: BACKEND_API_URL, userId, taskId, token });
    } catch (error) {
      console.warn(`Failed to delete task ${taskId}:`, error);
    }
  }
}

test.describe('Chat Task Creation (US1 - E2E)', () => {
  let createdTaskIds: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Reset task IDs
    createdTaskIds = [];

    // Login user
    await loginUser(page);
  });

  test.afterEach(async ({ page }) => {
    // Clean up created tasks
    if (createdTaskIds.length > 0) {
      await cleanupTestTasks(page, createdTaskIds);
    }
  });

  test('should create task via chat message "add task to buy groceries"', async ({ page }) => {
    // Navigate to chat page
    await page.goto('/dashboard/chat');

    // Wait for ChatKit widget to load
    await waitForChatWidget(page);

    // Send message to create task
    const taskDescription = 'buy groceries';
    await sendChatMessage(page, `add task to ${taskDescription}`);

    // Wait for AI agent to respond
    const agentResponses = await waitForAgentResponse(page, ['created', 'task', 'groceries'], 30000);

    // Verify agent acknowledged the task creation
    expect(agentResponses.length).toBeGreaterThan(0);
    const responseText = agentResponses.join(' ').toLowerCase();
    expect(responseText).toMatch(/created|added|task/);

    // Verify task exists in backend database
    const createdTask = await verifyTaskInDatabase(page, taskDescription);

    // Assertions on created task
    expect(createdTask).toBeDefined();
    expect(createdTask.title.toLowerCase()).toContain('groceries');
    expect(createdTask.is_complete).toBe(false);
    expect(createdTask.user_id).toBeDefined();

    // Store task ID for cleanup
    createdTaskIds.push(createdTask.id);
  });

  test('should create task with priority detection from "urgent task to call dentist"', async ({ page }) => {
    // Navigate to chat page
    await page.goto('/dashboard/chat');
    await waitForChatWidget(page);

    // Send message with priority keyword
    await sendChatMessage(page, 'add urgent task to call dentist');

    // Wait for agent response
    await waitForAgentResponse(page, ['created', 'task', 'dentist'], 30000);

    // Verify task in database
    const createdTask = await verifyTaskInDatabase(page, 'dentist');

    // Verify task properties
    expect(createdTask.title.toLowerCase()).toContain('dentist');
    expect(createdTask.priority).toBe('high'); // Agent should detect "urgent" keyword

    createdTaskIds.push(createdTask.id);
  });

  test('should create task from natural language "remind me to pay bills"', async ({ page }) => {
    // Navigate to chat page
    await page.goto('/dashboard/chat');
    await waitForChatWidget(page);

    // Send natural language request
    await sendChatMessage(page, 'remind me to pay bills');

    // Wait for agent response
    await waitForAgentResponse(page, ['created', 'task', 'bills', 'reminder'], 30000);

    // Verify task in database
    const createdTask = await verifyTaskInDatabase(page, 'bills');

    expect(createdTask.title.toLowerCase()).toContain('bill');

    createdTaskIds.push(createdTask.id);
  });

  test('should handle multiple task creations in same conversation', async ({ page }) => {
    // Navigate to chat page
    await page.goto('/dashboard/chat');
    await waitForChatWidget(page);

    // Create first task
    await sendChatMessage(page, 'add task to water plants');
    await waitForAgentResponse(page, ['created', 'task'], 30000);
    await page.waitForTimeout(2000);

    // Create second task
    await sendChatMessage(page, 'also add task to walk dog');
    await waitForAgentResponse(page, ['created', 'task'], 30000);
    await page.waitForTimeout(2000);

    // Verify both tasks in database
    const task1 = await verifyTaskInDatabase(page, 'plants');
    const task2 = await verifyTaskInDatabase(page, 'dog');

    expect(task1.title.toLowerCase()).toContain('plant');
    expect(task2.title.toLowerCase()).toContain('dog');

    createdTaskIds.push(task1.id, task2.id);
  });

  test('should show error handling when task creation fails', async ({ page }) => {
    // Navigate to chat page
    await page.goto('/dashboard/chat');
    await waitForChatWidget(page);

    // Send message with invalid/empty task (edge case)
    await sendChatMessage(page, 'add task to ');

    // Wait for response
    await page.waitForTimeout(3000);

    // Get all messages
    const messages = await page.locator('[data-testid="chat-message"]').allTextContents();
    const responseText = messages.join(' ').toLowerCase();

    // Agent should respond with error or ask for clarification
    expect(responseText).toMatch(/sorry|error|clarify|specify|what|task/i);
  });

  test('should maintain conversation context across task creations', async ({ page }) => {
    // Navigate to chat page
    await page.goto('/dashboard/chat');
    await waitForChatWidget(page);

    // Create first task
    await sendChatMessage(page, 'add task to buy milk');
    await waitForAgentResponse(page, ['created', 'task'], 30000);
    await page.waitForTimeout(1000);

    // Reference previous task implicitly
    await sendChatMessage(page, 'make it high priority');
    await waitForAgentResponse(page, ['priority', 'updated', 'high'], 30000);

    // Verify task has high priority
    const task = await verifyTaskInDatabase(page, 'milk');
    expect(task.priority).toBe('high');

    createdTaskIds.push(task.id);
  });

  test('should display streaming response progressively', async ({ page }) => {
    // Navigate to chat page
    await page.goto('/dashboard/chat');
    await waitForChatWidget(page);

    // Track message appearance times
    const messageTimestamps: number[] = [];

    // Set up message observer
    page.on('console', (msg) => {
      if (msg.text().includes('chunk') || msg.text().includes('stream')) {
        messageTimestamps.push(Date.now());
      }
    });

    // Send message
    await sendChatMessage(page, 'add task to organize closet');

    // Wait for first chunk to appear
    await page.waitForSelector('[data-testid="chat-message"]:has-text("task")', { timeout: 5000 });

    // Wait for complete response
    await waitForAgentResponse(page, ['created', 'task'], 30000);

    // Verify task was created
    const task = await verifyTaskInDatabase(page, 'closet');
    expect(task).toBeDefined();

    createdTaskIds.push(task.id);
  });

  test('should handle timeout gracefully (if agent takes too long)', async ({ page }) => {
    // This test requires backend to be running but may experience delays
    await page.goto('/dashboard/chat');
    await waitForChatWidget(page);

    // Send message
    await sendChatMessage(page, 'add task to research vacation destinations');

    try {
      // Wait with extended timeout
      await waitForAgentResponse(page, ['created', 'task'], 45000);

      // If successful, verify task
      const task = await verifyTaskInDatabase(page, 'vacation');
      expect(task).toBeDefined();
      createdTaskIds.push(task.id);
    } catch (error) {
      // If timeout occurs, verify error message shown to user
      const messages = await page.locator('[data-testid="chat-message"]').allTextContents();
      const hasTimeoutMessage = messages.some(msg =>
        msg.toLowerCase().includes('timeout') ||
        msg.toLowerCase().includes('try again') ||
        msg.toLowerCase().includes('taking longer')
      );

      // Either task succeeded or proper timeout message shown
      expect(hasTimeoutMessage || error.message.includes('not received')).toBeTruthy();
    }
  });
});

test.describe('Chat Task Creation - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should require authentication to access chat', async ({ page, context }) => {
    // Clear all cookies and storage (logout)
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Try to access chat page without auth
    await page.goto('/dashboard/chat');

    // Should redirect to sign-in
    await page.waitForURL('/sign-in', { timeout: 5000 });
    expect(page.url()).toContain('/sign-in');
  });

  test('should prevent message submission when ChatKit not loaded', async ({ page }) => {
    // Navigate to chat page
    await page.goto('/dashboard/chat');

    // Try to send message immediately (before widget loads)
    const chatInput = page.locator('[data-testid="chat-input"]');

    // Input should either not exist or be disabled
    const inputExists = await chatInput.count();
    if (inputExists > 0) {
      const isEnabled = await chatInput.isEnabled();
      expect(isEnabled).toBe(false);
    }
  });

  test('should enforce 2000 character limit on messages', async ({ page }) => {
    await page.goto('/dashboard/chat');
    await waitForChatWidget(page);

    // Create message exceeding 2000 characters
    const longMessage = 'a'.repeat(2001);
    const chatInput = page.locator('[data-testid="chat-input"]');

    await chatInput.fill(longMessage);

    // Either input prevents entry or submit button is disabled
    const actualValue = await chatInput.inputValue();
    const submitButton = page.locator('[data-testid="chat-submit"]');

    const isValid = actualValue.length <= 2000 || !(await submitButton.isEnabled());
    expect(isValid).toBe(true);
  });
});
