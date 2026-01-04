/**
 * Chat Route Page (T089)
 *
 * Redirects to dashboard - chat is available via global floating button.
 * The dedicated /chat route is disabled in favor of the global chat experience.
 */

import { redirect } from 'next/navigation';

export default function ChatPage() {
  // Redirect to dashboard - chat is available via floating button
  redirect('/dashboard');
}
