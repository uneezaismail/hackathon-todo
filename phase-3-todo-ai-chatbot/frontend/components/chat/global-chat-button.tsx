/**
 * Global Chat Button Component
 *
 * Floating chat button that appears on all authenticated pages.
 * Opens a chat modal overlay with ChatKitWidget when clicked.
 *
 * Features:
 * - Fixed position floating button at bottom-right corner
 * - Opens modal overlay with ChatKit widget
 * - PERSISTS chat state when closed (widget stays mounted, just hidden)
 * - Checks auth before showing (only for authenticated users)
 * - Hidden on public routes (landing, sign-in, sign-up)
 * - Smooth animations for open/close transitions
 * - Accessible with proper ARIA attributes
 */

"use client";

import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { ChatKitWidget } from "./chatkit-widget";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { usePathname } from "next/navigation";

export function GlobalChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasBeenOpened, setHasBeenOpened] = useState(false);
  const pathname = usePathname();

  // Routes where the chat button should NOT appear
  const hiddenRoutes = ["/", "/sign-in", "/sign-up", "/chat"];
  const shouldShow = !hiddenRoutes.includes(pathname);

  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await authClient.getSession();
        if (session?.data?.user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Failed to check auth:", error);
        setIsAuthenticated(false);
      }
    }

    if (shouldShow) {
      checkAuth();
    }
  }, [shouldShow]);

  // Track if chat has been opened at least once (to mount widget)
  const handleOpen = () => {
    setIsOpen(true);
    setHasBeenOpened(true);
  };

  // Don't render if on hidden routes or not authenticated
  if (!shouldShow || !isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={handleOpen}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "w-14 h-14 md:w-16 md:h-16 rounded-full",
          "bg-linear-to-br from-[#00d4b8] to-[#00b4d8]",
          "hover:from-[#00c4a8] hover:to-[#00a4c8]",
          "text-white shadow-lg hover:shadow-xl",
          "flex items-center justify-center",
          "transition-all duration-300",
          "hover:scale-110 active:scale-95",
          "focus:outline-none focus:ring-2 focus:ring-[#00d4b8] focus:ring-offset-2",
          "border-2 border-white/20",
          isOpen && "hidden"
        )}
        aria-label="Open chat assistant"
      >
        <MessageCircle className="w-6 h-6 md:w-7 md:h-7" />
      </button>

      {/* Backdrop - only visible when open */}
      <div
        className={cn(
          "fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Chat Modal - stays mounted after first open, just hidden */}
      <div
        className={cn(
          "fixed z-[9999]",
          // Mobile: nearly full screen with padding
          "inset-4",
          // Desktop: fixed size at bottom-right
          "md:inset-auto md:bottom-6 md:right-6",
          "md:w-full md:max-w-md",
          "md:h-[600px]",
          "flex flex-col",
          "transition-all duration-300",
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Only render content after first open to avoid initial load */}
        {hasBeenOpened && (
          <div className="bg-background border border-border rounded-2xl shadow-2xl flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-[#00d4b8]/10 to-[#00b4d8]/10">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  AI Assistant
                </h3>
                <p className="text-xs text-muted-foreground">
                  Ask me anything about your tasks
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close chat"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Chat Widget - stays mounted, preserves conversation */}
            <div className="flex-1 overflow-hidden">
              <ChatKitWidget className="h-full w-full" />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default GlobalChatButton;
