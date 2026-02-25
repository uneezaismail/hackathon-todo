import { HeroSection } from '@/components/landing/hero-section'
import { ProductMockup } from '@/components/landing/product-mockup'
import { FeaturesSection } from '@/components/landing/features-section'
import { HowItWorksSection } from '@/components/landing/how-it-works-section'
import { PricingSection } from '@/components/landing/pricing-section'
import { CTASection } from '@/components/landing/cta-section'
import { LandingHeader } from '@/components/layout/landing-header'
import { LandingFooter } from '@/components/layout/landing-footer'

export default function Home() {
  return (
    <>
      <div className="lg:min-h-screen bg-dark-background">
        <LandingHeader />
        <HeroSection />
        <ProductMockup />
      </div>

      {/* New Sections */}
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <CTASection />

      <LandingFooter />
    </>
  )
}
