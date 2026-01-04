/**
 * ChatKit Client Configuration
 *
 * Configures OpenAI ChatKit widget for Phase 3 AI chatbot integration.
 * Integrates with Better Auth for JWT authentication and backend chat API.
 *
 * Reference: Frontend foundation task T017, Streaming configuration T076
 */

import { useChatKit, ChatKit } from "@openai/chatkit-react";

/**
 * SSE Event types from backend streaming API
 */
export interface SSEChunkEvent {
  type: "chunk";
  content: string;
}

export interface SToolCallEvent {
  type: "tool_call";
  tool: string;
  args: Record<string, unknown>;
}

export interface SSEToolResultEvent {
  type: "tool_result";
  tool: string;
  result: Record<string, unknown>;
}

export interface SSEDoneEvent {
  type: "done";
  conversation_id: string;
}

export type SSEEvent = SSEChunkEvent | SToolCallEvent | SSEToolResultEvent | SSEDoneEvent;

/**
 * Streaming state for progressive message rendering
 */
export interface StreamingState {
  isStreaming: boolean;
  currentContent: string;
  toolCalls: Array<{
    tool: string;
    args: Record<string, unknown>;
    result?: Record<string, unknown>;
  }>;
  conversationId: string | null;
}

/**
 * ChatKit configuration object for widget initialization.
 *
 * @property apiUrl - Backend chat endpoint (from environment variable)
 * @property authToken - JWT token from Better Auth session
 * @property streaming - Enable streaming responses (SSE)
 * @property maxMessageLength - Maximum user message length (2000 chars per FR-032)
 * @property onChunk - Callback for progressive text chunks
 * @property onToolCall - Callback for tool invocation events
 * @property onToolResult - Callback for tool execution results
 * @property onDone - Callback for streaming completion
 */
export interface ChatKitConfig {
  apiUrl: string;
  authToken: string | null;
  streaming: boolean;
  maxMessageLength: number;
  onChunk?: (content: string) => void;
  onToolCall?: (tool: string, args: Record<string, unknown>) => void;
  onToolResult?: (tool: string, result: Record<string, unknown>) => void;
  onDone?: (conversationId: string) => void;
}

/**
 * Default streaming callbacks for progressive text rendering
 */
export const defaultStreamingCallbacks = {
  onChunk: (content: string) => {
    console.debug("[ChatKit] Received chunk:", content.substring(0, 50) + "...");
  },
  onToolCall: (tool: string, args: Record<string, unknown>) => {
    console.debug("[ChatKit] Tool call:", tool, args);
  },
  onToolResult: (tool: string, result: Record<string, unknown>) => {
    console.debug("[ChatKit] Tool result:", tool, result);
  },
  onDone: (conversationId: string) => {
    console.debug("[ChatKit] Streaming complete, conversation:", conversationId);
  },
};

/**
 * Get ChatKit configuration with current auth token and streaming callbacks.
 *
 * @param callbacks - Optional streaming event callbacks
 * @returns ChatKit configuration object
 */
export async function getChatKitConfig(
  callbacks?: Partial<StreamingCallbacks>
): Promise<ChatKitConfig> {
  // Get auth token from Better Auth session
  const authToken = await getBetterAuthToken();

  // Merge default callbacks with provided ones
  const mergedCallbacks = {
    ...defaultStreamingCallbacks,
    ...callbacks,
  };

  return {
    apiUrl: process.env.NEXT_PUBLIC_CHAT_API_URL || "http://localhost:8000/api/v1/chat",
    authToken,
    streaming: true,
    maxMessageLength: 2000, // FR-032: User message length limit
    onChunk: mergedCallbacks.onChunk,
    onToolCall: mergedCallbacks.onToolCall,
    onToolResult: mergedCallbacks.onToolResult,
    onDone: mergedCallbacks.onDone,
  };
}

/**
 * Streaming callbacks interface for type safety
 */
export interface StreamingCallbacks {
  onChunk: (content: string) => void;
  onToolCall: (tool: string, args: Record<string, unknown>) => void;
  onToolResult: (tool: string, result: Record<string, unknown>) => void;
  onDone: (conversationId: string) => void;
}

/**
 * Parse SSE event from raw string data.
 *
 * @param data - Raw SSE data string
 * @returns Parsed SSE event or null if invalid
 */
export function parseSSEEvent(data: string): SSEEvent | null {
  try {
    // Handle both raw JSON and SSE "data: ..." format
    let jsonData = data;
    if (data.startsWith("data: ")) {
      jsonData = data.slice(6); // Remove "data: " prefix
    }

    // Handle empty lines (heartbeat/keepalive)
    if (!jsonData.trim() || jsonData === "[DONE]") {
      return null;
    }

    const parsed = JSON.parse(jsonData);

    // Validate event type
    if (!parsed.type || !["chunk", "tool_call", "tool_result", "done"].includes(parsed.type)) {
      console.warn("[ChatKit] Unknown SSE event type:", parsed.type);
      return null;
    }

    return parsed as SSEEvent;
  } catch (error) {
    console.error("[ChatKit] Failed to parse SSE event:", error);
    return null;
  }
}

