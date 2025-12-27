/**
 * ChatKit Widget Component
 *
 * Integrates OpenAI ChatKit with Next.js 16 frontend.
 * Uses useChatKit hook and ChatKit component from @openai/chatkit-react.
 *
 * Features:
 * - Custom backend integration (ChatKitServer at /api/chatkit)
 * - Better Auth JWT token authentication
 * - User-specific chat endpoint per authenticated user
 * - Automatic loading/auth state handling
 * - Responsive design matching app theme
 *
 * Reference: reference-phase3/frontend/components/chatkit/ChatKitWidget.tsx
 */

"use client";

import { useChatKit, ChatKit } from "@openai/chatkit-react";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";

interface ChatKitWidgetProps {
  /**
   * Optional domain key (required for production)
   * If not provided, uses NEXT_PUBLIC_OPENAI_DOMAIN_KEY from environment
   * For development, defaults to "local-dev"
   */
  domainKey?: string;

  /**
   * Optional CSS class name for styling
   */
  className?: string;
}

/**
 * ChatKit Widget Component
 *
 * This component:
 * 1. Checks user authentication via Better Auth
 * 2. Gets JWT token using Better Auth's JWT plugin (authClient.token())
 * 3. Configures ChatKit to point to custom backend /api/chatkit
 * 4. Renders chat interface with JWT authentication
 */
export function ChatKitWidget({ domainKey, className = "" }: ChatKitWidgetProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get environment variables
  const chatkitDomainKey = domainKey || process.env.NEXT_PUBLIC_OPENAI_DOMAIN_KEY;

  /**
   * Check authentication and get JWT token on mount
   */
  useEffect(() => {
    async function checkAuth() {
      try {
        setIsLoading(true);
        setError(null);

        // Get session from Better Auth
        const session = await authClient.getSession();

        if (!session?.data?.user) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        const user = session.data.user;
        setUserId(user.id);
        setIsAuthenticated(true);

        // Get JWT token from /api/auth/token (HS256, compatible with backend)
        try {
          const tokenResult = await import('@/lib/auth-client').then(m => m.getToken());

          if (tokenResult.data?.token) {
            setJwtToken(tokenResult.data.token);
          } else if (tokenResult.error) {
            console.error("Token error:", tokenResult.error);
            setError("Failed to get authentication token");
          } else {
            console.error("No token in response:", tokenResult);
            setError("Failed to get authentication token");
          }
        } catch (tokenError) {
          console.error("JWT token error:", tokenError);
          setError("Failed to get authentication token");
        }

        setIsLoading(false);
      } catch (err) {
        console.error("ChatKit auth check error:", err);
        setError("Failed to check authentication");
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  /**
   * Render authentication required state
   */
  if (!isAuthenticated) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="text-center">
          <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            Please sign in to use the chat feature
          </p>
          <a
            href="/sign-in"
            className="text-primary hover:underline"
          >
            Go to Sign In
          </a>
        </div>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="text-center">
          <p className="text-destructive mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary hover:underline"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  /**
   * Render initializing state (waiting for token)
   */
  if (!userId || !jwtToken) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="text-center">
          <p className="text-muted-foreground">Initializing chat...</p>
        </div>
      </div>
    );
  }

  // Render the actual ChatKit component
  return (
    <ChatKitWidgetInner
      jwtToken={jwtToken}
      chatkitDomainKey={chatkitDomainKey}
      className={className}
      onError={setError}
    />
  );
}

/**
 * Inner ChatKit component that only renders when auth is ready
 */
function ChatKitWidgetInner({
  jwtToken,
  chatkitDomainKey,
  className,
  onError,
}: {
  jwtToken: string;
  chatkitDomainKey?: string;
  className: string;
  onError: (error: string) => void;
}) {
  // Get API base URL from env or use default
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";


  /**
   * Configure ChatKit with custom backend and JWT auth
   */
  const chatkit = useChatKit({
    // Custom backend API configuration
    api: {
      // ChatKit endpoint (no user_id in URL - JWT handles authentication)
      url: `${API_BASE_URL}/api/chatkit`,

      // Domain key is ALWAYS required (use "local-dev" for development)
      domainKey: chatkitDomainKey || "local-dev",

      // Custom fetch function to add JWT token
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
        return fetch(url, {
          ...init,
          headers: {
            ...init?.headers,
            Authorization: `Bearer ${jwtToken}`,
          },
        });
      },
    },

    // Theme customization - matches app's teal/cyan accent colors
    theme: {
      colorScheme: "dark",
      radius: "round",
      color: {
        accent: { primary: "#00d4b8", level: 2 },
      },
    },

    // Start screen with smart suggestion prompts
    startScreen: {
      greeting: "How can I help you with your tasks today?",
      prompts: [
        {
          label: "Show my tasks",
          prompt: "Show me all my tasks",
          icon: "notebook",
        },
        {
          label: "Add a task",
          prompt: "Add a new task",
          icon: "plus",
        },
        {
          label: "What's due today?",
          prompt: "What tasks are due today?",
          icon: "calendar",
        },
        {
          label: "High priority",
          prompt: "Show me my high priority tasks",
          icon: "star",
        },
      ],
    },

    // Enable feedback and retry buttons on responses
    threadItemActions: {
      feedback: true,
      retry: true,
    },

    // Enable history panel with rename and delete options
    history: {
      enabled: true,
      showRename: true,
      showDelete: true,
    },

    // Debug: Log all events to understand message flow
    onThreadChange: ({ threadId }: { threadId: string | null }) => {
      console.log("[ChatKit] Thread changed to:", threadId);
    },
    onResponseStart: () => {
      console.log("[ChatKit] Response started");
    },
    onResponseEnd: () => {
      console.log("[ChatKit] Response ended");
    },
    onThreadLoadStart: ({ threadId }: { threadId: string | null }) => {
      console.log("[ChatKit] Thread load START:", threadId);
    },
    onThreadLoadEnd: ({ threadId }: { threadId: string | null }) => {
      console.log("[ChatKit] Thread load END:", threadId);
    },
    onLog: ({ name, data }: { name: string; data?: Record<string, unknown> }) => {
      // Only log certain events for debugging
      if (name?.startsWith('item.') || name?.startsWith('message.')) {
        console.log("[ChatKit] Log:", name, data ? JSON.stringify(data).slice(0, 500) : data);
      }
    },

    // Error handling
    onError: ({ error }) => {
      console.error("ChatKit error:", error);
      onError(error.message || "ChatKit encountered an error");
    },
  });

  return (
    <div className={cn("w-full h-full flex flex-col", className)}>
      <ChatKit control={chatkit.control} />
    </div>
  );
}

export default ChatKitWidget;
