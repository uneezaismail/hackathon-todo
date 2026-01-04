/**
 * Custom Chat Widget Component (REFERENCE ONLY - NOT USING)
 *
 * Complete custom chat implementation with SSE streaming support.
 * ALL code is in this ONE file - no external chat component imports.
 *
 * This is kept for reference - the app uses ChatKitWidget (official ChatKit) instead.
 *
 * Features:
 * - Custom SSE streaming with progressive text rendering
 * - Tool call display for MCP tools
 * - 2000 char message limit validation
 * - Better Auth JWT authentication
 * - Message display with avatars
 * - Streaming indicator
 *
 * NOTE: This component is NOT exported from index.ts
 * The app uses chatkit-widget.tsx (official @openai/chatkit-react) instead.
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Wrench, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
  result?: Record<string, unknown>;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls: ToolCall[];
  timestamp: Date;
}

interface ChatWidgetProps {
  className?: string;
  initialConversationId?: string | null;
}

// ============================================================================
// Constants
// ============================================================================

const MAX_MESSAGE_LENGTH = 2000;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ============================================================================
// Utility Functions
// ============================================================================

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function getAuthToken(): Promise<string | null> {
  try {
    const { getToken } = await import("@/lib/auth-client");
    const tokenResult = await getToken();
    return tokenResult.data?.token || null;
  } catch {
    return null;
  }
}

function formatToolArgs(args: Record<string, unknown>): string {
  const entries = Object.entries(args);
  if (entries.length === 0) return "{}";
  return entries
    .map(([key, value]) => {
      const formatted = typeof value === "string" ? `"${value}"` : String(value);
      return `  ${key}: ${formatted}`;
    })
    .join(",\n");
}

// ============================================================================
// Main Component
// ============================================================================

export function ChatWidget({
  className = "",
  initialConversationId = null,
}: ChatWidgetProps) {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
  const [currentStreamingId, setCurrentStreamingId] = useState<string | null>(null);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Toggle tool expansion
  const toggleTool = (toolKey: string) => {
    setExpandedTools((prev) => {
      const next = new Set(prev);
      if (next.has(toolKey)) {
        next.delete(toolKey);
      } else {
        next.add(toolKey);
      }
      return next;
    });
  };

  // Handle SSE streaming response
  const handleStream = useCallback(
    async (reader: ReadableStreamDefaultReader<Uint8Array>, assistantId: string) => {
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const event = JSON.parse(data);

              if (event.type === "chunk" && event.content) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantId
                      ? { ...msg, content: msg.content + event.content }
                      : msg
                  )
                );
              } else if (event.type === "tool_call") {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantId
                      ? {
                          ...msg,
                          toolCalls: [...msg.toolCalls, { tool: event.tool, args: event.args }],
                        }
                      : msg
                  )
                );
              } else if (event.type === "tool_result") {
                setMessages((prev) =>
                  prev.map((msg) => {
                    if (msg.id !== assistantId) return msg;
                    const updatedToolCalls = [...msg.toolCalls];
                    const lastIndex = updatedToolCalls.findLastIndex((tc) => tc.tool === event.tool);
                    if (lastIndex !== -1) {
                      updatedToolCalls[lastIndex] = { ...updatedToolCalls[lastIndex], result: event.result };
                    }
                    return { ...msg, toolCalls: updatedToolCalls };
                  })
                );
              } else if (event.type === "done" && event.conversation_id) {
                setConversationId(event.conversation_id);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      } finally {
        setIsStreaming(false);
        setCurrentStreamingId(null);
      }
    },
    []
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage) return;

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      toast.error(`Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }

    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: trimmedMessage,
      toolCalls: [],
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Add placeholder for assistant
    const assistantId = generateId();
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      toolCalls: [],
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);
    setCurrentStreamingId(assistantId);
    setIsStreaming(true);

    try {
      const authToken = await getAuthToken();
      if (!authToken) {
        throw new Error("Not authenticated. Please sign in first.");
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          message: trimmedMessage,
          conversation_id: conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (reader) {
        await handleStream(reader, assistantId);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantId));
      setIsStreaming(false);
      setCurrentStreamingId(null);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change with validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_MESSAGE_LENGTH) {
      setInputValue(value);
    }
  };

  return (
    <Card
      data-testid="custom-chat-widget"
      className={cn("flex flex-col h-150 max-w-2xl mx-auto", className)}
    >
      {/* Header */}
      <CardHeader className="pb-3 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5" />
          AI Chat Assistant (Custom)
        </CardTitle>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Bot className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-lg font-medium">Start a conversation</p>
            <p className="text-sm">Ask me to help with your tasks</p>
          </div>
        )}

        {messages.map((message) => {
          const isUser = message.role === "user";
          const isCurrentlyStreaming = isStreaming && message.id === currentStreamingId;

          return (
            <div
              key={message.id}
              data-testid={`chat-message-${message.role}`}
              className={cn(
                "flex gap-3 p-4 rounded-lg",
                isUser ? "bg-primary/10" : "bg-muted/50"
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                  isUser ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20"
                )}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* Role label with streaming indicator */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {isUser ? "You" : "AI Assistant"}
                  </span>
                  {isCurrentlyStreaming && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-xs">Thinking...</span>
                    </div>
                  )}
                </div>

                {/* Message content */}
                <div className={cn("prose prose-sm dark:prose-invert max-w-none", isCurrentlyStreaming && "min-h-[1.5em]")}>
                  <p className={cn("whitespace-pre-wrap", isCurrentlyStreaming && "after:content-['█'] after:animate-pulse")}>
                    {message.content}
                  </p>
                </div>

                {/* Tool calls for assistant messages */}
                {message.role === "assistant" && message.toolCalls.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.toolCalls.map((tc, index) => {
                      const toolKey = `${message.id}-${index}`;
                      const isExpanded = expandedTools.has(toolKey);
                      const hasResult = tc.result !== undefined;

                      return (
                        <div
                          key={toolKey}
                          className={cn(
                            "border rounded-lg overflow-hidden transition-colors",
                            hasResult ? "border-green-500/50 bg-green-500/5" : "border-blue-500/50 bg-blue-500/5"
                          )}
                        >
                          <button
                            onClick={() => toggleTool(toolKey)}
                            className="w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-opacity-50 transition-colors"
                          >
                            <Wrench className={cn("h-4 w-4 shrink-0", hasResult ? "text-green-500" : "text-blue-500")} />
                            <span className="font-mono text-sm font-medium">{tc.tool}</span>
                            {hasResult && (
                              <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded">Done</span>
                            )}
                            <ChevronDown className={cn("h-4 w-4 ml-auto transition-transform", isExpanded && "rotate-180")} />
                          </button>

                          {isExpanded && (
                            <div className="px-3 pb-3 space-y-2 border-t border-current/10">
                              <div className="mt-2">
                                <span className="text-xs text-muted-foreground uppercase">Args</span>
                                <pre className="mt-1 p-2 rounded bg-background/50 text-xs font-mono overflow-x-auto">
                                  {formatToolArgs(tc.args)}
                                </pre>
                              </div>
                              {hasResult && tc.result && (
                                <div>
                                  <span className="text-xs text-muted-foreground uppercase">Result</span>
                                  <pre className="mt-1 p-2 rounded bg-background/50 text-xs font-mono overflow-x-auto">
                                    {JSON.stringify(tc.result, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading skeleton when waiting for first chunk */}
        {isStreaming && currentStreamingId && messages.find((m) => m.id === currentStreamingId)?.content === "" && (
          <div className="flex gap-3 p-4 rounded-lg bg-muted/50">
            <div className="shrink-0 h-8 w-8 rounded-full bg-muted-foreground/20 flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-muted-foreground/20 rounded animate-pulse" />
              <div className="space-y-1">
                <div className="h-3 w-full bg-muted-foreground/20 rounded animate-pulse" />
                <div className="h-3 w-3/4 bg-muted-foreground/20 rounded animate-pulse" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            data-testid="chat-input"
            type="text"
            placeholder="Ask me to help with tasks..."
            value={inputValue}
            onChange={handleInputChange}
            disabled={isLoading || isStreaming}
            className="flex-1"
            aria-label="Chat message input"
            maxLength={MAX_MESSAGE_LENGTH}
          />
          <Button
            type="submit"
            disabled={isLoading || isStreaming || !inputValue.trim()}
            size="icon"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>

        <div className="flex justify-between mt-1">
          <span className="text-xs text-muted-foreground">
            {inputValue.length}/{MAX_MESSAGE_LENGTH}
          </span>
          {isStreaming && (
            <span className="text-xs text-muted-foreground animate-pulse">AI is typing...</span>
          )}
        </div>
      </div>
    </Card>
  );
}

export default ChatWidget;