/**
 * Create SSE event source for streaming chat responses.
 *
 * @param message - User message to send
 * @param conversationId - Optional conversation ID for context
 * @param callbacks - Streaming event callbacks
 * @returns EventSource or null if auth fails
 */
export async function createChatEventSource(
  message: string,
  conversationId: string | null,
  callbacks: StreamingCallbacks
): Promise<EventSource | null> {
  const authToken = await getBetterAuthToken();

  if (!authToken) {
    console.error("[ChatKit] No auth token available");
    return null;
  }

  // Build URL with query params
  const apiUrl = process.env.NEXT_PUBLIC_CHAT_API_URL || "http://localhost:8000/api/v1/chat";
  const url = new URL(apiUrl);
  url.searchParams.set("message", message);
  if (conversationId) {
    url.searchParams.set("conversation_id", conversationId);
  }

  // Create event source with auth header (using fetch-based approach for headers)
  // Note: EventSource doesn't support custom headers, so we use a custom approach
  const eventSource = new EventSource(url.toString());

  // Add authorization via query param (backend should support this)
  // Alternative: Use fetch with ReadableStream for proper auth header support

  // Handle message events for streaming
  eventSource.onmessage = (event) => {
    const sseEvent = parseSSEEvent(event.data);

    if (!sseEvent) return;

    switch (sseEvent.type) {
      case "chunk":
        callbacks.onChunk(sseEvent.content);
        break;

      case "tool_call":
        callbacks.onToolCall(sseEvent.tool, sseEvent.args);
        break;

      case "tool_result":
        callbacks.onToolResult(sseEvent.tool, sseEvent.result);
        break;

      case "done":
        callbacks.onDone(sseEvent.conversation_id);
        eventSource.close();
        break;
    }
  };

  eventSource.onerror = (error) => {
    console.error("[ChatKit] EventSource error:", error);
    eventSource.close();
  };

  return eventSource;
}

/**
 * Alternative: Fetch-based streaming for proper auth header support.
 * Uses fetch with ReadableStream to handle authentication properly.
 *
 * @param message - User message to send
 * @param conversationId - Optional conversation ID for context
 * @param callbacks - Streaming event callbacks
 * @param authToken - JWT token for authentication
 * @returns Promise that resolves when streaming completes
 */
export async function fetchStreamingChat(
  message: string,
  conversationId: string | null,
  callbacks: StreamingCallbacks,
  authToken: string
): Promise<void> {
  const apiUrl = process.env.NEXT_PUBLIC_CHAT_API_URL || "http://localhost:8000/api/v1/chat";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat API error: ${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error("No response body for streaming");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    // Decode chunk and add to buffer
    buffer += decoder.decode(value, { stream: true });

    // Process complete lines (SSE format: each line ends with \n\n or just \n)
    const lines = buffer.split("\n");
    buffer = lines.pop() || ""; // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.trim() && !line.startsWith(":")) { // Ignore comments
        const sseEvent = parseSSEEvent(line);
        if (sseEvent) {
          switch (sseEvent.type) {
            case "chunk":
              callbacks.onChunk(sseEvent.content);
              break;

            case "tool_call":
              callbacks.onToolCall(sseEvent.tool, sseEvent.args);
              break;

            case "tool_result":
              callbacks.onToolResult(sseEvent.tool, sseEvent.result);
              break;

            case "done":
              callbacks.onDone(sseEvent.conversation_id);
              return; // Streaming complete
          }
        }
      }
    }
  }
}

/**
 * Create ChatKit widget props for streaming display.
 *
 * @param config - ChatKit configuration
 * @returns Props object for ChatKit React component
 */
export function createChatKitProps(config: ChatKitConfig) {
  return {
    api: {
      url: config.apiUrl,
      fetch: (url: string, options?: RequestInit) => {
        return fetch(url, {
          ...options,
          headers: {
            ...options?.headers,
            Authorization: config.authToken ? `Bearer ${config.authToken}` : "",
          },
        });
      },
    },
    streaming: config.streaming,
    onChunk: config.onChunk,
    onToolCall: config.onToolCall,
    onToolResult: config.onToolResult,
    onDone: config.onDone,
    onError: ({ error }: { error: Error }) => {
      console.error("[ChatKit] Widget error:", error);
    },
  };
}

/**
 * Retrieve JWT token from Better Auth session.
 *
 * Fetches the current session and extracts the JWT token for backend authentication.
 * Returns null if user is not authenticated.
 *
 * @returns JWT token string or null if not authenticated
 */
export async function getBetterAuthToken(): Promise<string | null> {
  try {
    // Import authClient dynamically to avoid SSR issues
    const { authClient } = await import("./auth-client");

    // Get current session
    const result = await authClient.getSession();

    // Check if we have valid data with a session
    if (!result?.data?.session) {
      return null;
    }

    // Return the session token (JWT)
    return result.data.session.token || null;
  } catch (error) {
    console.error("Failed to get Better Auth token:", error);
    return null;
  }
}

/**
 * Validate user message length before sending.
 *
 * @param message - User message to validate
 * @returns true if valid, false otherwise
 */
export function validateMessageLength(message: string): boolean {
  return message.length > 0 && message.length <= 2000;
}

/**
 * Format error message for display in ChatKit widget.
 *
 * @param error - Error object or string
 * @returns Formatted error message
 */
export function formatChatError(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}
