import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";

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
    default: "Todo App - Task Management Made Simple",
    template: "%s | Todo App",
  },
  description:
    "Organize your work and life with our intuitive task management app. Stay productive, meet deadlines, and achieve your goals with ease.",
  keywords: ["todo", "task management", "productivity", "tasks", "organizer", "todo list", "task tracker"],
  authors: [{ name: "Todo App Team" }],
  creator: "Todo App",
  publisher: "Todo App",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Todo App - Task Management Made Simple",
    description:
      "Organize your work and life with our intuitive task management app.",
    siteName: "Todo App",
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
    title: "Todo App - Task Management Made Simple",
    description:
      "Organize your work and life with our intuitive task management app.",
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
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
