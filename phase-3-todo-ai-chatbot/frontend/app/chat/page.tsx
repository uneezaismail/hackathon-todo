// /**
//  * Chat Route Page (T089)
//  *
//  * Creates the /chat route with authentication check and ChatKit widget.
//  * This is the main chat interface page for the AI chatbot.
//  *
//  * Requirements from tasks.md (T089):
//  * - Create /chat route page
//  * - Authentication check
//  * - ChatKit widget integration
//  */

// import { redirect } from 'next/navigation';
// import { headers } from 'next/headers';
// import { auth } from '@/lib/auth';
// import { ChatWidget } from '@/components/chat';

// export default async function ChatPage() {
//   // Check authentication
//   const session = await auth.api.getSession({
//     headers: await headers(),
//   });

//   if (!session?.user) {
//     // Redirect to sign-in with callback URL
//     redirect('/sign-in?callbackUrl=/chat');
//   }

//   return (
//     <div className="min-h-screen bg-background">
//       <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
//         {/* Page Header */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold tracking-tight">AI Chat Assistant</h1>
//           <p className="text-muted-foreground mt-2">
//             Ask me to help manage your tasks. I can add, list, update, and delete tasks for you.
//           </p>
//         </div>

//         {/* Chat Widget */}
//         <ChatWidget />
//       </div>
//     </div>
//   );
// }
