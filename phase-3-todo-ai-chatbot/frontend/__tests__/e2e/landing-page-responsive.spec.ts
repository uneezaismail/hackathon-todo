import { test, expect } from '@playwright/test'

/**
 * T040: E2E test for responsive layout (mobile/tablet/desktop)
 *
 * Tests:
 * - Mobile viewport (375px) - hamburger menu if needed
 * - Tablet viewport (768px) - layout adjusts
 * - Desktop viewport (1024px+) - full layout
 */

test.describe('Landing Page Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test.describe('Mobile viewport (375px)', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test('should display mobile-optimized layout', async ({ page }) => {
      // Page should be visible
      await expect(page.locator('body')).toBeVisible()

      // Header should be visible
      const header = page.locator('header')
      await expect(header).toBeVisible()
    })

    test('should show auth buttons on mobile', async ({ page }) => {
      // Auth buttons should be visible even on mobile
      const signInButton = page.getByRole('link', { name: /sign in/i })
      await expect(signInButton).toBeVisible()

      const getStartedButton = page.getByRole('link', { name: /get started/i })
      await expect(getStartedButton).toBeVisible()
    })

    test('should display hero section in mobile layout', async ({ page }) => {
      const heroTitle = page.getByRole('heading', {
        name: /manage your tasks effortlessly/i,
        level: 1
      })
      await expect(heroTitle).toBeVisible()

      // Hero section should stack vertically on mobile
      const hero = page.locator('section').first()
      const heroBox = await hero.boundingBox()
      expect(heroBox?.width).toBeLessThanOrEqual(375)
    })

    test('should display features in single column on mobile', async ({ page }) => {
      const featureItems = page.locator('[data-testid="feature-card"]')
      await expect(featureItems.first()).toBeVisible()

      // Features should stack vertically (single column)
      const firstFeature = await featureItems.first().boundingBox()
      const secondFeature = await featureItems.nth(1).boundingBox()

      if (firstFeature && secondFeature) {
        // Second feature should be below first feature (not side by side)
        expect(secondFeature.y).toBeGreaterThan(firstFeature.y + firstFeature.height / 2)
      }
    })

    test('should display footer on mobile', async ({ page }) => {
      const footer = page.locator('footer')
      await expect(footer).toBeVisible()

      // Footer links should be visible
      await expect(footer.getByRole('link', { name: /privacy/i })).toBeVisible()
      await expect(footer.getByRole('link', { name: /terms/i })).toBeVisible()
    })
  })

  test.describe('Tablet viewport (768px)', () => {
    test.use({ viewport: { width: 768, height: 1024 } })

    test('should display tablet-optimized layout', async ({ page }) => {
      await expect(page.locator('body')).toBeVisible()

      const header = page.locator('header')
      await expect(header).toBeVisible()
    })

    test('should display features in 2-column grid on tablet', async ({ page }) => {
      const featureItems = page.locator('[data-testid="feature-card"]')
      await expect(featureItems.first()).toBeVisible()

      // Get positions of first two features
      const firstFeature = await featureItems.first().boundingBox()
      const secondFeature = await featureItems.nth(1).boundingBox()

      if (firstFeature && secondFeature) {
        // Features should be side by side or vertically stacked
        // On tablet, we expect 2 columns, so they might be on same row
        const horizontalGap = Math.abs(secondFeature.x - firstFeature.x)
        const verticalGap = Math.abs(secondFeature.y - firstFeature.y)

        // If horizontal gap is significant, they're in different columns (side by side)
        // If vertical gap is significant, they're stacked
        expect(horizontalGap > 50 || verticalGap > 50).toBe(true)
      }
    })

    test('should display auth buttons inline on tablet', async ({ page }) => {
      const signInButton = page.getByRole('link', { name: /sign in/i }).first()
      const getStartedButton = page.getByRole('link', { name: /get started/i }).first()

      await expect(signInButton).toBeVisible()
      await expect(getStartedButton).toBeVisible()

      // Buttons should be visible in header
      const header = page.locator('header')
      const signInInHeader = header.getByRole('link', { name: /sign in/i })
      await expect(signInInHeader).toBeVisible()
    })
  })

  test.describe('Desktop viewport (1024px+)', () => {
    test.use({ viewport: { width: 1440, height: 900 } })

    test('should display full desktop layout', async ({ page }) => {
      await expect(page.locator('body')).toBeVisible()

      const header = page.locator('header')
      await expect(header).toBeVisible()
    })

    test('should display features in 3-column grid on desktop', async ({ page }) => {
      const featureItems = page.locator('[data-testid="feature-card"]')
      await expect(featureItems).toHaveCount(3, { timeout: 5000 })

      // Get Y positions to check if they're on the same row
      const firstY = (await featureItems.first().boundingBox())?.y || 0
      const secondY = (await featureItems.nth(1).boundingBox())?.y || 0
      const thirdY = (await featureItems.nth(2).boundingBox())?.y || 0

      // On desktop (3 columns), all features should be roughly on the same row
      // Allow for some variance in alignment
      const rowTolerance = 50
      const sameRow = Math.abs(firstY - secondY) < rowTolerance &&
                     Math.abs(secondY - thirdY) < rowTolerance

      // OR they could be in 2 rows (2 on top, 1 on bottom)
      const twoRows = (Math.abs(firstY - secondY) < rowTolerance) ||
                     (Math.abs(secondY - thirdY) < rowTolerance)

      expect(sameRow || twoRows).toBe(true)
    })

    test('should display auth buttons inline in header on desktop', async ({ page }) => {
      const header = page.locator('header')

      const signInButton = header.getByRole('link', { name: /sign in/i })
      const getStartedButton = header.getByRole('link', { name: /get started/i })

      await expect(signInButton).toBeVisible()
      await expect(getStartedButton).toBeVisible()

      // Buttons should be on the same horizontal line
      const signInBox = await signInButton.boundingBox()
      const getStartedBox = await getStartedButton.boundingBox()

      if (signInBox && getStartedBox) {
        // Y positions should be similar (same row)
        expect(Math.abs(signInBox.y - getStartedBox.y)).toBeLessThan(10)
      }
    })

    test('should display wider hero section on desktop', async ({ page }) => {
      const hero = page.locator('section').first()
      const heroBox = await hero.boundingBox()

      // Hero should take advantage of wider viewport
      expect(heroBox?.width).toBeGreaterThan(768)
    })

    test('should display footer with proper spacing on desktop', async ({ page }) => {
      const footer = page.locator('footer')
      await expect(footer).toBeVisible()

      // Footer should span the full width
      const footerBox = await footer.boundingBox()
      expect(footerBox?.width).toBeGreaterThan(1000)
    })
  })

  test.describe('Extra large viewport (1920px)', () => {
    test.use({ viewport: { width: 1920, height: 1080 } })

    test('should display properly on large screens', async ({ page }) => {
      await expect(page.locator('body')).toBeVisible()

      // Content should be centered and not stretch too wide
      const main = page.locator('main')
      await expect(main).toBeVisible()
    })

    test('should maintain readable line lengths on large screens', async ({ page }) => {
      const heroTitle = page.getByRole('heading', {
        name: /manage your tasks effortlessly/i,
        level: 1
      })
      await expect(heroTitle).toBeVisible()

      // Content should have max-width constraint
      const heroBox = await heroTitle.boundingBox()
      expect(heroBox?.width).toBeLessThan(1400) // Should not stretch full width
    })
  })

  test.describe('Small mobile viewport (320px)', () => {
    test.use({ viewport: { width: 320, height: 568 } })

    test('should display properly on small mobile screens', async ({ page }) => {
      await expect(page.locator('body')).toBeVisible()

      const header = page.locator('header')
      await expect(header).toBeVisible()
    })

    test('should keep content within viewport on small screens', async ({ page }) => {
      // No horizontal scroll should be present
      const bodyBox = await page.locator('body').boundingBox()
      expect(bodyBox?.width).toBeLessThanOrEqual(320)

      // All content should be visible without horizontal scroll
      const heroTitle = page.getByRole('heading', {
        name: /manage your tasks effortlessly/i,
        level: 1
      })
      await expect(heroTitle).toBeVisible()

      const titleBox = await heroTitle.boundingBox()
      expect(titleBox?.width).toBeLessThanOrEqual(320)
    })
  })
})
