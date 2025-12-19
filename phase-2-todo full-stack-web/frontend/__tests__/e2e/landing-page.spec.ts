import { test, expect } from '@playwright/test'

/**
 * T039: E2E test for landing page load and content visibility
 *
 * Tests:
 * - Page loads at http://localhost:3000
 * - Header visible with "Sign In" and "Get Started" buttons
 * - Hero section with title and CTA
 * - Features section with 3+ features
 * - Footer visible with links
 */

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load successfully at root path', async ({ page }) => {
    await expect(page).toHaveURL('/')
    await expect(page).toHaveTitle(/Todo App/i)
  })

  test('should display header with authentication buttons', async ({ page }) => {
    // Check header is visible
    const header = page.locator('header')
    await expect(header).toBeVisible()

    // Check for "Sign In" button
    const signInButton = page.getByRole('link', { name: /sign in/i })
    await expect(signInButton).toBeVisible()
    await expect(signInButton).toHaveAttribute('href', '/sign-in')

    // Check for "Get Started" button
    const getStartedButton = page.getByRole('link', { name: /get started/i })
    await expect(getStartedButton).toBeVisible()
    await expect(getStartedButton).toHaveAttribute('href', '/sign-up')
  })

  test('should display hero section with title and CTA', async ({ page }) => {
    // Check for main heading
    const heroTitle = page.getByRole('heading', {
      name: /manage your tasks effortlessly/i,
      level: 1
    })
    await expect(heroTitle).toBeVisible()

    // Check for value proposition subheading
    const subheading = page.locator('text=/organize|productivity|simple/i').first()
    await expect(subheading).toBeVisible()

    // Check for CTA button in hero section
    const heroCTA = page.getByRole('link', { name: /get started/i }).first()
    await expect(heroCTA).toBeVisible()
    await expect(heroCTA).toHaveAttribute('href', /sign-up/)
  })

  test('should display features section with at least 3 features', async ({ page }) => {
    // Check for features section heading
    const featuresHeading = page.getByRole('heading', {
      name: /features|why choose|what we offer/i
    })
    await expect(featuresHeading).toBeVisible()

    // Check for at least 3 feature cards
    // We'll use a more flexible selector for feature items
    const featureItems = page.locator('[data-testid="feature-card"]')
    await expect(featureItems).toHaveCount(3, { timeout: 5000 })

    // Check that each feature has an icon, title, and description
    for (let i = 0; i < 3; i++) {
      const feature = featureItems.nth(i)
      await expect(feature).toBeVisible()

      // Each feature should have a title
      const featureTitle = feature.locator('h3, h4, strong')
      await expect(featureTitle).toBeVisible()

      // Each feature should have a description
      const featureDescription = feature.locator('p')
      await expect(featureDescription).toBeVisible()
    }
  })

  test('should display CTA section', async ({ page }) => {
    // Check for CTA section with call to action text
    const ctaText = page.locator('text=/ready to get started|start managing|join today/i')
    await expect(ctaText).toBeVisible()

    // Check for CTA button
    const ctaButton = page.getByRole('link', { name: /create free account|get started|sign up/i }).last()
    await expect(ctaButton).toBeVisible()
    await expect(ctaButton).toHaveAttribute('href', /sign-up/)
  })

  test('should display footer with links', async ({ page }) => {
    // Check footer is visible
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()

    // Check for app name/tagline
    const appName = footer.locator('text=/todo app|task management/i').first()
    await expect(appName).toBeVisible()

    // Check for footer links
    const privacyLink = footer.getByRole('link', { name: /privacy/i })
    await expect(privacyLink).toBeVisible()

    const termsLink = footer.getByRole('link', { name: /terms/i })
    await expect(termsLink).toBeVisible()

    const contactLink = footer.getByRole('link', { name: /contact/i })
    await expect(contactLink).toBeVisible()

    // Check for copyright notice with current year
    const currentYear = new Date().getFullYear()
    const copyright = footer.locator(`text=/©.*${currentYear}/i`)
    await expect(copyright).toBeVisible()
  })

  test('navigation buttons should be clickable', async ({ page }) => {
    // Test "Sign In" button navigation
    const signInButton = page.getByRole('link', { name: /sign in/i }).first()
    await expect(signInButton).toBeEnabled()

    // Test "Get Started" button navigation
    const getStartedButton = page.getByRole('link', { name: /get started/i }).first()
    await expect(getStartedButton).toBeEnabled()
  })
})
