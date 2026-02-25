/**
 * Global Chat Button Component
 *
 * Professional floating chat button with purple theme matching the website design.
 * Opens a chat modal overlay with ChatKitWidget when clicked.
 *
 * Features:
 * - Fixed position floating button at bottom-right corner with gradient purple styling
 * - Opens modal overlay with ChatKit widget
 * - PERSISTS chat state when closed (widget stays mounted, just hidden)
 * - Checks auth before showing (only for authenticated users)
 * - Hidden on public routes (landing, sign-in, sign-up)
 * - Smooth animations for open/close transitions
 * - Body scroll lock when chat is open (prevents background scrolling)
 * - Professional design matching purple theme (#A855F7)
 * - Accessible with proper ARIA attributes
 * - Glassmorphism effects and modern UI patterns
 */

"use client";

import { useState, useEffect } from "react";
import { MessageCircle, X, Sparkles } from "lucide-react";
import { ChatKitWidget } from "./chatkit-widget";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

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

  // Lock body scroll when chat is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.height = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
    };
  }, [isOpen]);

  // Track if chat has been opened at least once (to mount widget)
  const handleOpen = () => {
    setIsOpen(true);
    setHasBeenOpened(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Don't render if on hidden routes or not authenticated
  if (!shouldShow || !isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        onClick={handleOpen}
        className={cn(
          "fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50",
          "w-13 h-13 sm:w-16 sm:h-16 lg:w-18 lg:h-18 rounded-full",
          // Gradient purple background matching your theme
          "bg-gradient-to-br from-[#A855F7] via-[#9333EA] to-[#7C3AED]",
          "hover:from-[#9333EA] hover:via-[#7C3AED] hover:to-[#6D28D9]",
          // Glow effect
          "shadow-[0_8px_32px_rgba(168,85,247,0.4)]",
          "hover:shadow-[0_12px_40px_rgba(168,85,247,0.6)]",
          "text-white",
          "flex items-center justify-center",
          "transition-all duration-300",
          "hover:scale-105 active:scale-95",
          "focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-background",
          "border-2 border-white/20",
          // Subtle pulse animation for attention
          "animate-pulse-slow",
          isOpen && "scale-0 opacity-0"
        )}
        aria-label="Open AI chat assistant"
      >
        {/* Sparkle icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-white/20 blur-xl rounded-full" />
          <MessageCircle className="relative w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </motion.button>

      {/* Backdrop - only visible when open */}
      <div
        className={cn(
          "fixed inset-0 z-[9998] bg-black/60 backdrop-blur-md transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Chat Modal - stays mounted after first open, just hidden */}
      <motion.div
        initial={false}
        animate={{
          opacity: isOpen ? 1 : 0,
          scale: isOpen ? 1 : 0.95,
          y: isOpen ? 0 : 20,
        }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
        }}
        className={cn(
          "fixed z-[9999]",
          // Mobile: full height with padding
          "inset-2 sm:inset-4",
          // Desktop: fixed size at bottom-right (reduced size)
          "lg:inset-auto lg:bottom-6 lg:right-6",
          "lg:w-[420px] lg:max-w-[calc(100vw-4rem)]",
          "lg:h-[580px] lg:max-h-[calc(100vh-4rem)]",
          "flex flex-col",
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-title"
      >
        {/* Only render content after first open to avoid initial load */}
        {hasBeenOpened && (
          <div className="bg-[#0A0A1F]/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-500/20 flex-1 flex flex-col overflow-hidden">
            {/* Header with gradient */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-purple-500/10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-500/30 blur-xl rounded-full animate-pulse" />
                  <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center border border-purple-400/30 shadow-lg shadow-purple-500/30">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                </div>
                <div>
                  <h3 id="chat-title" className="text-sm sm:text-base lg:text-lg font-bold text-white">
                    AI Assistant
                  </h3>
                  <p className="text-[10px] sm:text-xs text-purple-300/80">
                    Powered by Taskio AI
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/30 transition-all duration-200 group"
                aria-label="Close chat"
              >
                <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </button>
            </div>

            {/* Chat Widget - stays mounted, preserves conversation */}
            <div className="flex-1 overflow-hidden bg-[#0A0A1F]">
              <ChatKitWidget className="h-full w-full" />
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}

export default GlobalChatButton;
