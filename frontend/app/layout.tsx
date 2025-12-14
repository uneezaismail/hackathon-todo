import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";

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
    "Manage your tasks efficiently with our modern todo application. Create, update, and organize your tasks with ease.",
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
      "Manage your tasks efficiently with our modern todo application.",
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
      "Manage your tasks efficiently with our modern todo application.",
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
