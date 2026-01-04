import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { GlobalChatButton } from "@/components/chat";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Taskio - AI-Powered Task Management",
    template: "%s | Taskio",
  },
  description:
    "Transform your productivity with AI-powered task management. Natural language commands, smart scheduling, and intelligent insights.",
  keywords: ["taskio", "ai todo", "task management", "productivity", "ai assistant", "smart tasks", "task automation"],
  authors: [{ name: "Taskio Team" }],
  creator: "Taskio",
  publisher: "Taskio",
  icons: {
    icon: "/favicon.svg",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Taskio - AI-Powered Task Management",
    description:
      "Transform your productivity with AI-powered task management.",
    siteName: "Taskio",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Todo App - Task Management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Taskio - AI-Powered Task Management",
    description:
      "Transform your productivity with AI-powered task management.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
          <Toaster />
          {/* Global floating chat button - shows on authenticated pages */}
          <GlobalChatButton />
          {/* CRITICAL: Load ChatKit CDN script for widget styling */}
          <Script
            src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js"
            strategy="afterInteractive"
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
