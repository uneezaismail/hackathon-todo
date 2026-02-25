/**
 * Chat Components Index
 *
 * Main Components (ACTIVE - using official ChatKit):
 * - GlobalChatButton: Floating FAB that opens ChatKitWidget
 * - ChatKitWidget: OpenAI ChatKit SDK integration with Better Auth JWT
 *
 * Reference Components (NOT EXPORTED):
 * - chat-widget.tsx: Custom SSE streaming implementation (kept for reference)
 */

// Main chat components (ACTIVE)
export { GlobalChatButton } from './global-chat-button';
export { ChatKitWidget } from './chatkit-widget';
