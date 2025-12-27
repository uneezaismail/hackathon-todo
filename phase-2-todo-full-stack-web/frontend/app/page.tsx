import {
  Hero,
  Features,
  HowItWorks,
  CTASection,
  GeometricBackground,
  Footer,
} from '@/components/landing'
import Header from '@/components/layout/header'

export default function Home() {
  return (
    <>
      <GeometricBackground>
        <Header/>
        <Hero />
        <HowItWorks />
        <Features />
        <CTASection />
      </GeometricBackground>
      <Footer />
    </>
  )
}
