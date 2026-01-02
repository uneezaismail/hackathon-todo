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
import { Bot, Loader2 } from "lucide-react";

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
   * Render loading state - Professional purple-themed loader
   */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 h-full bg-[#0A0A1F]">
        <div className="text-center">
          {/* Purple gradient spinner */}
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse" />
            <Loader2 className="relative h-10 w-10 lg:h-12 lg:w-12 text-purple-500 animate-spin" />
          </div>
          <p className="text-purple-300/80 text-sm font-medium">Connecting to AI assistant...</p>
        </div>
      </div>
    );
  }

  /**
   * Render authentication required state - Professional purple-themed
   */
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center p-8 h-full bg-[#0A0A1F]">
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse" />
            <Bot className="relative h-12 w-12 text-purple-400 mx-auto" />
          </div>
          <p className="text-purple-300/80 mb-4 font-medium">
            Please sign in to use the chat feature
          </p>
          <a
            href="/sign-in"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-500/20 text-purple-300 font-medium border border-purple-500/30 hover:bg-purple-500/30 transition-all duration-200"
          >
            Go to Sign In
          </a>
        </div>
      </div>
    );
  }

  /**
   * Render error state - Professional purple-themed
   */
  if (error) {
    return (
      <div className="flex items-center justify-center p-8 h-full bg-[#0A0A1F]">
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse" />
            <Bot className="relative h-12 w-12 text-red-400 mx-auto" />
          </div>
          <p className="text-red-300/80 mb-4 font-medium">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-500/20 text-red-300 font-medium border border-red-500/30 hover:bg-red-500/30 transition-all duration-200"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  /**
   * Render initializing state (waiting for token) - Professional purple-themed loader
   */
  if (!userId || !jwtToken) {
    return (
      <div className="flex items-center justify-center p-8 h-full bg-[#0A0A1F]">
        <div className="text-center">
          {/* Purple gradient spinner */}
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse" />
            <Loader2 className="relative h-10 w-10 lg:h-12 lg:w-12 text-purple-500 animate-spin" />
          </div>
          <p className="text-purple-300/80 text-sm font-medium">Initializing AI assistant...</p>
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

    // Theme customization - matches app's purple theme (#A855F7)
    theme: {
      colorScheme: "dark",
      radius: "round",
      color: {
        accent: {
          primary: "#A855F7", // Purple from your theme
          level: 2,
        },
      },
    },

    // Composer (input field) customization
    composer: {
      placeholder: "How can I help you today?",
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
