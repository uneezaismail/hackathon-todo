'use client'

import Link from 'next/link'
import { useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Zap, Shield, Sparkles } from 'lucide-react'

/**
 * T043 & T044: Landing Page with responsive design
 *
 * Auth-aware CTAs:
 * - Authenticated users → redirected to /dashboard
 * - Non-authenticated users → redirected to /sign-up
 *
 * Sections:
 * - Hero Section: H1, subheading, CTA button
 * - Features Section: Grid of 3-4 feature cards
 * - CTA Section: Final call to action
 *
 * Responsive:
 * - Mobile: Single column, stacked layout
 * - Tablet: 2-column features grid
 * - Desktop: 3-column features grid, wider hero
 */

export default function Home() {
  const { data: session, isPending } = useSession()
  const isAuthenticated = !isPending && session?.user

  // Conditional redirect: dashboard for logged-in users, sign-up for new users
  const ctaHref = isAuthenticated ? '/dashboard' : '/sign-up'
  const ctaText = isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'
  const ctaTextBottom = isAuthenticated ? 'Open Dashboard' : 'Create Free Account'
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative w-full py-12 sm:py-16 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border bg-muted px-3 py-1 text-sm">
              <Sparkles className="mr-2 h-4 w-4" />
              <span className="font-medium">Simple. Powerful. Efficient.</span>
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Manage Your Tasks{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Effortlessly
              </span>
            </h1>

            <p className="mb-8 text-lg text-muted-foreground sm:text-xl md:text-2xl">
              Organize your work and life with our intuitive task management app.
              Stay productive, meet deadlines, and achieve your goals with ease.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="text-base font-semibold">
                <Link href={ctaHref}>
                  {ctaText}
                  <CheckCircle2 className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base font-semibold">
                <Link href="#features">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Background gradient */}
        <div className="absolute inset-x-0 top-0 -z-10 h-full bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-12 sm:py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful features to help you manage tasks efficiently
            </p>
          </div>

          {/* Feature Cards - Responsive Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1: Simple Task Management */}
            <Card
              data-testid="feature-card"
              className="transition-shadow hover:shadow-lg"
            >
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Simple Task Management</CardTitle>
                <CardDescription className="text-base">
                  Create, edit, and organize tasks with an intuitive interface.
                  Focus on what matters most without unnecessary complexity.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2: Real-time Sync */}
            <Card
              data-testid="feature-card"
              className="transition-shadow hover:shadow-lg"
            >
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Lightning Fast</CardTitle>
                <CardDescription className="text-base">
                  Instant updates and blazing fast performance. Your tasks are
                  always up to date, across all your devices.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3: Secure & Private */}
            <Card
              data-testid="feature-card"
              className="transition-shadow hover:shadow-lg"
            >
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Secure & Private</CardTitle>
                <CardDescription className="text-base">
                  Your data is encrypted and secure. We respect your privacy
                  and never share your information with third parties.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full bg-muted/50 py-12 sm:py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              {isAuthenticated ? 'Continue Your Work' : 'Ready to Get Started?'}
            </h2>
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
              {isAuthenticated
                ? 'Access your tasks and stay productive with our powerful task management tools.'
                : 'Join thousands of users who are already managing their tasks more efficiently. Sign up for free today.'}
            </p>
            <Button asChild size="lg" className="text-base font-semibold">
              <Link href={ctaHref}>
                {ctaTextBottom}
                <CheckCircle2 className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <p className="mt-4 text-sm text-muted-foreground">
              {isAuthenticated
                ? 'All your tasks are waiting for you.'
                : 'No credit card required. Get started in seconds.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
